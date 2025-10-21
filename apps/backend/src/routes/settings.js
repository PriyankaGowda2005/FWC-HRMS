const express = require('express');
const { authenticate, requireRole, authorize } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../database/connection');

const router = express.Router();

// Get system settings
router.get('/', [
  authenticate,
  requireRole('ADMIN', 'HR', 'MANAGER'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  const settings = await database.findOne('settings', {});
  
  res.json({
    success: true,
    data: settings || {
      companyName: 'FWC HRMS',
      timezone: 'UTC',
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      leaveTypes: ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity'],
      attendanceSettings: {
        gracePeriod: 15, // minutes
        autoClockOut: false
      }
    }
  });
}));

// Update system settings
router.put('/', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:update')
], asyncHandler(async (req, res) => {
  const { companyName, timezone, workingHours, leaveTypes, attendanceSettings } = req.body;
  
  const settings = {
    companyName,
    timezone,
    workingHours,
    leaveTypes,
    attendanceSettings,
    updatedAt: new Date(),
    updatedBy: req.user.id
  };

  const result = await database.updateOne(
    'settings',
    {},
    { $set: settings },
    { upsert: true }
  );

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings
  });
}));

// Get integrations
router.get('/integrations', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  const integrations = await database.find('integrations', {});
  
  res.json({
    success: true,
    data: integrations || []
  });
}));

// Connect integration
router.post('/integrations/:provider', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:update')
], asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { credentials, config } = req.body;
  
  const integration = {
    provider,
    credentials,
    config,
    isActive: true,
    connectedAt: new Date(),
    connectedBy: req.user.id
  };

  const result = await database.updateOne(
    'integrations',
    { provider },
    { $set: integration },
    { upsert: true }
  );

  res.json({
    success: true,
    message: `${provider} integration connected successfully`,
    data: integration
  });
}));

// Get dashboard statistics
router.get('/dashboard-stats', [
  authenticate,
  requireRole('ADMIN', 'HR', 'MANAGER'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  // Get real-time statistics
  const [employees, departments, attendance, leaveRequests] = await Promise.all([
    database.find('employees', { isActive: true }),
    database.find('departments', { isActive: true }),
    database.find('attendance', { 
      date: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    database.find('leave_requests', { status: 'PENDING' })
  ]);

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => emp.isActive).length,
    totalDepartments: departments.length,
    activeDepartments: departments.filter(dept => dept.isActive).length,
    todayAttendance: attendance.length,
    pendingLeaveRequests: leaveRequests.length,
    totalBudget: departments.reduce((sum, dept) => sum + (dept.budget || 0), 0),
    averageEmployeesPerDept: departments.length > 0 ? 
      (employees.length / departments.length).toFixed(1) : 0
  };

  res.json({ 
    success: true,
    stats 
  });
}));

// Get system health
router.get('/system-health', [
  authenticate,
  requireRole('ADMIN', 'HR'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  const health = {
    database: database.isConnected ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({ 
    success: true,
    health 
  });
}));

// Change password
router.post('/change-password', [
  authenticate,
  authorize('settings:update')
], asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Get user
  const user = await database.findOne('users', { _id: userId });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Verify current password
  const bcrypt = require('bcrypt');
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  // Hash new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await database.updateOne(
    'users',
    { _id: userId },
    { $set: { password: hashedPassword, updatedAt: new Date() } }
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

module.exports = router;