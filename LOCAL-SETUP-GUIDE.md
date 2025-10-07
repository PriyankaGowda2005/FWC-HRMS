# 🚀 FWC HRMS Local Setup Guide

## Prerequisite

Make sure you have these installed on your Windows machine:

1. **Node.js** (v18 or higher) - https://nodejs.org/
2. **Docker Desktop** - https://www.docker.com/products/docker-desktop
3. **Python** (3.8+ higher) - https://www.python.org/downloads/
4. **Git** - https://git-scm.com/download/win

## Quick Start (Automated)

### Option 1: Automated Script

```bash
# Run the automated demo script
scripts\demo-windows.bat
```

### Option 2: Manual Step-by-Step

## Manual Setup Steps

### Step 1: Start Docker Services

```bash
# Start MongoDB and Redis containers
docker-compose up -d mongodb redis

# Verify they're running
docker ps
```

### Step 2: Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd api/backend
npm install

# Frontend dependencies
cd ..\frontend
npm install

# ML service dependencies
cd ..\..\services\ml
pip install -r requirements.txt
cd ..\..
```

### Step 3: Database Setup

```bash
# Navigate to backend
cd apps\backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create demo data (optional)
node scripts\mongo-init.js

cd ..\..
```

### Step 4: Start All Services

You'll need **4 terminal windows** open simultaneously:

#### Terminal 1: Backend API Server

```bash
cd apps\backend
npm run dev
```

Should show: `🚀 Server running on port 3001`

#### Terminal 2: React Frontend

```bash
cd apps\frontend
npm run dev
```

Should show: `Local: http://localhost:5173`

#### Terminal 3: ML Service (Python)

```bash
cd services\ml
python main.py
```

Should show: `Server running on port 8000`

#### Terminal 4: Database Services (Keep Docker running)

```bash
docker-compose up -d mongodb redis
```

---

## 🎯 Accessing the Application

### Service URLs

- **Frontend App**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **ML Service**: http://localhost:8000/docs
- **Health Check**: http://localhost:3001/health

### Demo Credentials

#### Admin Dashboard

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Access**: Full system administration

#### Employee Portal

- **Email**: `employee@example.com`
- **Password**: `employee123`
- **Access**: Employee self-service features

## 🧪 Testing the System

### 1. Basic Health Checks

```bash
# Check if backend is running
curl http://localhost:3001/health

# Check if ML service is running
curl http://localhost:8000/docs
```

### 2. API Testing with Postman/curl

#### Login Test

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

#### Get Departments

```bash
curl -X GET http://localhost:3001/api/departments \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```

#### Clock In Test

```bash
curl -X POST http://localhost:3001/api/attendance/clock-in \
  -H "Cookie: token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Starting work","workFromHome":false}'
```

### 3. Frontend Functionality

1. **Navigate to** http://localhost:5173
2. **Login** with demo credentials
3. **Test Features**:
   - View employee dashboard
   - Clock in/out functionality
   - Submit leave request
   - View payroll records
   - Access admin features (if admin user)

### 4. ML Service Testing

1. **Navigate to** http://localhost:8000/docs
2. **Test Resume Parser**:

   ```bash
   curl -X POST http://localhost:8000/api/resume/analyze \
     -H "Content-Type: application/json" \
     -d '{"file_path":"test-resume.pdf","candidate_id":"test123"}'
   ```

3. **Test Interview Bot**:
   ```bash
   curl -X POST http://localhost:8000/api/interview/start \
     -H "Content-Type: application/json" \
     -d '{"candidate_id":"test123","interview_type":"TECHNICAL","job_title":"Senior Developer"}'
   ```

---

## 🔧 Common Issues & Solutions

### Issue: Port Already in Use

```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID_NUMBER> /F
```

### Issue: MongoDB Connection Error

```bash
# Restart Docker containers
docker-compose down
docker-compose up -d mongodb redis

# Check container status
docker ps
```

### Issue: Prisma Schema Issues

```bash
cd apps\backend

# Reset database
npx prisma db push --force-reset

# Regenerate client
npx prisma generate
```

### Issue: Frontend Build Errors

```bash
cd apps\frontend

# Clear cache and reinstall
npm cache clean --force
del node_modules
del package-lock.json
npm install
```

### Issue: Python ML Service Errors

```bash
cd services\ml

# Reinstall requirements
pip install -r requirements.txt --force-reinstall

# Check Python version (need 3.8+)
python --version
```

---

## 📊 Monitoring & Logs

### Backend Logs

View logs in Terminal 1 (backend terminal). Look for:

- `🚀 Server running on port 3001`
- `✅ Connected to MongoDB`
- API request logs

### Frontend Logs

View logs in Terminal 2 (frontend terminal). Look for:

- `Local: http://localhost:5173`
- Webpack compilation logs

### ML Service Logs

View logs in Terminal 3 (ML service terminal). Look for:

- `Server running on port 8000`
- Request processing logs

### Database Logs

```bash
# View MongoDB logs
docker logs fwc-hrms-mongodb-1

# View Redis logs
docker logs fwc-hrms- redis-1
```

---

## 🛑 Stopping the System

### Stop All Processes

Press `Ctrl+C` in each terminal window to stop:

- Frontend server
- Backend server
- ML service

### Stop Docker Services

```bash
docker-compose down
```

### Clean Up (Optional)

```bash
# Remove containers and volumes
docker-compose down -v

# Remove images (if needed)
docker rmi mongo redis
```

---

## 🚀 Development Commands

### Backend Development

```bash
cd apps\backend

# Run with nodemon (auto-restart)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Frontend Development

```bash
cd apps\frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Operations

```bash
cd apps\backend

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate migration
npx prisma migrate dev --name update-schema
```

---

## 📈 Production Deployment

The system is production-ready with:

### Environment Variables

Copy and configure:

```bash
# Root level
cp env.example .env

# Backend
cp apps\backend\env.example apps\backend\.env

# Configure with your values
```

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment

The system is ready for:

- **Frontend**: Vercel, Netlify, Railway
- **Backend**: Render, Railway, AWS
- **Database**: MongoDB Atlas
- **ML Services**: Railway, AWS Lambda

---

**🎉 You're all set!**

Your FWC HRMS system should now be running locally with full functionality. Navigate to http://localhost:5173 to start exploring!

For any issues, check the logs in each terminal and refer to the troubleshooting section above.

