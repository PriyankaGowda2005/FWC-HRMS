const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public endpoint for job postings (for HR screening)
router.get('/public', authenticate, requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { status, department, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (status) query.status = status;
  if (department) query.department = department;

  const jobPostings = await database.find('job_postings', query, {
    skip,
    limit,
    sort: { createdAt: -1 }
  });

  const total = await database.count('job_postings', query);

  res.json({
    success: true,
    data: {
      jobPostings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Apply auth middleware to all remaining routes
router.use(authenticate);

// Get all job postings
router.get('/', requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { status, department, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (status) query.status = status;
  if (department) query.department = department;

  const jobPostings = await database.find('job_postings', query, {
    skip,
    limit,
    sort: { createdAt: -1 }
  });

  const total = await database.count('job_postings', query);

  res.json({
    jobPostings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get job posting by ID
router.get('/:id', requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid job posting ID' });
  }

  const jobPosting = await database.findOne('job_postings', { _id: new ObjectId(id) });
  if (!jobPosting) {
    return res.status(404).json({ message: 'Job posting not found' });
  }

  res.json({ jobPosting });
}));

// Create job posting
router.post('/', requireRole('ADMIN', 'HR'), [
  body('title').notEmpty().withMessage('Job title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('location').optional().isString(),
  body('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']),
  body('experienceLevel').optional().isIn(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE']),
  body('salaryRange').optional().isString(),
  body('requirements').optional().isArray(),
  body('responsibilities').optional().isArray(),
  body('benefits').optional().isArray(),
  body('applicationDeadline').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    title,
    department,
    location,
    employmentType,
    experienceLevel,
    salaryRange,
    description,
    requirements,
    responsibilities,
    benefits,
    applicationDeadline
  } = req.body;

  const jobPosting = {
    title,
    department,
    location,
    employmentType: employmentType || 'FULL_TIME',
    experienceLevel: experienceLevel || 'MID_LEVEL',
    salaryRange,
    description,
    requirements: requirements || [],
    responsibilities: responsibilities || [],
    benefits: benefits || [],
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
    status: 'DRAFT',
    createdBy: req.user.userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await database.insertOne('job_postings', jobPosting);

  res.status(201).json({
    message: 'Job posting created successfully',
    jobPosting: {
      id: result.insertedId,
      ...jobPosting
    }
  });
}));

// Update job posting
router.put('/:id', requireRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid job posting ID' });
  }

  updateData.updatedAt = new Date();

  const result = await database.updateOne(
    'job_postings',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: 'Job posting not found' });
  }

  res.json({
    message: 'Job posting updated successfully',
    updated: true
  });
}));

// Delete job posting
router.delete('/:id', requireRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid job posting ID' });
  }

  const result = await database.deleteOne('job_postings', { _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Job posting not found' });
  }

  res.json({
    message: 'Job posting deleted successfully',
    deleted: true
  });
}));

// Publish job posting
router.patch('/:id/publish', requireRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid job posting ID' });
  }

  const result = await database.updateOne(
    'job_postings',
    { _id: new ObjectId(id) },
    { 
      $set: { 
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: 'Job posting not found' });
  }

  res.json({
    message: 'Job posting published successfully',
    published: true
  });
}));

module.exports = router;