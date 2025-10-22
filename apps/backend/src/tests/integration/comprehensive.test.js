// Comprehensive integration tests for HRMS system
const request = require('supertest');
const app = require('../../server');
const {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestUser,
  createTestAdmin,
  createTestEmployee,
  createTestDepartment,
  createTestLeaveRequest,
  createTestPayroll,
  createTestJobPosting,
  generateTestToken,
  makeAuthenticatedRequest,
  makeCookieRequest,
  expectValidUser,
  expectValidEmployee,
  expectValidDepartment,
  expectValidLeaveRequest,
  expectValidPayroll,
  expectValidationError,
  expectUnauthorizedError,
  expectForbiddenError,
  expectNotFoundError,
  setupTestEnvironment,
  cleanupTestFiles
} = require('../testUtils');

describe('FWC HRMS Integration Tests', () => {
  let adminToken = '';
  let employeeToken = '';
  let hrToken = '';
  let managerToken = '';
  let testDepartmentId = '';
  let testEmployeeId = '';
  let testUserId = '';

  beforeAll(async () => {
    setupTestEnvironment();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    cleanupTestFiles();
  });

  beforeEach(async () => {
    await clearDatabase();
    await setupTestUsers();
  });

  const setupTestUsers = async () => {
    // Create admin user
    const adminData = createTestAdmin();
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);
    
    adminToken = adminResponse.headers['set-cookie']
      .find(cookie => cookie.startsWith('token='))
      ?.split('=')[1]?.split(';')[0];

    // Create HR user
    const hrData = createTestUser({ 
      email: 'hr@test.com', 
      username: 'hruser',
      role: 'HR',
      department: 'Human Resources',
      position: 'HR Manager'
    });
    const hrResponse = await request(app)
      .post('/api/auth/register')
      .send(hrData);
    
    hrToken = hrResponse.headers['set-cookie']
      .find(cookie => cookie.startsWith('token='))
      ?.split('=')[1]?.split(';')[0];

    // Create manager user
    const managerData = createTestUser({ 
      email: 'manager@test.com', 
      username: 'manager',
      role: 'MANAGER',
      department: 'Engineering',
      position: 'Engineering Manager'
    });
    const managerResponse = await request(app)
      .post('/api/auth/register')
      .send(managerData);
    
    managerToken = managerResponse.headers['set-cookie']
      .find(cookie => cookie.startsWith('token='))
      ?.split('=')[1]?.split(';')[0];

    // Create employee user
    const employeeData = createTestUser({ 
      email: 'employee@test.com', 
      username: 'employee',
      role: 'EMPLOYEE',
      department: 'Engineering',
      position: 'Software Developer'
    });
    const employeeResponse = await request(app)
      .post('/api/auth/register')
      .send(employeeData);
    
    employeeToken = employeeResponse.headers['set-cookie']
      .find(cookie => cookie.startsWith('token='))
      ?.split('=')[1]?.split(';')[0];

    testUserId = employeeResponse.body.user.id;
    testEmployeeId = employeeResponse.body.employee.id;
  };

  describe('Authentication Flow', () => {
    describe('POST /api/auth/register', () => {
      it('should register new user successfully', async () => {
        const userData = createTestUser({ 
          email: 'newuser@test.com',
          username: 'newuser'
        });

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expectValidUser(response.body.user);
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.username).toBe(userData.username);
        expect(response.body.user.role).toBe('EMPLOYEE');
        expect(response.body.employee.firstName).toBe(userData.firstName);
        expect(response.body.employee.lastName).toBe(userData.lastName);
        expect(response.headers['set-cookie']).toBeDefined();
      });

      it('should fail with validation errors', async () => {
        const invalidData = {
          email: 'invalid-email',
          username: 'us',
          password: '123'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expectValidationError(response);
      });

      it('should fail with duplicate email', async () => {
        const userData = createTestUser({ 
          email: 'duplicate@test.com',
          username: 'duplicate'
        });

        // First registration
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Second registration with same email
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.message).toBe('User already exists');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'employee@test.com',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expectValidUser(response.body.user);
        expect(response.body.user.email).toBe(loginData.email);
        expect(response.headers['set-cookie']).toBeDefined();
      });

      it('should fail with invalid credentials', async () => {
        const loginData = {
          email: 'employee@test.com',
          password: 'wrongpassword'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expectUnauthorizedError(response);
      });
    });

    describe('GET /api/auth/me', () => {
      it('should return current user info', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/auth/me', `token=${employeeToken}`
        ).expect(200);

        expectValidUser(response.body.user);
        expect(response.body.user.email).toBe('employee@test.com');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expectUnauthorizedError(response);
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await makeCookieRequest(
          app, 'post', '/api/auth/logout', `token=${employeeToken}`
        ).expect(200);

        expect(response.body.message).toBe('Logout successful');
        expect(response.headers['set-cookie']).toBeDefined();
      });
    });
  });

  describe('Department Management', () => {
    beforeEach(async () => {
      // Create test department
      const deptData = createTestDepartment();
      const response = await makeCookieRequest(
        app, 'post', '/api/departments', `token=${adminToken}`, deptData
      ).expect(201);
      
      testDepartmentId = response.body.department.id;
    });

    describe('POST /api/departments', () => {
      it('should create department as admin', async () => {
        const deptData = createTestDepartment({ name: 'Marketing' });

        const response = await makeCookieRequest(
          app, 'post', '/api/departments', `token=${adminToken}`, deptData
        ).expect(201);

        expectValidDepartment(response.body.department);
        expect(response.body.department.name).toBe('Marketing');
      });

      it('should fail without admin role', async () => {
        const deptData = createTestDepartment({ name: 'Marketing' });

        const response = await makeCookieRequest(
          app, 'post', '/api/departments', `token=${employeeToken}`, deptData
        ).expect(403);

        expectForbiddenError(response);
      });
    });

    describe('GET /api/departments', () => {
      it('should get departments list', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/departments', `token=${adminToken}`
        ).expect(200);

        expect(response.body.departments).toBeInstanceOf(Array);
        expect(response.body.departments.length).toBeGreaterThan(0);
      });

      it('should fail without proper role', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/departments', `token=${employeeToken}`
        ).expect(403);

        expectForbiddenError(response);
      });
    });

    describe('PUT /api/departments/:id', () => {
      it('should update department', async () => {
        const updateData = { budget: 1500000 };

        const response = await makeCookieRequest(
          app, 'put', `/api/departments/${testDepartmentId}`, `token=${adminToken}`, updateData
        ).expect(200);

        expect(response.body.department.budget).toBe(1500000);
      });

      it('should fail with invalid department ID', async () => {
        const updateData = { budget: 1500000 };

        const response = await makeCookieRequest(
          app, 'put', '/api/departments/invalid-id', `token=${adminToken}`, updateData
        ).expect(404);

        expectNotFoundError(response);
      });
    });
  });

  describe('Employee Management', () => {
    describe('GET /api/employees', () => {
      it('should get employees list as HR', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/employees', `token=${hrToken}`
        ).expect(200);

        expect(response.body.employees).toBeInstanceOf(Array);
        expect(response.body.summary).toBeDefined();
      });

      it('should fail without HR role', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/employees', `token=${employeeToken}`
        ).expect(403);

        expectForbiddenError(response);
      });
    });

    describe('GET /api/employees/:id', () => {
      it('should get employee details', async () => {
        const response = await makeCookieRequest(
          app, 'get', `/api/employees/${testEmployeeId}`, `token=${hrToken}`
        ).expect(200);

        expectValidEmployee(response.body.employee);
      });

      it('should allow employee to view own details', async () => {
        const response = await makeCookieRequest(
          app, 'get', `/api/employees/${testEmployeeId}`, `token=${employeeToken}`
        ).expect(200);

        expectValidEmployee(response.body.employee);
      });
    });

    describe('PUT /api/employees/:id', () => {
      it('should update employee as HR', async () => {
        const updateData = { salary: 80000 };

        const response = await makeCookieRequest(
          app, 'put', `/api/employees/${testEmployeeId}`, `token=${hrToken}`, updateData
        ).expect(200);

        expect(response.body.employee.salary).toBe(80000);
      });

      it('should fail with validation errors', async () => {
        const invalidData = { salary: -1000 };

        const response = await makeCookieRequest(
          app, 'put', `/api/employees/${testEmployeeId}`, `token=${hrToken}`, invalidData
        ).expect(400);

        expectValidationError(response);
      });
    });
  });

  describe('Attendance Management', () => {
    describe('POST /api/attendance/clock', () => {
      it('should clock in employee', async () => {
        const clockData = { action: 'clock-in', notes: 'Starting work' };

        const response = await makeCookieRequest(
          app, 'post', '/api/attendance/clock', `token=${employeeToken}`, clockData
        ).expect(200);

        expect(response.body.attendance.clockIn).toBeDefined();
        expect(response.body.attendance.status).toBe('CLOCKED_IN');
      });

      it('should clock out employee', async () => {
        // First clock in
        await makeCookieRequest(
          app, 'post', '/api/attendance/clock', `token=${employeeToken}`, 
          { action: 'clock-in', notes: 'Starting work' }
        ).expect(200);

        // Then clock out
        const clockData = { action: 'clock-out', notes: 'Ending work' };

        const response = await makeCookieRequest(
          app, 'post', '/api/attendance/clock', `token=${employeeToken}`, clockData
        ).expect(200);

        expect(response.body.attendance.clockOut).toBeDefined();
        expect(response.body.attendance.status).toBe('CLOCKED_OUT');
        expect(response.body.attendance.hoursWorked).toBeDefined();
      });

      it('should fail with invalid action', async () => {
        const clockData = { action: 'invalid-action' };

        const response = await makeCookieRequest(
          app, 'post', '/api/attendance/clock', `token=${employeeToken}`, clockData
        ).expect(400);

        expectValidationError(response);
      });
    });

    describe('GET /api/attendance', () => {
      it('should get employee attendance records', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/attendance', `token=${employeeToken}`
        ).expect(200);

        expect(response.body.attendanceRecords).toBeInstanceOf(Array);
        expect(response.body.summary).toBeDefined();
      });

      it('should get team attendance as manager', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/attendance/team', `token=${managerToken}`
        ).expect(200);

        expect(response.body.teamAttendance).toBeInstanceOf(Array);
      });
    });
  });

  describe('Leave Management', () => {
    describe('POST /api/leave-requests', () => {
      it('should submit leave request', async () => {
        const leaveData = createTestLeaveRequest();

        const response = await makeCookieRequest(
          app, 'post', '/api/leave-requests', `token=${employeeToken}`, leaveData
        ).expect(201);

        expectValidLeaveRequest(response.body.leaveRequest);
        expect(response.body.leaveRequest.status).toBe('PENDING');
      });

      it('should fail with validation errors', async () => {
        const invalidData = {
          leaveType: 'INVALID_TYPE',
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        };

        const response = await makeCookieRequest(
          app, 'post', '/api/leave-requests', `token=${employeeToken}`, invalidData
        ).expect(400);

        expectValidationError(response);
      });
    });

    describe('GET /api/leave-requests', () => {
      it('should get employee leave requests', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/leave-requests', `token=${employeeToken}`
        ).expect(200);

        expect(response.body.leaveRequests).toBeInstanceOf(Array);
      });

      it('should get pending requests as manager', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/leave-requests/pending', `token=${managerToken}`
        ).expect(200);

        expect(response.body.leaveRequests).toBeInstanceOf(Array);
      });
    });

    describe('PUT /api/leave-requests/:id/approve', () => {
      let leaveRequestId = '';

      beforeEach(async () => {
        const leaveData = createTestLeaveRequest();
        const response = await makeCookieRequest(
          app, 'post', '/api/leave-requests', `token=${employeeToken}`, leaveData
        ).expect(201);
        
        leaveRequestId = response.body.leaveRequest.id;
      });

      it('should approve leave request', async () => {
        const approvalData = { action: 'APPROVED', notes: 'Approved for vacation' };

        const response = await makeCookieRequest(
          app, 'put', `/api/leave-requests/${leaveRequestId}/approve`, `token=${managerToken}`, approvalData
        ).expect(200);

        expect(response.body.leaveRequest.status).toBe('APPROVED');
      });

      it('should reject leave request', async () => {
        const rejectionData = { action: 'REJECTED', notes: 'Not enough coverage' };

        const response = await makeCookieRequest(
          app, 'put', `/api/leave-requests/${leaveRequestId}/approve`, `token=${managerToken}`, rejectionData
        ).expect(200);

        expect(response.body.leaveRequest.status).toBe('REJECTED');
      });
    });
  });

  describe('Payroll Management', () => {
    describe('POST /api/payroll', () => {
      it('should create payroll record as HR', async () => {
        const payrollData = createTestPayroll({ employeeId: testEmployeeId });

        const response = await makeCookieRequest(
          app, 'post', '/api/payroll', `token=${hrToken}`, payrollData
        ).expect(201);

        expectValidPayroll(response.body.payroll);
      });

      it('should fail without HR role', async () => {
        const payrollData = createTestPayroll({ employeeId: testEmployeeId });

        const response = await makeCookieRequest(
          app, 'post', '/api/payroll', `token=${employeeToken}`, payrollData
        ).expect(403);

        expectForbiddenError(response);
      });
    });

    describe('GET /api/payroll', () => {
      it('should get payroll records as HR', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/payroll', `token=${hrToken}`
        ).expect(200);

        expect(response.body.payrolls).toBeInstanceOf(Array);
      });

      it('should get own payroll as employee', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/payroll/my-payroll', `token=${employeeToken}`
        ).expect(200);

        expect(response.body.payrolls).toBeInstanceOf(Array);
      });
    });
  });

  describe('Job Posting Management', () => {
    describe('POST /api/job-postings', () => {
      it('should create job posting as HR', async () => {
        const jobData = createTestJobPosting();

        const response = await makeCookieRequest(
          app, 'post', '/api/job-postings', `token=${hrToken}`, jobData
        ).expect(201);

        expect(response.body.jobPosting.title).toBe('Senior Software Engineer');
        expect(response.body.jobPosting.status).toBe('DRAFT');
      });

      it('should fail without HR role', async () => {
        const jobData = createTestJobPosting();

        const response = await makeCookieRequest(
          app, 'post', '/api/job-postings', `token=${employeeToken}`, jobData
        ).expect(403);

        expectForbiddenError(response);
      });
    });

    describe('GET /api/job-postings/public', () => {
      it('should get public job postings', async () => {
        const response = await request(app)
          .get('/api/job-postings/public')
          .expect(200);

        expect(response.body.jobPostings).toBeInstanceOf(Array);
      });
    });
  });

  describe('Candidate Management', () => {
    let jobPostingId = '';

    beforeEach(async () => {
      const jobData = createTestJobPosting();
      const response = await makeCookieRequest(
        app, 'post', '/api/job-postings', `token=${hrToken}`, jobData
      ).expect(201);
      
      jobPostingId = response.body.jobPosting.id;
    });

    describe('POST /api/candidates/apply', () => {
      it('should submit job application', async () => {
        const applicationData = {
          firstName: 'John',
          lastName: 'Candidate',
          email: 'john.candidate@test.com',
          phoneNumber: '+1234567890',
          jobPostingId: jobPostingId,
          coverLetter: 'I am excited to apply for this position',
          expectedSalary: 95000
        };

        const response = await request(app)
          .post('/api/candidates/apply')
          .send(applicationData)
          .expect(201);

        expect(response.body.candidate.status).toBe('APPLIED');
        expect(response.body.candidate.firstName).toBe('John');
      });

      it('should fail with validation errors', async () => {
        const invalidData = {
          firstName: '',
          email: 'invalid-email',
          jobPostingId: 'invalid-id'
        };

        const response = await request(app)
          .post('/api/candidates/apply')
          .send(invalidData)
          .expect(400);

        expectValidationError(response);
      });
    });

    describe('GET /api/candidates', () => {
      it('should get candidates as HR', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/candidates', `token=${hrToken}`
        ).expect(200);

        expect(response.body.candidates).toBeInstanceOf(Array);
        expect(response.body.summary).toBeDefined();
      });

      it('should fail without HR role', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/candidates', `token=${employeeToken}`
        ).expect(403);

        expectForbiddenError(response);
      });
    });
  });

  describe('Performance Reviews', () => {
    describe('POST /api/performance-reviews', () => {
      it('should create performance review as HR', async () => {
        const reviewData = {
          employeeId: testEmployeeId,
          reviewPeriod: '2024-Q1',
          goals: ['Complete project A', 'Improve team collaboration'],
          achievements: ['Delivered project on time', 'Mentored junior developers'],
          areasForImprovement: ['Time management', 'Documentation'],
          overallRating: 4,
          reviewerNotes: 'Excellent performance this quarter'
        };

        const response = await makeCookieRequest(
          app, 'post', '/api/performance-reviews', `token=${hrToken}`, reviewData
        ).expect(201);

        expect(response.body.performanceReview.overallRating).toBe(4);
        expect(response.body.performanceReview.status).toBe('DRAFT');
      });

      it('should fail without proper role', async () => {
        const reviewData = {
          employeeId: testEmployeeId,
          reviewPeriod: '2024-Q1',
          overallRating: 4
        };

        const response = await makeCookieRequest(
          app, 'post', '/api/performance-reviews', `token=${employeeToken}`, reviewData
        ).expect(403);

        expectForbiddenError(response);
      });
    });
  });

  describe('Reports and Analytics', () => {
    describe('GET /api/reports/attendance', () => {
      it('should generate attendance report as HR', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/reports/attendance?month=1&year=2024', `token=${hrToken}`
        ).expect(200);

        expect(response.body.report).toBeDefined();
        expect(response.body.summary).toBeDefined();
      });

      it('should fail without proper role', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/reports/attendance?month=1&year=2024', `token=${employeeToken}`
        ).expect(403);

        expectForbiddenError(response);
      });
    });

    describe('GET /api/reports/payroll', () => {
      it('should generate payroll report as HR', async () => {
        const response = await makeCookieRequest(
          app, 'get', '/api/reports/payroll?month=1&year=2024', `token=${hrToken}`
        ).expect(200);

        expect(response.body.report).toBeDefined();
        expect(response.body.summary).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expectNotFoundError(response);
    });

    it('should handle server errors gracefully', async () => {
      // This would test error handling by mocking a service to throw an error
      const response = await makeCookieRequest(
        app, 'get', '/api/employees', `token=${hrToken}`
      );

      // Should not crash the server
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await makeCookieRequest(
        app, 'get', `/api/employees?search=${maliciousInput}`, `token=${hrToken}`
      );

      // Should handle malicious input safely
      expect(response.status).toBeLessThan(500);
    });

    it('should prevent XSS attacks', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await makeCookieRequest(
        app, 'post', '/api/leave-requests', `token=${employeeToken}`,
        { ...createTestLeaveRequest(), reason: maliciousInput }
      );

      // Should sanitize input
      expect(response.status).toBeLessThan(500);
    });

    it('should enforce rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill().map(() => 
        request(app).post('/api/auth/login').send({
          email: 'test@test.com',
          password: 'wrongpassword'
        })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
