const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const { errorHandler } = require('./middleware/errorHandler');
const database = require('./database/connection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - configure helmet to allow CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(cookieParser());

// Rate limiting (disabled in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Much higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/health' || req.path === '/api/health' || process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// Auth rate limiting (relaxed in development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Much higher limit in development
  message: 'Too many authentication attempts, please try again later.'
});

// CORS configuration - Allow all origins in development for easier debugging
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5175'
    ];
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
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
    database: {
      connected: database.isConnected,
      status: database.isConnected ? 'connected' : 'disconnected'
    },
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
    port: PORT,
    database: {
      connected: database.isConnected,
      status: database.isConnected ? 'connected' : 'disconnected'
    }
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
app.use('/api/career', require('./routes/careerApplications'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/candidate-interviews', require('./routes/candidateInterviews'));
app.use('/api/resume-screening', require('./routes/resumeScreening'));
app.use('/api/resume-processing', require('./routes/resumeProcessing'));
app.use('/api/job-attachments', require('./routes/jobAttachments'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/interview-transcripts', require('./routes/interviewTranscripts'));
app.use('/api/realtime-interview', require('./routes/realtimeInterview'));
app.use('/api/candidate-conversion', require('./routes/candidateConversion'));
app.use('/api/performance-reviews', require('./routes/performanceReviews'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/services', require('./routes/services'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/email', require('./routes/emailAutoReply'));
app.use('/api', require('./routes/demoRequest'));
app.use('/api/recruitment', require('./routes/recruitmentDashboard'));
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
    // Connect to MongoDB (with retry logic)
    const db = await database.connect();
    
    // Create database indexes (only if connected)
    if (db) {
      await database.createIndexes();
    }
    
    // Start the server even if MongoDB is not connected
    // Bind to 0.0.0.0 to ensure it's accessible on both IPv4 and IPv6
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Backend server is RUNNING!`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth login: http://localhost:${PORT}/api/auth/login`);
      console.log(`👥 Candidates login: http://localhost:${PORT}/api/candidates/login`);
      console.log(`${'='.repeat(60)}\n`);
      
      if (database.isConnected) {
        console.log(`✅ Database: Connected to MongoDB`);
      } else {
        console.log(`⚠️  Database: MongoDB not connected`);
        console.log(`   Note: Server will still work, but login requires database.`);
        console.log(`💡 To enable database:`);
        console.log(`   1. Install MongoDB: https://www.mongodb.com/try/download/community`);
        console.log(`   2. Start MongoDB: net start MongoDB (Windows)`);
        console.log(`   3. Or use MongoDB Atlas (cloud)`);
      }
      console.log(`\n✅ Server ready to accept connections!\n`);
    });

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
    // Don't exit - try to start server anyway
    console.log('⚠️  Attempting to start server without database connection...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Backend server is RUNNING! (Limited functionality)`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`⚠️  Database connection failed - login may not work without database`);
      console.log(`${'='.repeat(60)}\n`);
    });
    
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
