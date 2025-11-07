const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(verifyToken);

// Validation schemas
const leaveRequestCreateSchema = [
  body('leaveType')
    .isIn(['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'STUDY', 'EMERGENCY'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be valid ISO 8601 format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be valid ISO 8601 format'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  body('workCoverage')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Work coverage notes cannot exceed 200 characters'),
  body('isEmergency')
    .optional()
    .isBoolean()
    .withMessage('Is emergency must be boolean')
];

// Validate that endDate is after startDate
const validateLeaveDates = (req, res, next) => {
  const { startDate, endDate } = req.body;
  
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({
      message: 'End date must be after start date'
    });
  }

  // Calculate days requested
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysRequested > 365) {
    return res.status(400).json({
      message: 'Leave request cannot exceed 365 days'
    });
  }

  // Add calculated days to request body
  req.body.daysRequested = daysRequested;
  
  next();
};

// Submit leave request
router.post('/', [
  ...leaveRequestCreateSchema,
  validateLeaveDates
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    leaveType,
    startDate,
    endDate,
    reason,
    workCoverage,
    isEmergency = false
  } = req.body;

  const employeeId = req.user.employee.id;

  // Check for conflicting leave requests
  const conflictingLeave = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        }
      ]
    }
  });

  if (conflictingLeave.length > 0) {
    return res.status(400).json({ 
      message: 'You have a conflicting leave request for this period' 
    });
  }

  // Find supervisor for approval (if not emergency)
  let approver = null;
  if (!isEmergency && req.user.employee.supervisorId) {
    approver = req.user.employee.supervisorId;
  } else if (!isEmergency) {
    // Find department manager
    const departmentManager = await prisma.department.findFirst({
      where: {
        managerId: employeeId,
        isActive: true
      },
      select: { managerId: true }
    });
    
    if (departmentManager?.managerId) {
      approver = departmentManager.managerId;
    }
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      EmployeeId: employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      daysRequested: req.body.daysRequested,
      reason,
      workCoverage,
      isEmergency,
      approverId: approver,
      status: isEmergency ? 'APPROVED' : 'PENDING'
    },
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
      approver: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Leave request submitted successfully',
    leaveRequest
  });
}));

// Get employee's own leave requests
router.get('/my-leaves', [
  query('year').optional().isInt({ min: 2020 }).withMessage('Invalid year'),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
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
    where.startDate = {
      gte: new Date(year, 0, 1),
      lt: new Date(parseInt(year) + 1, 0, 1)
    };
  }

  const skip = (page - 1) * limit;

  const [leaveRequests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      skip,
      take: limit,
      where,
      orderBy: { startDate: 'desc' },
      include: {
        approver: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    }),
    prisma.leaveRequest.count({ where })
  ]);

  // Calculate leave balance
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);

  const leaveStats = await prisma.leaveRequest.groupBy({
    by: ['leaveType', 'status'],
    where: {
      employeeId,
      startDate: { gte: yearStart, lte: yearEnd }
    },
    _sum: {
      daysRequested: true
    }
  });

  const leaveBalance = {
    VACATION: 20, // Standard vacation days
    SICK: 10,     // Standard sick days
    PERSONAL: 5   // Standard personal days
  };

  // Calculate used days
  leaveStats.forEach(stat => {
    if (stat.status === 'APPROVED' && leaveBalance[stat.leaveType]) {
      leaveBalance[stat.leaveType] -= (stat._sum.daysRequested || 0);
    }
  });

  res.json({
    leaveRequests,
    leaveBalance,
    summary: {
      totalRequests: total,
      pendingRequests: leaveRequests.filter(req => req.status === 'PENDING').length,
      approvedRequests: leaveRequests.filter(req => req.status === 'APPROVED').length,
      rejectedRequests: leaveRequests.filter(req => req.status === 'REJECTED').length
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Approve/Reject leave request (Supervisors, HR, Admin)
router.put('/:id/approve', [
  checkRole('ADMIN', 'HR', 'MANAGER'),
  param('id').isMongoId().withMessage('Invalid leave request ID'),
  body('action').isIn(['APPROVED', 'REJECTED']).withMessage('Action must be APPROVED or REJECTED'),
  body('rejectionReason').optional().isLength({ max: 200 }).withMessage('Rejection reason too long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  // Check if user has permission to approve this request
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: true,
      approver: true
    }
  });

  if (!leaveRequest) {
    return res.status(404).json({ 
      message: 'Leave request not found' 
    });
  }

  // Check if already processed
  if (leaveRequest.status !== 'PENDING') {
    return res.status(400).json({ 
      message: 'Leave request has already been processed' 
    });
  }

  // Check permission logic
  const hasPermission = 
    req.user.role === 'ADMIN' || 
    req.user.role === 'HR' || 
    (req.user.role === 'MANAGER' && leaveRequest.approverId === req.user.employee.id) ||
    leaveRequest.approverId === req.user.employee.id;

  if (!hasPermission) {
    return res.status(403).json({ 
      message: 'You do not have permission to approve this leave request' 
    });
  }

  const updateData = {
    status: action
  };

  if (action === 'APPROVED') {
    updateData.approvedAt = new Date();
  } else {
    updateData.rejectedAt = new Date();
    updateData.rejectionReason = rejectionReason;
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: { id },
    data: updateData,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          position: true
        }
      },
      approver: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.json({
    message: `Leave request ${action.toLowerCase()} successfully`,
    leaveRequest: updatedRequest
  });
}));

// Cancel leave request
router.put('/:id/cancel', [
  param('id').isMongoId().withMessage('Invalid leave request ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const employeeId = req.user.employee.id;

  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: { 
      id,
      employeeId,
      status: 'PENDING' // Can only cancel pending requests
    }
  });

  if (!leaveRequest) {
    return res.status(404).json({ 
      message: 'Leave request not found or cannot be cancelled' 
    });
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: { id },
    data: { 
      status: 'CANCELLED',
      rejectedAt: new Date()
    }
  });

  res.json({
    message: 'Leave request cancelled successfully',
    leaveRequest: updatedRequest
  });
}));

// Get leave requests for approval (Supervisors, HR, Admin)
router.get('/pending', [
  checkRole('ADMIN', 'HR', 'MANAGER'),
  query('departmentId').optional().isMongoId().withMessage('Invalid department ID'),
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

  const { departmentId, page = 1, limit = 20 } = req.query;

  let where = { status: 'PENDING' };

  // If HR or Admin, get all pending requests
  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    if (departmentId) {
      // Get employees in department
      const departmentEmployeeIds = await prisma.employee.findMany({
        where: { departmentId },
        select: { id: true }
      });
      where.employeeId = { in: departmentEmployeeIds.map(emp => emp.id) };
    }
  } else if (req.user.role === 'MANAGER') {
    // Managers only see their subordinates' requests
    where.approverId = req.user.employee.id;
  }

  const skip = (page - 1) * limit;

  const [leaveRequests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    }),
    prisma.leaveRequest.count({ where })
  ]);

  res.json({
    leaveRequests,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get leave request by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid leave request ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: {
            select: {
              name: true
            }  
          }
        }
      },
      approver: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  if (!leaveRequest) {
    return res.status(404).json({ 
      message: 'Leave request not found' 
    });
  }

  // Check access permission
  const hasAccess = 
    leaveRequest.employeeId === req.user.employee.id ||
    req.user.role === 'ADMIN' ||
    req.user.role === 'HR' ||
    leaveRequest.approverId === req.user.employee.id;

  if (!hasAccess) {
    return res.status(403).json({ 
      message: 'You do not have access to view this leave request' 
    });
  }

  res.json({ leaveRequest });
}));

// Delete leave request (Admin only)
router.delete('/:id', [
  checkRole('ADMIN'),
  param('id').isMongoId().withMessage('Invalid leave request ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  await prisma.leaveRequest.delete({
    where: { id }
  });

  res.json({ 
    message: 'Leave request deleted successfully' 
  });
}));

module.exports = router;
