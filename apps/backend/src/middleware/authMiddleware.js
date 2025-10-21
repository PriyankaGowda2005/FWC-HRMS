const jwt = require('jsonwebtoken');
const database = require('../database/connection');
const { ObjectId } = require('mongodb');

// Role-based permissions
const PERMISSIONS = {
  // User management
  'users:read': ['ADMIN', 'HR'],
  'users:write': ['ADMIN', 'HR'],
  'users:delete': ['ADMIN'],
  
  // Employee management
  'employees:read': ['ADMIN', 'HR', 'MANAGER'],
  'employees:write': ['ADMIN', 'HR'],
  'employees:delete': ['ADMIN'],
  
  // Attendance
  'attendance:read': ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  'attendance:write': ['ADMIN', 'HR', 'EMPLOYEE'],
  'attendance:clock': ['EMPLOYEE'],
  
  // Leave management
  'leaves:read': ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  'leaves:write': ['ADMIN', 'HR', 'EMPLOYEE'],
  'leaves:approve': ['ADMIN', 'HR', 'MANAGER'],
  
  // Payroll
  'payroll:read': ['ADMIN', 'HR', 'EMPLOYEE'],
  'payroll:write': ['ADMIN', 'HR'],
  'payroll:release': ['ADMIN', 'HR'],
  
  // Performance
  'performance:read': ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  'performance:write': ['ADMIN', 'HR', 'MANAGER'],
  
  // Reports
  'reports:read': ['ADMIN', 'HR'],
  'reports:export': ['ADMIN', 'HR'],
  
  // Departments
  'departments:read': ['ADMIN', 'HR', 'MANAGER'],
  'departments:write': ['ADMIN', 'HR'],
  
  // Settings
  'settings:read': ['ADMIN', 'HR', 'MANAGER'],
  'settings:write': ['ADMIN', 'HR'],
  
  // Notifications
  'notifications:read': ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  'notifications:write': ['ADMIN', 'HR', 'MANAGER'],
};

// Check if user has permission
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fwc-hrms-super-secret-jwt-key-2024');
    
    // Get user from database
    const user = await database.findOne('users', { _id: new ObjectId(decoded.userId) });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token. User not found or inactive.' });
    }

    // Get employee data if user is an employee
    let employee = null;
    if (user.role === 'EMPLOYEE' || user.role === 'MANAGER') {
      employee = await database.findOne('employees', { userId: user._id });
    }

    req.user = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      employee: employee
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

// Authorization middleware
const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Role-based middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient role.',
        required: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Manager access middleware (can access their team members)
const requireManagerAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Admin and HR can access all employees
    if (req.user.role === 'ADMIN' || req.user.role === 'HR') {
      return next();
    }

    // Managers can only access their team members
    if (req.user.role === 'MANAGER') {
      const managerEmployee = await database.findOne('employees', { userId: req.user.id });
      
      if (!managerEmployee) {
        return res.status(403).json({ message: 'Manager profile not found.' });
      }

      // Check if the requested employee is under this manager
      const targetEmployeeId = req.params.id || req.params.employeeId;
      if (targetEmployeeId) {
        const targetEmployee = await database.findOne('employees', { 
          _id: new ObjectId(targetEmployeeId),
          managerId: managerEmployee._id
        });

        if (!targetEmployee) {
          return res.status(403).json({ message: 'Access denied. Employee not under your management.' });
        }
      }

      req.managerEmployee = managerEmployee;
      return next();
    }

    // Employees can only access their own data
    if (req.user.role === 'EMPLOYEE') {
      const employeeId = req.params.id || req.params.employeeId;
      if (employeeId && employeeId !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Access denied. Can only access own data.' });
      }
      return next();
    }

    return res.status(403).json({ message: 'Access denied. Invalid role.' });
  } catch (error) {
    console.error('Manager access check error:', error);
    return res.status(500).json({ message: 'Internal server error during authorization.' });
  }
};

// Audit logging middleware
const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      if (res.statusCode < 400 && req.user) {
        const auditData = {
          userId: req.user.id,
          action: action,
          entity: entity,
          entityId: req.params.id || null,
          details: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date()
          },
          timestamp: new Date()
        };

        // Don't await this to avoid blocking the response
        database.insertOne('audit_logs', auditData).catch(console.error);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Optional authentication (for public endpoints)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fwc-hrms-super-secret-jwt-key-2024');
      const user = await database.findOne('users', { _id: new ObjectId(decoded.userId) });
      
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.isActive
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  requireManagerAccess,
  auditLog,
  optionalAuth,
  PERMISSIONS,
  hasPermission
};