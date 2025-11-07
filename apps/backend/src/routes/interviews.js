// Interview scheduling API endpoints
const express = require('express');
const router = express.Router();
const database = require('../database/connection');
const { verifyToken } = require('../middleware/authMiddleware');
const Queue = require('bull');
const { ObjectId } = require('mongodb');

// Initialize email queue
let emailQueue;
try {
  emailQueue = new Queue('email-notifications', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    }
  });
} catch (error) {
  console.warn('Email queue not available:', error.message);
}

// Schedule interview
router.post('/schedule', verifyToken, async (req, res) => {
  try {
    // Check if user has MANAGER, HR, or ADMIN role
    if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager, HR, or Admin role required.'
      });
    }

    const { 
      attachmentId, 
      scheduledAt, 
      interviewType, 
      location, 
      meetingLink, 
      interviewNotes,
      interviewers = [],
      duration = 60
    } = req.body;

    if (!attachmentId || !scheduledAt || !interviewType) {
      return res.status(400).json({
        success: false,
        message: 'Attachment ID, scheduled date/time, and interview type are required'
      });
    }

    // Validate interview type
    if (!['PHONE', 'VIDEO', 'IN_PERSON', 'PANEL'].includes(interviewType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview type. Must be PHONE, VIDEO, IN_PERSON, or PANEL'
      });
    }

    // Get attachment details
    const attachment = await database.findOne('job_attachments', { _id: attachmentId });
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if interview is already scheduled
    const existingInterview = await database.findOne('interviews', { attachmentId });
    if (existingInterview) {
      return res.status(400).json({
        success: false,
        message: 'Interview is already scheduled for this candidate'
      });
    }

    // Get candidate and job posting details
    const candidate = await database.findOne('candidates', { _id: attachment.candidateId });
    const jobPosting = await database.findOne('job_postings', { _id: attachment.jobPostingId });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Create interview record
    const interview = {
      attachmentId,
      candidateId: attachment.candidateId,
      jobPostingId: attachment.jobPostingId,
      scheduledBy: req.user._id,
      scheduledByName: req.user.name,
      scheduledAt: new Date(scheduledAt),
      interviewType,
      location: location || null,
      meetingLink: meetingLink || null,
      interviewNotes: interviewNotes || '',
      interviewers: Array.isArray(interviewers) ? interviewers : [],
      duration: parseInt(duration) || 60,
      status: 'SCHEDULED',
      createdAt: new Date()
    };

    const interviewResult = await database.insertOne('interviews', interview);

    // Update attachment status
    await database.updateOne(
      'job_attachments',
      { _id: attachmentId },
      { 
        $set: { 
          status: 'INTERVIEW_SCHEDULED',
          statusUpdatedBy: req.user._id,
          statusUpdatedAt: new Date()
        }
      }
    );

    // Update candidate application status
    await database.updateOne(
      'candidate_applications',
      { candidateId: attachment.candidateId, jobPostingId: attachment.jobPostingId },
      { 
        $set: { 
          status: 'INTERVIEW_SCHEDULED',
          updatedAt: new Date()
        }
      }
    );

    // Send email notification to candidate
    if (emailQueue) {
      await emailQueue.add('send-email', {
        type: 'interview_scheduled',
        to: candidate.email,
        data: {
          candidateName: candidate.name,
          jobTitle: jobPosting.title,
          scheduledAt: interview.scheduledAt,
          type: interviewType,
          location: location,
          meetingLink: meetingLink,
          duration: duration,
          interviewers: interviewers,
          scheduledByName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        interviewId: interviewResult.insertedId,
        candidate: {
          name: candidate.name,
          email: candidate.email
        },
        jobPosting: {
          title: jobPosting.title,
          department: jobPosting.department
        },
        interview: {
          scheduledAt: interview.scheduledAt,
          interviewType,
          location,
          meetingLink,
          duration
        }
      }
    });

  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Generate AI interview questions based on job role and requirements
function generateInterviewQuestions(jobPosting, candidate) {
  const { title, requirements = [], department } = jobPosting;
  const candidateSkills = candidate?.skills || [];
  
  // Base questions for all interviews
  const baseQuestions = [
    {
      question: `Tell me about yourself and why you're interested in the ${title} position.`,
      type: 'BEHAVIORAL',
      category: 'introduction',
      expectedKeywords: ['experience', 'background', 'interest', 'motivation']
    },
    {
      question: `What interests you most about this role at our ${department} department?`,
      type: 'BEHAVIORAL',
      category: 'motivation',
      expectedKeywords: ['role', 'company', 'challenges', 'growth']
    }
  ];
  
  // Technical questions based on requirements
  const technicalQuestions = [];
  if (requirements && requirements.length > 0) {
    requirements.slice(0, 3).forEach((req, index) => {
      technicalQuestions.push({
        question: `Can you describe your experience with ${req}?`,
        type: 'TECHNICAL',
        category: 'technical_skills',
        expectedKeywords: [req.toLowerCase(), 'experience', 'projects', 'implementation']
      });
    });
  }
  
  // Situational questions
  const situationalQuestions = [
    {
      question: 'Describe a challenging project you worked on and how you overcame obstacles.',
      type: 'BEHAVIORAL',
      category: 'problem_solving',
      expectedKeywords: ['challenge', 'problem', 'solution', 'approach', 'results']
    },
    {
      question: 'How do you handle tight deadlines and multiple competing priorities?',
      type: 'BEHAVIORAL',
      category: 'time_management',
      expectedKeywords: ['deadlines', 'prioritization', 'organization', 'stress', 'management']
    },
    {
      question: 'Tell me about a time you had to work with a difficult team member. How did you handle it?',
      type: 'BEHAVIORAL',
      category: 'teamwork',
      expectedKeywords: ['team', 'collaboration', 'conflict', 'communication', 'resolution']
    }
  ];
  
  // Role-specific questions
  const roleQuestions = [];
  if (title.toLowerCase().includes('developer') || title.toLowerCase().includes('engineer')) {
    roleQuestions.push({
      question: 'Walk me through your approach to debugging a complex issue in production.',
      type: 'TECHNICAL',
      category: 'problem_solving',
      expectedKeywords: ['debugging', 'logs', 'testing', 'systematic', 'methodology']
    });
  }
  
  if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('lead')) {
    roleQuestions.push({
      question: 'How do you motivate and develop team members?',
      type: 'BEHAVIORAL',
      category: 'leadership',
      expectedKeywords: ['leadership', 'mentoring', 'development', 'motivation', 'team']
    });
  }
  
  // Combine all questions (limit to 8-10 questions)
  const allQuestions = [
    ...baseQuestions,
    ...technicalQuestions.slice(0, 3),
    ...situationalQuestions.slice(0, 2),
    ...roleQuestions.slice(0, 2)
  ].slice(0, 10);
  
  return allQuestions;
}

// Schedule AI interview (no attachment required) with automated question generation
router.post('/schedule-ai', verifyToken, async (req, res) => {
  try {
    if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Manager, HR, or Admin role required.' });
    }

    const { candidateId, jobPostingId, scheduledAt, meetingLink, interviewNotes, interviewers = [], duration = 45, autoInvite = false } = req.body;
    if (!candidateId || !jobPostingId) {
      return res.status(400).json({ success: false, message: 'candidateId and jobPostingId are required' });
    }

    const normalizedCandidateId = ObjectId.isValid(candidateId) ? new ObjectId(candidateId) : candidateId;
    const normalizedJobPostingId = ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId;

    const candidate = await database.findOne('candidates', { _id: normalizedCandidateId });
    const jobPosting = await database.findOne('job_postings', { _id: normalizedJobPostingId });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    if (!jobPosting) return res.status(404).json({ success: false, message: 'Job posting not found' });

    // Generate AI interview questions
    const interviewQuestions = generateInterviewQuestions(jobPosting, candidate);
    
    // Generate meeting link if not provided
    const generatedMeetingLink = meetingLink || `https://meet.${process.env.COMPANY_DOMAIN || 'company.com'}/ai-interview/${normalizedCandidateId}-${Date.now()}`;

    const interview = {
      candidateId: normalizedCandidateId,
      jobPostingId: normalizedJobPostingId,
      scheduledBy: req.user._id,
      scheduledByName: req.user.name,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
      interviewType: 'AI',
      location: 'VIRTUAL',
      meetingLink: generatedMeetingLink,
      interviewNotes: interviewNotes || '',
      interviewers: Array.isArray(interviewers) ? interviewers : [],
      duration: parseInt(duration) || 45,
      status: 'SCHEDULED',
      questions: interviewQuestions,
      totalQuestions: interviewQuestions.length,
      createdAt: new Date()
    };

    const interviewResult = await database.insertOne('interviews', interview);

    // Update candidate application status
    await database.updateOne(
      'candidate_applications',
      { candidateId: normalizedCandidateId, jobPostingId: normalizedJobPostingId },
      { 
        $set: { 
          status: 'INTERVIEW_SCHEDULED',
          interviewId: interviewResult.insertedId,
          updatedAt: new Date()
        }
      }
    );

    // Send automated invitation email if requested
    if (autoInvite) {
      try {
        const { generateInterviewInvitationEmail, emailToHTML } = require('./careerApplications');
        const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';
        const { Resend } = require('resend');
        const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        
        if (resend) {
          const emailData = generateInterviewInvitationEmail(
            companyName,
            jobPosting.title,
            candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
            generatedMeetingLink,
            new Date(interview.scheduledAt).toLocaleDateString(),
            new Date(interview.scheduledAt).toLocaleTimeString()
          );
          
          const htmlBody = emailToHTML(emailData.body, companyName);
          
          await resend.emails.send({
            from: process.env.RESEND_FROM || 'Careers <onboarding@resend.dev>',
            to: [candidate.email],
            subject: emailData.subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                  <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${companyName}</h1>
                </div>
                ${htmlBody}
              </div>
            `
          });
          
          console.log('✅ AI interview invitation email sent to:', candidate.email);
        }
      } catch (emailError) {
        console.error('❌ Failed to send interview invitation email:', emailError);
        // Don't fail the interview scheduling if email fails
      }
    }

    res.json({ 
      success: true, 
      message: 'AI interview scheduled successfully', 
      data: { 
        interviewId: interviewResult.insertedId, 
        scheduledAt: interview.scheduledAt,
        meetingLink: generatedMeetingLink,
        questions: interviewQuestions,
        totalQuestions: interviewQuestions.length,
        emailSent: autoInvite
      } 
    });
  } catch (error) {
    console.error('Schedule AI interview error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Automatically invite shortlisted candidates for AI interview
router.post('/auto-invite-shortlisted', verifyToken, async (req, res) => {
  try {
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. HR or Admin role required.' });
    }

    const { jobPostingId, minFitScore = 70, scheduledAt } = req.body;
    if (!jobPostingId) {
      return res.status(400).json({ success: false, message: 'jobPostingId is required' });
    }

    const normalizedJobPostingId = ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId;
    
    // Get job posting
    const jobPosting = await database.findOne('job_postings', { _id: normalizedJobPostingId });
    if (!jobPosting) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Get shortlisted candidates (screened with fit score >= minFitScore)
    const screenings = await database.find(
      'resume_screenings',
      { 
        jobPostingId: normalizedJobPostingId,
        fitScore: { $gte: parseInt(minFitScore) },
        status: 'SCREENED'
      },
      { sort: { fitScore: -1 } }
    );

    const invitations = [];
    const errors = [];

    for (const screening of screenings) {
      try {
        const candidate = await database.findOne('candidates', { _id: screening.candidateId });
        if (!candidate) continue;

        // Check if interview already scheduled
        const existingInterview = await database.findOne('interviews', {
          candidateId: screening.candidateId,
          jobPostingId: normalizedJobPostingId,
          status: { $in: ['SCHEDULED', 'COMPLETED'] }
        });

        if (existingInterview) {
          continue; // Skip if already scheduled
        }

        // Generate questions
        const interviewQuestions = generateInterviewQuestions(jobPosting, candidate);
        const generatedMeetingLink = `https://meet.${process.env.COMPANY_DOMAIN || 'company.com'}/ai-interview/${screening.candidateId}-${Date.now()}`;
        
        const interview = {
          candidateId: screening.candidateId,
          jobPostingId: normalizedJobPostingId,
          scheduledBy: req.user._id,
          scheduledByName: req.user.name,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
          interviewType: 'AI',
          location: 'VIRTUAL',
          meetingLink: generatedMeetingLink,
          duration: 45,
          status: 'SCHEDULED',
          questions: interviewQuestions,
          totalQuestions: interviewQuestions.length,
          autoScheduled: true,
          createdAt: new Date()
        };

        const interviewResult = await database.insertOne('interviews', interview);

        // Send invitation email
        try {
          const { generateInterviewInvitationEmail, emailToHTML } = require('./careerApplications');
          const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';
          const { Resend } = require('resend');
          const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
          
          if (resend) {
            const emailData = generateInterviewInvitationEmail(
              companyName,
              jobPosting.title,
              candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
              generatedMeetingLink,
              new Date(interview.scheduledAt).toLocaleDateString(),
              new Date(interview.scheduledAt).toLocaleTimeString()
            );
            
            await resend.emails.send({
              from: process.env.RESEND_FROM || 'Careers <onboarding@resend.dev>',
              to: [candidate.email],
              subject: emailData.subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${companyName}</h1>
                  </div>
                  ${emailToHTML(emailData.body, companyName)}
                </div>
              `
            });
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${candidate.email}:`, emailError);
        }

        invitations.push({
          candidateId: candidate._id,
          candidateName: candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
          interviewId: interviewResult.insertedId,
          fitScore: screening.fitScore
        });
      } catch (error) {
        errors.push({ candidateId: screening.candidateId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully invited ${invitations.length} candidate(s) for AI interview`,
      data: {
        invitations,
        errors: errors.length > 0 ? errors : undefined,
        total: invitations.length
      }
    });
  } catch (error) {
    console.error('Auto-invite shortlisted error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Get interviews for a manager
router.get('/manager/:managerId', verifyToken, async (req, res) => {
  try {
    const { managerId } = req.params;
    const { status, dateRange, sortBy = 'scheduledAt', sortOrder = 'asc' } = req.query;

    // Check if user can access this data
    if (req.user._id !== managerId && !['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build filter: show interviews scheduled by manager or where manager is listed as interviewer
    const filter = { $or: [ { scheduledBy: managerId }, { interviewers: { $in: [managerId] } } ] };
    if (status) filter.status = status;
    
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        filter.scheduledAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get interviews
    const interviews = await database.find(
      'interviews',
      filter,
      { sort }
    );

    // Populate candidate and job posting details
    const populatedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        const candidate = await database.findOne('candidates', { _id: interview.candidateId });
        const jobPosting = await database.findOne('job_postings', { _id: interview.jobPostingId });
        const attachment = await database.findOne('job_attachments', { _id: interview.attachmentId });
        
        return {
          ...interview,
          candidate: candidate ? {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone
          } : null,
          jobPosting: jobPosting ? {
            title: jobPosting.title,
            department: jobPosting.department
          } : null,
          attachment: attachment ? {
            fitScore: attachment.fitScore,
            priority: attachment.priority
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: populatedInterviews
    });

  } catch (error) {
    console.error('Get manager interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get interviews for a job posting
router.get('/job/:jobPostingId', verifyToken, async (req, res) => {
  try {
    // Check if user has HR, ADMIN, or MANAGER role
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const { jobPostingId } = req.params;

    // Get interviews
    const interviews = await database.find(
      'interviews',
      { jobPostingId },
      { sort: { scheduledAt: 1 } }
    );

    // Populate candidate details
    const populatedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        const candidate = await database.findOne('candidates', { _id: interview.candidateId });
        
        return {
          ...interview,
          candidate: candidate ? {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: populatedInterviews
    });

  } catch (error) {
    console.error('Get job interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update interview status
router.put('/:interviewId/status', verifyToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { status, notes, feedback } = req.body;

    if (!['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const interview = await database.findOne('interviews', { _id: interviewId });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can update this interview
    if (interview.scheduledBy !== req.user._id && !['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the interviewer or HR/Admin can update interview status.'
      });
    }

    // Update interview status
    const updateData = {
      status,
      statusUpdatedBy: req.user.userId,
      statusUpdatedAt: new Date()
    };

    if (notes) updateData.interviewNotes = notes;
    if (feedback) updateData.feedback = feedback;

    await database.updateOne(
      'interviews',
      { _id: interviewId },
      { $set: updateData }
    );

    // Update attachment status if interview is completed
    if (status === 'COMPLETED') {
      await database.updateOne(
        'job_attachments',
        { _id: interview.attachmentId },
        { 
          $set: { 
            status: 'INTERVIEWED',
            statusUpdatedBy: req.user._id,
            statusUpdatedAt: new Date()
          }
        }
      );

      // Update candidate application status
      await database.updateOne(
        'candidate_applications',
        { candidateId: interview.candidateId, jobPostingId: interview.jobPostingId },
        { 
          $set: { 
            status: 'INTERVIEWED',
            updatedAt: new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      message: `Interview status updated to ${status}`,
      data: { status, notes, feedback }
    });

  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Reschedule interview
router.put('/:interviewId/reschedule', verifyToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { scheduledAt, location, meetingLink, notes } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'New scheduled date/time is required'
      });
    }

    const interview = await database.findOne('interviews', { _id: interviewId });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can reschedule this interview
    if (interview.scheduledBy !== req.user._id && !['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the interviewer or HR/Admin can reschedule.'
      });
    }

    // Update interview
    await database.updateOne(
      'interviews',
      { _id: interviewId },
      { 
        $set: { 
          scheduledAt: new Date(scheduledAt),
          location: location || interview.location,
          meetingLink: meetingLink || interview.meetingLink,
          interviewNotes: notes || interview.interviewNotes,
          rescheduledBy: req.user._id,
          rescheduledAt: new Date()
        }
      }
    );

    // Send reschedule notification to candidate
    const candidate = await database.findOne('candidates', { _id: interview.candidateId });
    const jobPosting = await database.findOne('job_postings', { _id: interview.jobPostingId });

    if (emailQueue && candidate) {
      await emailQueue.add('send-email', {
        type: 'interview_rescheduled',
        to: candidate.email,
        data: {
          candidateName: candidate.name,
          jobTitle: jobPosting.title,
          oldScheduledAt: interview.scheduledAt,
          newScheduledAt: new Date(scheduledAt),
          type: interview.interviewType,
          location: location || interview.location,
          meetingLink: meetingLink || interview.meetingLink,
          rescheduledByName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: {
        interviewId,
        newScheduledAt: new Date(scheduledAt),
        location: location || interview.location,
        meetingLink: meetingLink || interview.meetingLink
      }
    });

  } catch (error) {
    console.error('Reschedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Cancel interview
router.put('/:interviewId/cancel', verifyToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { reason } = req.body;

    const interview = await database.findOne('interviews', { _id: interviewId });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user can cancel this interview
    if (interview.scheduledBy !== req.user._id && !['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the interviewer or HR/Admin can cancel.'
      });
    }

    // Update interview status
    await database.updateOne(
      'interviews',
      { _id: interviewId },
      { 
        $set: { 
          status: 'CANCELLED',
          cancellationReason: reason || '',
          cancelledBy: req.user._id,
          cancelledAt: new Date()
        }
      }
    );

    // Update attachment status
    await database.updateOne(
      'job_attachments',
      { _id: interview.attachmentId },
      { 
        $set: { 
          status: 'SHORTLISTED',
          statusUpdatedBy: req.user._id,
          statusUpdatedAt: new Date()
        }
      }
    );

    // Send cancellation notification to candidate
    const candidate = await database.findOne('candidates', { _id: interview.candidateId });
    const jobPosting = await database.findOne('job_postings', { _id: interview.jobPostingId });

    if (emailQueue && candidate) {
      await emailQueue.add('send-email', {
        type: 'interview_cancelled',
        to: candidate.email,
        data: {
          candidateName: candidate.name,
          jobTitle: jobPosting.title,
          scheduledAt: interview.scheduledAt,
          reason: reason || 'No reason provided',
          cancelledByName: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      data: { reason: reason || '' }
    });

  } catch (error) {
    console.error('Cancel interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get interview details
router.get('/:interviewId', verifyToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await database.findOne('interviews', { _id: interviewId });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Get candidate, job posting, and attachment details
    const candidate = await database.findOne('candidates', { _id: interview.candidateId });
    const jobPosting = await database.findOne('job_postings', { _id: interview.jobPostingId });
    const attachment = await database.findOne('job_attachments', { _id: interview.attachmentId });

    res.json({
      success: true,
      data: {
        ...interview,
        candidate: candidate ? {
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          resumePath: candidate.resumePath
        } : null,
        jobPosting: jobPosting ? {
          title: jobPosting.title,
          department: jobPosting.department,
          description: jobPosting.description,
          requirements: jobPosting.requirements
        } : null,
        attachment: attachment ? {
          fitScore: attachment.fitScore,
          priority: attachment.priority,
          strengths: attachment.screening?.strengths,
          weaknesses: attachment.screening?.weaknesses
        } : null
      }
    });

  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
