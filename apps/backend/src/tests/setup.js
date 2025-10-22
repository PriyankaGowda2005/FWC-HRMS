// Jest setup file for comprehensive testing
const { setupTestEnvironment } = require('./testUtils');

// Setup test environment
setupTestEnvironment();

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock external services
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}));

// Mock email service
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}));

// Mock file upload
jest.mock('multer', () => ({
  memoryStorage: jest.fn(),
  single: jest.fn(() => (req, res, next) => {
    req.file = {
      fieldname: 'resume',
      originalname: 'test-resume.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('test file content'),
      size: 1024,
    };
    next();
  }),
}));

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock date for consistent testing
  mockDate: (date) => {
    const mockDate = new Date(date);
    global.Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());
  },
  
  // Restore original date
  restoreDate: () => {
    global.Date = Date;
  },
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global cleanup
afterAll(() => {
  jest.restoreAllMocks();
});
