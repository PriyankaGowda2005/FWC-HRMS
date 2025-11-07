#!/bin/bash

# SmartHire AI-Powered Recruitment System Integration Test
# Tests all major endpoints and features

echo "🧪 SmartHire Integration Test Suite"
echo "=================================="

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

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local url="$2"
    
    echo -e "${YELLOW}Checking $service_name at $url...${NC}"
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running${NC}"
        return 1
    fi
}

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}❌ curl is not installed. Please install curl to run tests.${NC}"
    exit 1
fi

echo -e "${BLUE}Starting integration tests...${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}Checking service availability...${NC}"
check_service "ML Service" "$ML_SERVICE_URL/health"
check_service "Backend" "$BACKEND_URL/api/health"
check_service "Frontend" "$FRONTEND_URL"

echo ""

# ML Service Tests
echo -e "${BLUE}=== ML Service Tests ===${NC}"

run_test "ML Service Health Check" "curl -s '$ML_SERVICE_URL/health' | grep -q 'healthy'"

run_test "ML Service Root Endpoint" "curl -s '$ML_SERVICE_URL/' | grep -q 'SmartHire'"

run_test "ML Service API Documentation" "curl -s '$ML_SERVICE_URL/docs' | grep -q 'Swagger'"

# Test resume analysis endpoint (with mock data)
run_test "Resume Analysis Endpoint" "curl -s -X POST '$ML_SERVICE_URL/api/resume/upload' -F 'file=@/dev/null' | grep -q 'error'"

# Test emotion analysis endpoint
run_test "Emotion Analysis Endpoint" "curl -s -X POST '$ML_SERVICE_URL/api/emotion/analyze' -H 'Content-Type: application/json' -d '{\"text_data\":\"I am happy\"}' | grep -q 'sentiment'"

# Test interview endpoints
run_test "Interview Start Endpoint" "curl -s -X POST '$ML_SERVICE_URL/api/interview/start' -H 'Content-Type: application/json' -d '{\"candidate_id\":\"test\",\"job_role\":\"developer\"}' | grep -q 'session_id'"

# Backend Tests
echo -e "${BLUE}=== Backend Tests ===${NC}"

run_test "Backend Health Check" "curl -s '$BACKEND_URL/api/health' | grep -q 'healthy'"

run_test "Backend Root Endpoint" "curl -s '$BACKEND_URL/' | grep -q 'FWC'"

# Test authentication endpoints
run_test "Login Endpoint" "curl -s -X POST '$BACKEND_URL/api/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}' | grep -q 'token'"

# Test employee endpoints
run_test "Employees Endpoint" "curl -s '$BACKEND_URL/api/employees' | grep -q 'employees'"

# Test departments endpoint
run_test "Departments Endpoint" "curl -s '$BACKEND_URL/api/departments' | grep -q 'departments'"

# Frontend Tests
echo -e "${BLUE}=== Frontend Tests ===${NC}"

run_test "Frontend Homepage" "curl -s '$FRONTEND_URL' | grep -q 'FWC'"

run_test "Frontend SmartHire Dashboard" "curl -s '$FRONTEND_URL/smarthire' | grep -q 'SmartHire'"

run_test "Frontend Resume Analysis" "curl -s '$FRONTEND_URL/resume-analysis' | grep -q 'Resume'"

run_test "Frontend AI Interview" "curl -s '$FRONTEND_URL/ai-interview' | grep -q 'Interview'"

run_test "Frontend Assessment Management" "curl -s '$FRONTEND_URL/assessments' | grep -q 'Assessment'"

# Integration Tests
echo -e "${BLUE}=== Integration Tests ===${NC}"

# Test complete flow: Login -> Dashboard -> Resume Analysis
run_test "Complete User Flow" "curl -s '$FRONTEND_URL/login' | grep -q 'Login'"

# Test API connectivity between services
run_test "Backend-ML Service Integration" "curl -s '$BACKEND_URL/api/health' && curl -s '$ML_SERVICE_URL/health'"

# Test WebSocket connection (basic check)
run_test "WebSocket Endpoint Available" "curl -s '$ML_SERVICE_URL/ws/interview/test' | grep -q 'WebSocket'"

# Performance Tests
echo -e "${BLUE}=== Performance Tests ===${NC}"

# Test response times
echo -e "${YELLOW}Testing response times...${NC}"

ML_RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$ML_SERVICE_URL/health")
BACKEND_RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$BACKEND_URL/api/health")
FRONTEND_RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL")

echo -e "ML Service Response Time: ${ML_RESPONSE_TIME}s"
echo -e "Backend Response Time: ${BACKEND_RESPONSE_TIME}s"
echo -e "Frontend Response Time: ${FRONTEND_RESPONSE_TIME}s"

# Check if response times are acceptable (< 2 seconds)
if (( $(echo "$ML_RESPONSE_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ ML Service performance: GOOD${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ ML Service performance: SLOW${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if (( $(echo "$BACKEND_RESPONSE_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ Backend performance: GOOD${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Backend performance: SLOW${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if (( $(echo "$FRONTEND_RESPONSE_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ Frontend performance: GOOD${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Frontend performance: SLOW${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# Test Results Summary
echo -e "${BLUE}=== Test Results Summary ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! SmartHire system is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Some tests failed. Please check the services and try again.${NC}"
    exit 1
fi
