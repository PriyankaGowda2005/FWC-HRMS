const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireManagerAccess, auditLog, requireRole } = require('../middleware/authMiddleware');
const socketService = require('../services/socketService');

const router = express.Router();

// Clock in/out endpoint
router.post('/clock', [
  authenticate,
  authorize('attendance:clock'),
  body('type').isIn(['in', 'out', 'break']).withMessage('Type must be in, out, or break'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('deviceId').optional().isString().withMessage('Device ID must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { type, location, deviceId } = req.body;
  const employeeId = req.user.id;

  // Check if employee exists
  const employee = await database.findOne('employees', { userId: employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee profile not found' });
  }

  // Check for duplicate clock events within 1 minute
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentClock = await database.findOne('attendance_logs', {
    employeeId: employeeId,
    type: type.toUpperCase(),
    timestamp: { $gte: oneMinuteAgo }
  });

  if (recentClock) {
    return res.status(400).json({ 
      message: 'Duplicate clock event detected. Please wait before clocking again.' 
    });
  }

  // Create attendance log
  const attendanceLog = {
    employeeId: employeeId,
    type: type.toUpperCase(),
    timestamp: new Date(),
    location: location || 'Office',
    deviceId: deviceId || 'WEB',
    source: 'web',
    createdAt: new Date()
  };

  const result = await database.insertOne('attendance_logs', attendanceLog);

  // Update daily attendance summary
  await updateAttendanceSummary(employeeId, new Date());

  // Calculate total hours for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = await database.find('attendance_logs', {
    employeeId: employeeId,
    timestamp: { $gte: today, $lt: tomorrow }
  });

  const totalHours = calculateTotalHours(todayLogs);

  // Emit real-time event
  const notification = {
    type: 'attendance:clocked',
    data: {
      employeeId: employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      type: type.toUpperCase(),
      timestamp: attendanceLog.timestamp,
      location: attendanceLog.location,
      totalHoursToday: totalHours
    }
  };

  // Broadcast to managers, HR, and admin
  socketService.broadcastToRole('MANAGER', 'notification', notification);
  socketService.broadcastToRole('HR', 'notification', notification);
  socketService.broadcastToRole('ADMIN', 'notification', notification);

  // Send confirmation to user
  socketService.sendToUser(employeeId, 'attendance:clocked', {
    success: true,
    type: type.toUpperCase(),
    timestamp: attendanceLog.timestamp,
    totalHoursToday: totalHours
  });

  res.json({
    success: true,
    message: `Successfully clocked ${type}`,
    data: {
      id: result.insertedId,
      type: type.toUpperCase(),
      timestamp: attendanceLog.timestamp,
      totalHoursToday: totalHours
    }
  });
}));

// Get attendance records
router.get('/', [
  authenticate,
  authorize('attendance:read')
], asyncHandler(async (req, res) => {
  const { employeeId, date, startDate, endDate, page = 1, limit = 50 } = req.query;
  const userId = req.user.id;

  let query = {};
  let dateQuery = {};

  // Build query based on user role
  if (req.user.role === 'EMPLOYEE') {
    query.userId = userId;
  } else if (employeeId && employeeId !== 'undefined') {
    // Check if user has access to this employee
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

  // Date filtering
  if (date) {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    dateQuery.timestamp = { $gte: targetDate, $lt: nextDay };
  } else if (startDate && endDate) {
    dateQuery.timestamp = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  }

  const finalQuery = { ...query, ...dateQuery };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const attendanceLogs = await database.find('attendance', finalQuery, {
    skip: skip,
    limit: parseInt(limit),
    sort: { date: -1 }
  });

  const total = await database.count('attendance', finalQuery);

  res.json({
    success: true,
    attendanceRecords: attendanceLogs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get attendance summary
router.get('/summary', [
  authenticate,
  authorize('attendance:read')
], asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate } = req.query;
  const userId = req.user.id;

  let query = {};

  if (req.user.role === 'EMPLOYEE') {
    query.employeeId = userId;
  } else if (employeeId) {
    // Check access permissions
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

  // Date filtering
  if (startDate && endDate) {
    query.date = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  }

  const summaries = await database.find('attendance_summaries', query, {
    sort: { date: -1 }
  });

  // Calculate statistics
  const stats = {
    totalDays: summaries.length,
    presentDays: summaries.filter(s => s.status === 'PRESENT').length,
    absentDays: summaries.filter(s => s.status === 'ABSENT').length,
    lateDays: summaries.filter(s => s.status === 'LATE').length,
    totalHours: summaries.reduce((sum, s) => sum + (s.totalHours || 0), 0),
    averageHours: summaries.length > 0 ? 
      summaries.reduce((sum, s) => sum + (s.totalHours || 0), 0) / summaries.length : 0
  };

  res.json({
    success: true,
    data: summaries,
    stats
  });
}));

// Get my attendance (for employees)
router.get('/my-attendance', [
  authenticate,
  authorize('attendance:read')
], asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 30 } = req.query;
  const userId = req.user.id;

  let query = { userId: userId };

  // Date filtering
  if (startDate && endDate) {
    query.date = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const summaries = await database.find('attendance', query, {
    skip: skip,
    limit: parseInt(limit),
    sort: { date: -1 }
  });

  const total = await database.count('attendance', query);

  res.json({
    success: true,
    attendanceRecords: summaries,
    summary: {
      totalHours: summaries.reduce((sum, record) => sum + (record.hoursWorked || 0), 0),
      daysPresent: summaries.filter(record => record.status === 'PRESENT').length,
      daysLate: summaries.filter(record => record.status === 'LATE').length,
      daysAbsent: summaries.filter(record => record.status === 'ABSENT').length
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get team attendance (for managers)
router.get('/team', [
  authenticate,
  requireRole('MANAGER', 'HR', 'ADMIN'),
  authorize('attendance:read')
], asyncHandler(async (req, res) => {
  const { managerId, timeRange = '7d' } = req.query;
  const userId = req.user.id;

  let managerEmployeeId = managerId;

  // If not admin/HR, use current user's employee ID
  if (req.user.role === 'MANAGER') {
    const managerEmployee = await database.findOne('employees', { userId: userId });
    if (!managerEmployee) {
      return res.status(404).json({ message: 'Manager profile not found' });
    }
    managerEmployeeId = managerEmployee._id;
  }

  // Get team members
  const teamMembers = await database.find('employees', { 
    managerId: new ObjectId(managerEmployeeId) 
  });

  const teamMemberIds = teamMembers.map(member => member.userId);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '1d':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  // Get attendance summaries for team
  const summaries = await database.find('attendance_summaries', {
    employeeId: { $in: teamMemberIds },
    date: { $gte: startDate, $lte: endDate }
  });

  // Group by employee
  const teamAttendance = teamMembers.map(member => {
    const memberSummaries = summaries.filter(s => s.employeeId.equals(member.userId));
    const stats = {
      totalDays: memberSummaries.length,
      presentDays: memberSummaries.filter(s => s.status === 'PRESENT').length,
      absentDays: memberSummaries.filter(s => s.status === 'ABSENT').length,
      lateDays: memberSummaries.filter(s => s.status === 'LATE').length,
      totalHours: memberSummaries.reduce((sum, s) => sum + (s.totalHours || 0), 0)
    };

    return {
      employee: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        employeeCode: member.employeeCode,
        designation: member.designation
      },
      attendance: memberSummaries,
      stats
    };
  });

  res.json({
    success: true,
    data: teamAttendance,
    timeRange,
    startDate,
    endDate
  });
}));

// Helper function to update attendance summary
async function updateAttendanceSummary(employeeId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const logs = await database.find('attendance_logs', {
    employeeId: employeeId,
    timestamp: { $gte: startOfDay, $lte: endOfDay }
  });

  const totalHours = calculateTotalHours(logs);
  const status = determineAttendanceStatus(logs, totalHours);

  const summary = {
    employeeId: employeeId,
    date: startOfDay,
    totalHours: totalHours,
    status: status,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Upsert the summary
  await database.updateOne(
    'attendance_summaries',
    { employeeId: employeeId, date: startOfDay },
    { $set: summary },
    { upsert: true }
  );
}

// Helper function to calculate total hours
function calculateTotalHours(logs) {
  const sortedLogs = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let totalHours = 0;
  let clockInTime = null;

  for (const log of sortedLogs) {
    if (log.type === 'IN') {
      clockInTime = new Date(log.timestamp);
    } else if (log.type === 'OUT' && clockInTime) {
      const hours = (new Date(log.timestamp) - clockInTime) / (1000 * 60 * 60);
      totalHours += hours;
      clockInTime = null;
    }
  }

  return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
}

// Helper function to determine attendance status
function determineAttendanceStatus(logs, totalHours) {
  if (logs.length === 0) return 'ABSENT';
  
  const hasClockIn = logs.some(log => log.type === 'IN');
  const hasClockOut = logs.some(log => log.type === 'OUT');
  
  if (!hasClockIn) return 'ABSENT';
  if (hasClockIn && !hasClockOut) return 'PRESENT'; // Still at work
  
  // Check if late (assuming 9 AM start time)
  const clockInLog = logs.find(log => log.type === 'IN');
  const clockInTime = new Date(clockInLog.timestamp);
  const expectedStartTime = new Date(clockInTime);
  expectedStartTime.setHours(9, 0, 0, 0);
  
  if (clockInTime > expectedStartTime) return 'LATE';
  
  return 'PRESENT';
}

module.exports = router;