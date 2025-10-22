// Test utilities and helpers for comprehensive TDD
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Test database setup
let mongoServer;

const setupTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const teardownTestDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

// Test data factories
const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  role: 'EMPLOYEE',
  department: 'IT',
  position: 'Developer',
  ...overrides
});

const createTestAdmin = (overrides = {}) => ({
  email: 'admin@example.com',
  username: 'admin',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  department: 'Management',
  position: 'Admin',
  ...overrides
});

const createTestEmployee = (overrides = {}) => ({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  hireDate: new Date(),
  salary: 75000,
  department: 'Engineering',
  position: 'Software Developer',
  ...overrides
});

const createTestDepartment = (overrides = {}) => ({
  name: 'Engineering',
  description: 'Software development team',
  budget: 1000000,
  location: 'Headquarters',
  managerId: null,
  ...overrides
});

const createTestLeaveRequest = (overrides = {}) => ({
  leaveType: 'VACATION',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 3 days later
  reason: 'Family vacation',
  workCoverage: 'Peers will handle urgent tasks',
  status: 'PENDING',
  ...overrides
});

const createTestPayroll = (overrides = {}) => ({
  payPeriodStart: new Date(),
  payPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  grossSalary: 7500,
  basicSalary: 6000,
  allowances: { housing: 1000, transport: 500 },
  deductions: { tax: 750, health: 100 },
  overtimePay: 0,
  bonus: 500,
  ...overrides
});

const createTestJobPosting = (overrides = {}) => ({
  title: 'Senior Software Engineer',
  description: 'Join our engineering team to build amazing products',
  requirements: ['5+ years experience', 'React knowledge', 'Node.js'],
  responsibilities: ['Design APIs', 'Lead team projects', 'Code reviews'],
  salaryMin: 80000,
  salaryMax: 120000,
  location: 'San Francisco',
  employmentType: 'FULL_TIME',
  remoteAllowed: true,
  applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  status: 'DRAFT',
  ...overrides
});

// Authentication helpers
const generateTestToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id || 'test-user-id',
      email: user.email,
      role: user.role || 'EMPLOYEE'
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

const generateTestRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id || 'test-user-id',
      email: user.email,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    { expiresIn: '7d' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// API test helpers
const makeAuthenticatedRequest = (app, method, endpoint, token, data = null) => {
  const req = request(app)[method](endpoint)
    .set('Authorization', `Bearer ${token}`);
  
  if (data) {
    return req.send(data);
  }
  return req;
};

const makeCookieRequest = (app, method, endpoint, cookies, data = null) => {
  const req = request(app)[method](endpoint)
    .set('Cookie', cookies);
  
  if (data) {
    return req.send(data);
  }
  return req;
};

// Database helpers
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

const seedTestData = async () => {
  // This would seed the database with test data
  // Implementation depends on your specific models
};

// Mock helpers
const mockExternalService = (serviceName, mockImplementation) => {
  jest.mock(serviceName, () => mockImplementation);
};

const mockFileUpload = () => {
  return {
    fieldname: 'resume',
    originalname: 'test-resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test file content'),
    size: 1024
  };
};

// Assertion helpers
const expectValidUser = (user) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('username');
  expect(user).toHaveProperty('role');
  expect(user).not.toHaveProperty('password'); // Password should not be returned
};

const expectValidEmployee = (employee) => {
  expect(employee).toHaveProperty('id');
  expect(employee).toHaveProperty('firstName');
  expect(employee).toHaveProperty('lastName');
  expect(employee).toHaveProperty('email');
  expect(employee).toHaveProperty('department');
  expect(employee).toHaveProperty('position');
};

const expectValidDepartment = (department) => {
  expect(department).toHaveProperty('id');
  expect(department).toHaveProperty('name');
  expect(department).toHaveProperty('description');
  expect(department).toHaveProperty('budget');
};

const expectValidLeaveRequest = (leaveRequest) => {
  expect(leaveRequest).toHaveProperty('id');
  expect(leaveRequest).toHaveProperty('leaveType');
  expect(leaveRequest).toHaveProperty('startDate');
  expect(leaveRequest).toHaveProperty('endDate');
  expect(leaveRequest).toHaveProperty('status');
};

const expectValidPayroll = (payroll) => {
  expect(payroll).toHaveProperty('id');
  expect(payroll).toHaveProperty('grossSalary');
  expect(payroll).toHaveProperty('netSalary');
  expect(payroll).toHaveProperty('payPeriodStart');
  expect(payroll).toHaveProperty('payPeriodEnd');
};

// Error testing helpers
const expectValidationError = (response) => {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('message');
  expect(response.body.message).toContain('validation');
};

const expectUnauthorizedError = (response) => {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('message');
  expect(response.body.message).toContain('authentication');
};

const expectForbiddenError = (response) => {
  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty('message');
  expect(response.body.message).toContain('forbidden');
};

const expectNotFoundError = (response) => {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('message');
  expect(response.body.message).toContain('not found');
};

// Performance testing helpers
const measureResponseTime = async (requestPromise) => {
  const start = Date.now();
  const response = await requestPromise;
  const end = Date.now();
  return {
    response,
    duration: end - start
  };
};

const expectResponseTime = (duration, maxTime = 1000) => {
  expect(duration).toBeLessThan(maxTime);
};

// Test environment setup
const setupTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test-hrms';
  process.env.REDIS_URL = 'redis://localhost:6379';
};

// Cleanup helpers
const cleanupTestFiles = () => {
  const fs = require('fs');
  const path = require('path');
  const uploadDir = path.join(__dirname, '../uploads');
  
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    files.forEach(file => {
      if (file.startsWith('test-')) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    });
  }
};

module.exports = {
  // Database setup
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  seedTestData,
  
  // Test data factories
  createTestUser,
  createTestAdmin,
  createTestEmployee,
  createTestDepartment,
  createTestLeaveRequest,
  createTestPayroll,
  createTestJobPosting,
  
  // Authentication helpers
  generateTestToken,
  generateTestRefreshToken,
  hashPassword,
  
  // API helpers
  makeAuthenticatedRequest,
  makeCookieRequest,
  
  // Mock helpers
  mockExternalService,
  mockFileUpload,
  
  // Assertion helpers
  expectValidUser,
  expectValidEmployee,
  expectValidDepartment,
  expectValidLeaveRequest,
  expectValidPayroll,
  
  // Error testing
  expectValidationError,
  expectUnauthorizedError,
  expectForbiddenError,
  expectNotFoundError,
  
  // Performance testing
  measureResponseTime,
  expectResponseTime,
  
  // Environment setup
  setupTestEnvironment,
  cleanupTestFiles
};
