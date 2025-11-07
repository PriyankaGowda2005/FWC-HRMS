#!/usr/bin/env node

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const CONFIG = {
  backend: 'http://localhost:3001',
  frontend: 'http://localhost:5174',
  database: 'mongodb+srv://priyanka636192:Priyanka@cluster0.hqrqzgl.mongodb.net/fwc_hrms',
  timeout: 10000
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const test = async (name, testFn) => {
  try {
    log(`Testing: ${name}`);
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    log(`✓ ${name}`, 'success');
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    log(`✗ ${name}: ${error.message}`, 'error');
  }
};

// Test functions
const testBackendHealth = async () => {
  const response = await axios.get(`${CONFIG.backend}/health`, { timeout: CONFIG.timeout });
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.status || response.data.status !== 'OK') {
    throw new Error('Health check failed');
  }
};

const testBackendAPIHealth = async () => {
  const response = await axios.get(`${CONFIG.backend}/api/health`, { timeout: CONFIG.timeout });
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.message || !response.data.message.includes('API is running')) {
    throw new Error('API health check failed');
  }
};

const testDatabaseConnection = async () => {
  const client = new MongoClient(CONFIG.database);
  await client.connect();
  const db = client.db('fwc_hrms');
  const collections = await db.listCollections().toArray();
  if (collections.length === 0) {
    throw new Error('No collections found in database');
  }
  await client.close();
};

const testUserRegistration = async () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'test123456',
    firstName: 'Test',
    lastName: 'User',
    role: 'EMPLOYEE'
  };

  const response = await axios.post(`${CONFIG.backend}/api/auth/register`, testUser, {
    timeout: CONFIG.timeout
  });

  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`);
  }

  if (!response.data.user || !response.data.token) {
    throw new Error('Registration response missing user or token');
  }

  return { user: response.data.user, token: response.data.token };
};

const testUserLogin = async () => {
  const loginData = {
    email: 'admin@fwcit.com',
    password: 'admin123'
  };

  const response = await axios.post(`${CONFIG.backend}/api/auth/login`, loginData, {
    timeout: CONFIG.timeout
  });

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.user || !response.data.token) {
    throw new Error('Login response missing user or token');
  }

  return response.data.token;
};

const testProtectedRoute = async (token) => {
  const response = await axios.get(`${CONFIG.backend}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: CONFIG.timeout
  });

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.user) {
    throw new Error('Protected route response missing user data');
  }
};

const testEmployeeAPI = async (token) => {
  const response = await axios.get(`${CONFIG.backend}/api/employees`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: CONFIG.timeout
  });

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.employees) {
    throw new Error('Employee API response missing employees data');
  }
};

const testAttendanceAPI = async (token) => {
  const response = await axios.get(`${CONFIG.backend}/api/attendance`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: CONFIG.timeout
  });

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.attendanceRecords) {
    throw new Error('Attendance API response missing attendance data');
  }
};

const testLeaveAPI = async (token) => {
  const response = await axios.get(`${CONFIG.backend}/api/leave-requests`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: CONFIG.timeout
  });

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.leaveRequests) {
    throw new Error('Leave API response missing leave requests data');
  }
};

const testFrontendAccess = async () => {
  const response = await axios.get(CONFIG.frontend, { timeout: CONFIG.timeout });
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.includes('FWC HRMS')) {
    throw new Error('Frontend page does not contain expected content');
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting FWC HRMS System Tests');
  log('=====================================');

  let authToken = null;

  // Basic connectivity tests
  await test('Backend Health Check', testBackendHealth);
  await test('Backend API Health Check', testBackendAPIHealth);
  await test('Database Connection', testDatabaseConnection);
  await test('Frontend Access', testFrontendAccess);

  // Authentication tests
  await test('User Registration', async () => {
    const result = await testUserRegistration();
    // Store token for subsequent tests
    authToken = result.token;
  });

  await test('User Login', async () => {
    authToken = await testUserLogin();
  });

  // Protected route tests
  if (authToken) {
    await test('Protected Route Access', () => testProtectedRoute(authToken));
    await test('Employee API', () => testEmployeeAPI(authToken));
    await test('Attendance API', () => testAttendanceAPI(authToken));
    await test('Leave Requests API', () => testLeaveAPI(authToken));
  }

  // Print results
  log('=====================================');
  log('📊 Test Results Summary');
  log('=====================================');
  log(`✅ Passed: ${results.passed}`);
  log(`❌ Failed: ${results.failed}`);
  log(`📈 Total: ${results.passed + results.failed}`);

  if (results.failed > 0) {
    log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => log(`  - ${t.name}: ${t.error}`));
  }

  log('\n🎯 System Status:');
  if (results.failed === 0) {
    log('✅ All tests passed! System is ready for deployment.', 'success');
  } else {
    log('⚠️ Some tests failed. Please review and fix issues before deployment.', 'error');
  }

  return results.failed === 0;
};

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`Test runner error: ${error.message}`, 'error');
    process.exit(1);
  });
