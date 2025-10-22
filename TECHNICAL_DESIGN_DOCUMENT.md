# FWC HRMS - Technical Design Document

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Security Architecture](#security-architecture)
7. [AI/ML Integration](#aiml-integration)
8. [Frontend Architecture](#frontend-architecture)
9. [Backend Architecture](#backend-architecture)
10. [Deployment Strategy](#deployment-strategy)
11. [Testing Strategy](#testing-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Scalability Design](#scalability-design)
14. [Monitoring & Logging](#monitoring--logging)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Project Overview

FWC HRMS is a comprehensive, enterprise-grade Human Resource Management System built with modern web technologies. The system provides end-to-end HR functionality including employee management, attendance tracking, payroll processing, performance reviews, recruitment, and AI-powered features.

### Key Features

- **Core HR Management**: Employee lifecycle, attendance, leave, payroll, performance
- **AI-Powered Features**: Resume screening, interview analysis, emotion detection, chatbot
- **Real-time Capabilities**: Live notifications, WebSocket integration, real-time collaboration
- **Role-based Access Control**: Granular permissions for Admin, HR, Manager, Employee roles
- **Mobile-responsive Design**: Progressive Web App with offline capabilities
- **Microservices Architecture**: Scalable, maintainable, and deployable services

### Business Objectives

- Streamline HR operations and reduce manual processes
- Improve employee experience with self-service capabilities
- Enhance decision-making with AI-powered analytics
- Ensure compliance with HR regulations and data security
- Provide scalable solution for growing organizations

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Application Layer                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Frontend      │   Backend API   │   AI/ML Services           │
│   (React/Vite)  │   (Node.js)     │   (Python/FastAPI)         │
└─────────────────┴─────────────────┴─────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Data Layer                                   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   MongoDB        │   Redis Cache  │   File Storage             │
│   (Primary DB)   │   (Sessions)   │   (AWS S3/Local)          │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Microservices Architecture

#### Service Breakdown

1. **Frontend Service** (React/Vite)

   - User interface and user experience
   - State management with React Query
   - Real-time updates via Socket.IO

2. **Backend API Service** (Node.js/Express)

   - RESTful API endpoints
   - Authentication and authorization
   - Business logic implementation
   - WebSocket server for real-time features

3. **AI/ML Service** (Python/FastAPI)

   - Resume parsing and screening
   - Interview analysis and transcription
   - Emotion detection
   - Chatbot functionality

4. **Database Service** (MongoDB)

   - Primary data storage
   - Document-based data model
   - Indexing and query optimization

5. **Cache Service** (Redis)
   - Session management
   - API response caching
   - Real-time data storage

---

## Technology Stack

### Frontend Technologies

- **React 18**: Modern UI library with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router**: Client-side routing and navigation
- **TanStack Query**: Server state management and caching
- **Socket.IO Client**: Real-time bidirectional communication
- **Framer Motion**: Animation library for smooth UI transitions
- **React Hook Form**: Form handling and validation
- **Recharts**: Data visualization and charting

### Backend Technologies

- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **MongoDB**: NoSQL document database
- **Redis**: In-memory data store for caching
- **JWT**: JSON Web Token for authentication
- **BullMQ**: Job queue management for background tasks
- **Multer**: File upload handling
- **Zod**: Schema validation and type safety

### AI/ML Technologies

- **Python 3.9+**: Machine learning runtime
- **FastAPI**: Modern Python web framework
- **OpenAI API**: AI-powered features and language models
- **Speech Recognition**: Audio processing and transcription
- **Natural Language Processing**: Text analysis and processing
- **Computer Vision**: Image and video analysis
- **TensorFlow/PyTorch**: Deep learning frameworks

### DevOps & Infrastructure

- **Docker**: Containerization platform
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer
- **PM2**: Process management for Node.js
- **GitHub Actions**: CI/CD pipeline automation
- **AWS/GCP**: Cloud deployment platforms

---

## Database Design

### MongoDB Collections

#### User Management

```javascript
// Users Collection
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: Enum ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  department: ObjectId,
  manager: ObjectId,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}

// Departments Collection
{
  _id: ObjectId,
  name: String,
  description: String,
  manager: ObjectId,
  budget: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Employee Management

```javascript
// Employees Collection
{
  _id: ObjectId,
  userId: ObjectId,
  employeeId: String (unique),
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: Object,
    emergencyContact: Object
  },
  employmentInfo: {
    position: String,
    department: ObjectId,
    manager: ObjectId,
    startDate: Date,
    salary: Number,
    employmentType: Enum ['FULL_TIME', 'PART_TIME', 'CONTRACT'],
    status: Enum ['ACTIVE', 'INACTIVE', 'TERMINATED']
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Attendance Management

```javascript
// Attendance Collection
{
  _id: ObjectId,
  employeeId: ObjectId,
  date: Date,
  clockIn: Date,
  clockOut: Date,
  breakStart: Date,
  breakEnd: Date,
  totalHours: Number,
  overtimeHours: Number,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: Enum ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Leave Management

```javascript
// Leave Requests Collection
{
  _id: ObjectId,
  employeeId: ObjectId,
  leaveType: Enum ['SICK', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY'],
  startDate: Date,
  endDate: Date,
  daysRequested: Number,
  reason: String,
  status: Enum ['PENDING', 'APPROVED', 'REJECTED'],
  approvedBy: ObjectId,
  approvedAt: Date,
  comments: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Payroll Management

```javascript
// Payroll Collection
{
  _id: ObjectId,
  employeeId: ObjectId,
  payPeriod: {
    startDate: Date,
    endDate: Date,
    month: Number,
    year: Number
  },
  basicSalary: Number,
  allowances: [{
    type: String,
    amount: Number
  }],
  deductions: [{
    type: String,
    amount: Number
  }],
  overtimePay: Number,
  grossSalary: Number,
  netSalary: Number,
  status: Enum ['PENDING', 'PROCESSED', 'PAID'],
  processedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Recruitment Management

```javascript
// Job Postings Collection
{
  _id: ObjectId,
  title: String,
  department: ObjectId,
  description: String,
  requirements: [String],
  responsibilities: [String],
  salaryRange: {
    min: Number,
    max: Number
  },
  employmentType: String,
  location: String,
  status: Enum ['DRAFT', 'PUBLISHED', 'CLOSED'],
  postedBy: ObjectId,
  postedAt: Date,
  deadline: Date,
  createdAt: Date,
  updatedAt: Date
}

// Candidates Collection
{
  _id: ObjectId,
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: Object
  },
  applicationInfo: {
    jobPostingId: ObjectId,
    resumeUrl: String,
    coverLetter: String,
    appliedAt: Date,
    status: Enum ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED']
  },
  interviewScores: [{
    round: Number,
    score: Number,
    feedback: String,
    interviewer: ObjectId,
    date: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes

```javascript
// Performance optimization indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ employeeId: 1 }, { unique: true });
db.employees.createIndex({ department: 1 });
db.attendance.createIndex({ employeeId: 1, date: 1 });
db.leaveRequests.createIndex({ employeeId: 1, status: 1 });
db.payroll.createIndex({
  employeeId: 1,
  "payPeriod.year": 1,
  "payPeriod.month": 1,
});
db.jobPostings.createIndex({ status: 1, department: 1 });
db.candidates.createIndex({
  "applicationInfo.jobPostingId": 1,
  "applicationInfo.status": 1,
});
```

---

## API Design

### RESTful API Endpoints

#### Authentication Endpoints

```
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Refresh token
GET    /api/auth/me                 # Get current user
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Reset password
```

#### Employee Management

```
GET    /api/employees               # List employees
POST   /api/employees               # Create employee
GET    /api/employees/:id           # Get employee details
PUT    /api/employees/:id           # Update employee
DELETE /api/employees/:id           # Delete employee
GET    /api/employees/:id/team      # Get employee team
```

#### Attendance Management

```
POST   /api/attendance/clock        # Clock in/out
GET    /api/attendance              # Get attendance records
GET    /api/attendance/summary      # Get attendance summary
GET    /api/attendance/team         # Get team attendance
PUT    /api/attendance/:id          # Update attendance record
```

#### Leave Management

```
POST   /api/leave-requests          # Apply for leave
GET    /api/leave-requests          # Get leave requests
PUT    /api/leave-requests/:id/approve # Approve/reject leave
GET    /api/leave-requests/pending  # Get pending leaves
GET    /api/leave-requests/balance  # Get leave balance
```

#### Payroll Management

```
GET    /api/payroll                 # Get payroll records
POST   /api/payroll/generate        # Generate payroll
POST   /api/payroll/:id/release     # Release payroll
GET    /api/payroll/my-payroll      # Get my payroll
GET    /api/payroll/reports         # Get payroll reports
```

#### Recruitment Management

```
GET    /api/job-postings            # List job postings
POST   /api/job-postings            # Create job posting
GET    /api/job-postings/:id        # Get job posting details
PUT    /api/job-postings/:id        # Update job posting
DELETE /api/job-postings/:id        # Delete job posting

GET    /api/candidates              # List candidates
POST   /api/candidates              # Add candidate
GET    /api/candidates/:id          # Get candidate details
PUT    /api/candidates/:id          # Update candidate
POST   /api/candidates/:id/interview # Schedule interview
```

#### AI Services

```
POST   /api/ai/resume-screening     # Screen resume
POST   /api/ai/interview-analysis   # Analyze interview
POST   /api/ai/chatbot              # Chat with AI assistant
GET    /api/ai/sentiment-analysis   # Analyze sentiment
POST   /api/ai/emotion-detection    # Detect emotions
```

### API Response Format

```javascript
// Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### WebSocket Events

```javascript
// Real-time events
"user:online"; // User comes online
"user:offline"; // User goes offline
"attendance:clock"; // Attendance clock event
"leave:request"; // New leave request
"leave:approval"; // Leave approval/rejection
"payroll:generated"; // Payroll generation complete
"interview:scheduled"; // Interview scheduled
"notification:new"; // New notification
```

---

## Security Architecture

### Authentication & Authorization

#### JWT Token Strategy

```javascript
// Access Token (15 minutes)
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "permissions": ["read:profile", "write:attendance"],
  "iat": 1642248000,
  "exp": 1642248900
}

// Refresh Token (7 days)
{
  "sub": "user_id",
  "tokenVersion": 1,
  "iat": 1642248000,
  "exp": 1642852800
}
```

#### Role-Based Access Control (RBAC)

```javascript
// Permission Matrix
const PERMISSIONS = {
  ADMIN: [
    "read:all",
    "write:all",
    "delete:all",
    "manage:users",
    "manage:departments",
    "manage:system",
    "view:reports",
  ],
  HR: [
    "read:employees",
    "write:employees",
    "manage:recruitment",
    "manage:payroll",
    "view:hr-reports",
  ],
  MANAGER: [
    "read:team",
    "write:team-attendance",
    "approve:leave",
    "view:team-reports",
  ],
  EMPLOYEE: [
    "read:profile",
    "write:profile",
    "write:attendance",
    "create:leave-request",
  ],
};
```

### Security Middleware

```javascript
// Rate Limiting
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: "Too many login attempts",
  skipSuccessfulRequests: true,
});
```

### Data Encryption

- **In Transit**: TLS 1.3 encryption for all communications
- **At Rest**: AES-256 encryption for sensitive data
- **Password Hashing**: bcrypt with salt rounds
- **API Keys**: Environment variables with encryption

### Security Headers

```javascript
// Helmet.js configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

## AI/ML Integration

### AI Services Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI/ML Service Layer                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Resume Parser   │ Interview       │ Chatbot Service         │
│ Service         │ Analyzer        │                         │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Emotion         │ Sentiment      │ Report Generator        │
│ Detection       │ Analysis       │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Resume Screening Pipeline

```python
# Resume Processing Pipeline
class ResumeProcessor:
    def __init__(self):
        self.parser = ResumeParser()
        self.matcher = JobMatcher()
        self.scorer = ResumeScorer()

    async def process_resume(self, resume_file, job_posting):
        # Extract text from resume
        text = await self.parser.extract_text(resume_file)

        # Parse structured data
        resume_data = await self.parser.parse_resume(text)

        # Match against job requirements
        match_score = await self.matcher.calculate_match(
            resume_data, job_posting.requirements
        )

        # Generate screening report
        report = await self.scorer.generate_report(
            resume_data, match_score
        )

        return {
            'resume_data': resume_data,
            'match_score': match_score,
            'screening_report': report
        }
```

### Interview Analysis System

```python
# Real-time Interview Analysis
class InterviewAnalyzer:
    def __init__(self):
        self.transcriber = SpeechTranscriber()
        self.emotion_detector = EmotionDetector()
        self.sentiment_analyzer = SentimentAnalyzer()

    async def analyze_interview(self, audio_stream):
        # Real-time transcription
        transcript = await self.transcriber.transcribe_stream(audio_stream)

        # Emotion analysis
        emotions = await self.emotion_detector.analyze_audio(audio_stream)

        # Sentiment analysis
        sentiment = await self.sentiment_analyzer.analyze_text(transcript)

        # Generate analysis report
        analysis = {
            'transcript': transcript,
            'emotions': emotions,
            'sentiment': sentiment,
            'confidence_score': self.calculate_confidence(emotions, sentiment)
        }

        return analysis
```

### Chatbot Integration

```python
# HR Assistant Chatbot
class HRChatbot:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.knowledge_base = HRKnowledgeBase()

    async def process_query(self, user_query, user_context):
        # Retrieve relevant context
        context = await self.knowledge_base.get_context(user_query)

        # Generate response using OpenAI
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an HR assistant..."},
                {"role": "user", "content": f"Context: {context}\nQuery: {user_query}"}
            ]
        )

        return response.choices[0].message.content
```

---

## Frontend Architecture

### Component Architecture

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (Button, Modal, etc.)
│   ├── forms/           # Form components
│   ├── charts/          # Data visualization components
│   └── layout/          # Layout components
├── pages/               # Page components
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
├── services/            # API and external service integrations
├── utils/               # Utility functions
└── styles/              # Global styles and themes
```

### State Management Strategy

```javascript
// React Query for Server State
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Context for Global State
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

// Custom Hooks for Business Logic
const useEmployee = (employeeId) => {
  return useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => api.getEmployee(employeeId),
    enabled: !!employeeId,
  });
};
```

### Routing Strategy

```javascript
// Role-based Route Protection
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Route Configuration
const routes = [
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requiredRoles={["EMPLOYEE"]}>
        <EmployeeDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRoles={["ADMIN"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
];
```

### Real-time Features

```javascript
// Socket.IO Integration
const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.VITE_SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return socket;
};

// Real-time Notifications
const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on("notification:new", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast.success(notification.message);
      });
    }
  }, [socket]);

  return notifications;
};
```

---

## Backend Architecture

### Service Layer Architecture

```
src/
├── routes/              # API route handlers
├── middleware/          # Express middleware
├── services/           # Business logic services
├── models/             # Database models
├── utils/              # Utility functions
├── database/           # Database connection and configuration
└── tests/              # Test files
```

### Business Logic Services

```javascript
// Employee Service
class EmployeeService {
  async createEmployee(employeeData) {
    // Validate input data
    const validatedData = await this.validateEmployeeData(employeeData);

    // Check for duplicate employee ID
    const existingEmployee = await Employee.findOne({
      employeeId: validatedData.employeeId,
    });

    if (existingEmployee) {
      throw new Error("Employee ID already exists");
    }

    // Create employee record
    const employee = await Employee.create(validatedData);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(employee);

    // Log activity
    await this.auditLogger.logActivity("EMPLOYEE_CREATED", employee._id);

    return employee;
  }

  async getEmployeeById(employeeId) {
    const employee = await Employee.findById(employeeId)
      .populate("department")
      .populate("manager");

    if (!employee) {
      throw new Error("Employee not found");
    }

    return employee;
  }
}
```

### Background Job Processing

```javascript
// BullMQ Job Queue
const Queue = require("bullmq");
const { Worker } = require("bullmq");

// Email Queue
const emailQueue = new Queue("email", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Payroll Processing Queue
const payrollQueue = new Queue("payroll", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Worker for processing jobs
const emailWorker = new Worker(
  "email",
  async (job) => {
    const { to, subject, template, data } = job.data;

    await emailService.sendEmail({
      to,
      subject,
      template,
      data,
    });
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  }
);
```

### WebSocket Integration

```javascript
// Socket.IO Service
const socketService = {
  initialize(server) {
    this.io = require("socket.io")(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Join user to their room
      socket.on("join:user", (userId) => {
        socket.join(`user:${userId}`);
      });

      // Handle attendance clock events
      socket.on("attendance:clock", async (data) => {
        const result = await attendanceService.clockInOut(data);
        socket.emit("attendance:success", result);

        // Notify manager
        socket
          .to(`manager:${data.managerId}`)
          .emit("attendance:update", result);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  },

  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  },

  emitToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  },
};
```

---

## Deployment Strategy

### Docker Configuration

```yaml
# docker-compose.yml
version: "3.8"

services:
  frontend:
    build: ./apps/frontend
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  ml-service:
    build: ./services/ml
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    depends_on:
      - mongodb

volumes:
  mongodb_data:
  redis_data:
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t fwc-hrms/frontend ./apps/frontend
          docker build -t fwc-hrms/backend ./apps/backend
          docker build -t fwc-hrms/ml-service ./services/ml

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration

```bash
# Production Environment Variables
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fwc-hrms-prod
REDIS_URL=redis://redis-server:6379
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
FRONTEND_URL=https://fwchrms.com
OPENAI_API_KEY=your-openai-api-key
RESEND_API_KEY=your-resend-api-key
```

---

## Testing Strategy

### Test-Driven Development (TDD) Approach

#### Testing Pyramid

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

#### Backend Testing

```javascript
// Unit Test Example
describe("EmployeeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEmployee", () => {
    it("should create employee with valid data", async () => {
      // Arrange
      const employeeData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        employeeId: "EMP001",
      };

      // Act
      const result = await employeeService.createEmployee(employeeData);

      // Assert
      expect(result).toHaveProperty("_id");
      expect(result.firstName).toBe(employeeData.firstName);
      expect(result.email).toBe(employeeData.email);
    });

    it("should throw error for duplicate employee ID", async () => {
      // Arrange
      const existingEmployee = await Employee.create({
        employeeId: "EMP001",
        firstName: "Existing",
        lastName: "Employee",
      });

      const duplicateData = {
        employeeId: "EMP001",
        firstName: "John",
        lastName: "Doe",
      };

      // Act & Assert
      await expect(
        employeeService.createEmployee(duplicateData)
      ).rejects.toThrow("Employee ID already exists");
    });
  });
});
```

#### Frontend Testing

```javascript
// Component Test Example
describe("LoginForm", () => {
  it("should render login form correctly", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should handle form submission", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();

    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});
```

#### Integration Testing

```javascript
// API Integration Test
describe("Employee API Integration", () => {
  describe("POST /api/employees", () => {
    it("should create employee and return 201", async () => {
      const employeeData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        employeeId: "EMP001",
      };

      const response = await request(app)
        .post("/api/employees")
        .send(employeeData)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.firstName).toBe(employeeData.firstName);
    });
  });
});
```

#### End-to-End Testing

```javascript
// E2E Test with Playwright
test.describe("Employee Management Flow", () => {
  test("should complete employee creation flow", async ({ page }) => {
    await page.goto("/login");

    // Login
    await page.fill('[data-testid="email-input"]', "admin@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    // Navigate to employee management
    await page.click('[data-testid="employees-menu"]');
    await page.click('[data-testid="add-employee-button"]');

    // Fill employee form
    await page.fill('[data-testid="first-name-input"]', "John");
    await page.fill('[data-testid="last-name-input"]', "Doe");
    await page.fill('[data-testid="email-input"]', "john.doe@example.com");
    await page.click('[data-testid="submit-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

### Test Coverage Requirements

- **Unit Tests**: >80% code coverage
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user flows
- **Performance Tests**: Response time <500ms for API calls

---

## Performance Considerations

### Frontend Performance

```javascript
// Code Splitting
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Memoization
const EmployeeCard = memo(({ employee }) => {
  return (
    <div className="employee-card">
      <h3>{employee.name}</h3>
      <p>{employee.department}</p>
    </div>
  );
});

// Virtual Scrolling for Large Lists
const EmployeeList = () => {
  return (
    <FixedSizeList
      height={600}
      itemCount={employees.length}
      itemSize={80}
      itemData={employees}
    >
      {EmployeeCard}
    </FixedSizeList>
  );
};
```

### Backend Performance

```javascript
// Database Query Optimization
const getEmployeesWithPagination = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const employees = await Employee.find()
    .populate("department", "name")
    .populate("manager", "firstName lastName")
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for better performance

  const total = await Employee.countDocuments();

  return {
    employees,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Caching Strategy
const redis = require("redis");
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};
```

### Database Optimization

```javascript
// MongoDB Indexes
db.employees.createIndex({ employeeId: 1 }, { unique: true });
db.employees.createIndex({ department: 1, status: 1 });
db.attendance.createIndex({ employeeId: 1, date: -1 });
db.leaveRequests.createIndex({ employeeId: 1, status: 1, startDate: 1 });

// Aggregation Pipeline for Reports
const getAttendanceReport = async (startDate, endDate) => {
  return await Attendance.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$employeeId",
        totalDays: { $sum: 1 },
        totalHours: { $sum: "$totalHours" },
        averageHours: { $avg: "$totalHours" },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "_id",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $project: {
        employeeName: {
          $concat: ["$employee.firstName", " ", "$employee.lastName"],
        },
        totalDays: 1,
        totalHours: 1,
        averageHours: 1,
      },
    },
  ]);
};
```

---

## Scalability Design

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                Application Servers (Multiple)              │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend-1    │   Frontend-2    │   Frontend-N            │
│   Backend-1     │   Backend-2     │   Backend-N             │
└─────────────────┴─────────────────┴─────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    Database Cluster                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   MongoDB       │   Redis         │   File Storage          │
│   Primary       │   Cluster       │   (AWS S3/CDN)         │
│   Secondary     │                 │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Microservices Scaling

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fwc-hrms-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fwc-hrms-backend
  template:
    metadata:
      labels:
        app: fwc-hrms-backend
    spec:
      containers:
        - name: backend
          image: fwc-hrms/backend:latest
          ports:
            - containerPort: 3001
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: fwc-hrms-backend-service
spec:
  selector:
    app: fwc-hrms-backend
  ports:
    - port: 80
      targetPort: 3001
  type: LoadBalancer
```

### Database Scaling

```javascript
// MongoDB Sharding Configuration
sh.enableSharding("fwc-hrms");

// Shard employees collection by department
sh.shardCollection("fwc-hrms.employees", { department: 1 });

// Shard attendance collection by date
sh.shardCollection("fwc-hrms.attendance", { date: 1 });

// Read Preferences for Scaling
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, {
  readPreference: "secondaryPreferred",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

## Monitoring & Logging

### Application Monitoring

```javascript
// Winston Logger Configuration
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "fwc-hrms-backend" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Health Monitoring

```javascript
// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();

    // Check Redis connection
    const redis = require("redis");
    const client = redis.createClient(process.env.REDIS_URL);
    await client.ping();
    client.quit();

    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.APP_VERSION,
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

### Performance Monitoring

```javascript
// Performance Metrics
const prometheus = require("prom-client");

const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestTotal = new prometheus.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

// Middleware for metrics collection
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });

  next();
});
```

### Error Tracking

```javascript
// Sentry Integration
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handling middleware
app.use(Sentry.requestHandler());
app.use(Sentry.tracingHandler());

// Error reporting
app.use((error, req, res, next) => {
  Sentry.captureException(error);

  logger.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get("User-Agent"),
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});
```

---

## Future Enhancements

### Phase 1: Advanced AI Features

- **Predictive Analytics**: Employee retention prediction
- **Smart Scheduling**: AI-powered interview scheduling
- **Performance Insights**: Automated performance trend analysis
- **Chatbot Enhancement**: Multi-language support

### Phase 2: Mobile Application

- **React Native App**: Native mobile experience
- **Offline Capabilities**: Sync when connection restored
- **Push Notifications**: Real-time mobile notifications
- **Biometric Authentication**: Fingerprint/Face ID login

### Phase 3: Advanced Integrations

- **ERP Integration**: SAP, Oracle, Microsoft Dynamics
- **Payroll Systems**: ADP, Paychex, QuickBooks
- **Communication Tools**: Slack, Microsoft Teams
- **Calendar Integration**: Google Calendar, Outlook

### Phase 4: Advanced Analytics

- **Business Intelligence**: Advanced reporting dashboard
- **Machine Learning**: Custom ML models for HR insights
- **Predictive Modeling**: Workforce planning and forecasting
- **Real-time Dashboards**: Live HR metrics and KPIs

### Phase 5: Enterprise Features

- **Multi-tenancy**: Support for multiple organizations
- **Advanced Security**: SSO, LDAP, SAML integration
- **Compliance Tools**: GDPR, SOX, HIPAA compliance
- **Workflow Automation**: Custom business process automation

---

## Conclusion

The FWC HRMS Technical Design Document outlines a comprehensive, scalable, and maintainable Human Resource Management System. The architecture leverages modern technologies and best practices to deliver a robust solution that can grow with organizational needs.

### Key Strengths

- **Modern Architecture**: Microservices-based design with clear separation of concerns
- **Scalable Technology Stack**: Proven technologies with excellent community support
- **Comprehensive Security**: Multi-layered security approach with industry best practices
- **AI Integration**: Forward-thinking AI features for enhanced user experience
- **Testing Strategy**: Comprehensive testing approach ensuring code quality
- **Performance Optimization**: Multiple optimization strategies for optimal performance

### Implementation Timeline

- **Phase 1**: Core HR functionality (3-4 months)
- **Phase 2**: AI features and advanced modules (2-3 months)
- **Phase 3**: Testing, optimization, and deployment (1-2 months)
- **Phase 4**: Future enhancements (ongoing)

This technical design provides a solid foundation for building a world-class HR management system that will serve organizations effectively while maintaining high standards of security, performance, and user experience.

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Prepared By**: FWC Development Team  
**Review Status**: Approved for Implementation
