const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } =require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router =express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(verifyToken);

// Validation schemas
const performanceReviewCreateSchema = [
  body('employeeId')
    .isMongoId()
    .withMessage('Invalid employee ID'),
  body('reviewPeriod')
    .notEmpty()
    .withMessage('Review period is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Review period must be between 2-50 characters'),
  body('reviewType')
    .isIn(['ANNUAL', 'QUARTERLY', 'PROBATIONARY', 'PROJECT_BASED'])
    .withMessage('Invalid review type'),
  body('overallRating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1-5'),
  body('goals')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Goals must be an array with at least one item'),
  body('achievements')
    .optional()
    .isArray()
    .withMessage('Achievements must be an array'),
  body('areasForImprovement')
    .optional()
    .isArray()
    .withMessage('Areas for improvement must be an array'),
  body('feedback')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Feedback cannot exceed 2000 characters'),
  body('nextReviewDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid next review date')
];

// Create performance review (Manager/HR/Admin only)
router.post('/', [
  checkRole('ADMIN', 'HR', 'MANAGER'),
  ...performanceReviewCreateSchema
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    employeeId,
    reviewPeriod,
    reviewType,
    overallRating,
    goals,
    achievements,
    areasForImprovement,
    feedback,
    nextReviewDate
  } = req.body;

  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: {
        select: {
          email: true,
          username: true,
          role: true
        }
      }
    }
  });

  if (!employee) {
    return res.status(404).json({ 
      message: 'Employee not found' 
    });
  }

  // Permission check - managers can only review their subordinates
  if (req.user.role === 'MANAGER') {
    // Check if this employee reports to the current manager
    if (employee.supervisorId !== req.user.employee.id) {
      return res.status(403).json({ 
        message: 'You can only review employees under your supervision' 
      });
    }
  }

  // Check for existing review in the same period
  const existingReview = await prisma.performanceReview.findFirst({
    where: {
      employeeId,
      reviewPeriod,
      reviewType
    }
  });

  if (existingReview) {
    return res.status(400).json({ 
      message: 'Performance review already exists for this employee and period' 
    });
  }

  const reviewData = {
    employeeId,
    reviewPeriod,
    reviewType,
    overallRating,
    reviewerId: req.user.employee.id,
    goals: goals ? JSON.stringify(goals) : null,
    achievements: achievements ? JSON.stringify(achievements) : null,
    areasForImprovement: areasForImprovement ? JSON.stringify(areasForImprovement) : null,
    feedback,
    nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
    status: 'DRAFT'
  };

  const review = await prisma.performanceReview.create({
    data: reviewData,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true,
          department: {
            select: {
              name: true
            }
          }
        }
      },
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Performance review created successfully',
    review
  });
}));

// Get performance reviews with filtering
router.get('/', [
  checkRole('ADMIN', 'HR', 'MANAGER'),
  query('employeeId').optional().isMongoId().withMessage('Invalid employee ID'),
  query('reviewType').optional().isIn(['ANNUAL', 'QUARTERLY', 'PROBATIONARY', 'PROJECT_BASED']),
  query('status').optional().isIn(['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED']),
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Invalid year'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'overallRating', 'reviewPeriod']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    employeeId,
    reviewType,
    status,
    year,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const where = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (reviewType) {
    where.reviewType = reviewType;
  }

  if (status) {
    where.status = status;
  }

  if (year) {
    where.createdAt = {
      gte: new Date(year, 0, 1),
      lt: new Date(parseInt(year) + 1, 0, 1)
    };
  }

  const skip = (page - 1) * limit;
  const orderBy = { [sortBy]: sortOrder };

  const [reviews, total] = await Promise.all([
    prisma.performanceReview.findMany({
      skip,
      take: limit,
      where,
      orderBy,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    }),
    prisma.performanceReview.count({ where })
  ]);

  // Calculate summary statistics
  const stats = await prisma.performanceReview.aggregate({
    where,
    _avg: {
      overallRating: true
    },
    _count: true
  });

  res.json({
    reviews,
    summary: {
      totalReviews: stats._count,
      averageRating: parseFloat(stats._avg.overallRating || 0).toFixed(2)
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get performance review by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid review ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if {!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const review = await prisma.performanceReview.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          department: {
            select: {
              name: true,
              id: true
            }
          },
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      },
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
          position: true,
          user: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  if (!review) {
    return res.status(404).json({ 
      message: 'Performance review not found' 
    });
  }

  // Check access permission
  const hasAccess = 
    review.employeeId === req.user.employee.id ||
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR' ||
    req.user.reviewerId === req.user.employee.id ||
    review.employee.supervisorId === req.user.employee.id;

  if (!hasAccess) {
    return res.status(403).json({ 
      message: 'You do not have access to view this performance review' 
    });
  }

  res.json({ review });
}));

// Update performance review
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid review ID'),
  body('selfRating').optional().isFloat({ min: 1, max: 5 }).withMessage('Self rating must be between 1-5'),
  body('reviewerRating').optional().isFloat({ min: 1, max: 5 }).withMessage('Reviewer rating must be between 1-5'),
  body('managerRating').optional().isFloat({ min: 1, max: 5 }).withMessage('Manager rating must be between 1-5'),
  body('peerRatings').optional().isObject().withMessage('Peer ratings must be an object'),
  body('overallRating').optional().isFloat({ min: 1, max: 5 }).withMessage('Overall rating must be between 1-5'),
  body('goals').optional().isArray().withMessage('Goals must be an array'),
  body('achievements').optional().isArray().withMessage('Achievements must be an array'),
  body('areasForImprovement').optional().isArray().withMessage('Areas for improvement must be an array'),
  body('feedback').optional().isLength({ max: 2000 }).withMessage('Feedback cannot exceed 2000 characters'),
  body('status').optional().isIn(['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED']),
  body('nextReviewDate').optional().isISO8601().withMessage('Invalid next review date')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  // Check if review exists
  const existingReview = await prisma.performanceReview.findUnique({
    where: { id },
    include: {
      employee: true,
      reviewer: true
    }
  });

  if (!existingReview) {
    return res.status(404).json({ 
      message: 'Performance review not found' 
    });
  }

  // Permission checking
  const canEdit = 
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR' ||
    existingReview.reviewerId === req.user.employee.id ||
    existingReview.employeeId === req.user.employee.id;

  if (!canEdit) {
    return res.status(403).json({ 
      message: 'You do not have permission to edit this review' 
    });
  }

  // Build update data
  const updateData = {};

  // Filter allowed fields based on user role
  const allowedFields = [];
  
  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    allowedFields.push('reviewerRating', 'managerRating', 'overallRating', 'feedback', 'status');
  }
  
  if (existingReview.reviewerId === req.user.employee.id) {
    allowedFields.push('reviewerRating', 'feedback', 'status');
  }
  
  if (existingReview.employeeId === req.user.employee.id) {
    allowedFields.push('selfRating', 'goals', 'achievements', 'areasForImprovement');
  }

  // Handle special logic for status completion
  if (req.body.status === 'COMPLETED') {
    allowedFields.push('nextReviewDate', 'completedAt');
    if (!updateData.completedAt) {
      updateData.completedAt = new Date();
    }
  }

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Handle JSON fields
  if (req.body.goals) {
    updateData.goals = JSON.stringify(req.body.goals);
  }
  
  if (req.body.achievements) {
    updateData.achievements = JSON.stringify(req.body.achievements);
  }
  
  if (req.body.areasForImprovement) {
    updateData.areasForImprovement = JSON.stringify(req.body.areasForImprovement);
  }
  
  if (req.body.peerRatings) {
    updateData.peerRatings = JSON.stringify(req.body.peerRatings);
  }

  // Recalculate overall rating if individual ratings were updated
  if (req.body.selfRating || req.body.reviewerRating || req.body.managerRating) {
    const ratings = {
      self: req.body.selfRating || existingReview.selfRating,
      reviewer: req.body.reviewerRating || existingReview.reviewerRating,
      manager: req.body.managerRating || existingReview.managerRating
    };
    
    const validRatings = Object.values(ratings).filter(rating => rating !== null && rating !== undefined);
    if (validRatings.length > 0) {
      updateData.overallRating = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
    }
  }

  const review = await prisma.performanceReview.update({
    where: { id },
    data: updateData,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true,
          department: {
            select: {
              name: true
            }
          }
        }
      },
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.json({
    message: 'Performance review updated successfully',
    review
  });
}));

// Get employee's own performance reviews
router.get('/my-reviews', [
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('status').optional().isIn(['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED']),
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

  const { year, status, page = 1, limit = 20 } = req.query;
  const employeeId = req.user.employee.id;

  const where = { employeeId };

  if (status) {
    where.status = status;
  }

  if (year) {
    where.createdAt = {
      gte: new Date(year, 0, 1),
      lt: new Date(parseInt(year) + 1, 0, 1)
    };
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.performanceReview.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    }),
    prisma.performanceReview.count({ where })
  ]);

  // Calculate personal performance trends
  const yearlyStats = await prisma.performanceReview.aggregate({
    where: {
      employeeId,
      status: 'COMPLETED'
    },
    _avg: { overallRating: true },
    _max: { overallRating: true },
    _min: { overallRating: true },
    _count: true
  });

  res.json({
    reviews,
    stats: {
      totalReviews: yearlyStats._count,
      averageRating: parseFloat(yearlyStats._avg.overallRating || 0).toFixed(2),
      highestRating: yearlyStats._max.overallRating || 0,
      lowestRating: yearlyStats._min.overallRating || 0
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Submit self-rating for review
router.post('/:id/self-rating', [
  param('id').isMongoId().withMessage('Invalid review ID'),
  body('selfRating').isFloat({ min: 1, max: 5 }).withMessage('Self rating must be between 1-5'),
  body('goals').optional().isArray().withMessage('Goals must be an array'),
  body('achievements').optional().isArray().withMessage('Achievements must be an array'),
  body('areasForImprovement').optional().isArray().withMessage('Areas for improvement must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { selfRating, goals, achievements, areasForImprovement } = req.body;
  const employeeId = req.user.employee.id;

  // Check if review exists and belongs to the employee
  const review = await prisma.performanceReview.findFirst({
    where: { 
      id,
      employeeId
    }
  });

  if (!review) {
    return res.status(404).json({ 
      message: 'Performance review not found or you do not have access to it' 
    });
  }

  // Update with self-rating data
  const updateData = {
    selfRating,
    status: review.status === 'DRAFT' ? 'IN_PROGRESS' : review.status
  };

  if (goals) updateData.goals = JSON.stringify(goals);
  if (achievements) updateData.achievements = JSON.stringify(achievements);
  if (areasForImprovement) updateData.areasForImprovement = JSON.stringify(areasForImprovement);

  const updatedReview = await prisma.performanceReview.update({
    where: { id },
    data: updateData,
    include: {
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.json({
    message: 'Self-rating submitted successfully',
    review: updatedReview
  });
}));

// Delete performance review (Admin only)
router.delete('/:id', [
  checkRole('ADMIN'),
  param('id').isMongoId().withMessage('Invalid review ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message： 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  await prisma.performanceReview.delete({
    where: { id }
  });

  res.json({ 
    message: 'Performance review deleted successfully' 
  });
}));

module.exports = router;
