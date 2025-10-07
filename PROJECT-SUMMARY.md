# FWC HRMS - AI-Powered Human Resource Management System

## 🚀 Project Overview

**FWC HRMS** is a next-generation Human Resource Management System that leverages artificial intelligence to streamline and automate HR operations for modern workplaces. Built for hackathon competition with the theme "Build the Future of HR Management with AI-Powered Solutions".

## ✨ Key Features Implemented

### 🤖 AI-Powered Features

- **Advanced Resume Screening**: AI-driven resume analysis with skill extraction, experience evaluation, and job fit scoring
- **AI Interview Chatbot**: Automated interview sessions with real-time question generation and answer evaluation
- **Performance Prediction**: ML models for predicting employee performance, retention risk, and salary optimization
- **Sentiment Analysis**: AI-powered analysis of employee feedback and communication

### 👥 Multi-Role Authentication System

- **Admin**: Full system access with user management and system settings
- **HR**: Employee management, recruitment, payroll, and performance tracking
- **Manager**: Team management, attendance oversight, and performance reviews
- **Employee**: Personal dashboard, attendance tracking, and leave management
- **Candidate**: Application submission and profile management

### 📊 Personalized Dashboards

- **Role-based Dashboards**: Tailored interfaces for each user type
- **Real-time Analytics**: Live data visualization and metrics
- **AI Insights**: Intelligent recommendations and predictions
- **Performance Metrics**: Comprehensive KPIs and progress tracking

### 🔧 Core HRMS Functionalities

- **Employee Data Management**: Complete employee lifecycle management
- **Attendance Tracking**: Real-time clock-in/out with geolocation
- **Leave Management**: Automated approval workflows
- **Payroll Processing**: Comprehensive salary and benefits management
- **Performance Reviews**: 360-degree feedback system
- **Recruitment Pipeline**: End-to-end hiring process management

### 📱 Mobile-First Design

- **Responsive UI/UX**: Optimized for all device sizes
- **Mobile Navigation**: Touch-friendly interface with swipe gestures
- **Progressive Web App**: Offline capabilities and app-like experience
- **Cross-Platform**: Works seamlessly on iOS, Android, and desktop

### ⚡ Scalability & Performance

- **5000+ Employee Support**: Optimized for large organizations
- **Real-time Processing**: WebSocket connections for live updates
- **Caching Strategy**: Redis-based caching for improved performance
- **Background Jobs**: Queue-based processing for heavy operations
- **Database Optimization**: Connection pooling and query optimization

## 🏗️ Technical Architecture

### Backend Stack

- **Node.js** with Express.js framework
- **Prisma ORM** with MongoDB database
- **Redis** for caching and session management
- **BullMQ** for background job processing
- **JWT** authentication with role-based access control
- **Multer** for file uploads
- **Express Rate Limiting** for security

### Frontend Stack

- **React 18** with modern hooks
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Tailwind CSS** for styling
- **React Hot Toast** for notifications
- **Axios** for API communication

### AI/ML Services

- **Python FastAPI** for ML microservices
- **Advanced Resume Parser** with NLP capabilities
- **AI Interview Chatbot** with conversation management
- **Machine Learning Models** for predictions and analytics

### Infrastructure

- **Docker** containerization
- **Docker Compose** for local development
- **Nginx** for reverse proxy and static file serving
- **MongoDB** for primary data storage
- **Redis** for caching and sessions

## 📁 Project Structure

```
FWC-HRMS/
├── apps/
│   ├── backend/                 # Node.js API server
│   │   ├── src/
│   │   │   ├── middleware/      # Authentication, validation, file upload
│   │   │   ├── routes/          # API endpoints
│   │   │   ├── utils/           # Background jobs and utilities
│   │   │   └── server.js         # Main server file
│   │   ├── prisma/              # Database schema
│   │   └── uploads/             # File storage
│   └── frontend/                # React application
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── pages/           # Page components
│       │   ├── contexts/        # React contexts
│       │   └── services/        # API services
│       └── public/              # Static assets
├── services/
│   └── ml/                      # AI/ML microservices
│       ├── advanced_resume_parser.py
│       ├── chatbot_interviewer.py
│       └── main.py
├── mobile-app/                  # React Native mobile app
├── docs/                        # Documentation
└── scripts/                     # Deployment and utility scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- MongoDB
- Redis
- Docker (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd FWC-HRMS
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd apps/backend && npm install
   cd ../frontend && npm install
   cd ../../services/ml && pip install -r requirements.txt
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   cp apps/backend/env.example apps/backend/.env
   ```

4. **Database Setup**

   ```bash
   cd apps/backend
   npx prisma generate
   npx prisma db push
   ```

5. **Start Services**

   ```bash
   # Start all services
   npm run dev

   # Or start individually
   npm run dev:backend    # Backend API
   npm run dev:frontend   # Frontend React app
   cd services/ml && python main.py  # AI services
   ```

### Docker Deployment

```bash
docker-compose up -d
```

## 🔐 Authentication & Authorization

### User Roles

- **ADMIN**: Full system access, user management, system settings
- **HR**: Employee management, recruitment, payroll, performance
- **MANAGER**: Team oversight, attendance, performance reviews
- **EMPLOYEE**: Personal data, attendance, leave requests
- **CANDIDATE**: Application submission, profile management

### Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting for API endpoints
- Input validation and sanitization
- File upload security
- Audit logging for sensitive operations

## 🤖 AI Features Deep Dive

### Resume Analysis

- **Skill Extraction**: Identifies technical and soft skills
- **Experience Evaluation**: Analyzes work history and progression
- **Job Fit Scoring**: Calculates compatibility with job requirements
- **Confidence Metrics**: Provides reliability scores for analysis

### AI Interview System

- **Dynamic Question Generation**: Role-specific interview questions
- **Real-time Evaluation**: Instant feedback and scoring
- **Multi-dimensional Assessment**: Technical, communication, problem-solving
- **Session Management**: Persistent interview sessions

### Predictive Analytics

- **Performance Prediction**: Forecasts employee performance
- **Retention Risk Analysis**: Identifies at-risk employees
- **Salary Optimization**: Recommends competitive compensation
- **Workload Analysis**: Suggests optimal task distribution

## 📊 Dashboard Features

### Admin Dashboard

- System-wide analytics and metrics
- User management and role assignment
- System health monitoring
- Performance insights across departments

### HR Dashboard

- Recruitment pipeline management
- Employee lifecycle tracking
- Payroll and benefits administration
- Performance review coordination

### Manager Dashboard

- Team performance metrics
- Attendance and leave oversight
- Performance review management
- AI-powered team insights

### Employee Dashboard

- Personal attendance tracking
- Leave balance and requests
- Performance goals and reviews
- Personal development tracking

## 📱 Mobile Features

### Responsive Design

- Mobile-first approach
- Touch-optimized interface
- Swipe gestures and mobile navigation
- Progressive Web App capabilities

### Mobile-Specific Features

- Quick attendance check-in/out
- Mobile-optimized forms
- Push notifications (future enhancement)
- Offline data synchronization

## 🔧 API Documentation

### Core Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/employees` - Employee management
- `POST /api/attendance/clock-in-out` - Attendance tracking
- `GET /api/leave-requests` - Leave management
- `POST /api/payroll/generate` - Payroll processing
- `GET /api/performance-reviews` - Performance management

### AI Endpoints

- `POST /api/ai/resume/analyze` - Resume analysis
- `POST /api/ai/interview/start` - Start AI interview
- `POST /api/ai/interview/answer` - Submit interview answers
- `GET /api/ai/services/status` - AI services health check

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**

   ```bash
   NODE_ENV=production
   DATABASE_URL=mongodb://your-mongo-url
   REDIS_URL=redis://your-redis-url
   JWT_SECRET=your-secret-key
   ```

2. **Build Applications**

   ```bash
   npm run build:frontend
   npm run build:backend
   ```

3. **Docker Deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Scaling Considerations

- Horizontal scaling with load balancers
- Database sharding for large datasets
- Redis clustering for high availability
- CDN for static asset delivery

## 🔮 Future Enhancements

### Planned Features

- **Voice Recognition**: Voice-based attendance and commands
- **Advanced Analytics**: Machine learning insights and predictions
- **Integration APIs**: Third-party HR tool integrations
- **Mobile App**: Native iOS and Android applications
- **Advanced Reporting**: Custom report builder
- **Workflow Automation**: Visual workflow designer

### AI Improvements

- **Natural Language Processing**: Advanced text analysis
- **Computer Vision**: Document and image processing
- **Predictive Modeling**: Advanced ML algorithms
- **Chatbot Integration**: Multi-channel support

## 📈 Performance Metrics

### Scalability Targets

- **Concurrent Users**: 5,000+ simultaneous users
- **Response Time**: <200ms for API calls
- **Database**: Handles 1M+ records efficiently
- **File Storage**: Supports large file uploads
- **Real-time Updates**: WebSocket connections for live data

### Monitoring

- Application performance monitoring
- Database query optimization
- Cache hit ratio tracking
- Error rate monitoring
- User engagement analytics

## 🤝 Contributing

### Development Guidelines

1. Follow the existing code structure
2. Write comprehensive tests
3. Document new features
4. Follow security best practices
5. Maintain responsive design principles

### Code Standards

- ESLint configuration for JavaScript
- Prettier for code formatting
- TypeScript for type safety (future)
- Comprehensive error handling
- Input validation and sanitization

## 📄 License

This project is proprietary software developed for FWC IT Services Pvt. Ltd. All rights reserved.

## 👥 Team

- **Backend Development**: Node.js, Express.js, Prisma
- **Frontend Development**: React, Tailwind CSS
- **AI/ML Development**: Python, FastAPI, Machine Learning
- **DevOps**: Docker, MongoDB, Redis
- **UI/UX Design**: Responsive design, mobile optimization

## 📞 Support

For technical support or questions about the system:

- Email: support@fwcit.com
- Documentation: `/docs` directory
- API Reference: Available at `/api/docs` when running

---

**Built with ❤️ for the Future of HR Management**
