# FWC HRMS - Production-Ready Real-Time HR Management System

A comprehensive, real-time HR Management System built with React, Node.js, MongoDB, and Socket.IO. Features role-based access control, real-time updates, and production-ready architecture.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Setup Instructions

1. **Navigate to the correct directory**

   ```bash
   cd E:\BlogReact\FWC-HRMS
   ```

2. **Run the automated setup**

   ```bash
   node setup.js
   ```

3. **Or setup manually**

   ```bash
   # Install dependencies
   npm install
   cd apps/backend && npm install
   cd ../frontend && npm install

   # Setup database
   cd ../backend
   node setup-database.js
   ```

4. **Start the application**

   ```bash
   # Option 1: Start both services
   npm run dev

   # Option 2: Start individually
   npm run dev:backend
   npm run dev:frontend

   # Option 3: Use Docker
   docker-compose up -d
   ```

## 🔐 Demo Credentials

| Role      | Email                   | Password    |
| --------- | ----------------------- | ----------- |
| Admin     | admin@fwcit.com         | admin123    |
| HR        | hr@fwchrms.com          | HR@2024!    |
| Manager   | manager@fwcit.com       | manager123  |
| Employee  | employee@fwcit.com      | employee123 |
| Candidate | vishnu.h.s007@gmail.com | Alchem@1996 |

## 🌐 Access URLs

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api/health

## ✨ Features

### Real-time Features

- **Live Attendance Tracking** - Clock in/out with instant updates
- **Real-time Leave Approvals** - Instant notifications for managers
- **Live Payroll Notifications** - Real-time payroll release alerts
- **Performance Review Updates** - Live performance submissions

### Role-Based Access Control

- **Admin** - Full system access and management
- **HR** - Employee management, payroll, and reports
- **Manager** - Team management and approvals
- **Employee** - Personal dashboard and requests
- **Candidate** - Limited read-only access

### Core HR Features

- **Attendance Management** - Clock in/out, daily summaries, team tracking
- **Leave Management** - Apply, approve, track leave requests
- **Payroll Management** - Generate and release payroll
- **Performance Reviews** - Comprehensive performance tracking
- **Department Management** - Organize employees by departments
- **Reports & Analytics** - Generate comprehensive reports

## 🛠️ Tech Stack

### Frontend

- React 18 with Vite
- TanStack Query for server state
- Socket.IO Client for real-time features
- Tailwind CSS for styling
- React Router for navigation

### Backend

- Node.js with Express
- Socket.IO for real-time communication
- MongoDB with native driver
- Redis for session management
- JWT for authentication

## 📊 Database Schema

The system uses MongoDB with the following collections:

- `users` - User accounts and authentication
- `employees` - Employee profiles and details
- `departments` - Department information
- `attendance_logs` - Clock in/out records
- `attendance_summaries` - Daily attendance summaries
- `leave_requests` - Leave applications and approvals
- `leave_types` - Available leave types
- `payrolls` - Payroll records
- `performance_reviews` - Performance evaluations
- `notifications` - Real-time notifications
- `audit_logs` - System audit trail

## 🔌 Real-time Events

### Socket.IO Events

- `attendance:clocked` - Employee clocks in/out
- `leave:applied` - New leave request submitted
- `leave:decision` - Leave request approved/rejected
- `payroll:released` - Payroll released to employee
- `performance:submitted` - Performance review submitted
- `notification` - General notifications

## 🧪 Testing

```bash
# Backend tests
cd apps/backend
npm test

# Frontend tests
cd apps/frontend
npm test
```

## 🐳 Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📝 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Attendance

- `POST /api/attendance/clock` - Clock in/out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/summary` - Get attendance summary
- `GET /api/attendance/team` - Get team attendance (managers)

### Leave Management

- `POST /api/leave-requests` - Apply for leave
- `GET /api/leave-requests` - Get leave requests
- `PUT /api/leave-requests/:id/approve` - Approve/reject leave
- `GET /api/leave-requests/pending` - Get pending leaves

### Employee Management

- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL="mongodb+srv://vishnuhs007:alchem@student-portal.oomxgt8.mongodb.net/HRMS"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET="fwc-hrms-super-secret-jwt-key-2024"
JWT_REFRESH_SECRET="fwc-hrms-super-secret-refresh-key-2024"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:5174"

# Redis
REDIS_URL="redis://localhost:6379"

# Email
RESEND_API_KEY="re_LYQ937kg_M9KMwseqJFnB5qSWAGqYJBP3"
RESEND_FROM="FWC HRMS <onboarding@resend.dev>"
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=FWC HRMS
VITE_APP_VERSION=1.0.0
```

## 🚀 Deployment

### Production Setup

1. Update environment variables for production
2. Build frontend: `npm run build`
3. Start backend: `npm start`
4. Configure reverse proxy (nginx)
5. Setup SSL certificates

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Audit logging for sensitive operations

## 📈 Performance Features

- Database indexing for optimized queries
- Redis caching for sessions
- Socket.IO scaling with Redis adapter
- Connection pooling
- Rate limiting protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **"Could not read package.json" Error**

   - Make sure you're in the correct directory: `E:\BlogReact\FWC-HRMS`
   - Run: `cd E:\BlogReact\FWC-HRMS`

2. **MongoDB Connection Issues**

   - Check your internet connection
   - Verify MongoDB Atlas IP whitelist
   - Check firewall settings

3. **Port Already in Use**

   - Stop other Node.js processes: `taskkill /f /im node.exe`
   - Or change ports in .env files

4. **CORS Errors**
   - Ensure FRONTEND_URL in backend .env matches frontend URL
   - Check that both servers are running

### Getting Help

- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
- Check MongoDB connection string

---

**Built with ❤️ for modern HR management**
