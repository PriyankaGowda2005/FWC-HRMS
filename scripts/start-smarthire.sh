#!/bin/bash

# SmartHire AI-Powered Recruitment System Startup Script
# Complete system with FastAPI backend, React frontend, and ML services

echo "🚀 Starting SmartHire AI-Powered Recruitment System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

# Check Python
if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8+${NC}"
    exit 1
fi

# Check pip
if ! command_exists pip3; then
    echo -e "${RED}❌ pip3 is not installed. Please install pip3${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p services/ml/uploads/resumes
mkdir -p services/ml/reports
mkdir -p services/ml/templates
mkdir -p services/ml/assets

# Install Python dependencies for ML service
echo -e "${BLUE}Installing Python dependencies for ML service...${NC}"
cd services/ml
if [ -f requirements.txt ]; then
    pip3 install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Python dependencies${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ requirements.txt not found, skipping Python dependencies${NC}"
fi
cd ../..

# Install Node.js dependencies for frontend
echo -e "${BLUE}Installing Node.js dependencies for frontend...${NC}"
cd apps/frontend
if [ -f package.json ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ package.json not found, skipping frontend dependencies${NC}"
fi
cd ../..

# Install Node.js dependencies for backend
echo -e "${BLUE}Installing Node.js dependencies for backend...${NC}"
cd apps/backend
if [ -f package.json ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ package.json not found, skipping backend dependencies${NC}"
fi
cd ../..

# Check if ports are available
echo -e "${BLUE}Checking port availability...${NC}"

if port_in_use 3001; then
    echo -e "${RED}❌ Port 3001 is already in use (Backend)${NC}"
    exit 1
fi

if port_in_use 5173; then
    echo -e "${RED}❌ Port 5173 is already in use (Frontend)${NC}"
    exit 1
fi

if port_in_use 8000; then
    echo -e "${RED}❌ Port 8000 is already in use (ML Service)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All ports are available${NC}"

# Start services
echo -e "${BLUE}Starting services...${NC}"

# Start ML Service (FastAPI)
echo -e "${YELLOW}Starting ML Service (FastAPI) on port 8000...${NC}"
cd services/ml
python3 main.py &
ML_PID=$!
cd ../..

# Wait for ML service to be ready
wait_for_service localhost 8000 "ML Service"

# Start Backend (Node.js/Express)
echo -e "${YELLOW}Starting Backend (Node.js/Express) on port 3001...${NC}"
cd apps/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to be ready
wait_for_service localhost 3001 "Backend"

# Start Frontend (React/Vite)
echo -e "${YELLOW}Starting Frontend (React/Vite) on port 5173...${NC}"
cd apps/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for frontend to be ready
wait_for_service localhost 5173 "Frontend"

# Display service URLs
echo ""
echo -e "${GREEN}🎉 SmartHire AI-Powered Recruitment System is now running!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  Frontend (React):     ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend (Express):    ${GREEN}http://localhost:3001${NC}"
echo -e "  ML Service (FastAPI): ${GREEN}http://localhost:8000${NC}"
echo -e "  API Documentation:   ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}SmartHire Features:${NC}"
echo -e "  📄 Resume Analysis:   ${GREEN}http://localhost:5173/resume-analysis${NC}"
echo -e "  🎥 AI Interview:      ${GREEN}http://localhost:5173/ai-interview${NC}"
echo -e "  📊 Assessment Mgmt:  ${GREEN}http://localhost:5173/assessments${NC}"
echo -e "  🏠 Main Dashboard:   ${GREEN}http://localhost:5173/smarthire${NC}"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo -e "  Admin: admin@example.com / admin123"
echo -e "  HR:    hr@example.com / hr123"
echo -e "  Manager: manager@example.com / manager123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    
    if [ ! -z "$ML_PID" ]; then
        kill $ML_PID 2>/dev/null
        echo -e "${GREEN}✅ ML Service stopped${NC}"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    echo -e "${GREEN}🎉 All services stopped successfully${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
while true; do
    sleep 1
done
