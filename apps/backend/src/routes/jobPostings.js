const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes except public job listings
router.use(/^\/(?!public).*$/, verifyToken);

// Validation schemas
const jobPostingCreateSchema = [
  body('title').notEmpty().withMessage('Job title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3-200 characters'),
  body('description').notEmpty().withMessage('Job description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('responsibilities').optional().isArray().withMessage('Responsibilities must be an array'),
  body('salaryMin').optional().isFloat({ min: 0 }).withMessage('Min salary must be non-negative'),
  body('salaryMax').optional().isFloat({ min: 0 }).withMessage('Max salary must be non-negative'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location too long'),
  body('employmentType').isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE'])
    .withMessage('Invalid employment type'),
  body('remoteAllowed').optional().isBoolean().withMessage('Remote allowed must be boolean'),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid application deadline'),
  body('maxApplications').optional().isInt({ min: 1 }).withMessage('Max applications must be positive')
];

// Public job listings (no auth required)
router.get('/public', [
  query('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']),
  query('location').optional().isLength({ max: 100 }),
  query('department').optional().isLength({ max: 100 }),
  query('remote').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isLength({ max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    employmentType,
    location,
    department,
    remote,
    page = 1,
    limit = 20,
    search
  } = req.query;

  const where = {
    status: 'PUBLISHED',
    OR: [
      { applicationDeadline: { gt: new Date() } },
      { applicationDeadline: null }
    ]
  };

  // Apply filters
  if (employmentType) {
    where.employmentType = employmentType;
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  if (department) {
    where.department = {
      name: { contains: department, mode: 'insensitive' }
    };
  }

  if (remote !== undefined) {
    where.remoteAllowed = remote;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [jobPostings, total] = await Promise.all([
    prisma.jobPosting.findMany({
      skip,
      take: limit,
      where,
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        responsibilities: true,
        salaryMin: true,
        salaryMax: true,
        location: true,
        employmentType: true,
        remoteAllowed: true,
        applicationDeadline: true,
        createdAt: true,
        department: {
          select: {
            name: true,
            location: true
          }
        },
        _count: {
          select: {
            candidates: true
          }
        }
      }
    }),
    prisma.jobPosting.count({ where })
  ]);

  res.json({
    jobPostings: jobPostings.map(job => ({
      ...job,
      applicationCount: job._count.candidates
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get job posting details (public)
router.get('/public/:id', [
  param('id').isMongoId().withMessage('Invalid job posting ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      responsibilities: true,
      salaryMin: true,
      salaryMax: true,
      location: true,
      employmentType: true,
      remoteAllowed: true,
      applicationDeadline: true,
      maxApplications: true,
      currentApplications: true,
      createdAt: true,
      department: {
        select: {
          name: true,
          description: true,
          location: true
        }
      },
      _count: {
        select: {
          candidates: true
        }
      }
    }
  });

  if (!jobPosting || jobPosting.status !== 'PUBLISHED') {
    return res.status(404).json({ 
      message: 'Job posting not found' 
    });
  }

  // Check if application deadline has passed
  const now = new Date();
  const deadline = jobPosting.applicationDeadline;
  
  if (deadline && deadline < now) {
    return res.status(410).json({ 
      message: 'Application deadline has passed' 
    });
  }

  // Check if max applications reached
  if (jobPosting.maxApplications && jobPosting.currentApplications >= jobPosting.maxApplications) {
    return res.status(410).json({ 
      message: 'Application limit reached' 
    });
  }

  res.json({
    ...jobPosting,
    applicationCount: jobPosting._count.candidates,
    isAcceptingApplications: 
      (!deadline || deadline > now) && 
      (!jobPosting.maxApplications || jobPosting.currentApplications < jobPosting.maxApplications)
  });
}));

// Admin/HR: Get all job postings
router.get('/', [
  verifyToken,
  checkRole('ADMIN', 'HR', 'MANAGER'),
  query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']),
  query('departmentId').optional().isMongoId(),
  query('urgency').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    status,
    departmentId,
    urgency,
    page = 1,
    limit = 20
  } = req.query;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (urgency) {
    where.urgency = urgency;
  }

  const skip = (page - 1) * limit;

  const [jobPostings, total] = await Promise.all([
    prisma.jobPosting.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: {
            name: true,
            location: true
          }
        },
        _count: {
          select: {
            candidates: true
          }
        }
      }
    }),
    prisma.jobPosting.count({ where })
  ]);

  res.json({
    jobPostings: jobPostings.map(job => ({
      ...job,
      applicationCount: job._count.candidates
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Admin/HR: Create job posting
router.post('/', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  ...jobPostingCreateSchema
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const jobData = {
    ...req.body,
    postedBy: req.user.id
  };

  // Validate salary range
  if (jobData.salaryMin && jobData.salaryMax && jobData.salaryMin >jobData.salaryMax) {
    return res.status(400).json({ 
      message: 'Min salary cannot be greater than max salary' 
    });
  }

  // Validate application deadline is in future
  if (jobData.applicationDeadline && new Date(jobData.applicationDeadline) <= new Date()) {
    return res.status(400).json({ 
      message: 'Application deadline must be in the future' 
    });
  }

  const jobPosting = await prisma.jobPosting.create({
    data: jobData,
    include: {
      department: {
        select: {
          name: true,
          location: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Job posting created successfully',
    jobPosting
  });
}));

// Admin/HR: Update job posting
router.put('/:id', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid job posting ID'),
  body('title').optional().isLength({ min: 3, max: 200 }),
  body('description').optional().isLength({ min: 10 }),
  body('requirements').optional().isArray(),
  body('responsibilities').optional().isArray(),
  body('salaryMin').optional().isFloat({ min: 0 }),
  body('salaryMax').optional().isFloat({ min: 0 }),
  body('location').optional().isLength({ max: 100 }),
  body('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']),
  body('remoteAllowed').optional().isBoolean(),
  body('urgency').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']),
  body('applicationDeadline').optional().isISO8601(),
  body('maxApplications').optional().isInt({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = {};

  // Filter allowed fields
  const allowedFields = [
    'title', 'description', 'requirements', 'responsibilities',
    'salaryMin', 'salaryMax', 'location', 'employmentType',
    'remoteAllowed', 'urgency', 'status', 'applicationDeadline',
    'maxApplications'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Validate salary range
  if (updateData.salaryMin && updateData.salaryMax && updateData.salaryMin > updateData.salaryMax) {
    return res.status(400).json({ 
      message: 'Min salary cannot be greater than max salary' 
    });
  }

  const jobPosting = await prisma.jobPosting.update({
    where: { id },
    data: updateData,
    include: {
      department: {
        select: {
          name: true,
          location: true
        }
      }
    }
  });

  res.json({
    message: 'Job posting updated successfully',
    jobPosting
  });
}));

// Publish job posting
router.post('/:id/publish', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid job posting ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const jobPosting = await prisma.jobPosting.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      postedAt: new Date()
    },
    include: {
      department: {
        select: {
          name: true
        }
      }
    }
  });

  res.json({
    message: 'Job posting published successfully',
    jobPosting
  });
}));

// Close job posting
router.post('/:id/close', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid job posting ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const jobPosting = await prisma.jobPosting.update({
    where: { id },
    data: {
      status: 'CLOSED',
      closedAt: new Date()
    }
  });

  res.json({
    message: 'Job posting closed successfully',
    jobPosting
  });
}));

// Admin/HR: Delete job posting
router.delete('/:id', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid job posting ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  // Check if has applications
  const candidatesCount = await prisma.candidate.count({
    where: { jobPostingId: id }
  });

  if (candidatesCount > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete job posting with existing applications. Please close it instead.' 
    });
  }

  await prisma.jobPosting.delete({
    where: { id }
  });

  res.json({ 
    message: 'Job posting deleted successfully' 
  });
}));

module.exports = router;
