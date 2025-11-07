const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { createUploadMiddleware, handleUploadError } = require('../middleware/fileUpload');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const candidateApplicationSchema = [
  body('firstName').notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2-50 characters'),
  body('lastName').notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('jobPostingId').isMongoId().withMessage('Invalid job posting ID'),
  body('coverLetter').optional().isLength({ max: 5000 }).withMessage('Cover letter too long'),
  body('expectedSalary').optional().isFloat({ min: 0 }).withMessage('Expected salary must be non-negative'),
  body('availability').optional().isISO8601().withMessage('Invalid availability date'),
  body('additionalNotes').optional().isLength({ max: 1000 }).withMessage('Additional notes too long')
];

// Submit job application (public endpoint)
router.post('/apply', [
  ...candidateApplicationSchema
], createUploadMiddleware('resume', 'resumeFile', 1), handleUploadError, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    jobPostingId,
    coverLetter,
    expectedSalary,
    availability,
    additionalNotes
  } = req.body;

  // Check if resume file was uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      message: 'Resume file is required' 
    });
  }

  const resumeFile = req.files[0];

  // Verify job posting exists and is accepting applications
  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    select: {
      id: true,
      title: true,
      status: true,
      applicationDeadline: true,
      currentApplications: true,
      maxApplications: true
    }
  });

  if (!jobPosting) {
    return res.status(404).json({ 
      message: 'Job posting not found' 
    });
  }

  if (jobPosting.status !== 'PUBLISHED') {
    return res.status(400).json({ 
      message: 'This job posting is not accepting applications' 
    });
  }

  // Check application deadline
  if (jobPosting.applicationDeadline && jobPosting.applicationDeadline < new Date()) {
    return res.status(400).json({ 
      message: 'Application deadline has passed' 
    });
  }

  // Check max applications
  if (jobPosting.maxApplications && jobPosting.currentApplications >= jobPosting.maxApplications) {
    return res.status(400).json({ 
      message: 'Application limit reached for this position' 
    });
  }

  // Check for duplicate application
  const existingApplication = await prisma.candidate.findFirst({
    where: {
      email,
      jobPostingId
    }
  });

  if (existingApplication) {
    return res.status(400).json({ 
      message: 'You have already applied for this position' 
    });
  }

  // Create candidate record
  const candidate = await prisma.candidate.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNumber,
      resumeFile: resumeFile.filename,
      coverLetter,
      jobPostingId,
      expectedSalary,
      availability: availability ? new Date(availability) : null,
      additionalNotes,
      source: 'COMPANY_WEBSITE' // Default source
    },
    include: {
      jobPosting: {
        select: {
          title: true,
          department: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // Update application count
  await prisma.jobPosting.update({
    where: { id: jobPostingId },
    data: {
      currentApplications: jobPosting.currentApplications + 1
    }
  });

  res.status(201).json({
    message: 'Application submitted successfully',
    candidate: {
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      appliedAt: candidate.appliedAt,
      status: candidate.status
    },
    jobDetails: {
      title: candidate.jobPosting.title,
      department: candidate.jobPosting.department?.name
    }
  });
}));

// Admin/HR: Get all candidates
router.get('/', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  query('jobPostingId').optional().isMongoId().withMessage('Invalid job posting ID'),
  query('status').optional().isIn(['APPLIED', 'SCREENING', 'INTERVIEWED', 'TESTING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  query('source').optional().isIn(['COMPANY_WEBSITE', 'LINKEDIN', 'INDEED', 'GLASSDOOR', 'EMPLOYEE_REFERRAL', 'RECRUITER', 'CAMPUS_RECRUITMENT', 'OTHER']),
  query('experienceLevel').optional().isIn(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE']),
  query('sortBy').optional().isIn(['appliedAt', 'fitScore', 'firstName', 'lastName']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const {
    jobPostingId,
    status,
    source,
    experienceLevel,
    sortBy = 'appliedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = req.query;

  const where = {};

  if (jobPostingId) {
    where.jobPostingId = jobPostingId;
  }

  if (status) {
    where.status = status;
  }

  if (source) {
    where.source = source;
  }

  if (experienceLevel) {
    where.experienceLevel = experienceLevel;
  }

  const skip = (page - 1) * limit;
  const orderBy = { [sortBy]: sortOrder };

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      skip,
      take: limit,
      where,
      orderBy,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        interviews: {
          select: {
            id: true,
            scheduledAt: true,
            type: true,
            status: true,
            score: true
          }
        }
      }
    }),
    prisma.candidate.count({ where })
  ]);

  // Calculate summary statistics
  const stats = await prisma.candidate.groupBy({
    by: ['status'],
    where,
    _count: true,
    _avg: {
      fitScore: true
    }
  });

  res.json({
    candidates,
    summary: {
      totalCandidates: total,
      statusBreakdown: stats.map(stat => ({
        status: stat.status,
        count: stat._count,
        averageFitScore: stat._avg.fitScore || 0
      }))
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get candidate by ID
router.get('/:id', [
  verifyToken,
  checkRole('ADMIN', 'HR', 'MANAGER'),
  param('id').isMongoId().withMessage('Invalid candidate ID')


], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          department: {
            select: {
              name: true
            }
          },
          description: true,
          requirements: true,
          responsibilities: true
        }
      },
      interviews: {
        include: {
          interviewer: {
            select: {
              firstName: true,
              lastName: true,
              position: true
            }
          }
        },
        orderBy: { scheduledAt: 'desc' }
      }
    }
  });

  if (!candidate) {
    return res.status(404).json({ 
      message: 'Candidate not found' 
    });
  }

  res.json({ candidate });
}));

// Update candidate status/notes (Admin/HR only)
router.put('/:id', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid candidate ID'),
  body('status').optional().isIn(['APPLIED', 'SCREENING', 'INTERVIEWED', 'TESTING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  body('interviewNotes').optional().isLength({ max: 1000 }).withMessage('Interview notes too long'),
  body('interviewScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0-100'),
  body('additionalNotes').optional().isLength({ max: 1000 }).withMessage('Additional notes too long'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('fitScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Fit score must be between 0-100'),
  body('recommendedRole').optional().isLength({ max: 100 }).withMessage('Recommended role too long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = {};

  // Filter allowed fields
  const allowedFields = [
    'status', 'interviewNotes', 'interviewScore', 'additionalNotes',
    'skills', 'fitScore', 'recommendedRole'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Update interview completion timestamp if score provided
  if (updateData.interviewScore !== undefined) {
    updateData.interviewCompletedAt = new Date();
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: updateData,
    include: {
      jobPosting: {
        select: {
          title: true,
          department: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  res.json({
    message: 'Candidate updated successfully',
    candidate
  });
}));

// Process resume (trigger ML queue for resume processing)
router.post('/:id/process-resume', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid candidate ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: {
      id: true,
      resumeFile: true,
      jobPostingId: true,
      isProcessed: true
    }
  });

  if (!candidate) {
    return res.status(404).json({ 
      message: 'Candidate not found' 
    });
  }

  if (!candidate.resumeFile) {
    return res.status(400).json({ 
      message: 'No resume file available for processing' 
    });
  }

  if (candidate.isProcessed) {
    return res.status(400).json({ 
      message: 'Resume has already been processed' 
    });
  }

  // Trigger background job for resume processing
  const { addJob } = require('../utils/bullmq');
  
  try {
    const job = await addJob('resumeProcessing', 'process-resume', {
      filePath: `uploads/${candidate.resumeFile}`,
      candidateId: id,
      jobPostingId: candidate.jobPostingId
    }, {
      priority: 5,
      delay: 1000 // 1 second delay
    });

    res.json({
      message: 'Resume processing job submitted successfully',
      jobId: job.id,
      candidateId: id
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to submit resume processing job',
      error: error.message
    });
  }
}));

// Schedule interview
router.post('/:id/interview', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid candidate ID'),
  body('scheduledAt').isISO8601().withMessage('Invalid scheduled date'),
  body('type').isIn(['PHONE_SCREENING', 'VIDEO_INTERVIEW', 'IN_PERSON', 'TECHNICAL', 'BEHAVIORAL', 'PANEL', 'HR_ROUND']).withMessage('Invalid interview type'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes'),
  body('location').optional().isLength({ max: 200 }).withMessage('Location too long'),
  body('meetingLink').optional().isURL().withMessage('Invalid meeting link'),
  body('interviewerId').optional().isMongoId().withMessage('Invalid interviewer ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const {
    scheduledAt,
    type,
    duration = 60,
    location,
    meetingLink,
    interviewerId
  } = req.body;

  // Verify candidate exists
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  if (!candidate) {
    return res.status(404).json({ 
      message: 'Candidate not found' 
    });
  }

  // Check for conflicting interviews
  const conflictingInterview = await prisma.interview.findFirst({
    where: {
      candidateId: id,
      scheduledAt: {
        gte: new Date(scheduledAt).getTime() - (duration * 60 * 1000),
        lte: new Date(scheduledAt).getTime() + (duration * 60 * 1000)
      },
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
    }
  });

  if (conflictingInterview) {
    return res.status(400).json({ 
      message: 'Candidate already has an interview scheduled at this time' 
    });
  }

  const interview = await prisma.interview.create({
    data: {
      candidateId: id,
      scheduledAt: new Date(scheduledAt),
      duration,
      type,
      location,
      meetingLink,
      interviewerId
    },
    include: {
      candidate: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Update candidate status
  await prisma.candidate.update({
    where: { id },
    data: { status: 'INTERVIEWED' }
  });

  res.status(201).json({
    message: 'Interview scheduled successfully',
    interview
  });
}));

// Send rejection notification
router.post('/:id/reject', [
  verifyToken,
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid candidate ID'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Rejection reason too long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { reason } = req.body;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
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

  await prisma.candidate.update({
    where: { id },
    data: { 
      status: 'REJECTED',
      additionalNotes: reason ? `Rejection: ${reason}` : candidate.additionalNotes
    }
  });

  // Trigger email notification
  const { addJob } = require('../utils/bullmq');
  
  try {
    await addJob('emailNotifications', 'send-email', {
      type: 'application_rejected',
      to: candidate.email,
      data: {
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        jobTitle: candidate.jobPosting.title,
        reason
      }
    });

    res.json({
      message: 'Candidate rejected and notification sent'
    });
  } catch (error) {
    // Still return success even if email fails
    res.json({
      message: 'Candidate rejected (email notification may have failed)'
    });
  }
}));

// Delete candidate (Admin only)
router.delete('/:id', [
  verifyToken,
  checkRole('ADMIN'),
  param('id').isMongoId().withMessage('Invalid candidate ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  await prisma.candidate.delete({
    where: { id }
  });

  res.json({ 
    message: 'Candidate deleted successfully' 
  });
}));

module.exports = router;
