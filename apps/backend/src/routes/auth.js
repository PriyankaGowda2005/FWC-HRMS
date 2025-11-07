const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Generate tokens
const generateTokens = (userId, role) => {
  const token = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fwc-hrms-super-secret-jwt-key-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'fwc-hrms-super-secret-refresh-key-2024',
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

  let { email, username, password, firstName, lastName, role = 'EMPLOYEE', department, position } = req.body;

  // Normalize email (lowercase and trim)
  email = email.toLowerCase().trim();

  // Prevent candidate registration through this endpoint
  // Candidates must register via invitation system
  if (role && role.toUpperCase() === 'CANDIDATE') {
    return res.status(403).json({ 
      message: 'Candidate registration is not allowed through this endpoint. Candidates must register using an invitation link sent by HR.',
      code: 'CANDIDATE_REGISTRATION_NOT_ALLOWED'
    });
  }

  // Check if user already exists
  const existingUser = await database.findOne('users', {
    $or: [
      { email },
      { username }
    ]
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

  // Create user
  const userData = {
    email,
    username,
    password: hashedPassword,
    role: role.toUpperCase(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const userResult = await database.insertOne('users', userData);
  const userId = userResult.insertedId;

  // Create employee record
  const employeeData = {
    userId: userId,
    firstName,
    lastName,
    position: position || 'Employee',
    department: department || null,
    hireDate: new Date(),
    isActive: true,
    isOnProbation: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await database.insertOne('employees', employeeData);

  // Generate tokens
  const { token, refreshToken } = generateTokens(userId.toString(), role.toUpperCase());

  // Set cookies
  res.cookie('token', token, getCookieOptions());
  res.cookie('refreshToken', refreshToken, getCookieOptions(true));

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: userId,
      email,
      username,
      role: role.toUpperCase(),
      firstName,
      lastName
    },
    token,
    refreshToken
  });
}));

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  let { email, password } = req.body;

  // Debug logging - log raw request
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 Login attempt received`);
    console.log(`   Raw email: "${email}"`);
    console.log(`   Raw password: "${password ? password.substring(0, 3) + '***' : 'undefined'}"`);
    console.log(`   Request body keys: ${Object.keys(req.body).join(', ')}`);
  }

  // Validate email and password are present
  if (!email || !password) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ Missing email or password`);
      console.error(`   Email: ${email ? 'present' : 'missing'}`);
      console.error(`   Password: ${password ? 'present' : 'missing'}`);
    }
    return res.status(400).json({ 
      message: 'Email and password are required' 
    });
  }

  // Normalize email (lowercase and trim) for consistency
  email = email.toLowerCase().trim();
  password = String(password).trim();

  // Debug logging after normalization
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   Normalized email: "${email}"`);
    console.log(`   Normalized password length: ${password.length}`);
  }

  // Find user - try exact match first
  let user = await database.findOne('users', { email });
  
  // If not found, try case-insensitive search
  if (!user) {
    const allUsers = await database.find('users', {});
    user = allUsers.find(u => u.email && u.email.toLowerCase().trim() === email);
  }

  if (!user) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ User not found for email: ${email}`);
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`   Found user: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   IsActive: ${user.isActive}`);
    console.log(`   Has password: ${!!user.password}`);
  }

  // Ensure this is not a candidate trying to use regular auth
  // Candidates should use /candidates/login endpoint
  if (user.role === 'CANDIDATE') {
    return res.status(403).json({ 
      message: 'Candidates must use the candidate login endpoint. Please use the candidate portal to log in.',
      code: 'USE_CANDIDATE_LOGIN'
    });
  }

  // Check if user is active (default to true if not set)
  if (user.isActive === false) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ User is not active: ${user.email}`);
    }
    return res.status(401).json({ message: 'Account is deactivated' });
  }
  
  // If isActive is undefined/null, set it to true (default active)
  if (user.isActive === undefined || user.isActive === null) {
    await database.updateOne('users', { _id: user._id }, { $set: { isActive: true } });
    user.isActive = true;
  }

  // Check if password exists
  if (!user.password) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ User has no password: ${user.email}`);
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Verify password
  let isValidPassword = false;
  try {
    // Ensure password is a string
    const plainPassword = String(password || '').trim();
    const hashedPassword = String(user.password || '').trim();
    
    if (!plainPassword || !hashedPassword) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`❌ Empty password or hash for: ${user.email}`);
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    isValidPassword = await bcrypt.compare(plainPassword, hashedPassword);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   Password valid: ${isValidPassword}`);
      console.log(`   Password length: ${plainPassword.length}`);
      console.log(`   Hash length: ${hashedPassword.length}`);
      console.log(`   Hash starts with: ${hashedPassword.substring(0, 10)}`);
    }
  } catch (compareError) {
    console.error(`❌ Password comparison error for ${user.email}:`, compareError);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  if (!isValidPassword) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ Password mismatch for: ${user.email}`);
      console.error(`   Attempted password: "${password}"`);
      console.error(`   Stored hash: ${user.password.substring(0, 20)}...`);
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Get employee data (optional - employee record may not exist for all users)
  let employee = null;
  try {
    employee = await database.findOne('employees', { userId: user._id });
  } catch (employeeError) {
    // Employee record lookup failed - log but don't fail login
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   ⚠️  Employee record lookup failed (non-critical): ${employeeError.message}`);
    }
  }

  // Generate tokens
  let token, refreshToken;
  try {
    const tokens = generateTokens(user._id.toString(), user.role);
    token = tokens.token;
    refreshToken = tokens.refreshToken;
  } catch (tokenError) {
    console.error('❌ Token generation error:', tokenError);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'Failed to generate authentication tokens'
    });
  }

  // Set cookies
  try {
    res.cookie('token', token, getCookieOptions());
    res.cookie('refreshToken', refreshToken, getCookieOptions(true));
  } catch (cookieError) {
    // Cookie setting failed - log but continue (tokens still in response body)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   ⚠️  Cookie setting failed (non-critical): ${cookieError.message}`);
    }
  }

  // Return success response
  try {
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: employee?.firstName || null,
        lastName: employee?.lastName || null,
        position: employee?.position || null,
        department: employee?.department || null
      },
      token,
      refreshToken
    });
  } catch (responseError) {
    console.error('❌ Response error:', responseError);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'Failed to send response'
    });
  }
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  // Get refresh token from cookies or request body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  // Revoke refresh token if provided
  if (refreshToken) {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.exp) {
        await database.insertOne('revoked_tokens', {
          token: refreshToken,
          userId: decoded.userId,
          revokedAt: new Date(),
          expiresAt: new Date(decoded.exp * 1000)
        });
      }
    } catch (error) {
      // Ignore errors - token might already be invalid
      console.log('Note: Could not revoke refresh token on logout:', error.message);
    }
  }

  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  
  res.json({ message: 'Logout successful' });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  // Accept refresh token from cookies, request body, or Authorization header
  let refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  // Also check Authorization header for refresh token
  if (!refreshToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.substring(7);
    }
  }
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    // Check if token is revoked
    const revokedToken = await database.findOne('revoked_tokens', { token: refreshToken });
    if (revokedToken) {
      return res.status(401).json({ message: 'Refresh token has been revoked' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fwc-hrms-super-secret-refresh-key-2024');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Find user
    const user = await database.findOne('users', { _id: new ObjectId(decoded.userId) });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new tokens
    const { token, refreshToken: newRefreshToken } = generateTokens(user._id.toString(), user.role);

    // Revoke old refresh token (optional: for better security, rotate refresh tokens)
    try {
      await database.insertOne('revoked_tokens', {
        token: refreshToken,
        userId: decoded.userId,
        revokedAt: new Date(),
        expiresAt: new Date(decoded.exp * 1000) // Token expiration time
      });
    } catch (revokeError) {
      // Ignore errors if token already revoked or collection doesn't exist yet
      console.log('Note: Could not revoke old refresh token:', revokeError.message);
    }

    // Set new cookies
    res.cookie('token', token, getCookieOptions());
    res.cookie('refreshToken', newRefreshToken, getCookieOptions(true));

    res.json({
      message: 'Token refreshed successfully',
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fwc-hrms-super-secret-jwt-key-2024');
    
    const user = await database.findOne('users', { _id: new ObjectId(decoded.userId) });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const employee = await database.findOne('employees', { userId: user._id });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: employee?.firstName,
        lastName: employee?.lastName,
        position: employee?.position,
        department: employee?.department
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}));

module.exports = router;