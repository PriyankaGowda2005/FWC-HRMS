const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireManagerAccess, auditLog, requireRole } = require('../middleware/authMiddleware');
const socketService = require('../services/socketService');

const router = express.Router();

// Apply for leave
router.post('/', [
  authenticate,
  authorize('leaves:write'),
  body('leaveTypeId').notEmpty().withMessage('Leave type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { leaveTypeId, startDate, endDate, reason, notes } = req.body;
  const employeeId = req.user.id;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  if (start < new Date()) {
    return res.status(400).json({ message: 'Cannot apply for leave in the past' });
  }

  // Check if employee exists
  const employee = await database.findOne('employees', { userId: employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee profile not found' });
  }

  // Check leave type exists
  const leaveType = await database.findOne('leave_types', { _id: new ObjectId(leaveTypeId) });
  if (!leaveType) {
    return res.status(404).json({ message: 'Leave type not found' });
  }

  // Check for overlapping leave requests
  const overlappingLeave = await database.findOne('leave_requests', {
    employeeId: employeeId,
    status: { $in: ['APPLIED', 'APPROVED'] },
    $or: [
      {
        startDate: { $lte: end },
        endDate: { $gte: start }
      }
    ]
  });

  if (overlappingLeave) {
    return res.status(400).json({ 
      message: 'You already have a leave request for this period' 
    });
  }

  // Calculate leave days
  const leaveDays = calculateLeaveDays(start, end);

  // Check leave balance
  const leaveBalance = await getLeaveBalance(employeeId, leaveTypeId);
  if (leaveDays > leaveBalance.remaining) {
    return res.status(400).json({ 
      message: `Insufficient leave balance. Available: ${leaveBalance.remaining} days, Requested: ${leaveDays} days` 
    });
  }

  // Create leave request
  const leaveRequest = {
    employeeId: employeeId,
    leaveTypeId: leaveTypeId,
    startDate: start,
    endDate: end,
    leaveDays: leaveDays,
    status: 'APPLIED',
    appliedAt: new Date(),
    reason: reason,
    notes: notes || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await database.insertOne('leave_requests', leaveRequest);

  // Get employee's manager for notification
  const manager = employee.managerId ? 
    await database.findOne('employees', { _id: employee.managerId }) : null;

  // Create notification for managers/HR
  const notification = {
    type: 'leave:applied',
    data: {
      leaveRequestId: result.insertedId,
      employeeId: employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: leaveType.name,
      startDate: start,
      endDate: end,
      leaveDays: leaveDays,
      reason: reason
    }
  };

  // Send notifications
  if (manager) {
    socketService.sendToUser(manager.userId, 'notification', notification);
  }
  socketService.broadcastToRole('HR', 'notification', notification);
  socketService.broadcastToRole('ADMIN', 'notification', notification);

  // Send confirmation to employee
  socketService.sendToUser(employeeId, 'leave:applied', {
    success: true,
    leaveRequestId: result.insertedId,
    message: 'Leave request submitted successfully'
  });

  res.json({
    success: true,
    message: 'Leave request submitted successfully',
    data: {
      id: result.insertedId,
      ...leaveRequest
    }
  });
}));

// Get leave requests
router.get('/', [
  authenticate,
  authorize('leaves:read')
], asyncHandler(async (req, res) => {
  const { employeeId, status, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  let query = {};

  // Build query based on user role
  if (req.user.role === 'EMPLOYEE') {
    query.userId = userId;
  } else if (employeeId && employeeId !== 'undefined') {
    // Check access permissions for managers
    if (req.user.role === 'MANAGER') {
      const employee = await database.findOne('employees', { 
        _id: new ObjectId(employeeId),
        managerId: req.user.employee?._id
      });
      if (!employee) {
        return res.status(403).json({ message: 'Access denied to this employee data' });
      }
    }
    query.employeeId = employeeId;
  }

  // Status filtering
  if (status) {
    query.status = status.toUpperCase();
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const leaveRequests = await database.find('leave_requests', query, {
    skip: skip,
    limit: parseInt(limit),
    sort: { appliedAt: -1 }
  });

  // Populate leave type and employee data
  const populatedRequests = await Promise.all(
    leaveRequests.map(async (request) => {
      const leaveType = await database.findOne('leave_types', { _id: request.leaveTypeId });
      const employee = await database.findOne('employees', { userId: request.employeeId });
      
      return {
        ...request,
        leaveType: leaveType,
        employee: employee ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeCode: employee.employeeCode,
          designation: employee.designation
        } : null
      };
    })
  );

  const total = await database.count('leave_requests', query);

  res.json({
    success: true,
    leaveRequests: populatedRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get my leaves (for employees)
router.get('/my-leaves', [
  authenticate,
  authorize('leaves:read')
], asyncHandler(async (req, res) => {
  const { year, status, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  let query = { userId: userId };

  // Year filtering
  if (year) {
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);
    query.appliedAt = { $gte: startOfYear, $lte: endOfYear };
  }

  // Status filtering
  if (status) {
    query.status = status.toUpperCase();
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const leaveRequests = await database.find('leave_requests', query, {
    skip: skip,
    limit: parseInt(limit),
    sort: { appliedAt: -1 }
  });

  // Populate leave type data
  const populatedRequests = await Promise.all(
    leaveRequests.map(async (request) => {
      const leaveType = await database.findOne('leave_types', { _id: request.leaveTypeId });
      return {
        ...request,
        leaveType: leaveType
      };
    })
  );

  const total = await database.count('leave_requests', query);

  res.json({
    success: true,
    leaveRequests: populatedRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get team leave requests (for managers)
router.get('/team/:managerId', [
  authenticate,
  requireRole('MANAGER', 'HR', 'ADMIN'),
  authorize('leaves:read')
], asyncHandler(async (req, res) => {
  const { managerId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;
  
  // Use current user's ID if they're a manager
  let targetManagerId = managerId;
  if (req.user.role === 'MANAGER') {
    targetManagerId = req.user.id;
  }

  // Get manager's employee record
  const managerEmployee = await database.findOne('employees', { userId: targetManagerId });
  if (!managerEmployee) {
    return res.status(404).json({ message: 'Manager profile not found' });
  }

  // Get team members
  const teamMembers = await database.find('employees', { 
    managerId: managerEmployee._id 
  });
  
  if (teamMembers.length === 0) {
    return res.json({
      success: true,
      pendingRequests: [],
      leaveRequests: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  }

  const teamMemberIds = teamMembers.map(member => member.userId);
  
  // Build query
  let query = { employeeId: { $in: teamMemberIds } };
  
  // Status filtering
  if (status) {
    query.status = status.toUpperCase();
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const leaveRequests = await database.find('leave_requests', query, {
    skip: skip,
    limit: parseInt(limit),
    sort: { appliedAt: -1 }
  });

  // Populate data
  const populatedRequests = await Promise.all(
    leaveRequests.map(async (request) => {
      const leaveType = await database.findOne('leave_types', { _id: request.leaveTypeId });
      const employee = await database.findOne('employees', { userId: request.employeeId });
      
      return {
        ...request,
        leaveType: leaveType,
        employee: employee ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeCode: employee.employeeCode,
          designation: employee.designation,
          departmentId: employee.departmentId
        } : null
      };
    })
  );

  // Get pending requests separately
  const pendingQuery = { 
    employeeId: { $in: teamMemberIds },
    status: 'APPLIED'
  };
  const pendingRequests = await database.find('leave_requests', pendingQuery, {
    sort: { appliedAt: 1 }
  });

  const total = await database.count('leave_requests', query);

  res.json({
    success: true,
    pendingRequests: pendingRequests.length,
    leaveRequests: populatedRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get pending leaves (for managers/HR)
router.get('/pending', [
  authenticate,
  requireRole('MANAGER', 'HR', 'ADMIN'),
  authorize('leaves:read')
], asyncHandler(async (req, res) => {
  const { departmentId, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  let query = { status: 'APPLIED' };

  // Filter by department for managers
  if (req.user.role === 'MANAGER') {
    const managerEmployee = await database.findOne('employees', { userId: userId });
    if (!managerEmployee) {
      return res.status(404).json({ message: 'Manager profile not found' });
    }

    // Get team members
    const teamMembers = await database.find('employees', { 
      managerId: managerEmployee._id 
    });
    const teamMemberIds = teamMembers.map(member => member.userId);
    
    query.employeeId = { $in: teamMemberIds };
  } else if (departmentId) {
    // Filter by department for HR/Admin
    const departmentEmployees = await database.find('employees', { 
      departmentId: new ObjectId(departmentId) 
    });
    const employeeIds = departmentEmployees.map(emp => emp.userId);
    
    query.employeeId = { $in: employeeIds };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const leaveRequests = await database.find('leave_requests', query, {
    skip: skip,
    limit: parseInt(limit),
    sort: { appliedAt: 1 } // Oldest first for approval queue
  });

  // Populate data
  const populatedRequests = await Promise.all(
    leaveRequests.map(async (request) => {
      const leaveType = await database.findOne('leave_types', { _id: request.leaveTypeId });
      const employee = await database.findOne('employees', { userId: request.employeeId });
      
      return {
        ...request,
        leaveType: leaveType,
        employee: employee ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeCode: employee.employeeCode,
          designation: employee.designation,
          departmentId: employee.departmentId
        } : null
      };
    })
  );

  const total = await database.count('leave_requests', query);

  res.json({
    success: true,
    leaveRequests: populatedRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Approve/Reject leave
router.put('/:id/approve', [
  authenticate,
  authorize('leaves:approve'),
  body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
  body('note').optional().isString().withMessage('Note must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { status, note } = req.body;
  const decidedBy = req.user.id;

  // Get leave request
  const leaveRequest = await database.findOne('leave_requests', { _id: new ObjectId(id) });
  if (!leaveRequest) {
    return res.status(404).json({ message: 'Leave request not found' });
  }

  // Check if already decided
  if (leaveRequest.status !== 'APPLIED') {
    return res.status(400).json({ message: 'Leave request has already been decided' });
  }

  // Check permissions for managers
  if (req.user.role === 'MANAGER') {
    const managerEmployee = await database.findOne('employees', { userId: decidedBy });
    const employee = await database.findOne('employees', { userId: leaveRequest.employeeId });
    
    if (!managerEmployee || !employee || !employee.managerId.equals(managerEmployee._id)) {
      return res.status(403).json({ message: 'Access denied. Employee not under your management' });
    }
  }

  // Update leave request
  const updateData = {
    status: status.toUpperCase(),
    decidedBy: decidedBy,
    decidedAt: new Date(),
    notes: note || '',
    updatedAt: new Date()
  };

  await database.updateOne(
    'leave_requests',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  // Get employee and leave type for notification
  const employee = await database.findOne('employees', { userId: leaveRequest.employeeId });
  const leaveType = await database.findOne('leave_types', { _id: leaveRequest.leaveTypeId });

  // Create notification for employee
  const notification = {
    type: 'leave:decision',
    data: {
      leaveRequestId: id,
      status: status.toUpperCase(),
      decidedBy: decidedBy,
      note: note,
      leaveType: leaveType.name,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      leaveDays: leaveRequest.leaveDays
    }
  };

  // Send notification to employee
  socketService.sendToUser(leaveRequest.employeeId, 'notification', notification);

  // Send confirmation to approver
  socketService.sendToUser(decidedBy, 'leave:decided', {
    success: true,
    leaveRequestId: id,
    status: status.toUpperCase(),
    employeeName: `${employee.firstName} ${employee.lastName}`
  });

  res.json({
    success: true,
    message: `Leave request ${status.toLowerCase()} successfully`,
    data: {
      id: id,
      status: status.toUpperCase(),
      decidedBy: decidedBy,
      decidedAt: updateData.decidedAt
    }
  });
}));

// Cancel leave request
router.put('/:id/cancel', [
  authenticate,
  authorize('leaves:write')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get leave request
  const leaveRequest = await database.findOne('leave_requests', { _id: new ObjectId(id) });
  if (!leaveRequest) {
    return res.status(404).json({ message: 'Leave request not found' });
  }

  // Check ownership
  if (leaveRequest.employeeId !== userId && !['ADMIN', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Can only cancel your own leave requests' });
  }

  // Check if can be cancelled
  if (!['APPLIED', 'APPROVED'].includes(leaveRequest.status)) {
    return res.status(400).json({ message: 'Leave request cannot be cancelled' });
  }

  // Check if leave has already started
  if (new Date() >= leaveRequest.startDate) {
    return res.status(400).json({ message: 'Cannot cancel leave that has already started' });
  }

  // Update leave request
  await database.updateOne(
    'leave_requests',
    { _id: new ObjectId(id) },
    { 
      $set: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      } 
    }
  );

  res.json({
    success: true,
    message: 'Leave request cancelled successfully'
  });
}));

// Get leave balance
router.get('/balance/:employeeId', [
  authenticate,
  authorize('leaves:read')
], asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const userId = req.user.id;

  // Check access permissions
  if (req.user.role === 'EMPLOYEE' && employeeId !== userId) {
    return res.status(403).json({ message: 'Access denied. Can only view your own leave balance' });
  }

  if (req.user.role === 'MANAGER') {
    const employee = await database.findOne('employees', { 
      _id: new ObjectId(employeeId),
      managerId: req.user.employee?._id
    });
    if (!employee) {
      return res.status(403).json({ message: 'Access denied to this employee data' });
    }
  }

  // Get all leave types
  const leaveTypes = await database.find('leave_types', {});
  
  // Calculate balance for each leave type
  const balances = await Promise.all(
    leaveTypes.map(async (leaveType) => {
      const balance = await getLeaveBalance(employeeId, leaveType._id);
      return {
        leaveType: leaveType,
        ...balance
      };
    })
  );

  res.json({
    success: true,
    data: balances
  });
}));

// Helper function to calculate leave days
function calculateLeaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

// Helper function to get leave balance
async function getLeaveBalance(employeeId, leaveTypeId) {
  const leaveType = await database.findOne('leave_types', { _id: leaveTypeId });
  if (!leaveType) return { total: 0, used: 0, remaining: 0 };

  // Get current year
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01`);
  const endOfYear = new Date(`${currentYear}-12-31`);

  // Count used days
  const usedLeaves = await database.find('leave_requests', {
    employeeId: employeeId,
    leaveTypeId: leaveTypeId,
    status: { $in: ['APPROVED', 'APPLIED'] },
    startDate: { $gte: startOfYear, $lte: endOfYear }
  });

  const usedDays = usedLeaves.reduce((sum, leave) => sum + (leave.leaveDays || 0), 0);

  return {
    total: leaveType.daysAllowedPerYear,
    used: usedDays,
    remaining: Math.max(0, leaveType.daysAllowedPerYear - usedDays)
  };
}

module.exports = router;