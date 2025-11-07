@echo off
REM FWC HRMS Demo Script for Windows
REM This script sets up and runs the complete HRMS system

echo.
echo ======================================
echo FWC HRMS Demo - Windows Setup
echo ======================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop for Windows
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] All dependencies found ✅

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    copy env.example .env
    echo [WARNING] Please update .env file with your configuration before production use
) else (
    echo [INFO] .env file already exists
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down 2>nul

REM Start MongoDB and ML service
echo [INFO] Starting infrastructure services...
docker-compose up -d mongodb ml-service

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd apps\backend
if not exist "node_modules" (
    npm install
)

echo [INFO] Generating Prisma client...
call npx prisma generate

echo [INFO] Setting up database...
call npx prisma db push

REM Create demo users
echo [INFO] Creating demo users...
node -e "const {PrismaClient} = require('@prisma/client'); const bcrypt = require('bcrypt'); const prisma = new PrismaClient(); async function createDemoUsers() { try { const existingAdmin = await prisma.user.findUnique({where: {email: 'admin@example.com'}}); if (!existingAdmin) { const hashedPassword = await bcrypt.hash('admin123', 12); const user = await prisma.user.create({data: {email: 'admin@example.com', username: 'admin', password: hashedPassword, role: 'ADMIN'}}); await prisma.employee.create({data: {userId: user.id, firstName: 'Admin', lastName: 'User', department: 'Management', position: 'System Administrator', hireDate: new Date()}}); console.log('✅ Admin user created'); } const existingEmployee = await prisma.user.findUnique({where: {email: 'employee@example.com'}}); if (!existingEmployee) { const hashedPassword = await bcrypt.hash('employee123', 12); const user = await prisma.user.create({data: {email: 'employee@example.com', username: 'employee', password: hashedPassword, role: 'EMPLOYEE'}}); await prisma.employee.create({data: {userId: user.id, firstName: 'John', lastName: 'Doe', department: 'Engineering', position: 'Software Developer', salary: 75000, hireDate: new Date(), phoneNumber: '+1-555-1234'}}); console.log('✅ Employee user created'); } await prisma.$disconnect(); } catch (error) { console.error('Error:', error); process.exit(1); }} createDemoUsers();"

if %errorlevel% equ 0 (
    echo [SUCCESS] Demo users created successfully
) else (
    echo [ERROR] Failed to create demo users
    pause
    exit /b 1
)

REM Start backend server in background
echo [INFO] Starting backend server...
start "Backend Server" cmd /c "npm run dev & pause"
timeout /t 5in >nul

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    npm install
)

REM Start frontend server
echo [INFO] Starting frontend server...
start "Frontend Server" cmd /c "npm run dev & pause"

timeout /t 5 /nobreak >nul

echo.
echo ======================================
echo Demo setup complete! 🎉
echo ======================================
echo.
echo Service URLs:
echo Frontend:     http://localhost:5173
echo Backend API:  http://localhost:3001
echo ML Service:   http://localhost:8000
echo MongoDB:      mongodb://localhost:27017
echo.
echo Demo Credentials:
echo Admin:        admin@example.com / admin123
echo Employee:     employee@example.com / employee123
echo.
echo ML Service API: http://localhost:8000/docs
echo Health Check:   http://localhost:3001/health
echo.
echo To stop the demo, close the command windows or run:
echo docker-compose down
echo.

pause
