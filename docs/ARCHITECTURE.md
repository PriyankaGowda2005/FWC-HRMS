# FWC HRMS Architecture

## System Overview

The FWC HR Management System is built as a modern, scalable monorepo with microservices architecture.

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET/USERS                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                       │
│                  ┌─────────────────────┐                       │
│                  │  SSL Termination   │                       │
│                  │  Load Balancing    │                       │
│                  │  Static Files      │                       │
│                  └─────────────────────┘                       │
└─────┬───────────────┬───────────────┬─────────────────────────┘
      │               │               │
      ▼               ▼               ▼
┌───────────┐ ┌──────────────┐ ┌─────────────────┐
│  Frontend │ │   Backend   │ │   ML Service    │
│ (React)   │ │  (Node.js)  │ │   (FastAPI)     │
│           │ │             │ │                 │
│ - Vite    │ │ - Express   │ │ - Resume Parser │
│ - Tailwind│ │ - Prisma    │ │ - Analytics     │
│ - SPA     │ │ - JWT Auth  │ │ - Predictions  │
└───────────┘ └─────┬───────┘ └─────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌───────────┐ ┌───────────┐
│   MongoDB   │ │   Redis   │ │   Files   │
│             │ │           │ │           │
│ - Users     │ │ - BullMQ  │ │ - Storage │
│ - Employees │ │ - Sessions│ │ - Uploads │
│ - HR Data   │ │ - Cache   │ │ - Reports │
└─────────────┘ └───────────┘ └───────────┘
```

## 🔧 Component Details

### 1. Frontend (React + Vite)

**Location**: `apps/frontend/`

**Technologies:**

- React 18 with hooks and functional components
- Vite for fast development and building
- Tailwind CSS for styling
- React Router for navigation
- React Query for state management
- Axios for API communication

**Key Features:**

- Role-based routing (Admin/Employee dashboards)
- JWT token management
- Responsive design
- Toast notifications
- Protected routes

### 2. Backend (Node.js + Express)

**Location**: `apps/backend/`

**Technologies:**

- Node.js with Express.js framework
- Prisma ORM with MongoDB
- JWT authentication with refresh tokens
- Bcrypt for password hashing
- Helmet for security headers
- Express Rate Limiting
- Multer for file uploads
- BullMQ for background jobs

**Key Features:**

- RESTful API design
- Role-based access control
- Input validation with Zod
- Comprehensive error handling
- Background job processing
- File upload handling

### 3. ML Service (FastAPI)

**Location**: `services/ml/`

**Technologies:**

- FastAPI framework
- Python 3.11+
- Pydantic for validation
- HTTP client integration

**Key Features:**

- Resume parsing and analysis
- Skills extraction
- Role matching algorithms
- Interview scoring
- Performance predictions

### 4. Database Layer

#### MongoDB

- **Collections:**
  - `users` - Authentication and user data
  - `employees` - HR-specific employee information
  - `departments` - Organizational structure
  - `attendance` - Time tracking
  - `payroll` - Salary and payments
  - `leaveRequests` - Time off management
  - `jobPostings` - Job listings
  - `candidates` - Applicant tracking
  - `interviews` - Interview scheduling
  - `performanceReviews` - Performance evaluations

#### Redis

- **Use Cases:**
  - BullMQ job queues
  - Session storage
  - Caching frequently accessed data
  - Rate limiting tokens

## 🔄 Data Flow

### Authentication Flow

```
User Login → Frontend → Backend API → Prisma → MongoDB
           ← JWT Token ← Password Check ← User Data ←
```

### File Upload Flow

```
User Upload → Frontend → Backend (Multer) → Redis Queue → ML Service
           ← Success ← Processing Status ← Job Status ← Analysis
```

### Background Job Flow

```
API Request → Redis Queue → Job Worker → File Processing/Email
           ← Job Status ← Database Update ← Processing Result
```

## 🚀 Deployment Architecture

### Development Environment

```
Local Development:
├── Frontend (Vite Dev Server) → localhost:5173
├── Backend (Node.js) → localhost:3001
├── ML Service (FastAPI) → localhost:8000
├── MongoDB (Docker) → localhost:27017
└── Redis (Docker) → localhost:6379
```

### Production Environment

```
Production Deployment:
├── Nginx (Load Balancer) → https://domain.com
├── Frontend (Static Files) → CDN/Vercel
├── Backend (Docker Container) → Railway/Render
├── ML Service (Docker Container) → Railway
├── MongoDB (Managed Database) → MongoDB Atlas
└── Redis (Managed Cache) → Redis Cloud
```

## 🔐 Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Access (15m) + Refresh (7d)
- **HTTP-Only Cookies**: Secure token storage
- **Role-Based Access Control**: 5 roles (Admin, HR, Manager, Employee, Candidate)
- **Rate Limiting**: Different limits per endpoint type

### Data Protection

- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM
- **XSS Protection**: React Helmet + Content Security Policy
- **File Upload Security**: Type validation + size limits + virus scanning

### Infrastructure Security

- **Environment Variables**: Secure configuration management
- **HTTPS**: SSL/TLS encryption
- **Security Headers**: Comprehensive HTTP security headers
- **Network Isolation**: Docker networks with restricted access

## 📊 Monitoring & Observability

### Logging

- **Application Logs**: Structured logging with timestamps
- **Audit Logs**: User action tracking
- **Error Logs**: Exception tracking and alerting
- **Performance Logs**: API response times and database queries

### Health Checks

- **API Health**: `/health` endpoint with detailed status
- **Database Health**: Connection status and query performance
- **Queue Health**: Redis status and job processing metrics
- **File Storage**: Upload directory accessibility

### Metrics

- **User Metrics**: Registration, login, activity patterns
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: Applications, interviews, hires
- **Performance Metrics**: Response times, error rates

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```
Code Push → Tests → Security Scan → Build Docker → Deploy → Notify
```

**Pipeline Stages:**

1. **Test**: Backend tests, frontend build, linting
2. **Security**: Vulnerability scanning, dependency audit
3. **Build**: Docker images for all services
4. **Deploy**: Automatic deployment to production
5. **Notify**: Status notifications

### Deployment Strategy

- **Blue-Green**: Zero-downtime deployments
- **Rolling Updates**: Gradual service updates
- **Health Checks**: Automated health verification
- **Rollback**: Quick reversion on failure

## 🌟 Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: No server-side sessions
- **Database Sharding**: MongoDB horizontal scaling
- **Load Balancing**: Multiple service instances
- **CDN Integration**: Static asset distribution

### Performance Optimization

- **Database Indexing**: Optimized queries
- **Caching Strategy**: Redis caching layer
- **Connection Pooling**: Database connection management
- **File Storage**: Efficient file handling

### Future Enhancements

- **Microservices**: Additional specialized services
- **Event Streaming**: Real-time data processing
- **Machine Learning**: Advanced AI capabilities
- **Mobile App**: Native mobile application

## 📁 Directory Structure

```
fwc-hrms/
├── apps/
│   ├── backend/              # Node.js API server
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── middleware/  # Auth, validation, error handling
│   │   │   ├── utils/      # Utility functions and job handlers
│   │   │   └── tests/      # Jest test suites
│   │   ├── prisma/         # Database schema and migrations
│   │   └── Dockerfile      # Container configuration
│   │
│   └── frontend/           # React SPA
│       ├── src/
│       │   ├── components/ # Reusable UI components
│       │   ├── pages/      # Route-specific pages
│       │   ├── contexts/   # React context providers
│       │   └── services/   # HTTP client configurations
│       └── Dockerfile      # Container configuration
│
├── services/
│   └── ml/                 # FastAPI ML microservice
│       ├── main.py         # FastAPI application
│       ├── requirements.txt # Python dependencies
│       └── Dockerfile      # Container configuration
│
├── deploy/                 # Deployment configurations
│   └── setup.sh           # Production setup script
│
├── docs/                   # Documentation
│   └── ARCHITECTURE.md     # This file
│
├── .github/workflows/      # GitHub Actions CI/CD
│   └── deploy.yml          # Deployment pipeline
│
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md              # Project overview
```

This architecture provides a solid foundation for a scalable, secure, and maintainable HR Management System.
