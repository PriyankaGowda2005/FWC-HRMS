const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './apps/backend/.env' });

const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Test endpoint for users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint for employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            role: true
          }
        },
        department: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint for departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'FWC HRMS API Test Server Running',
    timestamp: new Date().toISOString(),
    mongoConnected: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FWC HRMS Test API Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`👷 Employees: http://localhost:${PORT}/api/employees`);
  console.log(`🏢 Departments: http://localhost:${PORT}/api/departments`);
  console.log(`💾 Connected to MongoDB Atlas: HRMS database`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
