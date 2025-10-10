@echo off
REM SmartHire AI-Powered Recruitment System Integration Test for Windows
REM Tests all major endpoints and features

echo 🧪 SmartHire Integration Test Suite
echo ==================================

set ML_SERVICE_URL=http://localhost:8000
set BACKEND_URL=http://localhost:3001
set FRONTEND_URL=http://localhost:5173

set TESTS_PASSED=0
set TESTS_FAILED=0
set TOTAL_TESTS=0

echo Starting integration tests...
echo.

REM Check if services are running
echo Checking service availability...
curl -s %ML_SERVICE_URL%/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ML Service is running
) else (
    echo ❌ ML Service is not running
)

curl -s %BACKEND_URL%/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not running
)

curl -s %FRONTEND_URL% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend is not running
)

echo.

REM ML Service Tests
echo === ML Service Tests ===

curl -s %ML_SERVICE_URL%/health | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: ML Service Health Check
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: ML Service Health Check
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

curl -s %ML_SERVICE_URL%/ | findstr "SmartHire" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: ML Service Root Endpoint
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: ML Service Root Endpoint
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

curl -s %ML_SERVICE_URL%/docs | findstr "Swagger" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: ML Service API Documentation
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: ML Service API Documentation
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

echo.

REM Backend Tests
echo === Backend Tests ===

curl -s %BACKEND_URL%/api/health | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: Backend Health Check
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: Backend Health Check
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

curl -s %BACKEND_URL%/ | findstr "FWC" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: Backend Root Endpoint
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: Backend Root Endpoint
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

echo.

REM Frontend Tests
echo === Frontend Tests ===

curl -s %FRONTEND_URL% | findstr "FWC" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: Frontend Homepage
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: Frontend Homepage
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

curl -s %FRONTEND_URL%/smarthire | findstr "SmartHire" >nul
if %errorlevel% equ 0 (
    echo ✅ PASSED: Frontend SmartHire Dashboard
    set /a TESTS_PASSED+=1
) else (
    echo ❌ FAILED: Frontend SmartHire Dashboard
    set /a TESTS_FAILED+=1
)
set /a TOTAL_TESTS+=1

echo.

REM Test Results Summary
echo === Test Results Summary ===
echo Total Tests: %TOTAL_TESTS%
echo Passed: %TESTS_PASSED%
echo Failed: %TESTS_FAILED%

if %TESTS_FAILED% equ 0 (
    echo 🎉 All tests passed! SmartHire system is working correctly.
) else (
    echo ⚠️ Some tests failed. Please check the services and try again.
)

echo.
echo Press any key to exit...
pause >nul
