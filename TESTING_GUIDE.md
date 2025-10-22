# Testing Guide for FWC HRMS

This guide provides comprehensive instructions for testing the FWC HRMS application using Test-Driven Development (TDD) principles.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

### Test-Driven Development (TDD) Approach

We follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

### Testing Pyramid

```
    /\
   /  \
  / E2E \     <- Few, slow, expensive
 /______\
/        \
/Integration\ <- Some, medium speed
/__________\
/            \
/   Unit Tests \ <- Many, fast, cheap
/______________\
```

## Backend Testing

### Setup

```bash
cd apps/backend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testNamePattern="auth"
npm test -- --testNamePattern="attendance"
```

### Test Structure

```
src/tests/
├── unit/                 # Unit tests
│   ├── services/        # Service layer tests
│   ├── middleware/       # Middleware tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
│   ├── api/            # API endpoint tests
│   ├── database/       # Database integration tests
│   └── auth/           # Authentication flow tests
├── fixtures/           # Test data and fixtures
└── testUtils.js        # Shared test utilities
```

### Writing Unit Tests

#### Example: AuthService Test

```javascript
// tests/unit/services/authService.test.js
const authService = require("../../services/authService");
const { createTestUser, expectValidUser } = require("../testUtils");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should login user with valid credentials", async () => {
      // Arrange
      const userData = createTestUser();
      const mockUser = { id: "1", ...userData };

      // Mock dependencies
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(userData.email, userData.password);

      // Assert
      expectValidUser(result.user);
      expect(result).toHaveProperty("token");
    });
  });
});
```

### Writing Integration Tests

#### Example: API Integration Test

```javascript
// tests/integration/api/auth.test.js
const request = require("supertest");
const app = require("../../server");
const { createTestUser, makeAuthenticatedRequest } = require("../testUtils");

describe("Auth API Integration", () => {
  describe("POST /api/auth/login", () => {
    it("should authenticate user and return token", async () => {
      const userData = createTestUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(userData.email);
    });
  });
});
```

## Frontend Testing

### Setup

```bash
cd apps/frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run component tests
npm run test:components

# Run integration tests
npm run test:integration
```

### Test Structure

```
src/tests/
├── unit/                 # Unit tests
│   ├── components/      # Component tests
│   ├── hooks/           # Custom hook tests
│   ├── services/        # Service tests
│   └── utils/           # Utility tests
├── integration/         # Integration tests
│   ├── userFlows/       # User flow tests
│   └── api/             # API integration tests
├── mocks/               # Mock data and services
│   ├── server.js        # MSW server setup
│   └── handlers.js      # API mock handlers
└── setup.js             # Test setup and utilities
```

### Writing Component Tests

#### Example: LoginForm Test

```javascript
// tests/unit/components/LoginForm.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@components/LoginForm";
import { TestWrapper } from "@tests/setup";

describe("LoginForm Component", () => {
  it("should render login form correctly", () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should handle form submission", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();

    render(
      <TestWrapper>
        <LoginForm onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});
```

### Writing Integration Tests

#### Example: User Flow Test

```javascript
// tests/integration/userFlows.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@pages/App";
import { TestWrapper } from "@tests/setup";

describe("User Authentication Flow", () => {
  it("should complete full login flow", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Navigate to login
    await user.click(screen.getByText(/login/i));

    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    // Verify successful login
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

## Integration Testing

### API Integration Tests

Test the interaction between frontend and backend:

```javascript
// tests/integration/api.test.js
import { server } from "@tests/mocks/server";
import { rest } from "msw";

describe("API Integration", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("should fetch employees data", async () => {
    const response = await fetch("/api/employees");
    const data = await response.json();

    expect(data.employees).toBeInstanceOf(Array);
    expect(data.summary).toBeDefined();
  });
});
```

### Database Integration Tests

Test database operations:

```javascript
// tests/integration/database.test.js
const { setupTestDatabase, teardownTestDatabase } = require("../testUtils");

describe("Database Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should create and retrieve user", async () => {
    const user = await User.create(testUserData);
    const retrievedUser = await User.findById(user.id);

    expect(retrievedUser.email).toBe(testUserData.email);
  });
});
```

## End-to-End Testing

### Setup with Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Writing E2E Tests

```javascript
// tests/e2e/auth.spec.js
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });
});
```

## Test Utilities

### Backend Test Utilities

```javascript
// tests/testUtils.js
const { MongoMemoryServer } = require("mongodb-memory-server");

// Database setup
const setupTestDatabase = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

// Test data factories
const createTestUser = (overrides = {}) => ({
  email: "test@example.com",
  password: "password123",
  firstName: "Test",
  lastName: "User",
  ...overrides,
});

// API helpers
const makeAuthenticatedRequest = (
  app,
  method,
  endpoint,
  token,
  data = null
) => {
  const req = request(app)
    [method](endpoint)
    .set("Authorization", `Bearer ${token}`);

  if (data) return req.send(data);
  return req;
};
```

### Frontend Test Utilities

```javascript
// tests/setup.js
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";

// Test wrapper component
export const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: "1",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "EMPLOYEE",
  ...overrides,
});
```

## Best Practices

### 1. Test Naming

Use descriptive test names that explain the behavior:

```javascript
// Good
it("should return user data when valid credentials are provided");

// Bad
it("should work");
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```javascript
it("should calculate total salary correctly", () => {
  // Arrange
  const employee = createTestEmployee({ salary: 50000 });
  const bonus = 5000;

  // Act
  const total = calculateTotalSalary(employee, bonus);

  // Assert
  expect(total).toBe(55000);
});
```

### 3. Test Isolation

Each test should be independent:

```javascript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any shared state
});
```

### 4. Mock External Dependencies

Mock external services and APIs:

```javascript
// Mock API calls
jest.mock("@services/api", () => ({
  login: jest.fn(),
  getEmployees: jest.fn(),
}));
```

### 5. Test Edge Cases

Test both happy path and error scenarios:

```javascript
describe("UserService", () => {
  describe("createUser", () => {
    it("should create user with valid data", () => {
      // Happy path test
    });

    it("should throw error with invalid email", () => {
      // Error case test
    });

    it("should handle duplicate email", () => {
      // Edge case test
    });
  });
});
```

### 6. Use Test Data Factories

Create reusable test data:

```javascript
const createTestEmployee = (overrides = {}) => ({
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  department: "Engineering",
  ...overrides,
});
```

### 7. Test Accessibility

Include accessibility tests:

```javascript
it("should be accessible", () => {
  const { container } = render(<LoginForm />);
  const results = axe(container);
  expect(results).toHaveNoViolations();
});
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

```javascript
// Increase timeout for slow tests
jest.setTimeout(10000);

// Or use async/await properly
it("should handle async operation", async () => {
  await expect(asyncFunction()).resolves.toBeDefined();
});
```

#### 2. Mock Not Working

```javascript
// Ensure mocks are properly set up
beforeEach(() => {
  jest.clearAllMocks();
  mockFunction.mockResolvedValue(expectedValue);
});
```

#### 3. Database Connection Issues

```javascript
// Use in-memory database for tests
const setupTestDatabase = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};
```

#### 4. React Testing Library Issues

```javascript
// Wait for elements to appear
await waitFor(() => {
  expect(screen.getByText("Expected Text")).toBeInTheDocument();
});

// Use proper queries
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);
```

### Debugging Tests

#### Backend Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/authService.test.js

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Frontend Debugging

```bash
# Run tests with UI
npm run test:ui

# Debug specific test
npm test -- --testNamePattern="LoginForm"

# Run tests in watch mode
npm run test:watch
```

### Performance Testing

#### Backend Performance

```javascript
it("should respond within acceptable time", async () => {
  const start = Date.now();
  const response = await request(app).get("/api/employees");
  const duration = Date.now() - start;

  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(1000); // 1 second
});
```

#### Frontend Performance

```javascript
it("should render within acceptable time", async () => {
  const start = performance.now();
  render(<LargeComponent />);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(100); // 100ms
});
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: cd apps/backend && npm ci
      - run: cd apps/backend && npm test
      - run: cd apps/backend && npm run test:coverage

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: cd apps/frontend && npm ci
      - run: cd apps/frontend && npm test
      - run: cd apps/frontend && npm run test:coverage
```

## Coverage Reports

### Backend Coverage

```bash
npm run test:coverage
# Generates coverage/lcov-report/index.html
```

### Frontend Coverage

```bash
npm run test:coverage
# Generates coverage/index.html
```

### Coverage Thresholds

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

This testing guide ensures comprehensive coverage and maintainable test suites for the FWC HRMS application. Follow these practices to maintain high code quality and reliability.
