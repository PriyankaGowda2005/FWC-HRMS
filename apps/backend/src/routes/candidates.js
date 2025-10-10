const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all candidates
router.get('/', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { jobPostingId, status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (jobPostingId) query.jobPostingId = jobPostingId;
  if (status) query.status = status;

  const candidates = await database.find('candidates', query, {
    skip,
    limit,
    sort: { createdAt: -1 }
  });

  const total = await database.count('candidates', query);

  res.json({
    candidates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get candidate by ID
router.get('/:id', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid candidate ID' });
  }

  const candidate = await database.findOne('candidates', { _id: new ObjectId(id) });
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  res.json({ candidate });
}));

// Create candidate
router.post('/', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    jobPostingId,
    resumeUrl,
    coverLetter,
    experience,
    skills,
    education,
    expectedSalary,
    availability
  } = req.body;

  const candidate = {
    firstName,
    lastName,
    email,
    phone,
    jobPostingId,
    resumeUrl,
    coverLetter: coverLetter || '',
    experience: experience || [],
    skills: skills || [],
    education: education || [],
    expectedSalary,
    availability: availability || 'IMMEDIATE',
    status: 'APPLIED',
    appliedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await database.insertOne('candidates', candidate);

  res.status(201).json({
    message: 'Candidate application submitted successfully',
    candidate: {
      id: result.insertedId,
      ...candidate
    }
  });
}));

// Update candidate
router.put('/:id', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid candidate ID' });
  }

  updateData.updatedAt = new Date();

  const result = await database.updateOne(
    'candidates',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  res.json({
    message: 'Candidate updated successfully',
    updated: true
  });
}));

// Update candidate status
router.patch('/:id/status', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid candidate ID' });
  }

  if (!['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (notes) {
    updateData.notes = notes;
  }

  if (status === 'HIRED') {
    updateData.hiredAt = new Date();
  }

  const result = await database.updateOne(
    'candidates',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  res.json({
    message: `Candidate status updated to ${status}`,
    status
  });
}));

// Delete candidate
router.delete('/:id', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid candidate ID' });
  }

  const result = await database.deleteOne('candidates', { _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  res.json({
    message: 'Candidate deleted successfully',
    deleted: true
  });
}));

// Get candidates by job posting
router.get('/job/:jobPostingId', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { jobPostingId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  if (!ObjectId.isValid(jobPostingId)) {
    return res.status(400).json({ message: 'Invalid job posting ID' });
  }

  let query = { jobPostingId };
  if (status) query.status = status;

  const candidates = await database.find('candidates', query, {
    skip,
    limit,
    sort: { appliedAt: -1 }
  });

  const total = await database.count('candidates', query);

  res.json({
    candidates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

module.exports = router;