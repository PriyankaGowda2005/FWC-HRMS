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
  res.json({
    services: {
      resumeAnalysis: { status: 'active', version: '1.0' },
      interviewBot: { status: 'active', version: '1.0' },
      performancePrediction: { status: 'active', version: '1.0' },
      retentionAnalysis: { status: 'active', version: '1.0' }
    },
    lastUpdated: new Date()
  });
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

module.exports = router;