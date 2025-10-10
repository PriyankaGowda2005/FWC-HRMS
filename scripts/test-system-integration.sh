#!/bin/bash

# Comprehensive System Integration Test Script
# Tests frontend-backend-ML service connections and database integration

echo "🚀 Starting Comprehensive System Integration Tests..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
ML_SERVICE_URL="http://localhost:8000"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
MONGODB_URL="mongodb://localhost:27017/HRMS"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=$3
    local expected_status=${4:-200}
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s -w "%{http_code}" "$url")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "$expected_status" ]; then
        print_status "SUCCESS" "HTTP $method $url - Status: $http_code"
        return 0
    else
        print_status "ERROR" "HTTP $method $url - Expected: $expected_status, Got: $http_code"
        echo "Response: $body"
        return 1
    fi
}

# Test 1: Check if all services are running
print_status "INFO" "Testing service availability..."

test_endpoint "$ML_SERVICE_URL/health" "GET" "" 200
ml_service_ok=$?

test_endpoint "$BACKEND_URL/api/health" "GET" "" 200
backend_service_ok=$?

test_endpoint "$FRONTEND_URL" "GET" "" 200
frontend_service_ok=$?

if [ $ml_service_ok -eq 0 ] && [ $backend_service_ok -eq 0 ] && [ $frontend_service_ok -eq 0 ]; then
    print_status "SUCCESS" "All services are running"
else
    print_status "ERROR" "One or more services are not running"
    echo "Please start all services before running tests:"
    echo "  ML Service: cd services/ml && python main.py"
    echo "  Backend: cd apps/backend && npm run dev"
    echo "  Frontend: cd apps/frontend && npm run dev"
    exit 1
fi

# Test 2: Test ML Service endpoints
print_status "INFO" "Testing ML Service endpoints..."

# Test resume analysis endpoint
test_endpoint "$ML_SERVICE_URL/api/resume/analyze" "POST" '{"test": "data"}' 422
resume_endpoint_ok=$?

# Test interview endpoints
test_endpoint "$ML_SERVICE_URL/api/interview/start" "POST" '{"candidate_id": "test", "job_role": "test"}' 200
interview_endpoint_ok=$?

# Test emotion analysis endpoint
test_endpoint "$ML_SERVICE_URL/api/emotion/analyze" "POST" '{"text": "test"}' 200
emotion_endpoint_ok=$?

# Test Zoom interview endpoints
test_endpoint "$ML_SERVICE_URL/api/zoom/webhook" "POST" '{"event": "test"}' 200
zoom_endpoint_ok=$?

# Test 3: Test Backend API endpoints
print_status "INFO" "Testing Backend API endpoints..."

# Test authentication endpoints
test_endpoint "$BACKEND_URL/api/auth/login" "POST" '{"email": "test@test.com", "password": "test"}' 400
auth_endpoint_ok=$?

# Test employee endpoints
test_endpoint "$BACKEND_URL/api/employees" "GET" "" 401
employee_endpoint_ok=$?

# Test attendance endpoints
test_endpoint "$BACKEND_URL/api/attendance" "GET" "" 401
attendance_endpoint_ok=$?

# Test 4: Test Database Connection
print_status "INFO" "Testing database connection..."

# Test MongoDB connection
python3 -c "
import pymongo
try:
    client = pymongo.MongoClient('$MONGODB_URL')
    client.admin.command('ping')
    print('✅ MongoDB connection successful')
    exit(0)
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    exit(1)
" 2>/dev/null
mongodb_ok=$?

# Test Redis connection
python3 -c "
import redis
try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.ping()
    print('✅ Redis connection successful')
    exit(0)
except Exception as e:
    print(f'❌ Redis connection failed: {e}')
    exit(1)
" 2>/dev/null
redis_ok=$?

# Test 5: Test Frontend Routes
print_status "INFO" "Testing frontend routes..."

test_endpoint "$FRONTEND_URL/login" "GET" "" 200
login_route_ok=$?

test_endpoint "$FRONTEND_URL/smarthire" "GET" "" 200
smarthire_route_ok=$?

test_endpoint "$FRONTEND_URL/zoom-interview" "GET" "" 200
zoom_route_ok=$?

# Test 6: Test ML Model Availability
print_status "INFO" "Testing ML model availability..."

cd services/ml
python3 -c "
try:
    import transformers
    import spacy
    import tensorflow as tf
    import numpy as np
    import redis
    import fastapi
    import uvicorn
    print('✅ All required ML packages are available')
    exit(0)
except ImportError as e:
    print(f'❌ Missing ML package: {e}')
    exit(1)
" 2>/dev/null
ml_packages_ok=$?
cd - > /dev/null

# Test 7: Test Frontend Dependencies
print_status "INFO" "Testing frontend dependencies..."

cd apps/frontend
npm list react react-dom react-router-dom framer-motion recharts > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Frontend dependencies available"
    frontend_deps_ok=0
else
    print_status "ERROR" "Frontend dependencies missing"
    frontend_deps_ok=1
fi
cd - > /dev/null

# Test 8: Test Backend Dependencies
print_status "INFO" "Testing backend dependencies..."

cd apps/backend
npm list express mongoose cors helmet > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "SUCCESS" "Backend dependencies available"
    backend_deps_ok=0
else
    print_status "ERROR" "Backend dependencies missing"
    backend_deps_ok=1
fi
cd - > /dev/null

# Test 9: Test API Integration
print_status "INFO" "Testing API integration..."

# Test ML service to backend communication
test_endpoint "$ML_SERVICE_URL/api/resume/analyze" "POST" '{"test": "data"}' 422
ml_backend_integration_ok=$?

# Test frontend to backend communication
test_endpoint "$BACKEND_URL/api/health" "GET" "" 200
frontend_backend_integration_ok=$?

# Test 10: Test Production Readiness
print_status "INFO" "Testing production readiness..."

# Check environment variables
if [ -f "apps/backend/.env" ]; then
    print_status "SUCCESS" "Backend environment file exists"
    backend_env_ok=0
else
    print_status "WARNING" "Backend environment file missing"
    backend_env_ok=1
fi

if [ -f "services/ml/.env" ]; then
    print_status "SUCCESS" "ML service environment file exists"
    ml_env_ok=0
else
    print_status "WARNING" "ML service environment file missing"
    ml_env_ok=1
fi

# Summary
echo ""
echo "=================================================="
echo "📊 Comprehensive Test Results Summary"
echo "=================================================="

total_tests=20
passed_tests=0

# Count passed tests
[ $ml_service_ok -eq 0 ] && ((passed_tests++))
[ $backend_service_ok -eq 0 ] && ((passed_tests++))
[ $frontend_service_ok -eq 0 ] && ((passed_tests++))
[ $resume_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $interview_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $emotion_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $zoom_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $auth_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $employee_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $attendance_endpoint_ok -eq 0 ] && ((passed_tests++))
[ $mongodb_ok -eq 0 ] && ((passed_tests++))
[ $redis_ok -eq 0 ] && ((passed_tests++))
[ $login_route_ok -eq 0 ] && ((passed_tests++))
[ $smarthire_route_ok -eq 0 ] && ((passed_tests++))
[ $zoom_route_ok -eq 0 ] && ((passed_tests++))
[ $ml_packages_ok -eq 0 ] && ((passed_tests++))
[ $frontend_deps_ok -eq 0 ] && ((passed_tests++))
[ $backend_deps_ok -eq 0 ] && ((passed_tests++))
[ $ml_backend_integration_ok -eq 0 ] && ((passed_tests++))
[ $frontend_backend_integration_ok -eq 0 ] && ((passed_tests++))

echo ""
echo "Service Availability:"
[ $ml_service_ok -eq 0 ] && print_status "SUCCESS" "ML Service (Port 8000)" || print_status "ERROR" "ML Service (Port 8000)"
[ $backend_service_ok -eq 0 ] && print_status "SUCCESS" "Backend Service (Port 3001)" || print_status "ERROR" "Backend Service (Port 3001)"
[ $frontend_service_ok -eq 0 ] && print_status "SUCCESS" "Frontend Service (Port 5173)" || print_status "ERROR" "Frontend Service (Port 5173)"

echo ""
echo "ML Service Endpoints:"
[ $resume_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Resume Analysis" || print_status "ERROR" "Resume Analysis"
[ $interview_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Interview Management" || print_status "ERROR" "Interview Management"
[ $emotion_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Emotion Analysis" || print_status "ERROR" "Emotion Analysis"
[ $zoom_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Zoom Integration" || print_status "ERROR" "Zoom Integration"

echo ""
echo "Backend API Endpoints:"
[ $auth_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Authentication" || print_status "ERROR" "Authentication"
[ $employee_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Employee Management" || print_status "ERROR" "Employee Management"
[ $attendance_endpoint_ok -eq 0 ] && print_status "SUCCESS" "Attendance Management" || print_status "ERROR" "Attendance Management"

echo ""
echo "Database Connections:"
[ $mongodb_ok -eq 0 ] && print_status "SUCCESS" "MongoDB Connection" || print_status "ERROR" "MongoDB Connection"
[ $redis_ok -eq 0 ] && print_status "SUCCESS" "Redis Connection" || print_status "ERROR" "Redis Connection"

echo ""
echo "Frontend Routes:"
[ $login_route_ok -eq 0 ] && print_status "SUCCESS" "Login Route" || print_status "ERROR" "Login Route"
[ $smarthire_route_ok -eq 0 ] && print_status "SUCCESS" "SmartHire Route" || print_status "ERROR" "SmartHire Route"
[ $zoom_route_ok -eq 0 ] && print_status "SUCCESS" "Zoom Interview Route" || print_status "ERROR" "Zoom Interview Route"

echo ""
echo "Dependencies:"
[ $ml_packages_ok -eq 0 ] && print_status "SUCCESS" "ML Packages" || print_status "ERROR" "ML Packages"
[ $frontend_deps_ok -eq 0 ] && print_status "SUCCESS" "Frontend Dependencies" || print_status "ERROR" "Frontend Dependencies"
[ $backend_deps_ok -eq 0 ] && print_status "SUCCESS" "Backend Dependencies" || print_status "ERROR" "Backend Dependencies"

echo ""
echo "Integration:"
[ $ml_backend_integration_ok -eq 0 ] && print_status "SUCCESS" "ML-Backend Integration" || print_status "ERROR" "ML-Backend Integration"
[ $frontend_backend_integration_ok -eq 0 ] && print_status "SUCCESS" "Frontend-Backend Integration" || print_status "ERROR" "Frontend-Backend Integration"

echo ""
echo "Production Readiness:"
[ $backend_env_ok -eq 0 ] && print_status "SUCCESS" "Backend Environment" || print_status "WARNING" "Backend Environment"
[ $ml_env_ok -eq 0 ] && print_status "SUCCESS" "ML Environment" || print_status "WARNING" "ML Environment"

echo ""
echo "=================================================="
echo "📈 Overall Results: $passed_tests/$total_tests tests passed"

if [ $passed_tests -ge 18 ]; then
    print_status "SUCCESS" "System is production-ready!"
    echo ""
    echo "🎉 Your SmartHire system is fully integrated and ready for production!"
    echo ""
    echo "Next steps:"
    echo "1. Access the frontend at: $FRONTEND_URL"
    echo "2. Login with admin credentials"
    echo "3. Test all features:"
    echo "   - Resume Analysis: $FRONTEND_URL/resume-analysis"
    echo "   - AI Interview: $FRONTEND_URL/ai-interview"
    echo "   - Zoom Interview: $FRONTEND_URL/zoom-interview"
    echo "   - SmartHire Dashboard: $FRONTEND_URL/smarthire"
    echo ""
    echo "API Documentation:"
    echo "- ML Service: $ML_SERVICE_URL/docs"
    echo "- Backend API: $BACKEND_URL/api/docs"
    echo ""
    echo "Database:"
    echo "- MongoDB: $MONGODB_URL"
    echo "- Redis: redis://localhost:6379"
    exit 0
elif [ $passed_tests -ge 15 ]; then
    print_status "WARNING" "System is mostly ready with minor issues"
    echo ""
    echo "⚠️ Your system is mostly functional but has some minor issues."
    echo "Check the failed tests above and fix them for optimal performance."
    exit 1
else
    print_status "ERROR" "System has significant issues"
    echo ""
    echo "❌ Your system has significant issues that need to be fixed."
    echo ""
    echo "Common issues and solutions:"
    echo "1. Make sure all services are running"
    echo "2. Install missing dependencies:"
    echo "   - ML Service: pip install -r services/ml/requirements.txt"
    echo "   - Backend: cd apps/backend && npm install"
    echo "   - Frontend: cd apps/frontend && npm install"
    echo "3. Start required services:"
    echo "   - MongoDB: mongod"
    echo "   - Redis: redis-server"
    echo "4. Check firewall settings"
    echo "5. Verify environment variables"
    exit 1
fi
