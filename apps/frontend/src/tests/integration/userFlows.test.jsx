// Frontend integration tests for complete user flows
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from '@contexts/AuthContext'
import App from '@pages/App'
import { server } from '@tests/mocks/server'
import { createMockUser, createMockEmployee } from '@tests/setup'

// Mock the API service
vi.mock('@services/api', () => ({
  login: vi.fn(),
  getEmployees: vi.fn(),
  getDepartments: vi.fn(),
  getAttendance: vi.fn(),
  getLeaveRequests: vi.fn(),
  getPayroll: vi.fn(),
}))

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Frontend Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    server.resetHandlers()
  })

  describe('Authentication Flow', () => {
    it('should complete full login flow', async () => {
      const mockUser = createMockUser()
      const mockEmployee = createMockEmployee()

      // Mock successful login
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.json({
              message: 'Login successful',
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to login page
      const loginLink = screen.getByText(/login/i)
      await user.click(loginLink)

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /login/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(loginButton)

      // Wait for successful login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle login error and show error message', async () => {
      // Mock login error
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              message: 'Invalid credentials'
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to login page
      const loginLink = screen.getByText(/login/i)
      await user.click(loginLink)

      // Fill login form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /login/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(loginButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Employee Dashboard Flow', () => {
    it('should load employee dashboard with data', async () => {
      const mockUser = createMockUser({ role: 'EMPLOYEE' })
      const mockEmployee = createMockEmployee()

      // Mock authenticated user
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.json({
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      // Mock dashboard data
      server.use(
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
                }
              ],
              summary: {
                totalDays: 1,
                totalHours: 8,
                averageHours: 8,
                attendanceRate: 100
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to dashboard
      await user.click(screen.getByText(/dashboard/i))

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
        expect(screen.getByText(/attendance/i)).toBeInTheDocument()
      })

      // Check attendance data is displayed
      expect(screen.getByText(/8 hours/i)).toBeInTheDocument()
      expect(screen.getByText(/100%/i)).toBeInTheDocument()
    })

    it('should handle clock in/out functionality', async () => {
      const mockUser = createMockUser({ role: 'EMPLOYEE' })
      const mockEmployee = createMockEmployee()

      // Mock authenticated user
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.json({
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      // Mock clock in/out
      server.use(
        rest.post('/api/attendance/clock', (req, res, ctx) => {
          return res(
            ctx.json({
              attendance: {
                id: '1',
                date: new Date().toISOString().split('T')[0],
                clockIn: '09:00:00',
                clockOut: null,
                hoursWorked: null,
                status: 'CLOCKED_IN'
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to attendance page
      await user.click(screen.getByText(/attendance/i))

      // Click clock in button
      const clockInButton = screen.getByRole('button', { name: /clock in/i })
      await user.click(clockInButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/clocked in successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('Leave Request Flow', () => {
    it('should complete leave request submission', async () => {
      const mockUser = createMockUser({ role: 'EMPLOYEE' })
      const mockEmployee = createMockEmployee()

      // Mock authenticated user
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.json({
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      // Mock leave request submission
      server.use(
        rest.post('/api/leave-requests', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              leaveRequest: {
                id: '1',
                leaveType: 'VACATION',
                startDate: '2024-02-01',
                endDate: '2024-02-05',
                reason: 'Family vacation',
                status: 'PENDING',
                submittedAt: new Date().toISOString()
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to leave management
      await user.click(screen.getByText(/leave/i))

      // Click apply for leave button
      const applyButton = screen.getByRole('button', { name: /apply for leave/i })
      await user.click(applyButton)

      // Fill leave request form
      const leaveTypeSelect = screen.getByLabelText(/leave type/i)
      const startDateInput = screen.getByLabelText(/start date/i)
      const endDateInput = screen.getByLabelText(/end date/i)
      const reasonInput = screen.getByLabelText(/reason/i)
      const submitButton = screen.getByRole('button', { name: /submit/i })

      await user.selectOptions(leaveTypeSelect, 'VACATION')
      await user.type(startDateInput, '2024-02-01')
      await user.type(endDateInput, '2024-02-05')
      await user.type(reasonInput, 'Family vacation')
      await user.click(submitButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/leave request submitted/i)).toBeInTheDocument()
      })
    })
  })

  describe('HR Management Flow', () => {
    it('should load HR dashboard with employee data', async () => {
      const mockUser = createMockUser({ role: 'HR' })
      const mockEmployee = createMockEmployee()

      // Mock authenticated HR user
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.json({
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      // Mock employees data
      server.use(
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
                }
              ],
              summary: {
                totalEmployees: 1,
                departments: 1,
                averageSalary: 75000
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to HR dashboard
      await user.click(screen.getByText(/hr/i))

      // Wait for HR dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/employee management/i)).toBeInTheDocument()
        expect(screen.getByText(/john doe/i)).toBeInTheDocument()
      })

      // Check summary data
      expect(screen.getByText(/1 employee/i)).toBeInTheDocument()
      expect(screen.getByText(/\$75,000/i)).toBeInTheDocument()
    })

    it('should handle employee creation', async () => {
      const mockUser = createMockUser({ role: 'HR' })
      const mockEmployee = createMockEmployee()

      // Mock authenticated HR user
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.json({
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      // Mock employee creation
      server.use(
        rest.post('/api/employees', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              employee: {
                id: '2',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                department: 'Marketing',
                position: 'Marketing Manager',
                hireDate: '2024-01-01',
                salary: 80000
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to HR dashboard
      await user.click(screen.getByText(/hr/i))

      // Click add employee button
      const addButton = screen.getByRole('button', { name: /add employee/i })
      await user.click(addButton)

      // Fill employee form
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const departmentSelect = screen.getByLabelText(/department/i)
      const positionInput = screen.getByLabelText(/position/i)
      const salaryInput = screen.getByLabelText(/salary/i)
      const submitButton = screen.getByRole('button', { name: /create employee/i })

      await user.type(firstNameInput, 'Jane')
      await user.type(lastNameInput, 'Smith')
      await user.type(emailInput, 'jane.smith@example.com')
      await user.selectOptions(departmentSelect, 'Marketing')
      await user.type(positionInput, 'Marketing Manager')
      await user.type(salaryInput, '80000')
      await user.click(submitButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/employee created successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('Manager Flow', () => {
    it('should handle leave request approval', async () => {
      const mockUser = createMockUser({ role: 'MANAGER' })
      const mockEmployee = createMockEmployee()

      // Mock authenticated manager user
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.json({
              user: mockUser,
              employee: mockEmployee
            })
          )
        })
      )

      // Mock pending leave requests
      server.use(
        rest.get('/api/leave-requests/pending', (req, res, ctx) => {
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
                  employee: {
                    firstName: 'John',
                    lastName: 'Doe'
                  }
                }
              ]
            })
          )
        })
      )

      // Mock leave request approval
      server.use(
        rest.put('/api/leave-requests/1/approve', (req, res, ctx) => {
          return res(
            ctx.json({
              leaveRequest: {
                id: '1',
                leaveType: 'VACATION',
                startDate: '2024-02-01',
                endDate: '2024-02-05',
                reason: 'Family vacation',
                status: 'APPROVED',
                employee: {
                  firstName: 'John',
                  lastName: 'Doe'
                }
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to manager dashboard
      await user.click(screen.getByText(/manager/i))

      // Wait for pending leave requests
      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument()
        expect(screen.getByText(/family vacation/i)).toBeInTheDocument()
      })

      // Approve leave request
      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/leave request approved/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should handle 404 errors', async () => {
      // Mock 404 error
      server.use(
        rest.get('/api/nonexistent', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              message: 'Resource not found'
            })
          )
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Navigate to non-existent page
      await user.click(screen.getByText(/nonexistent/i))

      // Wait for 404 message
      await waitFor(() => {
        expect(screen.getByText(/resource not found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Check for mobile-specific elements
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('should adapt to tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Check for tablet-specific layout
      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toBeInTheDocument()
    })
  })
})
