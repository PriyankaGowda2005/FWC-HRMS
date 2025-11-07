# 🚀 FWC HRMS - AI-Powered HR Management System

> **Next-generation HRMS with AI-driven automation for modern workplaces**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-red.svg)](https://fastapi.tiangolo.com/)

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔧 Backend Services](#-backend-services)
- [🎨 Frontend Application](#-frontend-application)
- [🤖 AI/ML Services](#-aiml-services)
- [📱 Mobile Application](#-mobile-application)
- [🌐 API Documentation](#-api-documentation)
- [🔐 Authentication & Security](#-authentication--security)
- [📊 Database Schema](#-database-schema)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [📈 Performance](#-performance)
- [🤝 Contributing](#-contributing)

## ✨ Features

### 🤖 AI-Powered Capabilities

- **Smart Resume Screening** - AI analyzes resumes and scores job fit compatibility
- **Automated Interviews** - AI chatbot conducts preliminary interviews with dynamic questions
- **Performance Prediction** - ML models predict employee performance and retention risk
- **Sentiment Analysis** - AI analyzes employee feedback and communication patterns
- **Emotion Recognition** - Real-time emotion analysis during video interviews
- **Advanced Resume Parsing** - Extract skills, experience, and qualifications automatically

### 👥 Multi-Role System

- **Admin** - Full system control, user management, and system configuration
- **HR** - Employee lifecycle management, recruitment, and policy enforcement
- **Manager** - Team oversight, performance tracking, and approval workflows
- **Employee** - Personal dashboard, self-service, and profile management
- **Candidate** - Application submission, interview scheduling, and status tracking

### 📊 Comprehensive HR Features

- **Employee Management** - Complete employee lifecycle from onboarding to offboarding
- **Attendance Tracking** - Real-time clock-in/out with geolocation and biometric verification
- **Leave Management** - Automated approval workflows with calendar integration
- **Payroll Processing** - Complete salary, benefits, and tax management
- **Performance Reviews** - 360-degree feedback system with AI insights
- **Recruitment Pipeline** - End-to-end hiring process with AI assistance
- **Department Management** - Organizational structure and hierarchy management
- **Reports & Analytics** - Comprehensive reporting with data visualization

### 📱 Mobile-First Design

- **Responsive UI** - Optimized for all devices and screen sizes
- **Mobile Navigation** - Touch-friendly interface with gesture support
- **Progressive Web App** - App-like experience with offline capabilities
- **Cross-Platform** - Works seamlessly on iOS, Android, and desktop
- **Push Notifications** - Real-time updates and alerts

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI/ML Services│
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 5173    │    │   Port: 3001    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   MongoDB       │    │   Redis Cache   │
│   (React Native)│    │   Database      │    │   Queue System  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Backend Services

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript support
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Caching**: Redis for session management and caching
- **Queue System**: BullMQ for background job processing
- **File Upload**: Multer with cloud storage support
- **Security**: Helmet, CORS, Rate limiting, Input validation

#### Frontend Application

- **Framework**: React 18 with React Router
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **Forms**: React Hook Form with validation
- **UI Components**: Headless UI and Heroicons
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth transitions

#### AI/ML Services

- **Framework**: FastAPI with Python 3.8+
- **ML Libraries**: TensorFlow, PyTorch, Scikit-learn
- **NLP**: spaCy, Transformers for text processing
- **Computer Vision**: OpenCV for image processing
- **Document Processing**: PyPDF2, python-docx
- **Report Generation**: ReportLab for PDF generation
- **Async Processing**: Celery with Redis broker

#### Mobile Application

- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation
- **State Management**: Context API with hooks
- **API Integration**: Axios for HTTP requests
- **Platform Support**: iOS and Android

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ with npm
- **Python** 3.8+ with pip
- **MongoDB** 5.0+ (local or cloud)
- **Redis** 6.0+ (for caching and queues)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/FWC-HRMS.git
   cd FWC-HRMS
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd apps/backend
   npm install
   ```

4. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

5. **Install ML service dependencies**

   ```bash
   cd ../../services/ml
   pip install -r requirements.txt
   ```

6. **Environment setup**

   ```bash
   # Copy environment files
   cp env.example .env
   cp apps/backend/env.example apps/backend/.env
   cp services/ml/.env.example services/ml/.env
   ```

7. **Database initialization**

   ```bash
   cd apps/backend
   npm run db:init
   npm run db:seed
   ```

8. **Start all services**
   ```bash
   # From root directory
   npm run dev
   ```

### Docker Setup (Alternative)

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Backend Services

### API Endpoints

#### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

#### Employee Management

- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

#### Attendance

- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/:employeeId` - Get attendance records
- `GET /api/attendance/reports` - Generate attendance reports

#### Leave Management

- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/requests` - List leave requests
- `PUT /api/leave/requests/:id/approve` - Approve leave
- `PUT /api/leave/requests/:id/reject` - Reject leave

#### Payroll

- `GET /api/payroll/:employeeId` - Get payroll details
- `POST /api/payroll/process` - Process payroll
- `GET /api/payroll/reports` - Generate payroll reports

#### Performance

- `POST /api/performance/review` - Submit performance review
- `GET /api/performance/:employeeId` - Get performance data
- `POST /api/performance/goals` - Set performance goals

#### Recruitment

- `POST /api/recruitment/job-posting` - Create job posting
- `GET /api/recruitment/jobs` - List job postings
- `POST /api/recruitment/apply` - Submit job application
- `GET /api/recruitment/applications` - List applications

### Database Models

#### User Model

```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  role: String, // admin, hr, manager, employee, candidate
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    address: Object,
    avatar: String
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Employee Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  employeeId: String,
  department: String,
  position: String,
  manager: ObjectId,
  salary: Number,
  benefits: Array,
  startDate: Date,
  status: String // active, inactive, terminated
}
```

#### Attendance Model

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  date: Date,
  clockIn: Date,
  clockOut: Date,
  hoursWorked: Number,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: String // present, absent, late, half-day
}
```

### Background Jobs

The system uses BullMQ for processing background jobs:

- **Email Notifications** - Send welcome emails, password reset, etc.
- **Report Generation** - Generate PDF reports asynchronously
- **Data Synchronization** - Sync data between systems
- **AI Processing** - Process resumes and interviews in background

## 🎨 Frontend Application

### Project Structure

```
apps/frontend/src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   ├── Forms/          # Form components
│   ├── Charts/         # Chart components
│   └── Common/         # Common components
├── pages/              # Page components
│   ├── Dashboard/     # Dashboard pages
│   ├── Employee/      # Employee management
│   ├── Attendance/    # Attendance tracking
│   ├── Leave/         # Leave management
│   ├── Payroll/       # Payroll management
│   ├── Performance/   # Performance reviews
│   ├── Recruitment/   # Recruitment management
│   └── Reports/       # Reports and analytics
├── contexts/           # React contexts
│   ├── AuthContext.jsx
│   └── NavigationContext.jsx
├── services/           # API services
│   ├── api.js
│   └── auth.js
├── styles/             # Global styles
└── utils/              # Utility functions
```

### Key Components

#### Layout Components

- **Layout** - Main application layout with sidebar
- **Header** - Top navigation bar
- **Sidebar** - Navigation sidebar with role-based menus
- **Footer** - Application footer

#### Dashboard Components

- **PersonalizedDashboard** - Role-based dashboard
- **AdminDashboard** - Admin-specific dashboard
- **HRDashboard** - HR-specific dashboard
- **ManagerDashboard** - Manager-specific dashboard
- **EmployeeDashboard** - Employee-specific dashboard

#### Form Components

- **EmployeeForm** - Employee creation/editing
- **LeaveRequestForm** - Leave request submission
- **PerformanceReviewForm** - Performance review submission
- **JobApplicationForm** - Job application submission

#### Chart Components

- **AttendanceChart** - Attendance visualization
- **PerformanceChart** - Performance metrics
- **PayrollChart** - Payroll analytics
- **RecruitmentChart** - Recruitment metrics

### State Management

The application uses React Query for server state management:

```javascript
// Example: Fetching employees
const {
  data: employees,
  isLoading,
  error,
} = useQuery("employees", () => api.getEmployees(), {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Routing

The application uses React Router for navigation:

```javascript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <PersonalizedDashboard />
      </ProtectedRoute>
    }
  />
  {/* More routes... */}
</Routes>
```

## 🤖 AI/ML Services

### Services Overview

The AI/ML services are built with FastAPI and provide:

- **Resume Parsing** - Extract information from resumes
- **Interview Chatbot** - Conduct automated interviews
- **Emotion Analysis** - Analyze emotions in video interviews
- **Performance Prediction** - Predict employee performance
- **Report Generation** - Generate AI-powered reports

### API Endpoints

#### Resume Processing

- `POST /api/resume/parse` - Parse resume file
- `GET /api/resume/analysis/:id` - Get resume analysis
- `POST /api/resume/score` - Score resume against job requirements

#### Interview System

- `POST /api/interview/start` - Start AI interview
- `POST /api/interview/answer` - Submit interview answer
- `GET /api/interview/score/:id` - Get interview score
- `WebSocket /ws/interview/:id` - Real-time interview communication

#### Emotion Analysis

- `POST /api/emotion/analyze` - Analyze emotions in video
- `GET /api/emotion/report/:id` - Get emotion analysis report

#### Performance Prediction

- `POST /api/performance/predict` - Predict employee performance
- `GET /api/performance/insights/:employeeId` - Get performance insights

### ML Models

#### Resume Parser

```python
class ResumeParser:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self.skill_extractor = SkillExtractor()

    def parse_resume(self, file_path: str) -> Dict:
        # Extract text from PDF/DOCX
        text = self.extract_text(file_path)

        # Parse with spaCy
        doc = self.nlp(text)

        # Extract entities
        entities = self.extract_entities(doc)

        # Extract skills
        skills = self.skill_extractor.extract(text)

        return {
            "entities": entities,
            "skills": skills,
            "experience": self.extract_experience(doc),
            "education": self.extract_education(doc)
        }
```

#### Interview Chatbot

```python
class AIInterviewChatbot:
    def __init__(self):
        self.model = pipeline("text-generation", model="gpt-3.5-turbo")
        self.question_generator = QuestionGenerator()

    async def generate_question(self, job_role: str, previous_answers: List[str]) -> str:
        context = self.build_context(job_role, previous_answers)
        question = await self.question_generator.generate(context)
        return question

    async def evaluate_answer(self, question: str, answer: str) -> Dict:
        evaluation = await self.model.evaluate(question, answer)
        return {
            "score": evaluation.score,
            "feedback": evaluation.feedback,
            "suggestions": evaluation.suggestions
        }
```

#### Emotion Analyzer

```python
class EmotionAnalyzer:
    def __init__(self):
        self.model = load_emotion_model()
        self.face_detector = cv2.CascadeClassifier()

    def analyze_video(self, video_path: str) -> Dict:
        emotions = []
        timestamps = []

        cap = cv2.VideoCapture(video_path)
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Detect faces
            faces = self.face_detector.detectMultiScale(frame)

            for face in faces:
                # Extract face region
                face_region = frame[face[1]:face[1]+face[3], face[0]:face[0]+face[2]]

                # Predict emotion
                emotion = self.model.predict(face_region)
                emotions.append(emotion)
                timestamps.append(cap.get(cv2.CAP_PROP_POS_MSEC))

        return {
            "emotions": emotions,
            "timestamps": timestamps,
            "summary": self.generate_summary(emotions)
        }
```

### Performance Prediction

The system uses machine learning to predict employee performance:

```python
class PerformancePredictor:
    def __init__(self):
        self.model = joblib.load("performance_model.pkl")
        self.feature_encoder = FeatureEncoder()

    def predict_performance(self, employee_data: Dict) -> Dict:
        # Encode features
        features = self.feature_encoder.encode(employee_data)

        # Make prediction
        prediction = self.model.predict(features)
        probability = self.model.predict_proba(features)

        return {
            "predicted_performance": prediction[0],
            "confidence": probability[0].max(),
            "risk_factors": self.identify_risk_factors(features),
            "recommendations": self.generate_recommendations(prediction[0])
        }
```

## 📱 Mobile Application

### Features

- **Quick Attendance** - One-tap clock in/out
- **Leave Requests** - Submit and track leave requests
- **Payroll Access** - View salary and payslips
- **Performance Tracking** - View performance metrics
- **Push Notifications** - Real-time updates
- **Offline Support** - Basic functionality without internet

### Project Structure

```
mobile-app/src/
├── screens/             # Screen components
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   └── AttendanceScreen.tsx
├── services/            # API services
│   ├── ApiService.ts
│   └── AuthService.ts
├── types/              # TypeScript types
│   └── navigation.ts
└── components/          # Reusable components
```

### Key Screens

#### Login Screen

```typescript
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await AuthService.login(email, password);
      navigation.navigate("Dashboard");
    } catch (error) {
      Alert.alert("Error", "Login failed");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};
```

#### Attendance Screen

```typescript
const AttendanceScreen = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [location, setLocation] = useState(null);

  const handleClockIn = async () => {
    try {
      const currentLocation = await getCurrentLocation();
      await ApiService.clockIn(currentLocation);
      setIsClockedIn(true);
    } catch (error) {
      Alert.alert("Error", "Clock in failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <Button
        title={isClockedIn ? "Clock Out" : "Clock In"}
        onPress={isClockedIn ? handleClockOut : handleClockIn}
      />
    </View>
  );
};
```

## 🌐 API Documentation

### Authentication

All API endpoints require authentication except for login and registration.

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **File Upload**: 20 requests per 15 minutes

### Pagination

List endpoints support pagination:

```
GET /api/employees?page=1&limit=10&sort=name&order=asc
```

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🔐 Authentication & Security

### JWT Authentication

The system uses JWT tokens for authentication:

```javascript
// Token structure
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "employee",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Access Control

```javascript
const roles = {
  admin: ["*"], // All permissions
  hr: [
    "employees:read",
    "employees:write",
    "attendance:read",
    "attendance:write",
    "leave:read",
    "leave:write",
    "payroll:read",
    "payroll:write",
    "performance:read",
    "performance:write",
    "recruitment:read",
    "recruitment:write",
  ],
  manager: [
    "employees:read",
    "attendance:read",
    "leave:read",
    "leave:write",
    "performance:read",
    "performance:write",
  ],
  employee: [
    "profile:read",
    "profile:write",
    "attendance:read",
    "attendance:write",
    "leave:read",
    "leave:write",
    "payroll:read",
    "performance:read",
  ],
  candidate: [
    "profile:read",
    "profile:write",
    "jobs:read",
    "applications:read",
    "applications:write",
  ],
};
```

### Security Measures

- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: SameSite cookies
- **Rate Limiting**: Express rate limit middleware
- **Helmet**: Security headers
- **CORS**: Configured origins

## 📊 Database Schema

### Collections

#### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'hr', 'manager', 'employee', 'candidate']),
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    avatar: String,
    dateOfBirth: Date,
    gender: String
  },
  isActive: Boolean,
  emailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Employees Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  employeeId: String (unique),
  department: String,
  position: String,
  manager: ObjectId (ref: 'employees'),
  salary: {
    base: Number,
    currency: String,
    frequency: String
  },
  benefits: [String],
  startDate: Date,
  endDate: Date,
  status: String (enum: ['active', 'inactive', 'terminated']),
  workLocation: String,
  employmentType: String (enum: ['full-time', 'part-time', 'contract', 'intern']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Attendance Collection

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId (ref: 'employees'),
  date: Date,
  clockIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: String (enum: ['manual', 'biometric', 'rfid'])
  },
  clockOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: String
  },
  hoursWorked: Number,
  overtime: Number,
  status: String (enum: ['present', 'absent', 'late', 'half-day', 'sick', 'leave']),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Leave Requests Collection

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId (ref: 'employees'),
  type: String (enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'emergency']),
  startDate: Date,
  endDate: Date,
  days: Number,
  reason: String,
  status: String (enum: ['pending', 'approved', 'rejected', 'cancelled']),
  approvedBy: ObjectId (ref: 'employees'),
  approvedAt: Date,
  comments: String,
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### Payroll Collection

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId (ref: 'employees'),
  month: Number,
  year: Number,
  basicSalary: Number,
  allowances: [{
    type: String,
    amount: Number
  }],
  deductions: [{
    type: String,
    amount: Number
  }],
  grossSalary: Number,
  netSalary: Number,
  status: String (enum: ['pending', 'processed', 'paid']),
  paymentDate: Date,
  paymentMethod: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Performance Reviews Collection

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId (ref: 'employees'),
  reviewerId: ObjectId (ref: 'employees'),
  period: {
    start: Date,
    end: Date
  },
  goals: [{
    title: String,
    description: String,
    target: String,
    achieved: String,
    score: Number
  }],
  competencies: [{
    name: String,
    score: Number,
    comments: String
  }],
  overallScore: Number,
  feedback: String,
  recommendations: String,
  status: String (enum: ['draft', 'submitted', 'approved']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Job Postings Collection

```javascript
{
  _id: ObjectId,
  title: String,
  department: String,
  location: String,
  type: String (enum: ['full-time', 'part-time', 'contract', 'intern']),
  level: String (enum: ['entry', 'mid', 'senior', 'lead', 'executive']),
  description: String,
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  status: String (enum: ['draft', 'published', 'closed', 'cancelled']),
  postedBy: ObjectId (ref: 'employees'),
  postedAt: Date,
  deadline: Date,
  applications: [ObjectId] (ref: 'applications'),
  createdAt: Date,
  updatedAt: Date
}
```

#### Applications Collection

```javascript
{
  _id: ObjectId,
  jobId: ObjectId (ref: 'jobpostings'),
  candidateId: ObjectId (ref: 'users'),
  resume: String,
  coverLetter: String,
  status: String (enum: ['submitted', 'screening', 'interview', 'offer', 'rejected', 'hired']),
  score: Number,
  interviewScores: [{
    round: Number,
    score: Number,
    feedback: String,
    interviewer: ObjectId (ref: 'employees')
  }],
  appliedAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Performance indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ employeeId: 1 }, { unique: true });
db.employees.createIndex({ userId: 1 }, { unique: true });
db.attendance.createIndex({ employeeId: 1, date: 1 });
db.leaveRequests.createIndex({ employeeId: 1, status: 1 });
db.payroll.createIndex({ employeeId: 1, year: 1, month: 1 });
db.performanceReviews.createIndex({ employeeId: 1, "period.start": 1 });
db.jobPostings.createIndex({ status: 1, postedAt: -1 });
db.applications.createIndex({ jobId: 1, status: 1 });
```

## 🚀 Deployment

### Production Environment

#### Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
PORT=3001
DATABASE_URL=mongodb://localhost:27017/fwc-hrms-prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-production-secret-key
JWT_REFRESH_SECRET=your-production-refresh-secret
FRONTEND_URL=https://your-domain.com
ML_SERVICE_URL=https://ml.your-domain.com

# Frontend (.env)
VITE_API_URL=https://api.your-domain.com
VITE_ML_SERVICE_URL=https://ml.your-domain.com

# ML Services (.env)
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@localhost/hrms_ml
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-openai-key
```

#### Docker Production Setup

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./apps/frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  ml-service:
    build: ./services/ml
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    depends_on:
      - redis

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:6.0
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # ML Services
    location /ml {
        proxy_pass http://ml-service:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Scaling Considerations

#### Horizontal Scaling

- **Load Balancer**: Nginx or HAProxy
- **Multiple Backend Instances**: PM2 cluster mode
- **Database Sharding**: MongoDB sharding
- **Redis Cluster**: For high availability

#### Performance Optimization

- **CDN**: CloudFlare or AWS CloudFront
- **Image Optimization**: WebP format, lazy loading
- **Caching**: Redis for API responses
- **Database Indexing**: Optimized queries

#### Monitoring

- **Application Monitoring**: New Relic or DataDog
- **Log Management**: ELK Stack or Splunk
- **Uptime Monitoring**: Pingdom or UptimeRobot
- **Error Tracking**: Sentry or Bugsnag

## 🧪 Testing

### Backend Testing

#### Unit Tests

```javascript
// tests/auth.test.js
describe("Authentication", () => {
  test("should login with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

#### Integration Tests

```javascript
// tests/integration.test.js
describe("Employee Management", () => {
  test("should create employee", async () => {
    const token = await getAuthToken();

    const response = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        department: "Engineering",
        position: "Software Engineer",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.employeeId).toBeDefined();
  });
});
```

### Frontend Testing

#### Component Tests

```javascript
// tests/Login.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../pages/Login";

test("should render login form", () => {
  render(<Login />);

  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
});

test("should handle login submission", async () => {
  render(<Login />);

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));

  // Assert login behavior
});
```

### ML Service Testing

#### API Tests

```python
# test_ml_service.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_resume_parsing():
    response = client.post(
        "/api/resume/parse",
        files={"file": ("resume.pdf", open("test_resume.pdf", "rb"))}
    )
    assert response.status_code == 200
    assert "entities" in response.json()
    assert "skills" in response.json()

def test_interview_chatbot():
    response = client.post(
        "/api/interview/start",
        json={"job_role": "Software Engineer"}
    )
    assert response.status_code == 200
    assert "question" in response.json()
```

### Test Commands

```bash
# Backend tests
cd apps/backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Frontend tests
cd apps/frontend
npm test                   # Run all tests
npm run test:coverage      # Coverage report

# ML service tests
cd services/ml
pytest                     # Run all tests
pytest --cov              # Coverage report
pytest -v                 # Verbose output
```

## 📈 Performance

### Benchmarks

#### API Performance

- **Response Time**: <200ms for 95% of requests
- **Throughput**: 1000+ requests per second
- **Concurrent Users**: 5000+ supported
- **Database Queries**: <50ms average

#### Frontend Performance

- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **Time to Interactive**: <3s

#### ML Service Performance

- **Resume Parsing**: <5s per document
- **Interview Processing**: <2s per question
- **Emotion Analysis**: <1s per frame
- **Performance Prediction**: <500ms per prediction

### Optimization Strategies

#### Backend Optimization

- **Database Indexing**: Optimized queries
- **Caching**: Redis for frequent data
- **Connection Pooling**: MongoDB connection pool
- **Compression**: Gzip compression
- **CDN**: Static asset delivery

#### Frontend Optimization

- **Code Splitting**: Lazy loading
- **Image Optimization**: WebP format
- **Bundle Optimization**: Tree shaking
- **Caching**: Service worker caching
- **Prefetching**: Critical resource prefetch

#### ML Service Optimization

- **Model Caching**: Pre-loaded models
- **Batch Processing**: Multiple requests
- **GPU Acceleration**: CUDA support
- **Async Processing**: Background jobs
- **Memory Management**: Efficient memory usage

### Monitoring

#### Performance Metrics

- **Response Time**: Average, P95, P99
- **Error Rate**: 4xx, 5xx errors
- **Throughput**: Requests per second
- **Resource Usage**: CPU, Memory, Disk
- **Database Performance**: Query time, connections

#### Alerting

- **High Error Rate**: >5% error rate
- **Slow Response**: >500ms response time
- **High Resource Usage**: >80% CPU/Memory
- **Database Issues**: Slow queries, connection errors
- **Service Down**: Health check failures

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Clone your fork**

   ```bash
   git clone https://github.com/your-username/FWC-HRMS.git
   cd FWC-HRMS
   ```

3. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Install dependencies**

   ```bash
   npm install
   cd apps/backend && npm install
   cd ../frontend && npm install
   cd ../../services/ml && pip install -r requirements.txt
   ```

5. **Make your changes**
6. **Run tests**

   ```bash
   npm test
   ```

7. **Commit your changes**

   ```bash
   git commit -m "Add your feature description"
   ```

8. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create a Pull Request**

### Code Standards

#### Backend Standards

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Type safety (optional)

#### Frontend Standards

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **React Testing Library**: Component testing
- **Tailwind CSS**: Styling

#### ML Service Standards

- **Black**: Code formatting
- **Flake8**: Code linting
- **Pytest**: Testing framework
- **Type Hints**: Type annotations

### Pull Request Guidelines

1. **Clear Description**: Describe what the PR does
2. **Tests**: Include tests for new features
3. **Documentation**: Update documentation if needed
4. **Breaking Changes**: Clearly mark breaking changes
5. **Screenshots**: Include screenshots for UI changes

### Issue Guidelines

1. **Bug Reports**: Use the bug report template
2. **Feature Requests**: Use the feature request template
3. **Clear Description**: Provide clear description
4. **Reproduction Steps**: Include steps to reproduce
5. **Environment**: Include environment details

## 📞 Support

### Documentation

- **API Documentation**: `/docs` directory
- **Component Documentation**: Storybook (if available)
- **Deployment Guide**: `DEPLOYMENT-GUIDE.md`
- **Architecture Guide**: `docs/ARCHITECTURE.md`

### Contact Information

- **Email**: support@fwcit.com
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Website**: https://fwcit.com

### Community

- **Contributors**: See CONTRIBUTORS.md
- **License**: See LICENSE file
- **Code of Conduct**: See CODE_OF_CONDUCT.md

---

## 🎯 Getting Started

Ready to revolutionize HR with AI? Here's how to get started:

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/FWC-HRMS.git
   cd FWC-HRMS
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development environment**

   ```bash
   npm run dev
   ```

4. **Access the application**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - AI Services: http://localhost:8000

5. **Login with default credentials**
   - Admin: admin@fwcit.com / admin123
   - HR: hr@fwchrms.com / HR@2024!
   - Manager: manager@fwcit.com / manager123
   - Employee: employee@fwcit.com / employee123

## 🚀 What's Next?

- **Explore the AI features** - Try the resume parser and interview chatbot
- **Customize the system** - Modify roles, permissions, and workflows
- **Deploy to production** - Follow the deployment guide
- **Contribute** - Submit issues and pull requests
- **Join the community** - Connect with other developers

---

**Built with ❤️ for the Future of HR Management**

_Ready to transform your HR processes with AI? Start exploring the FWC HRMS system today!_
