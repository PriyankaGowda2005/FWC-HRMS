# FWC HR Management System (HRMS)

A comprehensive monorepo HR Management System built with modern technologies, featuring role-based authentication, employee management, and machine learning capabilities.

## 🏗️ Architecture

```
fwc-hrms/
├── apps/
│   ├── backend/          # Node.js + Express + Prisma + MongoDB
│   └── frontend/         # React + Vite + Tailwind CSS
├── services/
│   └── ml/               # FastAPI ML microservice
├── scripts/              # Setup and demo scripts
└── docker-compose.yml    # Infrastructure setup
```

## 🚀 Features

### Backend (`apps/backend`)

- **Authentication & Authorization**

  - JWT-based authentication with access & refresh tokens
  - Role-based access control (Admin, HR, Employee)
  - Secure password hashing with bcrypt
  - HTTP-only cookies for secure token storage

- **Database & ORM**

  - MongoDB integration with Prisma ORM
  - User and Employee models with relationships
  - Automated database migrations and seeding

- **API Features**
  - RESTful API with Express.js
  - Input validation with express-validator
  - Rate limiting and security headers
  - Comprehensive error handling
  - Jest test suites

### Frontend (`apps/frontend`)

- **React Application**

  - Modern React with hooks and functional components
  - React Router for navigation
  - React Query for data fetching and caching

- **UI/UX**

  - Beautiful Tailwind CSS styling
  - Responsive design for all screen sizes
  - Toast notifications for user feedback
  - Role-based redirects after login

- **Authentication**
  - Secure JWT token management
  - Protected routes based on user roles
  - Automatic token refresh handling

### ML Service (`services/ml`)

- **FastAPI Microservice**
  - Employee performance prediction
  - Retention probability analysis
  - Salary optimization recommendations
  - Sentiment analysis for feedback
  - Workload optimization suggestions

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, Prisma, MongoDB
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, React Query
- **ML Service**: FastAPI, Python, Pydantic
- **Database**: MongoDB
- **Authentication**: JWT, bcrypt
- **Testing**: Jest, Supertest
- **DevOps**: Docker, Docker Compose

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **MongoDB** (or use Docker)

## 🚀 Quick Start

### Option 1: Automated Demo Script (Recommended)

**For Linux/macOS:**

```bash
./scripts/demo.sh
```

**For Windows:**

```cmd
scripts\demo.bat
```

The demo script will:

- Check dependencies
- Set up environment files
- Start MongoDB and ML service
- Install all dependencies
- Generate database schema
- Create demo users
- Start backend and frontend servers

### Option 2: Manual Setup

1. **Clone and setup environment:**

   ```bash
   git clone <repository-url>
   cd fwc-hrms
   cp env.example .env
   ```

2. **Start infrastructure:**

   ```bash
   docker-compose up -d mongodb ml-service
   ```

3. **Setup backend:**

   ```bash
   cd apps/backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

4. **Setup frontend:**

   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

5. **Create demo users:**

   ```bash
   cd apps/backend
   node -e "
   const {PrismaClient} = require('@prisma/client');
   const bcrypt = require('bcrypt');
   const prisma = new PrismaClient();

   async function createUsers() {
     // Admin user
     const hashedAdminPassword = await bcrypt.hash('admin123', 12);
     await prisma.user.create({
       data: {
         email: 'admin@example.com',
         username: 'admin',
         password: hashedAdminPassword,
         role: 'ADMIN'
       }
     });

     // Employee user
     const hashedEmpPassword = await bcrypt.hash('employee123', 12);
     await prisma.user.create({
       data: {
         email: 'employee@example.com',
         username: 'employee',
         password: hashedEmpPassword,
         role: 'EMPLOYEE'
       }
     });

     await prisma.$disconnect();
     console.log('Demo users created!');
   }

   createUsers();
   "
   ```

## 🌐 Service Access

After running the setup:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **ML Service Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:3001/health
- **MongoDB**: mongodb://localhost:27017

## 🔐 Demo Credentials

- **Admin Account**:

  - Email: `admin@example.com`
  - Password: `admin123`
  - Access: Full system access, employee management

- **Employee Account**
  - Email: `employee@example.com`
  - Password: `employee123`
  - Access: Personal dashboard, profile management

## 📖 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
POST /api/auth/logout      # Logout user
GET  /api/auth/me          # Get current user
POST /api/auth/refresh     # Refresh token
```

### Employee Management

```http
GET    /api/employees      # Get all employees (Admin/HR)
GET    /api/employees/:id  # Get specific employee
PUT    /api/employees/:id  # Update employee
DELETE /api/employees/:id  # Delete employee (Admin)
```

### ML Service Endpoints

```http
POST /predict/performance    # Predict employee performance
POST /predict/retention      # Predict retention probability
POST /predict/salary         # Predict optimal salary
GET  /analytics/sentiment    # Analyze text sentiment
GET  /analytics/workload     # Analyze workload optimization
```

## 🧪 Testing

Run backend tests:

```bash
cd apps/backend
npm test
```

Test specific files:

```bash
npm test -- --testNamePattern="auth"
```

## 📁 Project Structure

```
apps/backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── routes/            # API route handlers
│   ├── middleware/        # Auth and error middleware
│   ├── tests/             # Jest Test suites
│   └── server.js          # Main server file

apps/frontend/
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (Auth)
│   └── services/          # API service layer

services/ml/
└── main.py                # FastAPI ML service
```

## 🔧 Configuration

Key environment variables in `.env`:

```env
DATABASE_URL=mongodb://localhost:27017/fwc_hrms
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:5173
```

## 🚧 Development Notes

- The ML service contains placeholder implementations
- Roles: `ADMIN`, `HR`, `EMPLOYEE`
- JWT tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 7 days
- Rate limiting: 100 requests/15min (5 for auth)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for modern HR management**
