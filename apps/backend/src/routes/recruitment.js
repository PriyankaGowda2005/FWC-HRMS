const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all job postings
router.get('/jobs', [
  authenticate,
  authorize('recruitment:read')
], asyncHandler(async (req, res) => {
  const { status, department, page = 1, limit = 20 } = req.query;
  
  let query = {};
  
  if (status) {
    query.status = status.toUpperCase();
  }
  
  if (department) {
    query.department = department;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const jobPostings = await database.find('job_postings', query, {
    skip,
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  });

  // Get application count for each job
  const jobsWithCounts = await Promise.all(
    jobPostings.map(async (job) => {
      const applicationCount = await database.count('candidates', { 
        jobPostingId: job._id 
      });
      
      return {
        ...job,
        applicationCount
      };
    })
  );

  const total = await database.count('job_postings', query);

  res.json({
    success: true,
    jobPostings: jobsWithCounts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get job posting by ID
router.get('/jobs/:id', [
  authenticate,
  authorize('recruitment:read')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const jobPosting = await database.findOne('job_postings', { _id: new ObjectId(id) });
  
  if (!jobPosting) {
    return res.status(404).json({
      success: false,
      message: 'Job posting not found'
    });
  }

  // Get candidates for this job
  const candidates = await database.find('candidates', { 
    jobPostingId: new ObjectId(id) 
  });

  res.json({
    success: true,
    jobPosting: {
      ...jobPosting,
      candidates
    }
  });
}));

// Create job posting
router.post('/jobs', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('recruitment:write'),
  body('title').notEmpty().withMessage('Job title is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('requirements').notEmpty().withMessage('Job requirements are required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('type').isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).withMessage('Invalid job type'),
  body('salary').optional().isString().withMessage('Salary must be a string'),
  body('status').optional().isIn(['ACTIVE', 'CLOSED', 'DRAFT']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    title,
    description,
    requirements,
    department,
    location,
    type,
    salary,
    status = 'ACTIVE'
  } = req.body;

  const jobPosting = {
    title,
    description,
    requirements,
    department,
    location,
    type,
    salary: salary || '',
    status,
    createdBy: req.user.id,
    createdAt: new Date()
  };

  const result = await database.insertOne('job_postings', jobPosting);

  res.status(201).json({
    success: true,
    message: 'Job posting created successfully',
    jobPosting: {
      _id: result.insertedId,
      ...jobPosting
    }
  });
}));

// Update job posting
router.put('/jobs/:id', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('recruitment:write'),
  body('title').optional().notEmpty().withMessage('Job title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Job description cannot be empty'),
  body('requirements').optional().notEmpty().withMessage('Job requirements cannot be empty'),
  body('status').optional().isIn(['ACTIVE', 'CLOSED', 'DRAFT']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if job posting exists
  const existingJob = await database.findOne('job_postings', { _id: new ObjectId(id) });
  if (!existingJob) {
    return res.status(404).json({
      success: false,
      message: 'Job posting not found'
    });
  }

  updateData.updatedAt = new Date();
  updateData.updatedBy = req.user.id;

  await database.updateOne(
    'job_postings',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  res.json({
    success: true,
    message: 'Job posting updated successfully'
  });
}));

// Delete job posting
router.delete('/jobs/:id', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('recruitment:delete')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if job posting exists
  const jobPosting = await database.findOne('job_postings', { _id: new ObjectId(id) });
  if (!jobPosting) {
    return res.status(404).json({
      success: false,
      message: 'Job posting not found'
    });
  }

  // Check if there are candidates for this job
  const candidateCount = await database.count('candidates', { 
    jobPostingId: new ObjectId(id) 
  });

  if (candidateCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete job posting with candidates. Please handle candidates first.'
    });
  }

  await database.deleteOne('job_postings', { _id: new ObjectId(id) });

  res.json({
    success: true,
    message: 'Job posting deleted successfully'
  });
}));

// Get all candidates
router.get('/candidates', [
  authenticate,
  authorize('recruitment:read')
], asyncHandler(async (req, res) => {
  const { status, jobPostingId, page = 1, limit = 20 } = req.query;
  
  let query = {};
  
  if (status) {
    query.status = status.toUpperCase();
  }
  
  if (jobPostingId) {
    query.jobPostingId = new ObjectId(jobPostingId);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const candidates = await database.find('candidates', query, {
    skip,
    limit: parseInt(limit),
    sort: { appliedAt: -1 }
  });

  // Get job posting details for each candidate
  const candidatesWithJobs = await Promise.all(
    candidates.map(async (candidate) => {
      let jobPosting = null;
      if (candidate.jobPostingId) {
        jobPosting = await database.findOne('job_postings', { 
          _id: candidate.jobPostingId 
        });
      }
      
      return {
        ...candidate,
        jobPosting: jobPosting ? {
          title: jobPosting.title,
          department: jobPosting.department,
          location: jobPosting.location
        } : null
      };
    })
  );

  const total = await database.count('candidates', query);

  res.json({
    success: true,
    candidates: candidatesWithJobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get candidate by ID
router.get('/candidates/:id', [
  authenticate,
  authorize('recruitment:read')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const candidate = await database.findOne('candidates', { _id: new ObjectId(id) });
  
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  // Get job posting details
  let jobPosting = null;
  if (candidate.jobPostingId) {
    jobPosting = await database.findOne('job_postings', { 
      _id: candidate.jobPostingId 
    });
  }

  res.json({
    success: true,
    candidate: {
      ...candidate,
      jobPosting
    }
  });
}));

// Add candidate
router.post('/candidates', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('recruitment:write'),
  body('name').notEmpty().withMessage('Candidate name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('jobPostingId').optional().isMongoId().withMessage('Invalid job posting ID'),
  body('experience').optional().isString().withMessage('Experience must be a string'),
  body('skills').optional().isString().withMessage('Skills must be a string'),
  body('resume').optional().isString().withMessage('Resume must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    name,
    email,
    phone,
    jobPostingId,
    experience,
    skills,
    resume
  } = req.body;

  // Check if candidate already exists with this email
  const existingCandidate = await database.findOne('candidates', { email });
  if (existingCandidate) {
    return res.status(400).json({
      success: false,
      message: 'Candidate with this email already exists'
    });
  }

  // Validate job posting if provided
  if (jobPostingId) {
    const jobPosting = await database.findOne('job_postings', { 
      _id: new ObjectId(jobPostingId) 
    });
    if (!jobPosting) {
      return res.status(400).json({
        success: false,
        message: 'Job posting not found'
      });
    }
  }

  const candidate = {
    name,
    email,
    phone: phone || '',
    jobPostingId: jobPostingId ? new ObjectId(jobPostingId) : null,
    experience: experience || '',
    skills: skills || '',
    resume: resume || '',
    status: 'APPLIED',
    appliedAt: new Date(),
    createdBy: req.user.id,
    createdAt: new Date()
  };

  const result = await database.insertOne('candidates', candidate);

  res.status(201).json({
    success: true,
    message: 'Candidate added successfully',
    candidate: {
      _id: result.insertedId,
      ...candidate
    }
  });
}));

// Update candidate status
router.put('/candidates/:id/status', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('recruitment:write'),
  body('status').isIn(['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'HIRED', 'REJECTED']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { status, notes } = req.body;

  // Check if candidate exists
  const candidate = await database.findOne('candidates', { _id: new ObjectId(id) });
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  const updateData = {
    status: status.toUpperCase(),
    updatedAt: new Date(),
    updatedBy: req.user.id
  };

  if (notes) {
    updateData.notes = notes;
  }

  await database.updateOne(
    'candidates',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  res.json({
    success: true,
    message: 'Candidate status updated successfully'
  });
}));

// Delete candidate
router.delete('/candidates/:id', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('recruitment:delete')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if candidate exists
  const candidate = await database.findOne('candidates', { _id: new ObjectId(id) });
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found'
    });
  }

  await database.deleteOne('candidates', { _id: new ObjectId(id) });

  res.json({
    success: true,
    message: 'Candidate deleted successfully'
  });
}));

// Get recruitment statistics
router.get('/stats', [
  authenticate,
  authorize('recruitment:read')
], asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Get job posting stats
  const totalJobs = await database.count('job_postings', dateQuery);
  const activeJobs = await database.count('job_postings', { 
    ...dateQuery,
    status: 'PUBLISHED' 
  });
  const closedJobs = await database.count('job_postings', { 
    ...dateQuery,
    status: 'CLOSED' 
  });

  // Get candidate stats
  const totalCandidates = await database.count('candidates', dateQuery);
  const hiredCandidates = await database.count('candidates', { 
    ...dateQuery,
    status: 'HIRED' 
  });
  const rejectedCandidates = await database.count('candidates', { 
    ...dateQuery,
    status: 'REJECTED' 
  });

  // Calculate average time to hire
  const hiredCandidatesData = await database.find('candidates', { 
    ...dateQuery,
    status: 'HIRED' 
  });

  let averageTimeToHire = 0;
  if (hiredCandidatesData.length > 0) {
    const totalDays = hiredCandidatesData.reduce((sum, candidate) => {
      const daysDiff = Math.ceil((candidate.updatedAt - candidate.appliedAt) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    averageTimeToHire = Math.round(totalDays / hiredCandidatesData.length);
  }

  res.json({
    success: true,
    stats: {
      jobPostings: {
        total: totalJobs,
        active: activeJobs,
        closed: closedJobs
      },
      candidates: {
        total: totalCandidates,
        hired: hiredCandidates,
        rejected: rejectedCandidates,
        averageTimeToHire
      }
    }
  });
}));

module.exports = router;
