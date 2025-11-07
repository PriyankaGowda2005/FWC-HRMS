const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all employees (Admin/HR only)
router.get('/', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const employees = await prisma.employee.findMany({
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const total = await prisma.employee.count();

  res.json({
    employees,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get employee by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid employee ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  // If user is employee, only allow access to their own profile
  if (req.user.role === 'EMPLOYEE') {
    if (req.user.employee.id !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }
    }
  });

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  res.json({ employee });
}));

// Update employee (Admin/HR only, or self-update for basic info)
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid employee ID'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('salary').optional().isFloat().withMessage('Salary must be a number'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'department', 'position', 'salary'];
  const updateData = {};

  // Filter allowed fields
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Check permissions
  let canUpdate = false;
  
  if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
    canUpdate = true;
  } else if (req.user.role === 'EMPLOYEE') {
    // Employees can only update their own basic info (not salary)
    if (req.user.employee.id === id) {
      canUpdate = true;
      // Remove salary from update data for employees
      delete updateData.salary;
      // Only allow basic profile updates
      const basicFields = ['firstName', 'lastName', 'phoneNumber'];
      Object.keys(updateData).forEach(key => {
        if (!basicFields.includes(key)) {
          delete updateData[key];
        }
      });
    }
  }

  if (!canUpdate) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true
        }
      }
    }
  });

  res.json({ 
    message: 'Employee updated successfully',
    employee 
  });
}));

// Delete employee (Admin only)
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid employee ID')
], checkRole('ADMIN'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  // Prevent self-deletion
  if (req.user.employee.id === id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  await prisma.employee.delete({
    where: { id }
  });

  res.json({ message: 'Employee deleted successfully' });
}));

module.exports = router;
