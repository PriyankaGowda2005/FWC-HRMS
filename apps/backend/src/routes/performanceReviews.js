const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get performance reviews
router.get('/', asyncHandler(async (req, res) => {
  const { employeeId, status, reviewType, year, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (reviewType) query.reviewType = reviewType;
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    query.reviewDate = { $gte: startDate, $lte: endDate };
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const reviews = await database.find('performance_reviews', query, {
    skip,
    limit,
    sort
  });

  // Get employee and reviewer details for each review
  const reviewsWithDetails = await Promise.all(
    reviews.map(async (review) => {
      const employee = await database.findOne('employees', { _id: new ObjectId(review.employeeId) });
      const reviewer = await database.findOne('employees', { _id: new ObjectId(review.reviewerId) });
      
      return {
        ...review,
        employee: employee ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          department: employee.department
        } : null,
        reviewer: reviewer ? {
          firstName: reviewer.firstName,
          lastName: reviewer.lastName,
          position: reviewer.position
        } : null
      };
    })
  );

  const total = await database.count('performance_reviews', query);

  res.json({
    reviews: reviewsWithDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get my performance reviews
router.get('/my-reviews', asyncHandler(async (req, res) => {
  const { year, status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Get employee by user ID
  const employee = await database.findOne('employees', { userId: new ObjectId(req.user.id) });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  let query = { employeeId: employee._id.toString() };
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    query.reviewDate = { $gte: startDate, $lte: endDate };
  }
  if (status) query.status = status;

  const reviews = await database.find('performance_reviews', query, {
    skip,
    limit,
    sort: { reviewDate: -1 }
  });

  // Get reviewer details for each review
  const reviewsWithReviewers = await Promise.all(
    reviews.map(async (review) => {
      const reviewer = await database.findOne('employees', { _id: new ObjectId(review.reviewerId) });
      
      return {
        ...review,
        reviewer: reviewer ? {
          firstName: reviewer.firstName,
          lastName: reviewer.lastName,
          position: reviewer.position
        } : null
      };
    })
  );

  // Calculate stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews 
    : 0;

  const total = await database.count('performance_reviews', query);

  res.json({
    reviews: reviewsWithReviewers,
    stats: {
      totalReviews,
      averageRating: Math.round(avgRating * 10) / 10
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Create performance review
router.post('/', requireRole('ADMIN', 'HR', 'MANAGER'), [
  body('employeeId').notEmpty().withMessage('Employee ID required'),
  body('reviewPeriod').notEmpty().withMessage('Review period required'),
  body('overallRating').isNumeric().withMessage('Overall rating must be a number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { employeeId, reviewPeriod, overallRating, goals, achievements, areasForImprovement, comments } = req.body;

  // Get reviewer (current user)
  const reviewer = await database.findOne('employees', { userId: new ObjectId(req.user.userId) });
  if (!reviewer) {
    return res.status(404).json({ message: 'Reviewer not found' });
  }

  const review = {
    employeeId,
    reviewerId: reviewer._id.toString(),
    reviewPeriod,
    reviewDate: new Date(),
    overallRating: parseInt(overallRating),
    goals: goals || [],
    achievements: achievements || [],
    areasForImprovement: areasForImprovement || [],
    comments: comments || '',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await database.insertOne('performance_reviews', review);

  res.status(201).json({
    message: 'Performance review created successfully',
    review: {
      id: result.insertedId,
      ...review
    }
  });
}));

// Update performance review
router.put('/:id', requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  const updateData = {
    ...req.body,
    updatedAt: new Date()
  };

  const result = await database.updateOne(
    'performance_reviews',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: 'Performance review not found' });
  }

  res.json({
    message: 'Performance review updated successfully',
    review: { id, ...updateData }
  });
}));

// Submit self-rating
router.post('/:id/self-rating', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { selfRating, selfComments } = req.body;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  // Verify this review belongs to the current user
  const employee = await database.findOne('employees', { userId: new ObjectId(req.user.userId) });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const review = await database.findOne('performance_reviews', { 
    _id: new ObjectId(id),
    employeeId: employee._id.toString()
  });

  if (!review) {
    return res.status(404).json({ message: 'Performance review not found' });
  }

  const updateData = {
    selfRating: parseInt(selfRating),
    selfComments: selfComments || '',
    updatedAt: new Date()
  };

  await database.updateOne(
    'performance_reviews',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  res.json({
    message: 'Self-rating submitted successfully',
    selfRating: parseInt(selfRating)
  });
}));

// Delete performance review
router.delete('/:id', requireRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  const result = await database.deleteOne('performance_reviews', { _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Performance review not found' });
  }

  res.json({ message: 'Performance review deleted successfully' });
}));

// Get team performance reviews
router.get('/team/:managerId', requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { managerId } = req.params;
  const { year, status } = req.query;

  // Get team members under this manager
  const teamMembers = await database.find('employees', { 
    managerId: new ObjectId(managerId),
    isActive: true 
  });

  if (!teamMembers || teamMembers.length === 0) {
    return res.json({
      success: true,
      stats: {
        totalTeamMembers: 0,
        totalReviews: 0,
        averageRating: 0,
        highPerformers: 0,
        needsImprovement: 0
      },
      reviews: []
    });
  }

  const teamMemberIds = teamMembers.map(member => member._id);

  // Build query for team performance reviews
  let query = { employeeId: { $in: teamMemberIds } };
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    query.reviewDate = { $gte: startDate, $lte: endDate };
  }
  if (status) query.status = status;

  const reviews = await database.find('performance_reviews', query, {
    sort: { reviewDate: -1 }
  });

  // Calculate team statistics
  const stats = {
    totalTeamMembers: teamMembers.length,
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? 
      reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length : 0,
    highPerformers: reviews.filter(r => (r.overallRating || 0) >= 4).length,
    needsImprovement: reviews.filter(r => (r.overallRating || 0) < 3).length,
    completionRate: teamMembers.length > 0 ? 
      (reviews.length / teamMembers.length * 100).toFixed(1) : 0
  };

  // Add employee details to reviews
  const reviewsWithDetails = reviews.map(review => {
    const employee = teamMembers.find(member => member._id.toString() === review.employeeId.toString());
    return {
      ...review,
      employee: employee ? {
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department
      } : null
    };
  });

  res.json({
    success: true,
    stats,
    reviews: reviewsWithDetails,
    teamMembers: teamMembers.map(member => ({
      _id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      position: member.position,
      department: member.department
    }))
  });
}));

// Get performance metrics
router.get('/metrics', requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { period = 'current' } = req.query;
  
  // Calculate date range based on period
  let startDate, endDate;
  const now = new Date();
  
  switch (period) {
    case 'current':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      break;
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last-quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3, 0);
      break;
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
  }

  const reviews = await database.find('performance_reviews', {
    reviewDate: { $gte: startDate, $lte: endDate }
  });

  const metrics = {
    period: { startDate, endDate, period },
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? 
      reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length : 0,
    ratingDistribution: {
      excellent: reviews.filter(r => (r.overallRating || 0) >= 4.5).length,
      good: reviews.filter(r => (r.overallRating || 0) >= 3.5 && (r.overallRating || 0) < 4.5).length,
      satisfactory: reviews.filter(r => (r.overallRating || 0) >= 2.5 && (r.overallRating || 0) < 3.5).length,
      needsImprovement: reviews.filter(r => (r.overallRating || 0) < 2.5).length
    },
    statusDistribution: {
      completed: reviews.filter(r => r.status === 'COMPLETED').length,
      pending: reviews.filter(r => r.status === 'PENDING').length,
      draft: reviews.filter(r => r.status === 'DRAFT').length
    }
  };

  res.json({
    success: true,
    metrics
  });
}));

module.exports = router;