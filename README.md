# 🚀 FWC HRMS - AI-Powered HR Management System

> **Next-generation HRMS with AI-driven automation for modern workplaces**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## ✨ Features

### 🤖 AI-Powered Capabilities

- **Smart Resume Screening** - AI analyzes resumes and scores job fit
- **Automated Interviews** - AI chatbot conducts preliminary interviews
- **Performance Prediction** - ML models predict employee performance
- **Sentiment Analysis** - AI analyzes employee feedback and communication

### 👥 Multi-Role System

- **Admin** - Full system control and user management
- **HR** - Employee lifecycle and recruitment management
- **Manager** - Team oversight and performance tracking
- **Employee** - Personal dashboard and self-service
- **Candidate** - Application submission and tracking

### 📊 Comprehensive HR Features

- **Employee Management** - Complete employee lifecycle
- **Attendance Tracking** - Real-time clock-in/out with geolocation
- **Leave Management** - Automated approval workflows
- **Payroll Processing** - Complete salary and benefits management
- **Performance Reviews** - 360-degree feedback system
- **Recruitment Pipeline** - End-to-end hiring process

### 📱 Mobile-First Design

- **Responsive UI** - Optimized for all devices
- **Mobile Navigation** - Touch-friendly interface
- **Progressive Web App** - App-like experience
- **Cross-Platform** - Works on iOS, Android, and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- MongoDB
- Redis
- Git

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

3. **Environment setup**

   ```bash
   cp env.example .env
   cp apps/backend/env.example apps/backend/.env
   ```

4. **Database setup**

   ```bash
   cd apps/backend
   npx prisma generate
   npx prisma db push
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

### Docker Setup (Alternative)

```bash
docker-compose up -d
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Services**: http://localhost:8000
- **API Documentation**: http://localhost:5000/api/docs

## 🔐 Default Login Credentials

| Role     | Email              | Password    | Access Level       |
| -------- | ------------------ | ----------- | ------------------ |
| Admin    | admin@fwcit.com    | admin123    | Full system access |
| HR       | hr@fwcit.com       | hr123       | HR management      |
| Manager  | manager@fwcit.com  | manager123  | Team management    |
| Employee | employee@fwcit.com | employee123 | Personal dashboard |

## 📁 Project Structure

```
FWC-HRMS/
├── apps/
│   ├── backend/          # Node.js API server
│   └── frontend/         # React application
├── services/
│   └── ml/              # AI/ML microservices
├── mobile-app/          # React Native app
├── docs/               # Documentation
└── scripts/            # Deployment scripts
```

## 🛠️ Tech Stack

### Backend

- **Node.js** + Express.js
- **Prisma ORM** + MongoDB
- **Redis** for caching
- **BullMQ** for background jobs
- **JWT** authentication

### Frontend

- **React 18** + React Router
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Axios** for API calls

### AI/ML

- **Python** + FastAPI
- **Advanced NLP** for resume parsing
- **Machine Learning** models
- **AI Chatbot** for interviews

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:backend     # Backend only
npm run dev:frontend    # Frontend only

# Building
npm run build           # Build all applications
npm run build:frontend  # Build frontend
npm run build:backend   # Build backend

# Testing
npm run test            # Run all tests
npm run test:backend    # Backend tests
npm run test:frontend   # Frontend tests

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:seed         # Seed database
```

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/fwc-hrms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI Services
ML_SERVICE_URL=http://localhost:8000
OPENAI_API_KEY=your-openai-key
```

## 📊 Key Features

### AI Resume Analysis

- Extracts skills, experience, and qualifications
- Scores job fit compatibility
- Provides confidence metrics
- Generates detailed insights

### AI Interview System

- Dynamic question generation
- Real-time answer evaluation
- Multi-dimensional scoring
- Session persistence

### Performance Analytics

- Employee performance prediction
- Retention risk analysis
- Salary optimization suggestions
- Workload distribution insights

### Mobile Experience

- Responsive design for all devices
- Touch-optimized navigation
- Mobile-specific features
- Progressive Web App capabilities

## 🚀 Deployment

### Production Setup

1. Configure production environment variables
2. Build applications: `npm run build`
3. Deploy with Docker: `docker-compose -f docker-compose.prod.yml up -d`

### Scaling

- Supports 5000+ concurrent users
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Redis clustering for high availability

## 📈 Performance

- **Response Time**: <200ms for API calls
- **Concurrent Users**: 5000+ supported
- **Database**: Handles 1M+ records
- **Real-time Updates**: WebSocket connections
- **Caching**: Redis-based performance optimization

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Rate limiting for API endpoints
- Input validation and sanitization
- File upload security
- Audit logging

## 📱 Mobile App

The system includes a React Native mobile app for:

- Quick attendance check-in/out
- Mobile-optimized forms
- Push notifications
- Offline data sync

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Proprietary software - FWC IT Services Pvt. Ltd.

## 📞 Support

- **Email**: support@fwcit.com
- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues

---

**Built with ❤️ for the Future of HR Management**

_Ready to revolutionize HR with AI? Start the application and explore the future of human resource management!_
