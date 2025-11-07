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
const attendanceCreateSchema = [
  body('employeeId')
    .isMongoId()
    .withMessage('Invalid employee ID'),
  body('date')
    .isISO8601()
    .withMessage('Date must be valid ISO 8601 format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days in future
      
      if (date < new Date('2020-01-01') || date > maxDate) {
        throw new Error('Date must be between 2020 and 30 days from now');
      }
      return true;
    }),
  body('clockIn')
    .optional()
    .isISO8601()
    .withMessage('Clock in time must be valid ISO 8601 format'),
  body('clockOut')
    .optional()
    .isISO8601()
    .withMessage('Clock out time must be valid ISO 8601 format'),
  body('hoursWorked')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours worked必须以be between 0 and 24'),
  body('overtimeHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours must be positive'),
  body('breakTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Break time must be positive'),
  body('status')
    .optional()
    .isIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK', 'PERSONAL'])
    .withMessage('Invalid attendance status'),
  body('workFromHome')
    .optional()
    .isBoolean()
    .withMessage('Work from home must be boolean'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const attendanceUpdateSchema = [
  body('clockIn')
    .optional()
    .isISO8601()
    .withMessage('Clock in time must be valid ISO 8601 format'),
  body('clockOut')
    .optional()
    .isISO8601()
    .withMessage('Clock out time must be valid ISO 8601 format'),
  body('hoursWorked')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours worked must be between 0 and 24'),
  body('overtimeHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours must be positive'),
  body('breakTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Break time must be positive'),
  body('status')
    .optional()
    .isIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK', 'PERSONAL'])
    .withMessage('Invalid attendance status'),
  body('workFromHome')
    .optional()
    .isBoolean()
    .withMessage('Work from home must be boolean'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Clock In functionality
router.post('/clock-in', [
  body('notes').optional().isLength({ max: 200 }).withMessage('Notes too long'),
  body('workFromHome').optional().isBoolean().withMessage('Work from home must be boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { notes, workFromHome = false } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already clocked in today
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: req.user.employee.id,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      clockIn: { not: null }
    }
  });

  if (existingAttendance) {
    return res.status(400).json({ 
      message: 'Already clocked in for today' 
    });
  }

  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: req.user.employee.id,
        date: today
      }
    },
    update: {
      clockIn: new Date(),
      notes,
      workFromHome,
      status: workFromHome ? 'PRESENT' : 'PRESENT'
    },
    create: {
      employeeId: req.user.employee.id,
      date: today,
      clockIn: new Date(),
      notes,
      workFromHome,
      status: 'PRESENT'
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.json({
    message: 'Clocked in successfully',
    attendance: {
      id: attendance.id,
      clockIn: attendance.clockIn,
      workFromHome: attendance.workFromHome,
      notes: attendance.notes
    }
  });
}));

// Clock Out functionality
router.post('/clock-out', [
  body('notes').optional().isLength({ max: 200 }).withMessage('Notes too long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { notes } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance
  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: req.user.employee.id,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      clockIn: { not: null }
    }
  });

  if (!attendance) {
    return res.status(400).json({ 
      message: 'No clock in found for today' 
    });
  }

  if (attendance.clockOut) {
    return res.status(400).json({ 
      message: 'Already clocked out for today' 
    });
  }

  const clockOutTime = new Date();
  const clockInTime = attendance.clockIn;
  
  // Calculate hours worked
  const totalMinutes = (clockOutTime - clockInTime) / (1000 * 60);
  const breakTimeMinutes = (attendance.breakTime || 0) * 60;
  const hoursWorked = (totalMinutes - breakTimeMinutes) / 60;
  
  // Calculate overtime (assuming 8 hour workday)
  const overtimeHours = Math.max(0, hoursWorked - 8);

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      clockOut: clockOutTime,
      hoursWorked: Math.max(0, hoursWorked),
      overtimeHours,
      ...(notes && { notes })
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.json({
    message: 'Clocked out successfully',
    attendance: {
      id: updatedAttendance.id,
      clockIn: updatedAttendance.clockIn,
      clockOut: updatedAttendance.clockOut,
      hoursWorked: updatedAttendance.hoursWorked,
      overtimeHours: updatedAttendance.overtimeHours
    }
  });
}));

// Get current employee's attendance with filtering
router.get('/my-attendance', [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO 8601 format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
  query('status')
    .optional()
    .isIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK', 'PERSONAL'])
    .withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    startDate,
    endDate,
    page = 1,
    limit = 20,
    status
  } = req.query;

  // Default to current month if no dates provided
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const where = {
    employeeId: req.user.employee.id,
    date: {
      gte: new Date(start),
      lte: new Date(end)
    }
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [attendanceRecords, total] = await Promise.all([
    prisma.attendance.findMany({
      skip,
      take: limit,
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        clockIn: true,
        clockOut: true,
        hoursWorked: true,
        overtimeHours: true,
        status: true,
        workFromHome: true,
        notes: true,
        createdAt: true
      }
    }),
    prisma.attendance.count({ where })
  ]);

  // Calculate summary statistics
  const summary = await prisma.attendance.groupBy({
    by: ['status'],
    where: {
      employeeId: req.user.employee.id,
      date: {
        gte: new Date(start),
        lte: new Date(end)
      }
    },
    _sum: {
      hoursWorked: true,
      overtimeHours: true
    },
    _count: true
  });

  const totalHours = summary.reduce((sum, item) => sum + (item._sum.hoursWorked || 0), 0);
  const totalOvertime = summary.reduce((sum, item) => sum + (item._sum.overtimeHours || 0), 0);

  res.json({
    attendanceRecords,
    summary: {
      totalDays: total,
      totalHours,
      totalOvertime,
      statusBreakdown: summary.map(item => ({
        status: item.status,
        count: item._count,
        hours: item._sum.hoursWorked || 0,
        overtime: item._sum.overtimeHours || 0
      }))
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Admin/HR: Get all attendance with filters
router.get('/', [
  checkRole('ADMIN', 'HR', 'MANAGER'),
  query('employeeId').optional().isMongoId().withMessage('Invalid employee ID'),
  query('departmentId').optional().isMongoId().withMessage('Invalid department ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional().isIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK', 'PERSONAL']),
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
    employeeId,
    departmentId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 20
  } = req.query;

  const where = {};

  // Apply filters
  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (departmentId) {
    // Get employees in department
    const departmentEmployeeIds = await prisma.employee.findMany({
      where: { departmentId },
      select: { id: true }
    });
    where.employeeId = { in: departmentEmployeeIds.map(emp => emp.id) };
  }

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const skip = (page - 1) * limit;

  const [attendanceRecords, total] = await Promise.all([
    prisma.attendance.findMany({
      skip,
      take: limit,
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.attendance.count({ where })
  ]);

  res.json({
    attendanceRecords,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Create attendance record (Admin/HR only)
router.post('/', [
  checkRole('ADMIN', 'HR'),
  ...attendanceCreateSchema
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const attendanceData = req.body;
  const attendanceDate = new Date(attendanceData.date);

  // Check if attendance already exists for this employee and date
  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: attendanceData.employeeId,
      date: {
        gte: new Date(attendanceDate.getTime()),
        lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });

  if (existingAttendance) {
    return res.status(400).json({ 
      message: 'Attendance record already exists for this employee on this date' 
    });
  }

  const attendance = await prisma.attendance.create({
    data: attendanceData,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Attendance record created successfully',
    attendance
  });
}));

// Update attendance record (Admin/HR only)
router.put('/:id', [
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid attendance ID'),
  ...attendanceUpdateSchema
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
    'clockIn', 'clockOut', 'hoursWorked', 'overtimeHours', 
    'breakTime', 'status', 'workFromHome', 'notes'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const attendance = await prisma.attendance.update({
    where: { id },
    data: updateData,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true
        }
      }
    }
  });

  res.json({
    message: 'Attendance record updated successfully',
    attendance
  });
}));

// Delete attendance record (Admin only)
router.delete('/:id', [
  checkRole('ADMIN'),
  param('id').isMongoId().withMessage('Invalid attendance ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  await prisma.attendance.delete({
    where: { id }
  });

  res.json({ 
    message: 'Attendance record deleted successfully' 
  });
}));

module.exports = router;
