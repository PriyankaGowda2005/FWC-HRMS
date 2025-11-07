@echo off
echo 🚀 Starting FWC HRMS Local Demo...
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js and try again.
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop and try again.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python and try again.
    pause
    exit /b 1
)

echo ✅ Python is available

echo.
echo 📋 Step 1: Starting Docker services (MongoDB, Redis)
docker-compose up -d mongodb redis

echo.
echo 📋 Step 2: Installing dependencies...
echo Installing root dependencies...
call npm install

echo Installing backend dependencies...
cd apps\backend
call npm install

echo Installing frontend dependencies...
cd ..\frontend
call npm install

echo Installing ML service dependencies...
cd ..\..\services\ml
pip install -r requirements.txt

echo.
echo 📋 Step 3: Setting up database...
cd ..\..\apps\backend
call npx prisma generate
call npx prisma db push

REM Start services
echo.
echo 📋 Step 4: Starting all services...

REM Start MongoDB and Redis if not running (they should be from step 1)
cd ..\..

REM Start ML service in background
echo Starting ML service...
cd services\ml
start /B python main.py
timeout /t 5 /nobreak >nul
cd ..\..

REM Start frontend in background
echo Starting frontend service...
cd apps\frontend
start /B npm run dev
cd ..

REM Start backend
echo Starting backend service...
cd backend
npm run dev

REM This point won't be reached because npm run dev runs indefinitely
REM The demo is now running!
echo.
echo 🎉 FWC HRMS Demo is running!
echo ================================
echo.
echo 🌐 Service URLs:
echo ├── Frontend App:     http://localhost:5173
echo ├── Backend API:      http://backend:3001
echo ├── ML Service:       http://localhost:8000
echo ├── ML Docs:          http://localhost:8000/docs
echo ├── MongoDB:          mongodb://localhost:27017
echo └── Redis:            redis://localhost:6379
echo.
echo 🔐 Demo Credentials:
echo ├── Admin Dashboard:
echo │   ├── Email:    admin@example.com
echo │   └── Password: admin123
echo.
echo ├── Employee Portal:
echo │   ├── Email:    employee@example.com
echo │   └── Password: employee123
echo.
echo Press any key to continue...
pause >nul

