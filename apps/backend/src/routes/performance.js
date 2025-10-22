const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get performance reviews
router.get('/reviews', [
  authenticate,
  authorize('performance:read')
], asyncHandler(async (req, res) => {
  const { employeeId, status, page = 1, limit = 20 } = req.query;
  
  let query = {};
  
  // Filter by employee if user is not admin/hr
  if (req.user.role === 'EMPLOYEE') {
    query.employeeId = req.user.id;
  } else if (employeeId) {
    query.employeeId = employeeId;
  }
  
  if (status) {
    query.status = status.toUpperCase();
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const reviews = await database.find('performance_reviews', query, {
    skip,
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  });

  // Get employee and reviewer details
  const reviewsWithDetails = await Promise.all(
    reviews.map(async (review) => {
      const employee = await database.findOne('employees', { userId: review.employeeId });
      const reviewer = await database.findOne('employees', { userId: review.reviewerId });
      
      return {
        ...review,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        department: employee ? employee.department : 'Unknown',
        reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Unknown'
      };
    })
  );

  const total = await database.count('performance_reviews', query);

  res.json({
    success: true,
    reviews: reviewsWithDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get performance review by ID
router.get('/reviews/:id', [
  authenticate,
  authorize('performance:read')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const review = await database.findOne('performance_reviews', { _id: new ObjectId(id) });
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Performance review not found'
    });
  }

  // Check access permissions
  if (req.user.role === 'EMPLOYEE' && review.employeeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Get employee and reviewer details
  const employee = await database.findOne('employees', { userId: review.employeeId });
  const reviewer = await database.findOne('employees', { userId: review.reviewerId });

  res.json({
    success: true,
    review: {
      ...review,
      employee: employee ? {
        name: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        designation: employee.designation
      } : null,
      reviewer: reviewer ? {
        name: `${reviewer.firstName} ${reviewer.lastName}`,
        designation: reviewer.designation
      } : null
    }
  });
}));

// Create performance review
router.post('/reviews', [
  authenticate,
  requireRole('MANAGER', 'HR', 'ADMIN'),
  authorize('performance:write'),
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('reviewPeriod').notEmpty().withMessage('Review period is required'),
  body('overallRating').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('goalsRating').isInt({ min: 1, max: 5 }).withMessage('Goals rating must be between 1 and 5'),
  body('skillsRating').isInt({ min: 1, max: 5 }).withMessage('Skills rating must be between 1 and 5'),
  body('teamworkRating').isInt({ min: 1, max: 5 }).withMessage('Teamwork rating must be between 1 and 5'),
  body('communicationRating').isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('strengths').optional().isString().withMessage('Strengths must be a string'),
  body('areasForImprovement').optional().isString().withMessage('Areas for improvement must be a string'),
  body('comments').optional().isString().withMessage('Comments must be a string'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status')
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
    employeeId,
    reviewPeriod,
    overallRating,
    goalsRating,
    skillsRating,
    teamworkRating,
    communicationRating,
    strengths,
    areasForImprovement,
    comments,
    status = 'PENDING'
  } = req.body;

  // Check if employee exists
  const employee = await database.findOne('employees', { userId: employeeId });
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  // Check if review already exists for this period
  const existingReview = await database.findOne('performance_reviews', {
    employeeId,
    reviewPeriod
  });
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'Performance review already exists for this period'
    });
  }

  const review = {
    employeeId,
    reviewerId: req.user.id,
    reviewPeriod,
    overallRating: parseInt(overallRating),
    goalsRating: parseInt(goalsRating),
    skillsRating: parseInt(skillsRating),
    teamworkRating: parseInt(teamworkRating),
    communicationRating: parseInt(communicationRating),
    strengths: strengths || '',
    areasForImprovement: areasForImprovement || '',
    comments: comments || '',
    status: status.toUpperCase(),
    createdAt: new Date()
  };

  const result = await database.insertOne('performance_reviews', review);

  res.status(201).json({
    success: true,
    message: 'Performance review created successfully',
    review: {
      _id: result.insertedId,
      ...review
    }
  });
}));

// Update performance review
router.put('/reviews/:id', [
  authenticate,
  authorize('performance:write'),
  body('overallRating').optional().isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('goalsRating').optional().isInt({ min: 1, max: 5 }).withMessage('Goals rating must be between 1 and 5'),
  body('skillsRating').optional().isInt({ min: 1, max: 5 }).withMessage('Skills rating must be between 1 and 5'),
  body('teamworkRating').optional().isInt({ min: 1, max: 5 }).withMessage('Teamwork rating must be between 1 and 5'),
  body('communicationRating').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status')
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

  // Check if review exists
  const existingReview = await database.findOne('performance_reviews', { _id: new ObjectId(id) });
  if (!existingReview) {
    return res.status(404).json({
      success: false,
      message: 'Performance review not found'
    });
  }

  // Check permissions
  if (req.user.role === 'EMPLOYEE' && existingReview.employeeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Convert ratings to integers if provided
  if (updateData.overallRating) updateData.overallRating = parseInt(updateData.overallRating);
  if (updateData.goalsRating) updateData.goalsRating = parseInt(updateData.goalsRating);
  if (updateData.skillsRating) updateData.skillsRating = parseInt(updateData.skillsRating);
  if (updateData.teamworkRating) updateData.teamworkRating = parseInt(updateData.teamworkRating);
  if (updateData.communicationRating) updateData.communicationRating = parseInt(updateData.communicationRating);

  updateData.updatedAt = new Date();
  updateData.updatedBy = req.user.id;

  await database.updateOne(
    'performance_reviews',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  res.json({
    success: true,
    message: 'Performance review updated successfully'
  });
}));

// Get performance goals
router.get('/goals', [
  authenticate,
  authorize('performance:read')
], asyncHandler(async (req, res) => {
  const { employeeId, status, page = 1, limit = 20 } = req.query;
  
  let query = {};
  
  // Filter by employee if user is not admin/hr
  if (req.user.role === 'EMPLOYEE') {
    query.employeeId = req.user.id;
  } else if (employeeId) {
    query.employeeId = employeeId;
  }
  
  if (status) {
    query.status = status.toUpperCase();
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const goals = await database.find('performance_goals', query, {
    skip,
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  });

  // Get employee details
  const goalsWithDetails = await Promise.all(
    goals.map(async (goal) => {
      const employee = await database.findOne('employees', { userId: goal.employeeId });
      
      return {
        ...goal,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
      };
    })
  );

  const total = await database.count('performance_goals', query);

  res.json({
    success: true,
    goals: goalsWithDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Create performance goal
router.post('/goals', [
  authenticate,
  requireRole('MANAGER', 'HR', 'ADMIN'),
  authorize('performance:write'),
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('title').notEmpty().withMessage('Goal title is required'),
  body('description').notEmpty().withMessage('Goal description is required'),
  body('targetDate').isISO8601().withMessage('Valid target date is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
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
    employeeId,
    title,
    description,
    targetDate,
    priority = 'MEDIUM',
    status = 'NOT_STARTED'
  } = req.body;

  // Check if employee exists
  const employee = await database.findOne('employees', { userId: employeeId });
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  const goal = {
    employeeId,
    title,
    description,
    targetDate: new Date(targetDate),
    priority: priority.toUpperCase(),
    status: status.toUpperCase(),
    progress: 0,
    createdBy: req.user.id,
    createdAt: new Date()
  };

  const result = await database.insertOne('performance_goals', goal);

  res.status(201).json({
    success: true,
    message: 'Performance goal created successfully',
    goal: {
      _id: result.insertedId,
      ...goal
    }
  });
}));

// Update goal status
router.put('/goals/:id/status', [
  authenticate,
  authorize('performance:write'),
  body('status').isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
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
  const { status, progress } = req.body;

  // Check if goal exists
  const goal = await database.findOne('performance_goals', { _id: new ObjectId(id) });
  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Performance goal not found'
    });
  }

  // Check permissions
  if (req.user.role === 'EMPLOYEE' && goal.employeeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const updateData = {
    status: status.toUpperCase(),
    updatedAt: new Date(),
    updatedBy: req.user.id
  };

  if (progress !== undefined) {
    updateData.progress = parseInt(progress);
  }

  await database.updateOne(
    'performance_goals',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  res.json({
    success: true,
    message: 'Goal status updated successfully'
  });
}));

// Get employees (for managers)
router.get('/employees', [
  authenticate,
  requireRole('MANAGER', 'HR', 'ADMIN'),
  authorize('employees:read')
], asyncHandler(async (req, res) => {
  const employees = await database.find('employees', { isActive: true }, {
    sort: { firstName: 1 }
  });

  res.json({
    success: true,
    employees
  });
}));

// Get performance statistics
router.get('/stats', [
  authenticate,
  authorize('performance:read')
], asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Get review stats
  const totalReviews = await database.count('performance_reviews', dateQuery);
  const completedReviews = await database.count('performance_reviews', { 
    ...dateQuery,
    status: 'COMPLETED' 
  });
  const pendingReviews = await database.count('performance_reviews', { 
    ...dateQuery,
    status: 'PENDING' 
  });

  // Get goal stats
  const totalGoals = await database.count('performance_goals', dateQuery);
  const completedGoals = await database.count('performance_goals', { 
    ...dateQuery,
    status: 'COMPLETED' 
  });
  const inProgressGoals = await database.count('performance_goals', { 
    ...dateQuery,
    status: 'IN_PROGRESS' 
  });

  // Calculate average rating
  const completedReviewsData = await database.find('performance_reviews', { 
    ...dateQuery,
    status: 'COMPLETED' 
  });

  let averageRating = 0;
  if (completedReviewsData.length > 0) {
    const totalRating = completedReviewsData.reduce((sum, review) => sum + review.overallRating, 0);
    averageRating = Math.round((totalRating / completedReviewsData.length) * 10) / 10;
  }

  res.json({
    success: true,
    stats: {
      reviews: {
        total: totalReviews,
        completed: completedReviews,
        pending: pendingReviews,
        averageRating
      },
      goals: {
        total: totalGoals,
        completed: completedGoals,
        inProgress: inProgressGoals
      }
    }
  });
}));

module.exports = router;
