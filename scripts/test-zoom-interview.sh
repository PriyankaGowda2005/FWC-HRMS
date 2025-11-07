#!/bin/bash

# Zoom Interview Analysis Integration Test Script
# Tests the complete real-time Zoom interview analysis flow

echo "🚀 Starting Zoom Interview Analysis Integration Tests..."
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
TEST_SESSION_ID="test-session-$(date +%s)"

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

# Function to test WebSocket connection
test_websocket() {
    local url=$1
    print_status "INFO" "Testing WebSocket connection to $url"
    
    # Use websocat if available, otherwise skip
    if command -v websocat &> /dev/null; then
        echo '{"type": "ping"}' | timeout 5 websocat "$url" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "SUCCESS" "WebSocket connection successful"
            return 0
        else
            print_status "ERROR" "WebSocket connection failed"
            return 1
        fi
    else
        print_status "WARNING" "websocat not available, skipping WebSocket test"
        return 0
    fi
}

# Test 1: Check if services are running
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

# Test 2: Test Zoom webhook endpoint
print_status "INFO" "Testing Zoom webhook endpoint..."

webhook_data='{
    "event": "meeting.started",
    "payload": {
        "object": {
            "id": "test-meeting-123",
            "topic": "Test Interview",
            "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
        }
    },
    "event_ts": '$(date +%s)'
}'

test_endpoint "$ML_SERVICE_URL/api/zoom/webhook" "POST" "$webhook_data" 200
webhook_ok=$?

# Test 3: Test session creation
print_status "INFO" "Testing interview session creation..."

session_data='{
    "meeting_id": "test-meeting-123",
    "job_role": "Software Engineer",
    "job_requirements": ["JavaScript", "React", "Node.js", "Python"],
    "candidate_id": "test-candidate-123"
}'

test_endpoint "$ML_SERVICE_URL/api/zoom/start-session" "POST" "$session_data" 200
session_ok=$?

# Test 4: Test WebSocket connection
print_status "INFO" "Testing WebSocket connection..."

test_websocket "ws://localhost:8000/api/zoom/live-feed/$TEST_SESSION_ID"
websocket_ok=$?

# Test 5: Test session data retrieval
print_status "INFO" "Testing session data retrieval..."

# First create a session to test retrieval
session_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$session_data" "$ML_SERVICE_URL/api/zoom/start-session")
session_id=$(echo "$session_response" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$session_id" ]; then
    test_endpoint "$ML_SERVICE_URL/api/zoom/session/$session_id" "GET" "" 200
    session_data_ok=$?
else
    print_status "ERROR" "Failed to create session for data retrieval test"
    session_data_ok=1
fi

# Test 6: Test audio file upload
print_status "INFO" "Testing audio file upload..."

# Create a dummy audio file for testing
echo "dummy audio content" > /tmp/test_audio.wav

if [ -n "$session_id" ]; then
    upload_response=$(curl -s -w "%{http_code}" -X POST \
        -F "session_id=$session_id" \
        -F "file=@/tmp/test_audio.wav" \
        "$ML_SERVICE_URL/api/zoom/upload-audio")
    
    upload_http_code="${upload_response: -3}"
    if [ "$upload_http_code" = "200" ]; then
        print_status "SUCCESS" "Audio file upload test passed"
        upload_ok=0
    else
        print_status "ERROR" "Audio file upload test failed - Status: $upload_http_code"
        upload_ok=1
    fi
else
    print_status "WARNING" "Skipping audio upload test - no session ID"
    upload_ok=0
fi

# Clean up test file
rm -f /tmp/test_audio.wav

# Test 7: Test session ending
print_status "INFO" "Testing session ending..."

if [ -n "$session_id" ]; then
    test_endpoint "$ML_SERVICE_URL/api/zoom/session/$session_id/end" "POST" "" 200
    end_session_ok=$?
else
    print_status "WARNING" "Skipping session end test - no session ID"
    end_session_ok=0
fi

# Test 8: Test frontend routes
print_status "INFO" "Testing frontend routes..."

test_endpoint "$FRONTEND_URL/zoom-interview" "GET" "" 200
frontend_route_ok=$?

# Test 9: Test ML model availability
print_status "INFO" "Testing ML model availability..."

# Test if the required Python packages are available
cd services/ml
python3 -c "
try:
    import transformers
    import spacy
    import tensorflow as tf
    import numpy as np
    print('✅ All required ML packages are available')
    exit(0)
except ImportError as e:
    print(f'❌ Missing ML package: {e}')
    exit(1)
" 2>/dev/null
ml_packages_ok=$?
cd - > /dev/null

# Test 10: Test Redis connection
print_status "INFO" "Testing Redis connection..."

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

# Summary
echo ""
echo "=================================================="
echo "📊 Test Results Summary"
echo "=================================================="

total_tests=10
passed_tests=0

# Count passed tests
[ $ml_service_ok -eq 0 ] && ((passed_tests++))
[ $backend_service_ok -eq 0 ] && ((passed_tests++))
[ $frontend_service_ok -eq 0 ] && ((passed_tests++))
[ $webhook_ok -eq 0 ] && ((passed_tests++))
[ $session_ok -eq 0 ] && ((passed_tests++))
[ $websocket_ok -eq 0 ] && ((passed_tests++))
[ $session_data_ok -eq 0 ] && ((passed_tests++))
[ $upload_ok -eq 0 ] && ((passed_tests++))
[ $end_session_ok -eq 0 ] && ((passed_tests++))
[ $frontend_route_ok -eq 0 ] && ((passed_tests++))
[ $ml_packages_ok -eq 0 ] && ((passed_tests++))
[ $redis_ok -eq 0 ] && ((passed_tests++))

total_tests=12

echo ""
echo "Service Availability:"
[ $ml_service_ok -eq 0 ] && print_status "SUCCESS" "ML Service (Port 8000)" || print_status "ERROR" "ML Service (Port 8000)"
[ $backend_service_ok -eq 0 ] && print_status "SUCCESS" "Backend Service (Port 3001)" || print_status "ERROR" "Backend Service (Port 3001)"
[ $frontend_service_ok -eq 0 ] && print_status "SUCCESS" "Frontend Service (Port 5173)" || print_status "ERROR" "Frontend Service (Port 5173)"

echo ""
echo "API Endpoints:"
[ $webhook_ok -eq 0 ] && print_status "SUCCESS" "Zoom Webhook Endpoint" || print_status "ERROR" "Zoom Webhook Endpoint"
[ $session_ok -eq 0 ] && print_status "SUCCESS" "Session Creation" || print_status "ERROR" "Session Creation"
[ $session_data_ok -eq 0 ] && print_status "SUCCESS" "Session Data Retrieval" || print_status "ERROR" "Session Data Retrieval"
[ $upload_ok -eq 0 ] && print_status "SUCCESS" "Audio File Upload" || print_status "ERROR" "Audio File Upload"
[ $end_session_ok -eq 0 ] && print_status "SUCCESS" "Session Ending" || print_status "ERROR" "Session Ending"

echo ""
echo "Real-time Features:"
[ $websocket_ok -eq 0 ] && print_status "SUCCESS" "WebSocket Connection" || print_status "ERROR" "WebSocket Connection"

echo ""
echo "Frontend:"
[ $frontend_route_ok -eq 0 ] && print_status "SUCCESS" "Zoom Interview Route" || print_status "ERROR" "Zoom Interview Route"

echo ""
echo "Dependencies:"
[ $ml_packages_ok -eq 0 ] && print_status "SUCCESS" "ML Packages" || print_status "ERROR" "ML Packages"
[ $redis_ok -eq 0 ] && print_status "SUCCESS" "Redis Connection" || print_status "ERROR" "Redis Connection"

echo ""
echo "=================================================="
echo "📈 Overall Results: $passed_tests/$total_tests tests passed"

if [ $passed_tests -eq $total_tests ]; then
    print_status "SUCCESS" "All tests passed! Zoom Interview Analysis system is ready."
    echo ""
    echo "🎉 Your Zoom Interview Analysis system is fully functional!"
    echo ""
    echo "Next steps:"
    echo "1. Access the frontend at: $FRONTEND_URL/zoom-interview"
    echo "2. Configure Zoom webhook URL: $ML_SERVICE_URL/api/zoom/webhook"
    echo "3. Test with real Zoom meetings"
    echo ""
    echo "API Documentation: $ML_SERVICE_URL/docs"
    exit 0
else
    print_status "ERROR" "Some tests failed. Please check the errors above."
    echo ""
    echo "Common issues and solutions:"
    echo "1. Make sure all services are running"
    echo "2. Install missing Python packages: pip install -r services/ml/requirements.txt"
    echo "3. Start Redis server: redis-server"
    echo "4. Check firewall settings for WebSocket connections"
    exit 1
fi
