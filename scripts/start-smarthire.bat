@echo off
REM SmartHire AI-Powered Recruitment System Startup Script for Windows
REM Complete system with FastAPI backend, React frontend, and ML services

echo 🚀 Starting SmartHire AI-Powered Recruitment System...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create necessary directories
echo Creating necessary directories...
if not exist "services\ml\uploads\resumes" mkdir "services\ml\uploads\resumes"
if not exist "services\ml\reports" mkdir "services\ml\reports"
if not exist "services\ml\templates" mkdir "services\ml\templates"
if not exist "services\ml\assets" mkdir "services\ml\assets"

REM Install Python dependencies for ML service
echo Installing Python dependencies for ML service...
cd services\ml
if exist requirements.txt (
    pip install -r requirements.txt
    if %errorlevel% equ 0 (
        echo ✅ Python dependencies installed
    ) else (
        echo ❌ Failed to install Python dependencies
        pause
        exit /b 1
    )
) else (
    echo ⚠️ requirements.txt not found, skipping Python dependencies
)
cd ..\..

REM Install Node.js dependencies for frontend
echo Installing Node.js dependencies for frontend...
cd apps\frontend
if exist package.json (
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Frontend dependencies installed
    ) else (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ⚠️ package.json not found, skipping frontend dependencies
)
cd ..\..

REM Install Node.js dependencies for backend
echo Installing Node.js dependencies for backend...
cd apps\backend
if exist package.json (
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Backend dependencies installed
    ) else (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ⚠️ package.json not found, skipping backend dependencies
)
cd ..\..

echo Starting services...

REM Start ML Service (FastAPI)
echo Starting ML Service (FastAPI) on port 8000...
start "ML Service" cmd /k "cd services\ml && python main.py"

REM Wait a bit for ML service to start
timeout /t 5 /nobreak >nul

REM Start Backend (Node.js/Express)
echo Starting Backend (Node.js/Express) on port 3001...
start "Backend" cmd /k "cd apps\backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend (React/Vite)
echo Starting Frontend (React/Vite) on port 5173...
start "Frontend" cmd /k "cd apps\frontend && npm run dev"

REM Wait a bit for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo 🎉 SmartHire AI-Powered Recruitment System is now running!
echo ==================================================
echo.
echo Service URLs:
echo   Frontend (React):     http://localhost:5173
echo   Backend (Express):    http://localhost:3001
echo   ML Service (FastAPI): http://localhost:8000
echo   API Documentation:   http://localhost:8000/docs
echo.
echo SmartHire Features:
echo   📄 Resume Analysis:   http://localhost:5173/resume-analysis
echo   🎥 AI Interview:      http://localhost:5173/ai-interview
echo   📊 Assessment Mgmt:  http://localhost:5173/assessments
echo   🏠 Main Dashboard:   http://localhost:5173/smarthire
echo.
echo Demo Credentials:
echo   Admin: admin@example.com / admin123
echo   HR:    hr@example.com / hr123
echo   Manager: manager@example.com / manager123
echo.
echo Press any key to open the main dashboard...
pause >nul

REM Open the main dashboard in default browser
start http://localhost:5173/smarthire

echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
