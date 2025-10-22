// Mock Service Worker setup for API testing
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock API responses
const handlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Login successful',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'EMPLOYEE',
          firstName: 'Test',
          lastName: 'User'
        },
        employee: {
          id: '1',
          firstName: 'Test',
          lastName: 'User',
          department: 'Engineering',
          position: 'Software Developer'
        }
      })
    )
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'User registered successfully',
        user: {
          id: '2',
          email: 'newuser@example.com',
          username: 'newuser',
          role: 'EMPLOYEE',
          firstName: 'New',
          lastName: 'User'
        },
        employee: {
          id: '2',
          firstName: 'New',
          lastName: 'User',
          department: 'Engineering',
          position: 'Software Developer'
        }
      })
    )
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    return res(
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: 'EMPLOYEE',
          firstName: 'Test',
          lastName: 'User'
        },
        employee: {
          id: '1',
          firstName: 'Test',
          lastName: 'User',
          department: 'Engineering',
          position: 'Software Developer'
        }
      })
    )
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Logout successful'
      })
    )
  }),

  // Employee endpoints
  rest.get('/api/employees', (req, res, ctx) => {
    return res(
      ctx.json({
        employees: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
            position: 'Software Developer',
            hireDate: '2023-01-01',
            salary: 75000
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            department: 'Marketing',
            position: 'Marketing Manager',
            hireDate: '2023-02-01',
            salary: 80000
          }
        ],
        summary: {
          totalEmployees: 2,
          departments: 2,
          averageSalary: 77500
        }
      })
    )
  }),

  rest.get('/api/employees/:id', (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.json({
        employee: {
          id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          department: 'Engineering',
          position: 'Software Developer',
          hireDate: '2023-01-01',
          salary: 75000
        }
      })
    )
  }),

  // Department endpoints
  rest.get('/api/departments', (req, res, ctx) => {
    return res(
      ctx.json({
        departments: [
          {
            id: '1',
            name: 'Engineering',
            description: 'Software development team',
            budget: 1000000,
            location: 'Headquarters',
            employeeCount: 5
          },
          {
            id: '2',
            name: 'Marketing',
            description: 'Marketing and sales team',
            budget: 500000,
            location: 'Branch Office',
            employeeCount: 3
          }
        ]
      })
    )
  }),

  rest.post('/api/departments', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        department: {
          id: '3',
          name: 'Human Resources',
          description: 'HR management team',
          budget: 300000,
          location: 'Headquarters',
          employeeCount: 2
        }
      })
    )
  }),

  // Attendance endpoints
  rest.get('/api/attendance', (req, res, ctx) => {
    return res(
      ctx.json({
        attendanceRecords: [
          {
            id: '1',
            date: '2024-01-15',
            clockIn: '09:00:00',
            clockOut: '17:00:00',
            hoursWorked: 8,
            status: 'COMPLETED'
          },
          {
            id: '2',
            date: '2024-01-16',
            clockIn: '09:15:00',
            clockOut: null,
            hoursWorked: null,
            status: 'CLOCKED_IN'
          }
        ],
        summary: {
          totalDays: 2,
          totalHours: 8,
          averageHours: 8,
          attendanceRate: 100
        }
      })
    )
  }),

  rest.post('/api/attendance/clock', (req, res, ctx) => {
    return res(
      ctx.json({
        attendance: {
          id: '3',
          date: new Date().toISOString().split('T')[0],
          clockIn: '09:00:00',
          clockOut: null,
          hoursWorked: null,
          status: 'CLOCKED_IN'
        }
      })
    )
  }),

  // Leave request endpoints
  rest.get('/api/leave-requests', (req, res, ctx) => {
    return res(
      ctx.json({
        leaveRequests: [
          {
            id: '1',
            leaveType: 'VACATION',
            startDate: '2024-02-01',
            endDate: '2024-02-05',
            reason: 'Family vacation',
            status: 'PENDING',
            submittedAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            leaveType: 'SICK',
            startDate: '2024-01-20',
            endDate: '2024-01-20',
            reason: 'Doctor appointment',
            status: 'APPROVED',
            submittedAt: '2024-01-19T14:30:00Z'
          }
        ]
      })
    )
  }),

  rest.post('/api/leave-requests', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        leaveRequest: {
          id: '3',
          leaveType: 'VACATION',
          startDate: '2024-03-01',
          endDate: '2024-03-05',
          reason: 'Spring break',
          status: 'PENDING',
          submittedAt: new Date().toISOString()
        }
      })
    )
  }),

  // Payroll endpoints
  rest.get('/api/payroll', (req, res, ctx) => {
    return res(
      ctx.json({
        payrolls: [
          {
            id: '1',
            payPeriodStart: '2024-01-01',
            payPeriodEnd: '2024-01-31',
            grossSalary: 7500,
            netSalary: 6000,
            allowances: { housing: 1000, transport: 500 },
            deductions: { tax: 750, health: 100 },
            status: 'RELEASED'
          }
        ]
      })
    )
  }),

  rest.get('/api/payroll/my-payroll', (req, res, ctx) => {
    return res(
      ctx.json({
        payrolls: [
          {
            id: '1',
            payPeriodStart: '2024-01-01',
            payPeriodEnd: '2024-01-31',
            grossSalary: 7500,
            netSalary: 6000,
            allowances: { housing: 1000, transport: 500 },
            deductions: { tax: 750, health: 100 },
            status: 'RELEASED'
          }
        ]
      })
    )
  }),

  // Job posting endpoints
  rest.get('/api/job-postings/public', (req, res, ctx) => {
    return res(
      ctx.json({
        jobPostings: [
          {
            id: '1',
            title: 'Senior Software Engineer',
            description: 'Join our engineering team to build amazing products',
            requirements: ['5+ years experience', 'React knowledge', 'Node.js'],
            salaryMin: 80000,
            salaryMax: 120000,
            location: 'San Francisco',
            employmentType: 'FULL_TIME',
            remoteAllowed: true,
            applicationDeadline: '2024-03-01T23:59:59Z',
            status: 'PUBLISHED'
          }
        ]
      })
    )
  }),

  rest.get('/api/job-postings', (req, res, ctx) => {
    return res(
      ctx.json({
        jobPostings: [
          {
            id: '1',
            title: 'Senior Software Engineer',
            description: 'Join our engineering team to build amazing products',
            requirements: ['5+ years experience', 'React knowledge', 'Node.js'],
            salaryMin: 80000,
            salaryMax: 120000,
            location: 'San Francisco',
            employmentType: 'FULL_TIME',
            remoteAllowed: true,
            applicationDeadline: '2024-03-01T23:59:59Z',
            status: 'PUBLISHED'
          },
          {
            id: '2',
            title: 'Marketing Manager',
            description: 'Lead our marketing initiatives',
            requirements: ['3+ years experience', 'Digital marketing', 'Analytics'],
            salaryMin: 60000,
            salaryMax: 90000,
            location: 'New York',
            employmentType: 'FULL_TIME',
            remoteAllowed: false,
            applicationDeadline: '2024-02-15T23:59:59Z',
            status: 'DRAFT'
          }
        ]
      })
    )
  }),

  // Candidate endpoints
  rest.get('/api/candidates', (req, res, ctx) => {
    return res(
      ctx.json({
        candidates: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Candidate',
            email: 'john.candidate@example.com',
            phoneNumber: '+1234567890',
            status: 'APPLIED',
            appliedAt: '2024-01-15T10:00:00Z',
            jobPosting: {
              id: '1',
              title: 'Senior Software Engineer'
            }
          }
        ],
        summary: {
          totalCandidates: 1,
          applied: 1,
          reviewed: 0,
          interviewed: 0,
          hired: 0,
          rejected: 0
        }
      })
    )
  }),

  rest.post('/api/candidates/apply', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        candidate: {
          id: '2',
          firstName: 'Jane',
          lastName: 'Applicant',
          email: 'jane.applicant@example.com',
          phoneNumber: '+1234567891',
          status: 'APPLIED',
          appliedAt: new Date().toISOString(),
          jobPosting: {
            id: '1',
            title: 'Senior Software Engineer'
          }
        }
      })
    )
  }),

  // Performance review endpoints
  rest.get('/api/performance-reviews', (req, res, ctx) => {
    return res(
      ctx.json({
        performanceReviews: [
          {
            id: '1',
            employeeId: '1',
            reviewPeriod: '2024-Q1',
            overallRating: 4,
            status: 'COMPLETED',
            goals: ['Complete project A', 'Improve team collaboration'],
            achievements: ['Delivered project on time', 'Mentored junior developers'],
            areasForImprovement: ['Time management', 'Documentation'],
            reviewerNotes: 'Excellent performance this quarter',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      })
    )
  }),

  // Reports endpoints
  rest.get('/api/reports/attendance', (req, res, ctx) => {
    return res(
      ctx.json({
        report: {
          month: 1,
          year: 2024,
          totalEmployees: 10,
          averageAttendance: 95.5,
          totalHours: 1600
        },
        summary: {
          presentDays: 20,
          absentDays: 1,
          lateArrivals: 3,
          earlyDepartures: 2
        }
      })
    )
  }),

  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        version: '1.0.0'
      })
    )
  }),

  // Error handlers
  rest.get('/api/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        message: 'Internal server error'
      })
    )
  }),

  rest.get('/api/not-found', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        message: 'Resource not found'
      })
    )
  })
]

export const server = setupServer(...handlers)
