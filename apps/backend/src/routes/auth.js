const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Generate tokens
const generateTokens = (userId, role) => {
  const token = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { token, refreshToken };
};

// Set cookie options
const getCookieOptions = (isRefresh = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: isRefresh 
    ? (parseInt(process.env.JWT_REFRESH_EXPIRES_IN?.replace('d', '')) || 7) * 24 * 60 * 60 * 1000
    : (parseInt(process.env.JWT_EXPIRES_IN?.replace('m', '')) || 15) * 60 * 1000
});

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('role').optional().isIn(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'CANDIDATE']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { email, username, password, firstName, lastName, role = 'EMPLOYEE', department, position } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    return res.status(400).json({ 
      message: 'User already exists',
      field: existingUser.email === email ? 'email' : 'username'
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user and employee in transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role.toUpperCase()
      }
    });

    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        position,
        hireDate: new Date(),
        isActive: true,
        isOnProbation: false
      }
    });

    return { user, employee };
  });

  const { user, employee } = result;

  // Generate tokens
  const { token, refreshToken } = generateTokens(user.id, user.role);

  // Set cookies
  res.cookie('token', token, getCookieOptions());
  res.cookie('refreshToken', refreshToken, getCookieOptions(true));

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      position: employee.position
    }
  });
}));

// Login
router.post('/login', [
  body('email').notEmpty().withMessage('Email required'),
  body('password').notEmpty().withMessage('Password required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user with employee data
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      employee: true
    }
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate tokens
  const { token, refreshToken } = generateTokens(user.id, user.role);

  // Set cookies
  res.cookie('token', token, getCookieOptions());
  res.cookie('refreshToken', refreshToken, getCookieOptions(true));

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    employee: user.employee ? {
      id: user.employee.id,
      firstName: user.employee.firstName,
      lastName: user.employee.lastName,
      department: user.employee.department,
      position: user.employee.position
    } : null
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { token: newToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    res.cookie('token', newToken, getCookieOptions());
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(true));

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}));

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            phoneNumber: true,
            salary: true,
            hireDate: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      employee: user.employee
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}));

module.exports = router;
