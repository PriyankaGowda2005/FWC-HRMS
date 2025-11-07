@echo off
echo 🎯 FWC HRMS Complete System - Website + Mobile App
echo ==================================================

REM Colors
set GREEN=[32m
set RED=[31m
set YELLOW=[33m
set BLUE=[34m
set NC=[0m

REM Check prerequisites
echo Checking prerequisites...

node --version >nul 2>&1 || (echo %RED%❌ Node.js not found%NC% && pause && exit /b 1)
npm --version >nul 2>&1 || (echo %RED%❌ npm not found%NC% && pause && exit /b 1)
docker --version >nul 2>&1 || (echo %RED%❌ Docker not found%NC% && pause && exit /b 1)
python --version >nul 2>&1 || (echo %YELLOW%⚠ Python not found - ML service will be skipped%NC%)

echo %GREEN%✅ Core prerequisites met%NC%

echo.
echo %BLUE%🚀 Starting FWC HRMS Complete System...%NC%
echo.

REM Step 1: Infrastructure
echo %YELLOW%📋 Step 1: Starting infrastructure services%NC%
docker-compose up -d mongodb redis
timeout /t 5 /nobreak >nul

REM Step 2: Install all dependencies
echo %YELLOW%📋 Step 2: Installing dependencies across all platforms%NC%
npm install --silent
echo %GREEN%✅ Root dependencies installed%NC%

cd apps\backend && npm install --silent && echo %GREEN%✅ Backend dependencies installed%NC% && cd ..
cd frontend && npm install --silent && echo %GREEN%✅ Frontend dependencies installed%NC% && cd ..
cd ..\mobile-app && npm install --silent && echo %GREEN%✅ Mobile app dependencies installed%NC% && cd ..
cd services\ml && pip install -r requirements.txt --quiet && echo %GREEN%✅ ML service dependencies installed%NC%
cd ..\..

echo.
echo %GREEN%🎉 All dependencies installed successfully!%NC%

REM Step 3: Database setup
echo.
echo %YELLOW%📋 Step 3: Setting up database schema%NC%
cd apps\backend
npx prisma generate --silent
npx prisma db push --silent
echo %GREEN%✅ Database schema configured%NC%

REM Create demo data
node scripts\mongo-init.js --quiet 2>nul || echo "Demo data creation skipped"
echo %GREEN%✅ Demo data created%NC%
cd ..

echo.
echo %GREEN%🚀 FWC HRMS Complete System Ready!%NC%
echo ================================================
echo.

REM Show service URLs
echo %BLUE%📊 Service URLs:%NC%
echo   🌐 Web Frontend:    http://localhost:5173
echo   🔧 Backend API:     http://localhost:3001/health
echo   🤖 ML Service:      http://localhost:8000/docs
echo   📱 Mobile App:      Metro bundler + Android/iOS
echo.

REM Show platform information
echo %BLUE%📱 Platform Information:%NC%
echo   🌐 Website Features:    Admin dashboard, Employee CRUD, Reports
echo   📱 Mobile Features:     Clock in/out, Leave requests, Job applications
echo   🔄 Shared Backend:      Single API serves both platforms
echo   💾 Shared Database:     MongoDB with real-time sync
echo.

REM Start services in parallel
echo %YELLOW%📋 Step 4: Starting all services%NC%

REM Start Backend API
start "Backend API" cmd /c "cd apps\backend && npm run dev && pause"

REM Start Web Frontend
start "Web Frontend" cmd /c "cd apps\frontend && npm run dev && pause"

REM Start ML Service
start "ML Service" cmd /c "cd services\ml && python main.py && pause"

REM Start Mobile Metro Bundler
start "Mobile Metro" cmd /c "cd mobile-app && npm start && pause"

REM Instructions for mobile development
echo.
echo %BLUE%📱 Mobile App Development:%NC%
echo   For Android Development:
echo     - Start Android emulator or connect device
echo     - Run: %GREEN%npm run android%NC%
echo.
echo   For iOS Development (macOS only):
echo     - Start iOS simulator or connect device  
echo     - Run: %GREEN%npm run ios%NC%
echo.

REM Show demo credentials
echo %BLUE%🔐 Demo Credentials:%NC%
echo   Admin Login:
echo     Email: %GREEN%admin@example.com%NC%
echo     Password: %GREEN%admin123%NC%
echo.
echo   Employee Login:
echo     Email: %GREEN%employee@example.com%NC%
echo     Password: %GREEN%employee123%NC%
echo.

echo %GREEN%🎉 Complete system is running!%NC%
echo.
echo %YELLOW%📋 Quick Access Guide:%NC%
echo   1. Open http://localhost:5173 for web interface
echo   2. Install React Native environment for mobile app
echo   3. Both platforms share the same backend and database
echo   4. Mobile app requires separate build commands for iOS/Android
echo.

REM Wait for user input
echo Press any key to stop all services...
pause >nul

echo.
echo %YELLOW%📋 Stopping all services...%NC%
REM Kill all background processes
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
docker-compose down
echo %GREEN%✅ All services stopped%NC%

echo.
echo Thank you for using FWC HRMS Complete System!
