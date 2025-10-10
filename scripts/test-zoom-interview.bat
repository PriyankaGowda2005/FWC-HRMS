@echo off
REM Zoom Interview Analysis Integration Test Script for Windows
REM Tests the complete real-time Zoom interview analysis flow

echo 🚀 Starting Zoom Interview Analysis Integration Tests...
echo ==================================================

REM Test configuration
set ML_SERVICE_URL=http://localhost:8000
set BACKEND_URL=http://localhost:3001
set FRONTEND_URL=http://localhost:5173
set TEST_SESSION_ID=test-session-%RANDOM%

REM Test 1: Check if services are running
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

REM Test 2: Test Zoom webhook endpoint
echo ℹ️  Testing Zoom webhook endpoint...

curl -s -X POST -H "Content-Type: application/json" -d "{\"event\":\"meeting.started\",\"payload\":{\"object\":{\"id\":\"test-meeting-123\",\"topic\":\"Test Interview\"}},\"event_ts\":%RANDOM%}" "%ML_SERVICE_URL%/api/zoom/webhook" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo ✅ Zoom Webhook Endpoint - OK
    set WEBHOOK_OK=1
) else (
    echo ❌ Zoom Webhook Endpoint - FAILED
    set WEBHOOK_OK=0
)

REM Test 3: Test session creation
echo ℹ️  Testing interview session creation...

curl -s -X POST -H "Content-Type: application/json" -d "{\"meeting_id\":\"test-meeting-123\",\"job_role\":\"Software Engineer\",\"job_requirements\":[\"JavaScript\",\"React\",\"Node.js\",\"Python\"],\"candidate_id\":\"test-candidate-123\"}" "%ML_SERVICE_URL%/api/zoom/start-session" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo ✅ Session Creation - OK
    set SESSION_OK=1
) else (
    echo ❌ Session Creation - FAILED
    set SESSION_OK=0
)

REM Test 4: Test frontend routes
echo ℹ️  Testing frontend routes...

curl -s -w "%%{http_code}" "%FRONTEND_URL%/zoom-interview" | findstr "200" >nul
if %errorlevel% equ 0 (
    echo ✅ Zoom Interview Route - OK
    set FRONTEND_ROUTE_OK=1
) else (
    echo ❌ Zoom Interview Route - FAILED
    set FRONTEND_ROUTE_OK=0
)

REM Test 5: Test ML model availability
echo ℹ️  Testing ML model availability...

cd services\ml
python -c "import transformers, spacy, tensorflow, numpy; print('✅ All required ML packages are available')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ ML Packages - OK
    set ML_PACKAGES_OK=1
) else (
    echo ❌ ML Packages - FAILED
    set ML_PACKAGES_OK=0
)
cd ..\..

REM Test 6: Test Redis connection
echo ℹ️  Testing Redis connection...

python -c "import redis; r = redis.Redis(host='localhost', port=6379, db=0); r.ping(); print('✅ Redis connection successful')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Redis Connection - OK
    set REDIS_OK=1
) else (
    echo ❌ Redis Connection - FAILED
    set REDIS_OK=0
)

REM Summary
echo.
echo ==================================================
echo 📊 Test Results Summary
echo ==================================================

set TOTAL_TESTS=6
set PASSED_TESTS=0

if %ML_SERVICE_OK% equ 1 set /a PASSED_TESTS+=1
if %BACKEND_SERVICE_OK% equ 1 set /a PASSED_TESTS+=1
if %FRONTEND_SERVICE_OK% equ 1 set /a PASSED_TESTS+=1
if %WEBHOOK_OK% equ 1 set /a PASSED_TESTS+=1
if %SESSION_OK% equ 1 set /a PASSED_TESTS+=1
if %FRONTEND_ROUTE_OK% equ 1 set /a PASSED_TESTS+=1
if %ML_PACKAGES_OK% equ 1 set /a PASSED_TESTS+=1
if %REDIS_OK% equ 1 set /a PASSED_TESTS+=1

set TOTAL_TESTS=8

echo.
echo Service Availability:
if %ML_SERVICE_OK% equ 1 (echo ✅ ML Service (Port 8000)) else (echo ❌ ML Service (Port 8000))
if %BACKEND_SERVICE_OK% equ 1 (echo ✅ Backend Service (Port 3001)) else (echo ❌ Backend Service (Port 3001))
if %FRONTEND_SERVICE_OK% equ 1 (echo ✅ Frontend Service (Port 5173)) else (echo ❌ Frontend Service (Port 5173))

echo.
echo API Endpoints:
if %WEBHOOK_OK% equ 1 (echo ✅ Zoom Webhook Endpoint) else (echo ❌ Zoom Webhook Endpoint)
if %SESSION_OK% equ 1 (echo ✅ Session Creation) else (echo ❌ Session Creation)

echo.
echo Frontend:
if %FRONTEND_ROUTE_OK% equ 1 (echo ✅ Zoom Interview Route) else (echo ❌ Zoom Interview Route)

echo.
echo Dependencies:
if %ML_PACKAGES_OK% equ 1 (echo ✅ ML Packages) else (echo ❌ ML Packages)
if %REDIS_OK% equ 1 (echo ✅ Redis Connection) else (echo ❌ Redis Connection)

echo.
echo ==================================================
echo 📈 Overall Results: %PASSED_TESTS%/%TOTAL_TESTS% tests passed

if %PASSED_TESTS% equ %TOTAL_TESTS% (
    echo.
    echo ✅ All tests passed! Zoom Interview Analysis system is ready.
    echo.
    echo 🎉 Your Zoom Interview Analysis system is fully functional!
    echo.
    echo Next steps:
    echo 1. Access the frontend at: %FRONTEND_URL%/zoom-interview
    echo 2. Configure Zoom webhook URL: %ML_SERVICE_URL%/api/zoom/webhook
    echo 3. Test with real Zoom meetings
    echo.
    echo API Documentation: %ML_SERVICE_URL%/docs
    pause
    exit /b 0
) else (
    echo.
    echo ❌ Some tests failed. Please check the errors above.
    echo.
    echo Common issues and solutions:
    echo 1. Make sure all services are running
    echo 2. Install missing Python packages: pip install -r services\ml\requirements.txt
    echo 3. Start Redis server: redis-server
    echo 4. Check firewall settings for WebSocket connections
    pause
    exit /b 1
)
