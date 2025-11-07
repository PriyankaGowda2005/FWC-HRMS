const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get AI services status
router.get('/services/status', [
  verifyToken,
  checkRole('ADMIN', 'HR', 'MANAGER')
], asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/services/status`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(503).json({
      ai_services_available: false,
      error: 'AI services are currently unavailable',
      message: error.message
    });
  }
}));

// Analyze resume with AI
router.post('/resume/analyze', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  body('filePath').notEmpty().withMessage('File path is required'),
  body('jobRequirements').optional().isObject().withMessage('Job requirements must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { filePath, jobRequirements } = req.body;

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/resume/analyze`, {
      file_path: filePath,
      job_requirements: jobRequirements
    }, {
      timeout: 30000, // 30 seconds for AI processing
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze resume',
        message: error.message
      });
    }
  }
}));

// Start AI interview session
router.post('/interview/start', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  body('candidateId').isMongoId().withMessage('Invalid candidate ID'),
  body('jobRole').notEmpty().withMessage('Job role is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { candidateId, jobRole } = req.body;

  // Verify candidate exists
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      jobPosting: {
        select: {
          title: true
        }
      }
    }
  });

  if (!candidate) {
    return res.status(404).json({ 
      message: 'Candidate not found' 
    });
  }

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/interview/start`, {
      candidate_id: candidateId,
      job_role: jobRole || candidate.jobPosting?.title || 'General Position'
    }, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    // Store interview session in database
    await prisma.interview.create({
      data: {
        candidateId,
        scheduledAt: new Date(),
        type: 'AI_INTERVIEW',
        status: 'IN_PROGRESS',
        notes: `AI Interview Session: ${response.data.session_id}`,
        meetingLink: `ai-session-${response.data.session_id}`
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to start AI interview',
        message: error.message
      });
    }
  }
}));

// Get next interview question
router.get('/interview/question/:sessionId', [
  verifyToken,
  checkRole('ADMIN', 'HR')
], asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/interview/question/${sessionId}`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get interview question',
        message: error.message
      });
    }
  }
}));

// Submit interview answer
router.post('/interview/answer', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('questionId').notEmpty().withMessage('Question ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { sessionId, answer, questionId } = req.body;

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/interview/answer`, {
      session_id: sessionId,
      answer_text: answer,
      question_id: questionId
    }, {
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    // If interview is completed, update candidate with final assessment
    if (response.data.status === 'interview_completed' && response.data.assessment) {
      const assessment = response.data.assessment;
      
      await prisma.candidate.update({
        where: { 
          id: sessionId.split('_')[1] // Extract candidate ID from session ID
        },
        data: {
          interviewScore: assessment.overall_assessment,
          interviewNotes: `AI Interview Assessment: ${assessment.overall_assessment}\nStrengths: ${assessment.strengths.join(', ')}\nAreas for Improvement: ${assessment.areas_for_improvement.join(', ')}`,
          interviewCompletedAt: new Date(),
          status: assessment.overall_assessment.includes('Recommended') ? 'INTERVIEWED' : 'REJECTED'
        }
      });

      // Update interview record
      await prisma.interview.updateMany({
        where: {
          candidateId: sessionId.split('_')[1],
          type: 'AI_INTERVIEW',
          status: 'IN_PROGRESS'
        },
        data: {
          status: 'COMPLETED',
          score: assessment.overall_assessment,
          notes: `AI Interview completed. Assessment: ${assessment.overall_assessment}`
        }
      });
    }

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process interview answer',
        message: error.message
      });
    }
  }
}));

// Get AI predictions for performance, retention, salary
router.post('/predict/:type', [
  verifyToken,
  checkRole('ADMIN', 'HR', 'MANAGER'),
  param('type').isIn(['performance', 'retention', 'salary']).withMessage('Invalid prediction type'),
  body('employeeData').isObject().withMessage('Employee data is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { type } = req.params;
  const { employeeData } = req.body;

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict/${type}`, {
      employee_data: employeeData,
      prediction_type: type
    }, {
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to generate ${type} prediction`,
        message: error.message
      });
    }
  }
}));

// Analyze sentiment from employee feedback
router.get('/analytics/sentiment', [
  verifyToken,
  checkRole('ADMIN', 'HR', 'MANAGER'),
  body('textData').notEmpty().withMessage('Text data is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { textData } = req.body;

  try {
    const response = await axios.get(`${AI_SERVICE_URL}/analytics/sentiment`, {
      params: { text_data: textData },
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze sentiment',
        message: error.message
      });
    }
  }
}));

// Analyze workload optimization
router.get('/analytics/workload', [
  verifyToken,
  checkRole('ADMIN', 'HR', 'MANAGER'),
  body('employeeData').isObject().withMessage('Employee data is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { employeeData } = req.body;

  try {
    const response = await axios.get(`${AI_SERVICE_URL}/analytics/workload`, {
      params: { employee_data: employeeData },
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${req.user.token || 'demo-token'}`
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze workload',
        message: error.message
      });
    }
  }
}));

// Bulk process resumes for a job posting
router.post('/bulk-process-resumes', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  body('jobPostingId').isMongoId().withMessage('Invalid job posting ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { jobPostingId } = req.body;

  // Get all candidates for this job posting with unprocessed resumes
  const candidates = await prisma.candidate.findMany({
    where: {
      jobPostingId,
      resumeFile: { not: null },
      isProcessed: false
    },
    select: {
      id: true,
      resumeFile: true,
      firstName: true,
      lastName: true
    }
  });

  if (candidates.length === 0) {
    return res.json({
      message: 'No candidates with unprocessed resumes found',
      processedCount: 0
    });
  }

  // Get job requirements for analysis
  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    select: {
      title: true,
      requirements: true,
      responsibilities: true
    }
  });

  const jobRequirements = {
    skills: jobPosting.requirements?.skills || [],
    experience_level: 'mid',
    industry: 'technology'
  };

  let processedCount = 0;
  const results = [];

  // Process each candidate's resume
  for (const candidate of candidates) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/resume/analyze`, {
        file_path: `uploads/${candidate.resumeFile}`,
        job_requirements: jobRequirements
      }, {
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${req.user.token || 'demo-token'}`
        }
      });

      if (response.data.success) {
        // Update candidate with AI analysis results
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            fitScore: response.data.job_fit_analysis?.overall_score,
            skills: response.data.candidate_profile?.skills_detected,
            aiAnalysis: response.data,
            isProcessed: true,
            processedAt: new Date()
          }
        });

        processedCount++;
        results.push({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          success: true,
          fitScore: response.data.job_fit_analysis?.overall_score
        });
      } else {
        results.push({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      results.push({
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        success: false,
        error: error.message
      });
    }
  }

  res.json({
    message: `Bulk processing completed. ${processedCount}/${candidates.length} resumes processed successfully`,
    processedCount,
    totalCandidates: candidates.length,
    results
  });
}));

module.exports = router;
