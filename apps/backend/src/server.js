const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const { errorHandler } = require('./middleware/errorHandler');
const database = require('./database/connection');
const socketService = require('./services/socketService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cookieParser());

// Rate limiting (disabled in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100000 : 100, // Much higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/health' || req.path === '/api/health' || process.env.NODE_ENV === 'development' || req.path.startsWith('/api/');
  }
});
app.use(limiter);

// Auth rate limiting (relaxed in development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Much higher limit in development
  message: 'Too many authentication attempts, please try again later.'
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:5175'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'X-XSRF-TOKEN'
  ]
};
app.use(cors(corsOptions));
// Explicitly enable pre-flight across-the-board
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:5175'
      ]
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', require('./routes/departments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leave-requests', require('./routes/leaveRequests'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/job-postings', require('./routes/jobPostings'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/candidate-interviews', require('./routes/candidateInterviews'));
app.use('/api/resume-screening', require('./routes/resumeScreening'));
app.use('/api/job-attachments', require('./routes/jobAttachments'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/interview-transcripts', require('./routes/interviewTranscripts'));
app.use('/api/candidate-conversion', require('./routes/candidateConversion'));
app.use('/api/performance-reviews', require('./routes/performanceReviews'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/files/:folder/:filename', require('./middleware/fileUpload').serveFile);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await database.connect();
    
    // Create database indexes
    await database.createIndexes();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`📊 Database: Connected to MongoDB Atlas`);
    });

    // Initialize Socket.IO
    socketService.initialize(server);

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop other instances or use a different port.`);
        console.log(`💡 Try running: taskkill /f /im node.exe`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
