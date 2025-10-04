#!/bin/bash

# FWC HRMS Demo Script
# This script sets up and runs the complete HRMS system

set -e

echo "🚀 Starting FWC HRMS Demo..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js (version 16 or higher)."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "All dependencies found ✅"

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp env.example .env
    print_warning "Please update .env file with your configuration before production use"
else
    print_status ".env file already exists"
fi

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start MongoDB and ML service
print_status "Starting infrastructure services..."
docker-compose up -d mongodb ml-service

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Install backend dependencies
print_status "Installing backend dependencies..."
cd apps/backend
if [ ! -d "node_modules" ]; then
    npm install
fi

print_status "Generating Prisma client..."
npx prisma generate

print_status "Setting up database..."
npx prisma db push

# Create demo users (if they don't exist)
print_status "Creating demo users..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@example.com' }
      });
      
      await prisma.employee.create({
        data: {
          userId: adminUser.id,
          firstName: 'Admin',
          lastName: 'User',
          department: 'Management',
          position: 'System Administrator',
          hireDate: new Date()
        }
      });
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if employee user exists
    const existingEmployee = await prisma.user.findUnique({
      where: { email: 'employee@example.com' }
    });

    if (!existingEmployee) {
      const hashedPassword = await bcrypt.hash('employee123', 12);
      await prisma.user.create({
        data: {
          email: 'employee@example.com',
          username: 'employee',
          password: hashedPassword,
          role: 'EMPLOYEE'
        }
      });
      
      const employeeUser = await prisma.user.findUnique({
        where: { email: 'employee@example.com' }
      });
      
      await prisma.employee.create({
        data: {
          userId: employeeUser.id,
          firstName: 'John',
          lastName: 'Doe',
          department: 'Engineering',
          position: 'Software Developer',
          salary: 75000,
          hireDate: new Date(),
          phoneNumber: '+1-555-1234'
        }
      });
      
      console.log('✅ Employee user created successfully');
    } else {
      console.log('ℹ️  Employee user already exists');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating demo users:', error);
    process.exit(1);
  }
}

createDemoUsers();
"

if [ $? -eq 0 ]; then
    print_success "Demo users created successfully"
else
    print_error "Failed to create demo users"
    exit 1
fi

# Start backend server in background
print_status "Starting backend server..."
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Start frontend server
print_status "Starting frontend server..."
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Handle cleanup on script exit
cleanup() {
    print_status "Cleaning up..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    docker-compose down 2>/dev/null || true
}

trap cleanup EXIT

# Wait a bit for frontend to start
sleep 5

print_success "🎉 Demo setup complete!"
echo ""
echo "📋 Service URLs:"
echo "=================="
echo "🌐 Frontend:     http://localhost:5173"
echo "⚙️  Backend API:  http://localhost:3001"
echo "🤖 ML Service:   http://localhost:8000"
echo "🗄️  MongoDB:     mongodb://localhost:27017"
echo ""
echo "🔐 Demo Credentials:"
echo "==================="
echo "👑 Admin:        admin@example.com / admin123"
echo "👤 Employee:     employee@example.com / employee123"
echo ""
echo "📖 Documentation:"
echo "=================="
echo "📘 ML Service API: http://localhost:8000/docs"
echo "🏥 Health Check:   http://localhost:3001/health"
echo ""
echo "📁 Logs:"
echo "========"
echo "Backend:  tail -f backend.log"
echo "Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop the demo:"
echo "Press Ctrl+C or run: docker-compose down"
echo ""

# Keep script running
print_status "Demo is running! Press Ctrl+C to stop."
wait
