const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all departments - temporarily public for testing
router.get('/', asyncHandler(async (req, res) => {
  const departments = await database.find('departments', {}, {
    sort: { name: 1 }
  });

  // Get employee count for each department
  const departmentsWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const employeeCount = await database.count('employees', { 
        departmentId: dept._id,
        isActive: true 
      });
      
      // Get manager name if exists
      let managerName = null;
      if (dept.managerId) {
        const manager = await database.findOne('employees', { _id: dept.managerId });
        if (manager) {
          managerName = `${manager.firstName} ${manager.lastName}`;
        }
      }

      return {
        ...dept,
        employeeCount,
        managerName
      };
    })
  );

  res.json({
    success: true,
    departments: departmentsWithCounts
  });
}));

// Get department by ID
router.get('/:id', [
  authenticate,
  authorize('departments:read')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid department ID format'
    });
  }
  
  const department = await database.findOne('departments', { _id: new ObjectId(id) });
  
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Get employees in this department
  const employees = await database.find('employees', { 
    departmentId: new ObjectId(id),
    isActive: true 
  });

  // Get manager details if exists
  let manager = null;
  if (department.managerId) {
    manager = await database.findOne('employees', { _id: department.managerId });
  }

  res.json({
    success: true,
    department: {
      ...department,
      employees,
      manager
    }
  });
}));

// Create department
router.post('/', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('departments:write'),
  body('name').notEmpty().withMessage('Department name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number'),
  body('managerId').optional().isMongoId().withMessage('Invalid manager ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { name, description, budget, managerId } = req.body;

  // Check if department already exists
  const existingDept = await database.findOne('departments', { name });
  if (existingDept) {
    return res.status(400).json({
      success: false,
      message: 'Department with this name already exists'
    });
  }

  // Validate manager if provided
  if (managerId) {
    const manager = await database.findOne('employees', { _id: new ObjectId(managerId) });
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: 'Manager not found'
      });
    }
  }

  const department = {
    name,
    description: description || '',
    budget: budget ? parseFloat(budget) : 0,
    managerId: managerId ? new ObjectId(managerId) : null,
    isActive: true,
    createdAt: new Date(),
    createdBy: req.user.id
  };

  const result = await database.insertOne('departments', department);

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    department: {
      _id: result.insertedId,
      ...department
    }
  });
}));

// Update department
router.put('/:id', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('departments:write'),
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number'),
  body('managerId').optional().isMongoId().withMessage('Invalid manager ID'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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

  // Check if department exists
  const existingDept = await database.findOne('departments', { _id: new ObjectId(id) });
  if (!existingDept) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Check if name is being changed and if it already exists
  if (updateData.name && updateData.name !== existingDept.name) {
    const nameExists = await database.findOne('departments', { 
      name: updateData.name,
      _id: { $ne: new ObjectId(id) }
    });
    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }
  }

  // Validate manager if provided
  if (updateData.managerId) {
    const manager = await database.findOne('employees', { _id: new ObjectId(updateData.managerId) });
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: 'Manager not found'
      });
    }
    updateData.managerId = new ObjectId(updateData.managerId);
  }

  // Convert budget to number if provided
  if (updateData.budget) {
    updateData.budget = parseFloat(updateData.budget);
  }

  updateData.updatedAt = new Date();
  updateData.updatedBy = req.user.id;

  await database.updateOne(
    'departments',
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  res.json({
    success: true,
    message: 'Department updated successfully'
  });
}));

// Delete department
router.delete('/:id', [
  authenticate,
  requireRole('ADMIN'),
  authorize('departments:delete')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if department exists
  const department = await database.findOne('departments', { _id: new ObjectId(id) });
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Check if department has employees
  const employeeCount = await database.count('employees', { 
    departmentId: new ObjectId(id),
    isActive: true 
  });

  if (employeeCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete department with active employees. Please reassign employees first.'
    });
  }

  await database.deleteOne('departments', { _id: new ObjectId(id) });

  res.json({
    success: true,
    message: 'Department deleted successfully'
  });
}));

// Get department statistics
router.get('/:id/stats', [
  authenticate,
  authorize('departments:read')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await database.findOne('departments', { _id: new ObjectId(id) });
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Get employee count
  const totalEmployees = await database.count('employees', { 
    departmentId: new ObjectId(id),
    isActive: true 
  });

  // Get attendance stats for the department
  const employees = await database.find('employees', { 
    departmentId: new ObjectId(id),
    isActive: true 
  });

  const employeeIds = employees.map(emp => emp._id);
  
  // Get current month attendance
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const attendanceRecords = await database.find('attendance', {
    employeeId: { $in: employeeIds },
    date: { $gte: currentMonth, $lt: nextMonth }
  });

  const attendanceStats = {
    totalRecords: attendanceRecords.length,
    presentCount: attendanceRecords.filter(r => r.status === 'PRESENT').length,
    lateCount: attendanceRecords.filter(r => r.status === 'LATE').length,
    absentCount: attendanceRecords.filter(r => r.status === 'ABSENT').length
  };

  // Get leave stats
  const leaveRequests = await database.find('leave_requests', {
    employeeId: { $in: employeeIds },
    appliedAt: { $gte: currentMonth, $lt: nextMonth }
  });

  const leaveStats = {
    totalRequests: leaveRequests.length,
    approvedRequests: leaveRequests.filter(r => r.status === 'APPROVED').length,
    pendingRequests: leaveRequests.filter(r => r.status === 'APPLIED').length,
    rejectedRequests: leaveRequests.filter(r => r.status === 'REJECTED').length
  };

  res.json({
    success: true,
    stats: {
      totalEmployees,
      attendanceStats,
      leaveStats,
      budget: department.budget,
      budgetUsed: 0 // This would need to be calculated based on actual expenses
    }
  });
}));

module.exports = router;