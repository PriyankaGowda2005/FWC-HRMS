const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');

const router = express.Router();

// Debug endpoint to test ML service connection
router.get('/debug/ml', asyncHandler(async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    console.log('🔍 Debug: Checking ML service at:', mlServiceUrl);
    
    const response = await axios.get(`${mlServiceUrl}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Debug: ML service response:', response.status);
    
    res.json({
      success: true,
      mlServiceUrl,
      status: response.status,
      data: response.data
    });
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
    res.json({
      success: false,
      error: error.message,
      mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000'
    });
  }
}));

// Public AI services status endpoint (no auth required)
router.get('/services/status', asyncHandler(async (req, res) => {
  try {
    // Check ML service health
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    console.log('🔍 Checking ML service at:', mlServiceUrl);
    
    const response = await axios.get(`${mlServiceUrl}/health`, {
      timeout: 5000
    });
    
    console.log('✅ ML service response:', response.status, response.data);
    
    if (response.status === 200) {
      const mlHealth = response.data;
      res.json({
        available: true,
        services: {
          resumeAnalysis: { status: 'active', version: '1.0' },
          interviewBot: { status: 'active', version: '1.0' },
          performancePrediction: { status: 'active', version: '1.0' },
          retentionAnalysis: { status: 'active', version: '1.0' }
        },
        lastUpdated: new Date(),
        mlService: mlHealth
      });
    } else {
      throw new Error('ML service not responding');
    }
  } catch (error) {
    console.error('❌ AI Services Status Error:', error.message);
    console.error('❌ Error details:', error);
    res.json({
      available: false,
      services: {
        resumeAnalysis: { status: 'inactive', version: '1.0' },
        interviewBot: { status: 'inactive', version: '1.0' },
        performancePrediction: { status: 'inactive', version: '1.0' },
        retentionAnalysis: { status: 'inactive', version: '1.0' }
      },
      lastUpdated: new Date(),
      error: 'AI services temporarily unavailable'
    });
  }
}));

// Get HR insights (temporarily public for testing)
router.get('/insights/hr', asyncHandler(async (req, res) => {
  // Mock HR insights
  const insights = {
    predictions: {
      retentionRisk: Math.floor(Math.random() * 30) + 10,
      performanceScore: Math.floor(Math.random() * 30) + 70,
      salaryOptimization: Math.floor(Math.random() * 50) + 10
    },
    trends: {
      employeeSatisfaction: Math.floor(Math.random() * 20) + 70,
      productivityTrend: 'increasing',
      retentionTrend: 'stable'
    },
    recommendations: [
      'Implement flexible work arrangements',
      'Enhance employee development programs',
      'Review compensation packages',
      'Improve onboarding process'
    ],
    generatedAt: new Date()
  };

  res.json({
    insights
  });
}));

// Get recruitment insights (temporarily public for testing)
router.get('/recruitment/insights', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  // Mock recruitment insights
  const insights = {
    period,
    metrics: {
      totalApplications: Math.floor(Math.random() * 200) + 50,
      interviewsScheduled: Math.floor(Math.random() * 50) + 10,
      offersExtended: Math.floor(Math.random() * 20) + 5,
      hiresCompleted: Math.floor(Math.random() * 15) + 3,
      averageTimeToHire: Math.floor(Math.random() * 30) + 15,
      candidateQualityScore: Math.floor(Math.random() * 30) + 70
    },
    trends: {
      applicationTrend: 'increasing',
      interviewConversionRate: Math.floor(Math.random() * 20) + 60,
      offerAcceptanceRate: Math.floor(Math.random() * 20) + 70,
      timeToHireTrend: 'decreasing'
    },
    topSources: [
      { source: 'LinkedIn', applications: Math.floor(Math.random() * 100) + 50, conversion: Math.floor(Math.random() * 20) + 60 },
      { source: 'Company Website', applications: Math.floor(Math.random() * 80) + 30, conversion: Math.floor(Math.random() * 20) + 70 },
      { source: 'Job Boards', applications: Math.floor(Math.random() * 60) + 20, conversion: Math.floor(Math.random() * 20) + 50 },
      { source: 'Referrals', applications: Math.floor(Math.random() * 40) + 10, conversion: Math.floor(Math.random() * 20) + 80 }
    ],
    predictions: {
      nextMonthApplications: Math.floor(Math.random() * 100) + 50,
      hiringVelocity: Math.floor(Math.random() * 20) + 80,
      skillGaps: ['React', 'Python', 'Data Analysis', 'Leadership']
    },
    recommendations: [
      'Optimize job descriptions for better visibility',
      'Implement automated screening processes',
      'Enhance employer branding on social media',
      'Develop referral incentive programs',
      'Improve candidate experience during interviews'
    ],
    generatedAt: new Date()
  };

  res.json({
    message: 'Recruitment insights retrieved successfully',
    insights
  });
}));

// Apply auth middleware to all remaining routes
router.use(authenticate);

// Analyze resume
router.post('/resume/analyze', requireRole('ADMIN', 'HR'), [
  body('filePath').notEmpty().withMessage('File path required'),
  body('jobRequirements').isArray().withMessage('Job requirements must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { filePath, jobRequirements } = req.body;
  
  // For now, use mock data since we don't have actual file processing
  // In production, this would process the actual resume file

  // Mock resume analysis
  const analysis = {
    candidateName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    experience: 5,
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
    education: 'Bachelor of Computer Science',
    matchScore: Math.floor(Math.random() * 30) + 70, // 70-100%
    strengths: [
      'Strong technical background',
      'Relevant work experience',
      'Good communication skills'
    ],
    weaknesses: [
      'Limited leadership experience',
      'No experience with specific technology X'
    ],
    recommendations: [
      'Schedule technical interview',
      'Assess leadership potential',
      'Consider for senior role'
    ],
    analyzedAt: new Date()
  };

  res.json({
    message: 'Resume analyzed successfully',
    analysis
  });
}));

// Start AI interview
router.post('/interview/start', requireRole('ADMIN', 'HR'), [
  body('candidateId').notEmpty().withMessage('Candidate ID required'),
  body('jobRole').notEmpty().withMessage('Job role required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { candidateId, jobRole } = req.body;

  // Mock interview session
  const sessionId = new ObjectId().toString();
  const questions = [
    'Tell me about yourself and your experience.',
    'What interests you most about this role?',
    'Describe a challenging project you worked on.',
    'How do you handle tight deadlines?',
    'What are your career goals?'
  ];

  res.json({
    message: 'Interview session started',
    sessionId,
    jobRole,
    totalQuestions: questions.length,
    currentQuestion: 1,
    questions,
    startedAt: new Date()
  });
}));

// Submit interview answer
router.post('/interview/answer', requireRole('ADMIN', 'HR'), [
  body('sessionId').notEmpty().withMessage('Session ID required'),
  body('answer').notEmpty().withMessage('Answer required'),
  body('questionId').isNumeric().withMessage('Question ID must be a number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { sessionId, answer, questionId } = req.body;

  // Mock answer analysis
  const analysis = {
    relevanceScore: Math.floor(Math.random() * 30) + 70,
    communicationScore: Math.floor(Math.random() * 30) + 70,
    technicalScore: Math.floor(Math.random() * 30) + 70,
    feedback: 'Good answer, shows relevant experience and clear communication.',
    keywords: ['experience', 'project', 'team', 'leadership'],
    answeredAt: new Date()
  };

  res.json({
    message: 'Answer submitted successfully',
    analysis,
    nextQuestion: parseInt(questionId) + 1
  });
}));

// Get next interview question
router.get('/interview/question/:sessionId', requireRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  // Mock next question
  const questions = [
    'Tell me about yourself and your experience.',
    'What interests you most about this role?',
    'Describe a challenging project you worked on.',
    'How do you handle tight deadlines?',
    'What are your career goals?'
  ];

  const currentQuestion = Math.floor(Math.random() * questions.length) + 1;

  res.json({
    questionId: currentQuestion,
    question: questions[currentQuestion - 1],
    totalQuestions: questions.length,
    timeLimit: 300 // 5 minutes
  });
}));

// Get AI insights for reports
router.post('/reports/insights', [
  authenticate,
  requireRole('ADMIN', 'HR', 'MANAGER'),
  body('data').isObject().withMessage('Report data is required'),
  body('type').isIn(['attendance', 'leave', 'performance', 'payroll', 'general']).withMessage('Valid report type required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { data, type } = req.body;

  try {
    // Generate AI insights based on report data
    const insights = {
      type,
      generatedAt: new Date(),
      summary: generateReportSummary(data, type),
      recommendations: generateRecommendations(data, type),
      trends: generateTrendAnalysis(data, type),
      alerts: generateAlerts(data, type)
    };

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('AI insights generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
}));

// Helper functions for AI insights
function generateReportSummary(data, type) {
  switch (type) {
    case 'attendance':
      return {
        totalRecords: data.summary?.totalAttendance || 0,
        averageAttendance: data.summary?.averageAttendance || 0,
        keyMetrics: {
          presentRate: data.breakdown?.attendance?.present || 0,
          absentRate: data.breakdown?.attendance?.absent || 0,
          lateRate: data.breakdown?.attendance?.late || 0
        }
      };
    case 'leave':
      return {
        totalRequests: data.summary?.totalLeaveRequests || 0,
        approvalRate: data.summary?.leaveApprovalRate || 0,
        keyMetrics: {
          pending: data.breakdown?.leave?.pending || 0,
          approved: data.breakdown?.leave?.approved || 0,
          rejected: data.breakdown?.leave?.rejected || 0
        }
      };
    default:
      return {
        totalRecords: data.summary?.totalEmployees || 0,
        period: data.period?.dateRange || 'unknown'
      };
  }
}

function generateRecommendations(data, type) {
  const recommendations = [];
  
  switch (type) {
    case 'attendance':
      if (data.breakdown?.attendance?.absent > data.breakdown?.attendance?.present * 0.1) {
        recommendations.push('Consider implementing attendance improvement programs');
      }
      if (data.breakdown?.attendance?.late > data.breakdown?.attendance?.present * 0.05) {
        recommendations.push('Review and optimize work schedules to reduce lateness');
      }
      break;
    case 'leave':
      if (data.breakdown?.leave?.pending > data.breakdown?.leave?.approved) {
        recommendations.push('Streamline leave approval process to reduce pending requests');
      }
      break;
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Overall performance metrics look good. Continue current practices.');
  }
  
  return recommendations;
}

function generateTrendAnalysis(data, type) {
  return {
    trend: 'stable',
    direction: 'neutral',
    confidence: 0.75,
    description: 'Data shows consistent patterns over the selected period'
  };
}

function generateAlerts(data, type) {
  const alerts = [];
  
  switch (type) {
    case 'attendance':
      if (data.summary?.averageAttendance < 0.8) {
        alerts.push({
          type: 'warning',
          message: 'Low attendance rate detected',
          severity: 'medium'
        });
      }
      break;
    case 'leave':
      if (data.breakdown?.leave?.rejected > data.breakdown?.leave?.approved) {
        alerts.push({
          type: 'warning',
          message: 'High leave rejection rate',
          severity: 'high'
        });
      }
      break;
  }
  
  return alerts;
}

// Get team insights
router.get('/insights/team/:managerId', requireRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { managerId } = req.params;

  // Mock team insights
  const insights = {
    performanceScore: Math.floor(Math.random() * 30) + 70,
    retentionRisk: Math.floor(Math.random() * 30) + 10,
    recommendations: [
      'Consider team building activities',
      'Provide additional training opportunities',
      'Review workload distribution',
      'Schedule regular one-on-ones'
    ],
    strengths: [
      'Strong collaboration',
      'High productivity',
      'Good communication',
      'Technical expertise'
    ],
    areasForImprovement: [
      'Time management',
      'Leadership skills',
      'Cross-functional collaboration'
    ],
    predictedTurnover: Math.floor(Math.random() * 5) + 1,
    generatedAt: new Date()
  };

  res.json({
    insights
  });
}));

// Analyze hiring trends
router.post('/recruitment/trends', requireRole('ADMIN', 'HR'), [
  body('departmentId').optional().isMongoId().withMessage('Invalid department ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { departmentId } = req.body;

  // Mock hiring trends analysis
  const trends = {
    departmentId,
    analysis: {
      hiringVelocity: Math.floor(Math.random() * 30) + 70,
      candidateQuality: Math.floor(Math.random() * 30) + 70,
      timeToFill: Math.floor(Math.random() * 20) + 20,
      costPerHire: Math.floor(Math.random() * 5000) + 5000
    },
    trends: {
      applications: 'increasing',
      interviews: 'stable',
      offers: 'increasing',
      hires: 'stable'
    },
    insights: [
      'Hiring velocity has improved by 15% this quarter',
      'Candidate quality scores are above industry average',
      'Time to fill has decreased by 20%',
      'Cost per hire is within budget targets'
    ],
    generatedAt: new Date()
  };

  res.json({
    message: 'Hiring trends analyzed successfully',
    trends
  });
}));

// Predict hiring needs
router.post('/recruitment/predict', requireRole('ADMIN', 'HR'), [
  body('departmentId').optional().isMongoId().withMessage('Invalid department ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { departmentId } = req.body;

  // Mock hiring needs prediction
  const predictions = {
    departmentId,
    predictions: {
      nextQuarter: {
        positionsNeeded: Math.floor(Math.random() * 10) + 5,
        skillRequirements: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        urgencyLevel: 'medium',
        estimatedCost: Math.floor(Math.random() * 100000) + 50000
      },
      nextSixMonths: {
        positionsNeeded: Math.floor(Math.random() * 20) + 10,
        skillRequirements: ['Python', 'Machine Learning', 'Data Science', 'Leadership'],
        urgencyLevel: 'high',
        estimatedCost: Math.floor(Math.random() * 200000) + 100000
      }
    },
    factors: [
      'Projected business growth',
      'Current team capacity',
      'Historical hiring patterns',
      'Market demand for skills'
    ],
    confidence: Math.floor(Math.random() * 20) + 80,
    generatedAt: new Date()
  };

  res.json({
    message: 'Hiring needs predicted successfully',
    predictions
  });
}));

module.exports = router;