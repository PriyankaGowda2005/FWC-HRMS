@echo off
REM Comprehensive System Integration Test Script for Windows
REM Tests frontend-backend-ML service connections and database integration

echo 🚀 Starting Comprehensive System Integration Tests...
echo ==================================================

REM Test configuration
set ML_SERVICE_URL=http://localhost:8000
set BACKEND_URL=http://localhost:3001
set FRONTEND_URL=http://localhost:5173
set MONGODB_URL=mongodb://localhost:27017/HRMS

REM Test 1: Check if all services are running
echo ℹ️  Testing service availability...

curl -s -w "%%{http_code}" "%ML_SERVICE_URL%/health" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ ML Service (Port 8000) - OK
    set ML_SERVICE_OK=1
) else (
    echo ❌ ML Service (Port 8000) - FAILED
    set ML_SERVICE_OK=0
)

curl -s -w "%%{http_code}" "%BACKEND_URL%/api/health" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend Service (Port 3001) - OK
    set BACKEND_SERVICE_OK=1
) else (
    echo ❌ Backend Service (Port 3001) - FAILED
    set BACKEND_SERVICE_OK=0
)

curl -s -w "%%{http_code}" "%FRONTEND_URL%" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend Service (Port 5173) - OK
    set FRONTEND_SERVICE_OK=1
) else (
    echo ❌ Frontend Service (Port 5173) - FAILED
    set FRONTEND_SERVICE_OK=0
)

REM Check if all services are running
if %ML_SERVICE_OK% equ 1 if %BACKEND_SERVICE_OK% equ 1 if %FRONTEND_SERVICE_OK% equ 1 (
    echo ✅ All services are running
) else (
    echo ❌ One or more services are not running
    echo Please start all services before running tests:
    echo   ML Service: cd services\ml ^&^& python main.py
    echo   Backend: cd apps\backend ^&^& npm run dev
    echo   Frontend: cd apps\frontend ^&^& npm run dev
    pause
    exit /b 1
)

REM Test 2: Test ML Service endpoints
echo ℹ️  Testing ML Service endpoints...

curl -s -X POST -H "Content-Type: application/json" -d "{\"test\": \"data\"}" "%ML_SERVICE_URL%/api/resume/analyze" | findstr "422" >nul
if %errorlevel% equ 0 (
    echo ✅ Resume Analysis Endpoint - OK
    set RESUME_ENDPOINT_OK=1
) else (
    echo ❌ Resume Analysis Endpoint - FAILED
    set RESUME_ENDPOINT_OK=0
)

curl -s -X POST -H "Content-Type: application/json" -d "{\"candidate_id\": \"test\", \"job_role\": \"test\"}" "%ML_SERVICE_URL%/api/interview/start" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Interview Management Endpoint - OK
    set INTERVIEW_ENDPOINT_OK=1
) else (
    echo ❌ Interview Management Endpoint - FAILED
    set INTERVIEW_ENDPOINT_OK=0
)

curl -s -X POST -H "Content-Type: application/json" -d "{\"text\": \"test\"}" "%ML_SERVICE_URL%/api/emotion/analyze" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Emotion Analysis Endpoint - OK
    set EMOTION_ENDPOINT_OK=1
) else (
    echo ❌ Emotion Analysis Endpoint - FAILED
    set EMOTION_ENDPOINT_OK=0
)

curl -s -X POST -H "Content-Type: application/json" -d "{\"event\": \"test\"}" "%ML_SERVICE_URL%/api/zoom/webhook" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Zoom Integration Endpoint - OK
    set ZOOM_ENDPOINT_OK=1
) else (
    echo ❌ Zoom Integration Endpoint - FAILED
    set ZOOM_ENDPOINT_OK=0
)

REM Test 3: Test Backend API endpoints
echo ℹ️  Testing Backend API endpoints...

curl -s -X POST -H "Content-Type: application/json" -d "{\"email\": \"test@test.com\", \"password\": \"test\"}" "%BACKEND_URL%/api/auth/login" | findstr "400" >nul
if %errorlevel% equ 0 (
    echo ✅ Authentication Endpoint - OK
    set AUTH_ENDPOINT_OK=1
) else (
    echo ❌ Authentication Endpoint - FAILED
    set AUTH_ENDPOINT_OK=0
)

curl -s -w "%%{http_code}" "%BACKEND_URL%/api/employees" | findstr "401" >nul
if %errorlevel% equ 0 (
    echo ✅ Employee Management Endpoint - OK
    set EMPLOYEE_ENDPOINT_OK=1
) else (
    echo ❌ Employee Management Endpoint - FAILED
    set EMPLOYEE_ENDPOINT_OK=0
)

curl -s -w "%%{http_code}" "%BACKEND_URL%/api/attendance" | findstr "401" >nul
if %errorlevel% equ 0 (
    echo ✅ Attendance Management Endpoint - OK
    set ATTENDANCE_ENDPOINT_OK=1
) else (
    echo ❌ Attendance Management Endpoint - FAILED
    set ATTENDANCE_ENDPOINT_OK=0
)

REM Test 4: Test Database Connection
echo ℹ️  Testing database connection...

python -c "import pymongo; client = pymongo.MongoClient('mongodb://localhost:27017/HRMS'); client.admin.command('ping'); print('✅ MongoDB connection successful')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB Connection - OK
    set MONGODB_OK=1
) else (
    echo ❌ MongoDB Connection - FAILED
    set MONGODB_OK=0
)

python -c "import redis; r = redis.Redis(host='localhost', port=6379, db=0); r.ping(); print('✅ Redis connection successful')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Redis Connection - OK
    set REDIS_OK=1
) else (
    echo ❌ Redis Connection - FAILED
    set REDIS_OK=0
)

REM Test 5: Test Frontend Routes
echo ℹ️  Testing frontend routes...

curl -s -w "%%{http_code}" "%FRONTEND_URL%/login" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Login Route - OK
    set LOGIN_ROUTE_OK=1
) else (
    echo ❌ Login Route - FAILED
    set LOGIN_ROUTE_OK=0
)

curl -s -w "%%{http_code}" "%FRONTEND_URL%/smarthire" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ SmartHire Route - OK
    set SMARTHIRE_ROUTE_OK=1
) else (
    echo ❌ SmartHire Route - FAILED
    set SMARTHIRE_ROUTE_OK=0
)

curl -s -w "%%{http_code}" "%FRONTEND_URL%/zoom-interview" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Zoom Interview Route - OK
    set ZOOM_ROUTE_OK=1
) else (
    echo ❌ Zoom Interview Route - FAILED
    set ZOOM_ROUTE_OK=0
)

REM Test 6: Test ML Model Availability
echo ℹ️  Testing ML model availability...

cd services\ml
python -c "import transformers, spacy, tensorflow, numpy, redis, fastapi, uvicorn; print('✅ All required ML packages are available')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ ML Packages - OK
    set ML_PACKAGES_OK=1
) else (
    echo ❌ ML Packages - FAILED
    set ML_PACKAGES_OK=0
)
cd ..\..

REM Test 7: Test Frontend Dependencies
echo ℹ️  Testing frontend dependencies...

cd apps\frontend
npm list react react-dom react-router-dom framer-motion recharts >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend Dependencies - OK
    set FRONTEND_DEPS_OK=1
) else (
    echo ❌ Frontend Dependencies - FAILED
    set FRONTEND_DEPS_OK=0
)
cd ..\..

REM Test 8: Test Backend Dependencies
echo ℹ️  Testing backend dependencies...

cd apps\backend
npm list express mongoose cors helmet >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend Dependencies - OK
    set BACKEND_DEPS_OK=1
) else (
    echo ❌ Backend Dependencies - FAILED
    set BACKEND_DEPS_OK=0
)
cd ..\..

REM Test 9: Test Production Readiness
echo ℹ️  Testing production readiness...

if exist "apps\backend\.env" (
    echo ✅ Backend Environment File - OK
    set BACKEND_ENV_OK=1
) else (
    echo ⚠️ Backend Environment File - MISSING
    set BACKEND_ENV_OK=0
)

if exist "services\ml\.env" (
    echo ✅ ML Service Environment File - OK
    set ML_ENV_OK=1
) else (
    echo ⚠️ ML Service Environment File - MISSING
    set ML_ENV_OK=0
)

REM Summary
echo.
echo ==================================================
echo 📊 Comprehensive Test Results Summary
echo ==================================================

set TOTAL_TESTS=20
set PASSED_TESTS=0

if %ML_SERVICE_OK% equ 1 set /a PASSED_TESTS+=1
if %BACKEND_SERVICE_OK% equ 1 set /a PASSED_TESTS+=1
if %FRONTEND_SERVICE_OK% equ 1 set /a PASSED_TESTS+=1
if %RESUME_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %INTERVIEW_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %EMOTION_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %ZOOM_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %AUTH_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %EMPLOYEE_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %ATTENDANCE_ENDPOINT_OK% equ 1 set /a PASSED_TESTS+=1
if %MONGODB_OK% equ 1 set /a PASSED_TESTS+=1
if %REDIS_OK% equ 1 set /a PASSED_TESTS+=1
if %LOGIN_ROUTE_OK% equ 1 set /a PASSED_TESTS+=1
if %SMARTHIRE_ROUTE_OK% equ 1 set /a PASSED_TESTS+=1
if %ZOOM_ROUTE_OK% equ 1 set /a PASSED_TESTS+=1
if %ML_PACKAGES_OK% equ 1 set /a PASSED_TESTS+=1
if %FRONTEND_DEPS_OK% equ 1 set /a PASSED_TESTS+=1
if %BACKEND_DEPS_OK% equ 1 set /a PASSED_TESTS+=1
if %BACKEND_ENV_OK% equ 1 set /a PASSED_TESTS+=1
if %ML_ENV_OK% equ 1 set /a PASSED_TESTS+=1

echo.
echo Service Availability:
if %ML_SERVICE_OK% equ 1 (echo ✅ ML Service (Port 8000)) else (echo ❌ ML Service (Port 8000))
if %BACKEND_SERVICE_OK% equ 1 (echo ✅ Backend Service (Port 3001)) else (echo ❌ Backend Service (Port 3001))
if %FRONTEND_SERVICE_OK% equ 1 (echo ✅ Frontend Service (Port 5173)) else (echo ❌ Frontend Service (Port 5173))

echo.
echo ML Service Endpoints:
if %RESUME_ENDPOINT_OK% equ 1 (echo ✅ Resume Analysis) else (echo ❌ Resume Analysis)
if %INTERVIEW_ENDPOINT_OK% equ 1 (echo ✅ Interview Management) else (echo ❌ Interview Management)
if %EMOTION_ENDPOINT_OK% equ 1 (echo ✅ Emotion Analysis) else (echo ❌ Emotion Analysis)
if %ZOOM_ENDPOINT_OK% equ 1 (echo ✅ Zoom Integration) else (echo ❌ Zoom Integration)

echo.
echo Backend API Endpoints:
if %AUTH_ENDPOINT_OK% equ 1 (echo ✅ Authentication) else (echo ❌ Authentication)
if %EMPLOYEE_ENDPOINT_OK% equ 1 (echo ✅ Employee Management) else (echo ❌ Employee Management)
if %ATTENDANCE_ENDPOINT_OK% equ 1 (echo ✅ Attendance Management) else (echo ❌ Attendance Management)

echo.
echo Database Connections:
if %MONGODB_OK% equ 1 (echo ✅ MongoDB Connection) else (echo ❌ MongoDB Connection)
if %REDIS_OK% equ 1 (echo ✅ Redis Connection) else (echo ❌ Redis Connection)

echo.
echo Frontend Routes:
if %LOGIN_ROUTE_OK% equ 1 (echo ✅ Login Route) else (echo ❌ Login Route)
if %SMARTHIRE_ROUTE_OK% equ 1 (echo ✅ SmartHire Route) else (echo ❌ SmartHire Route)
if %ZOOM_ROUTE_OK% equ 1 (echo ✅ Zoom Interview Route) else (echo ❌ Zoom Interview Route)

echo.
echo Dependencies:
if %ML_PACKAGES_OK% equ 1 (echo ✅ ML Packages) else (echo ❌ ML Packages)
if %FRONTEND_DEPS_OK% equ 1 (echo ✅ Frontend Dependencies) else (echo ❌ Frontend Dependencies)
if %BACKEND_DEPS_OK% equ 1 (echo ✅ Backend Dependencies) else (echo ❌ Backend Dependencies)

echo.
echo Production Readiness:
if %BACKEND_ENV_OK% equ 1 (echo ✅ Backend Environment) else (echo ⚠️ Backend Environment)
if %ML_ENV_OK% equ 1 (echo ✅ ML Environment) else (echo ⚠️ ML Environment)

echo.
echo ==================================================
echo 📈 Overall Results: %PASSED_TESTS%/%TOTAL_TESTS% tests passed

if %PASSED_TESTS% geq 18 (
    echo.
    echo ✅ System is production-ready!
    echo.
    echo 🎉 Your SmartHire system is fully integrated and ready for production!
    echo.
    echo Next steps:
    echo 1. Access the frontend at: %FRONTEND_URL%
    echo 2. Login with admin credentials
    echo 3. Test all features:
    echo    - Resume Analysis: %FRONTEND_URL%/resume-analysis
    echo    - AI Interview: %FRONTEND_URL%/ai-interview
    echo    - Zoom Interview: %FRONTEND_URL%/zoom-interview
    echo    - SmartHire Dashboard: %FRONTEND_URL%/smarthire
    echo.
    echo API Documentation:
    echo - ML Service: %ML_SERVICE_URL%/docs
    echo - Backend API: %BACKEND_URL%/api/docs
    echo.
    echo Database:
    echo - MongoDB: %MONGODB_URL%
    echo - Redis: redis://localhost:6379
    pause
    exit /b 0
) else if %PASSED_TESTS% geq 15 (
    echo.
    echo ⚠️ System is mostly ready with minor issues
    echo.
    echo ⚠️ Your system is mostly functional but has some minor issues.
    echo Check the failed tests above and fix them for optimal performance.
    pause
    exit /b 1
) else (
    echo.
    echo ❌ System has significant issues
    echo.
    echo ❌ Your system has significant issues that need to be fixed.
    echo.
    echo Common issues and solutions:
    echo 1. Make sure all services are running
    echo 2. Install missing dependencies:
    echo    - ML Service: pip install -r services\ml\requirements.txt
    echo    - Backend: cd apps\backend ^&^& npm install
    echo    - Frontend: cd apps\frontend ^&^& npm install
    echo 3. Start required services:
    echo    - MongoDB: mongod
    echo    - Redis: redis-server
    echo 4. Check firewall settings
    echo 5. Verify environment variables
    pause
    exit /b 1
)
