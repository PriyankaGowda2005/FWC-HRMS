// Frontend test setup file
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock fetch
global.fetch = vi.fn()

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor() {}
  close() {}
  send() {}
}

// Mock Socket.IO
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  }
})

// Mock React Query
vi.mock('react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children,
}))

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    input: 'input',
    form: 'form',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    main: 'main',
    aside: 'aside',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
}))

// Mock QR code
vi.mock('react-qr-code', () => ({
  QRCode: () => 'QRCode',
}))

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }) => children,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => children,
  BarChart: ({ children }) => children,
  Bar: () => null,
  PieChart: ({ children }) => children,
  Pie: () => null,
  Cell: () => null,
}))

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  role: 'EMPLOYEE',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
})

export const createMockEmployee = (overrides = {}) => ({
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1234567890',
  department: 'Engineering',
  position: 'Software Developer',
  hireDate: '2023-01-01',
  salary: 75000,
  ...overrides,
})

export const createMockDepartment = (overrides = {}) => ({
  id: '1',
  name: 'Engineering',
  description: 'Software development team',
  budget: 1000000,
  location: 'Headquarters',
  ...overrides,
})

export const createMockLeaveRequest = (overrides = {}) => ({
  id: '1',
  leaveType: 'VACATION',
  startDate: '2024-02-01',
  endDate: '2024-02-05',
  reason: 'Family vacation',
  status: 'PENDING',
  ...overrides,
})

export const createMockPayroll = (overrides = {}) => ({
  id: '1',
  payPeriodStart: '2024-01-01',
  payPeriodEnd: '2024-01-31',
  grossSalary: 7500,
  netSalary: 6000,
  allowances: { housing: 1000, transport: 500 },
  deductions: { tax: 750, health: 100 },
  ...overrides,
})

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { user = createMockUser(), ...renderOptions } = options
  
  // Mock AuthContext
  const MockAuthProvider = ({ children }) => {
    return React.createElement('div', { 'data-testid': 'auth-provider' }, children)
  }
  
  return {
    ...render(ui, {
      wrapper: MockAuthProvider,
      ...renderOptions,
    }),
    user,
  }
}

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
})

// Mock error response
export const mockApiError = (message = 'API Error', status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
})

// Test data factories
export const testData = {
  users: {
    admin: createMockUser({ role: 'ADMIN', email: 'admin@test.com' }),
    hr: createMockUser({ role: 'HR', email: 'hr@test.com' }),
    manager: createMockUser({ role: 'MANAGER', email: 'manager@test.com' }),
    employee: createMockUser({ role: 'EMPLOYEE', email: 'employee@test.com' }),
  },
  employees: {
    developer: createMockEmployee({ position: 'Software Developer' }),
    manager: createMockEmployee({ position: 'Engineering Manager' }),
    designer: createMockEmployee({ position: 'UI/UX Designer' }),
  },
  departments: {
    engineering: createMockDepartment({ name: 'Engineering' }),
    marketing: createMockDepartment({ name: 'Marketing' }),
    hr: createMockDepartment({ name: 'Human Resources' }),
  },
}
