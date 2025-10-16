const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get AI services status
router.get('/services/status', asyncHandler(async (req, res) => {
  try {
    // Check ML service health
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${mlServiceUrl}/health`);
    
    if (response.ok) {
      const mlHealth = await response.json();
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
    console.error('AI Services Status Error:', error);
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

// Analyze resume
router.post('/resume/analyze', checkRole('ADMIN', 'HR'), [
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
router.post('/interview/start', checkRole('ADMIN', 'HR'), [
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
router.post('/interview/answer', checkRole('ADMIN', 'HR'), [
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
router.get('/interview/question/:sessionId', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
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

// Get team insights
router.get('/insights/team/:managerId', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
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

// Get HR insights
router.get('/insights/hr', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
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

// Get recruitment insights
router.get('/recruitment/insights', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
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

// Analyze hiring trends
router.post('/recruitment/trends', checkRole('ADMIN', 'HR'), [
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
router.post('/recruitment/predict', checkRole('ADMIN', 'HR'), [
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