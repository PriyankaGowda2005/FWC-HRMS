@echo off
echo 🎯 FWC HRMS MVP Demo - Hackathon Ready
echo ======================================

REM Colors
set GREEN=[32m
set RED=[31m
set YELLOW=[33m
set NC=[0m

REM Check prerequisites
echo Checking prerequisites...

node --version >nul 2>&1 || (echo %RED%❌ Node.js not found%NC% && pause && exit /b 1)
npm --version >nul 2>&1 || (echo %RED%❌ npm not found%NC% && pause && exit /b 1)
docker --version >nul 2>&1 || (echo %RED%❌ Docker not found%NC% && pause && exit /b 1)
python --version >nul 2>&1 || (echo %RED%❌ Python not found%NC% && pause && exit /b 1)

echo %GREEN%✅ All prerequisites met%NC%

echo.
echo 🚀 Starting MVP Demo...
echo.

REM Step 1: Infrastructure
echo %YELLOW%📋 Step 1: Starting infrastructure%NC%
docker-compose up -d mongodb redis
timeout /t 3 /nobreak >nul

REM Step 2: Install only required packages
echo %YELLOW%📋 Step 2: Installing MVP dependencies%NC%
npm install --silent
cd apps\backend && npm install --silent && cd ..
cd apps\frontend && npm install --silent && cd ..
cd ..\services\ml && pip install -r requirements.txt --quiet && cd ..\..

REM Step 3: Database setup
echo %YELLOW%📋 Step 3: Setting up database%NC%
cd apps\backend
npx prisma generate --silent
npx prisma db push --silent
cd ..\..

REM Step 4: Create demo data
echo %YELLOW%📋 Step 4: Creating demo data%NC%
cd apps\backend
node scripts\mongo-init.js --quiet || echo "Demo data creation skipped"
cd ..\

echo.
echo %GREEN%🎉 MVP Demo is ready!%NC%
echo ================================
echo.

REM Start services efficiently
echo %YELLOW%📋 Step 5: Starting MVP services%NC%

REM Start ML service in background
start "ML Service" cmd /c "cd services\ml && python main.py && pause"

REM Start frontend in background  
start "Frontend" cmd /c "cd apps\frontend && npm run dev && pause"

REM Start backend in foreground (main service)
echo %GREEN%🚀 Starting backend service...%NC%
cd apps\backend
npm run dev

REM This won't be reached because npm run dev runs indefinitely
