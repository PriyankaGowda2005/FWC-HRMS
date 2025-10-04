#!/bin/bash

# 🎉 FWC HRMS Complete System Demo
# This script demonstrates the FULL HRMS platform with all features

set -e

echo "🚀 Starting FWC HRMS Complete Demo..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC现在我继续完成剩余实现:
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "Node.js and npm are available"

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local count=0
    
    print_info "Waiting for $service_name to be ready..."
    
    while [ $count -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_status "$service_name is ready!"
            return 0
        fi
        
        count=$((count + 1))
        printf "."
        sleep 2
    done
    
    print_warning "$service_name may not be ready. Proceeding anyway..."
    return 1
}

# Step 1: Start Docker services
print_info "Step 1: Starting Docker services (MongoDB, Redis)"
docker-compose up -d mongodb redis

# Wait for services to be ready
wait_for_service "http://localhost:27017" "MongoDB"
wait_for_service "http://localhost:6379" "Redis"

# Step 2: Install dependencies
print_info "Step 2: Installing dependencies..."

# Install root dependencies
npm install
print_status "Root dependencies installed"

# Install backend dependencies
cd apps/backend
npm install
print_status "Backend dependencies installed"

# Install frontend dependencies
cd ../frontend
npm install
print_status "Frontend dependencies installed"

# Install ML service dependencies
cd ../../services/ml
pip install -r requirements.txt
print_status "ML service dependencies installed"

cd ../..

# Step 3: Set up database
print_info "Step 3: Setting up database..."

cd apps/backend
npx prisma generate
npx prisma db push
print_status "Prisma client generated and database schema applied"

# Step 4: Generate Prisma client
cd apps/backend
npx prisma generate

# Step 5: Create demo users and data
print_info "Step 5: Creating demo data..."
node scripts/mongo-init.js
print_status "Demo data created"

cd ../..

# Step 6: Start services
print_info "Step 6: Starting all services..."

# Start MongoDB and Redis if not running
docker-compose up -d mongodb redis

# Start ML service in background
print_info "Starting ML service..."
cd services/ml
python main.py &
ML_SERVICE_PID=$!
cd ../..

# Wait for ML service
sleep 5

# Start backend in background
print_info "Starting backend service..."
cd apps/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Start frontend in background
print_info "Starting frontend service..."
cd apps/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for services to be ready
wait_for_service "http://localhost:3001/health" "Backend API"
wait_for_service "http://localhost:5173" "Frontend App"
wait_for_service "http://localhost:8000/docs" "ML Service"

# Step 7: Run comprehensive tests
print_info "Step 7: Running comprehensive tests..."

# Navigate to backend and run tests
cd apps/backend
npm test
TEST_EXIT_CODE=$?
cd ../..

if test $TEST_EXIT_CODE -eq 0; then
    print_status "All tests passed!"
else
    print_warning "Some tests failed. Check test output above."
fi

# Step 8: Display demo information
echo ""
echo "🎉 FWC HRMS Complete System Demo is Ready!"
echo "=============================================="
echo ""
echo -e "${GREEN}🌐 Service URLs:${NC}"
echo "├── Frontend App:     http://localhost:5173"
echo "├── Backend API:      http://localhost:3001"
echo "├── ML Service:       http://localhost:8000"
echo "├── ML Docs:          http://localhost:8000/docs"
echo "├── MongoDB:          mongodb://localhost:27017"
echo "└── Redis:            redis://localhost:6379"
echo ""

echo -e "${GREEN}🔐 Demo Credentials:${NC}"
echo "├── Admin Dashboard:"
echo "│   ├── Email:    admin@example.com"
echo "│   └── Password: admin123"
echo ""
echo "├── Employee Portal:"
echo "│   ├── Email:    employee@example.com"
echo "│   └── Password: employee123"
echo ""

echo -e "${GREEN}🚀 Key Features Available:${NC}"
echo "├── 👥 Employee Management (CRUD, departments, hierarchy)"
echo "├── ⏰ Time & Attendance (clock-in/out, reporting)"
echo "├── 📝 Leave Management (requests, approvals, balances)"
echo "├── 💰 Payroll System (processing, reports, analytics)"
echo "├── 📊 Performance Reviews (360-degree feedback)"
echo "├── 🧑‍💼 Recruitment Pipeline (job postings, candidates)"
echo "├── 🤖 AI Resume Parser (skills extraction, matching)"
echo "├── 🎤 Interview Bot (automated interviews)"
echo "├── 📨 Email Notifications (SMTP integration)"
echo "├── 🔄 Background Jobs (BullMQ queues)"
echo "└── 🛡️ Advanced Security (RBAC, validation)"
echo ""

echo -e "${GREEN}📋 Quick API Tests:${NC}"
echo "├── Health Check:    curl http://localhost:3001/health"
echo "├── Auth Login:      curl -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'"
echo "├── Get Departments: curl http://localhost:3001/api/departments"
echo "└── Get Candidates:  curl http://localhost:3001/api/candidates"
echo ""

echo -e "${GREEN}🧪 Test Resume Upload:${NC}"
echo "└── Upload Test:     curl -X POST http://localhost:8000/api/resume/analyze -H 'Content-Type: application/json' -d '{\"file_path\":\"test-resume.pdf\",\"job_requirements\":[\"Python\",\"React\"]}'"
echo ""

echo -e "${GREEN}📊 Business Intelligence:${NC}"
echo "├── Real-time analytics dashboard"
echo "├── Department performance metrics"
echo "├── Recruitment funnel analysis"
echo "├── Employee retention insights"
echo "└── Cost center optimization"
echo ""

echo -e "${GREEN}🔧 Architecture Highlights:${NC}"
echo "├── Monorepo structure with microservices"
echo "├── MongoDB + Prisma ORM (type-safe database)"
echo "├── JWT authentication with refresh tokens"
echo "├── FastAPI + Python ML services"
echo "├── Redis + BullMQ for background jobs"
echo "├── Docker containerization"
echo "└── CI/CD pipeline ready"
echo ""

echo -e "${YELLOW}⚠️  Demo Management Commands:${NC}"
echo "├── Stop Services:   pkill -f 'node.*dev' && pkill -f 'python.*main.py'"
echo "├── Stop Docker:     docker-compose down"
echo "├── View Logs:       docker-compose logs -f"
echo "└── Clean Start:     ./scripts/demo-final.sh"
echo ""

echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "├── Try uploading a PDF resume to see ML parsing"
echo "├── Submit a job application to test the workflow"
echo "├── Clock in/out to test attendance tracking"
echo "├── Request leave and approve it as different users"
echo "└── Process payroll for demonstration"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Cleaning up services..."
    
    # Kill service processes
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $ML_SERVICE_PID 2>/dev/null || true
    
    # Stop Docker services
    docker-compose down
    
    print_status "Demo cleanup completed"
    exit 0
}

# Set up signal handlers for cleanup
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}🎉 Demo is running! Press Ctrl+C to stop and cleanup.${NC}"
echo ""

# Keep the script running
print_info "Services are running. Open http://localhost:5173 to start exploring."
print_info "Check the URLs above to access different services."

# Wait for user interrupt
while true; do
    sleep 30
    print_info "Demo is still running... Press Ctrl+C to stop."
done
