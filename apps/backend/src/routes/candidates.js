const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const database = require('../database/connection');
const { authenticateCandidate, verifyToken } = require('../middleware/authMiddleware');
const { candidateSchemas, validateSchema } = require('../middleware/validation');
const Queue = require('bull');
const { Resend } = require('resend');

// Initialize Resend for direct email sending
const resend = new Resend(process.env.RESEND_API_KEY);

// Simple email sending function (no Redis required)
async function sendEmailDirect(type, to, data) {
  try {
    const templates = {
      candidate_invitation: {
        subject: 'Invitation to Join FWC Talent Pool',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">FWC HRMS</h1>
              <p style="color: #6b7280; margin: 5px 0;">Talent Acquisition Portal</p>
            </div>
            
            <h2 style="color: #1f2937;">You're Invited to Join Our Talent Pool!</h2>
            
            <p>Dear ${data.candidateName || 'Candidate'},</p>
            
            <p>We are excited to invite you to join our talent pool at FWC. We believe your skills and experience could be a great fit for our organization.</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
              <ol style="color: #374151;">
                <li><strong>Create Your Account:</strong> Click the link below to set up your candidate profile</li>
                <li><strong>Upload Your Resume:</strong> Share your professional background with us</li>
                <li><strong>Browse Opportunities:</strong> Explore current job openings that match your skills</li>
                <li><strong>Apply for Positions:</strong> Submit applications for roles that interest you</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.registrationLink}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Create Your Account
              </a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>Note:</strong> This invitation is valid for 7 days. If you don't create an account within this time, you can still register later using your email address.
              </p>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact our HR team.</p>
            
            <p>We look forward to learning more about you!</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Best regards,<br>
              ${data.invitedByName || 'FWC HR Team'}<br>
              <strong>FWC Human Resources</strong>
            </p>
          </div>
        `
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Email template not found for type: ${type}`);
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'FWC HRMS <onboarding@resend.dev>',
      to: [to],
      subject: template.subject,
      html: template.html
    });

    console.log('Email sent successfully:', result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Candidate registration
router.post('/register', validateSchema(candidateSchemas.register), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, invitationToken } = req.body;

    // Check if candidate already exists
    const existingCandidate = await database.findOne('candidates', { email });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this email already exists'
      });
    }

    // If invitation token is provided, validate it
    if (invitationToken) {
      try {
        const decoded = jwt.verify(invitationToken, process.env.JWT_SECRET);
        if (decoded.email !== email) {
          return res.status(400).json({
            success: false,
            message: 'Invalid invitation token'
          });
        }

        // Update invitation status to ACCEPTED
        await database.updateOne(
          'candidate_invitations',
          { invitationToken, email },
          { 
            $set: { 
              status: 'ACCEPTED',
              acceptedAt: new Date()
            }
          }
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired invitation token'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create candidate
    const candidate = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      status: 'ACTIVE',
      profileComplete: false,
      resumeUploaded: false,
      invitedBy: invitationToken ? 'INVITATION' : 'SELF_REGISTERED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await database.insertOne('candidates', candidate);

    // Generate JWT token
    const token = jwt.sign(
      { 
        candidateId: result.insertedId.toString(),
        email: candidate.email,
        role: 'CANDIDATE'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully',
      data: {
        candidateId: result.insertedId,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        token
      }
    });

  } catch (error) {
    console.error('Candidate registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Candidate login
router.post('/login', validateSchema(candidateSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find candidate
    const candidate = await database.findOne('candidates', { email });
    if (!candidate) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if candidate is active
    if (candidate.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        candidateId: candidate._id.toString(),
        email: candidate.email,
        role: 'CANDIDATE'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        candidateId: candidate._id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        profileComplete: candidate.profileComplete,
        resumeUploaded: candidate.resumeUploaded,
        token
      }
    });

  } catch (error) {
    console.error('Candidate login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all candidates (for HR/Admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { jobPostingId, status, page = 1, limit = 10 } = req.query;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user._id;

    // Verify user has permission (user is already loaded by verifyToken middleware)
    const user = req.user;

    if (!['HR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Build filter
    const filter = {};
    if (jobPostingId) filter.jobPostingId = jobPostingId;
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get candidates
    const candidates = await database.find(
      'candidates',
      filter,
      {
        sort: { createdAt: -1 },
        limit: parseInt(limit),
        skip: skip
      }
    );

    // Get total count for pagination
    const totalCandidates = await database.count('candidates', filter);

    res.json({
      success: true,
      data: {
        candidates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCandidates,
          pages: Math.ceil(totalCandidates / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get candidate profile
router.get('/profile', authenticateCandidate, async (req, res) => {
  try {
    const candidate = await database.findOne('candidates', { _id: req.candidateId });
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Remove password from response
    delete candidate.password;

    res.json({
      success: true,
      data: candidate
    });

  } catch (error) {
    console.error('Get candidate profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update candidate profile
router.put('/profile', authenticateCandidate, validateSchema(candidateSchemas.updateProfile), async (req, res) => {
  try {
    const { firstName, lastName, phone, skills, experience, education } = req.body;

    const updateData = {
      firstName,
      lastName,
      phone,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      profileComplete: true,
      updatedAt: new Date()
    };

    const result = await database.updateOne(
      'candidates',
      { _id: req.candidateId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update candidate profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Upload resume
router.post('/resume', authenticateCandidate, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }

    const resumeData = {
      candidateId: req.candidateId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      status: 'UPLOADED',
      aiProcessed: false
    };

    // Save resume record
    const resumeResult = await database.insertOne('candidate_resumes', resumeData);

    // Update candidate record
    await database.updateOne(
      'candidates',
      { _id: req.candidateId },
      { 
        $set: { 
          resumeUploaded: true,
          resumeId: resumeResult.insertedId,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeId: resumeResult.insertedId,
        fileName: resumeData.fileName,
        fileSize: resumeData.fileSize
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get available job postings
router.get('/jobs', authenticateCandidate, async (req, res) => {
  try {
    const { page = 1, limit = 10, department, location } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'PUBLISHED' };
    
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const jobs = await database.find('job_postings', query, {
      skip: parseInt(skip),
      limit: parseInt(limit),
      sort: { postedAt: -1 }
    });

    const totalJobs = await database.count('job_postings', query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalJobs / limit),
          totalJobs,
          hasNext: page * limit < totalJobs,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Apply for a job
router.post('/apply/:jobId', authenticateCandidate, validateSchema(candidateSchemas.jobApplication), async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.candidateId;

    // Check if job exists
    const job = await database.findOne('job_postings', { _id: jobId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check if candidate has uploaded resume
    const candidate = await database.findOne('candidates', { _id: candidateId });
    if (!candidate.resumeUploaded) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume before applying'
      });
    }

    // Check if already applied
    const existingApplication = await database.findOne('candidate_applications', {
      candidateId: candidateId,
      jobPostingId: jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    const application = {
      candidateId,
      jobPostingId: jobId,
      resumeId: candidate.resumeId,
      status: 'APPLIED',
      appliedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await database.insertOne('candidate_applications', application);

    // Update job posting application count
    await database.updateOne(
      'job_postings',
      { _id: jobId },
      { $inc: { currentApplications: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.insertedId,
        jobTitle: job.title,
        appliedAt: application.appliedAt
      }
    });

  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get candidate applications
router.get('/applications', authenticateCandidate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const candidateId = req.candidateId;

    const applications = await database.find('candidate_applications', 
      { candidateId },
      {
        skip: parseInt(skip),
        limit: parseInt(limit),
        sort: { appliedAt: -1 }
      }
    );

    // Populate job details for each application
    const populatedApplications = await Promise.all(
      applications.map(async (app) => {
        const job = await database.findOne('job_postings', { _id: app.jobPostingId });
        return {
          ...app,
          job: job ? {
            title: job.title,
            department: job.department,
            location: job.location,
            status: job.status
          } : null
        };
      })
    );

    const totalApplications = await database.count('candidate_applications', { candidateId });

    res.json({
      success: true,
      data: {
        applications: populatedApplications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalApplications / limit),
          totalApplications,
          hasNext: page * limit < totalApplications,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

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

// HR: Send candidate invitation email
router.post('/invite', verifyToken, async (req, res) => {
  try {
    // Check if user has HR or ADMIN role
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR or Admin role required.'
      });
    }

    const { email, candidateName, invitedBy } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Check if candidate already exists
    const existingCandidate = await database.findOne('candidates', { email });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this email already exists'
      });
    }

    // Create invitation record
    const invitation = {
      email,
      candidateName: candidateName || email.split('@')[0],
      invitedBy: req.user._id,
      invitedByName: invitedBy || req.user.name,
      status: 'PENDING',
      invitationToken: jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' }),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    const invitationResult = await database.insertOne('candidate_invitations', invitation);

    // Generate registration link
    const registrationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/candidate-portal/register?token=${invitation.invitationToken}&email=${encodeURIComponent(email)}`;

    // Send email invitation directly (no Redis required)
    let emailSent = false;
    let emailError = null;
    
    try {
      const emailResult = await sendEmailDirect('candidate_invitation', email, {
        candidateName: invitation.candidateName,
        registrationLink,
        invitedByName: invitation.invitedByName
      });
      
      if (emailResult.success) {
        emailSent = true;
        console.log('Email invitation sent successfully');
      } else {
        emailError = emailResult.error;
        console.error('Failed to send email:', emailError);
      }
    } catch (error) {
      emailError = error.message;
      console.error('Email sending error:', error);
    }

    res.json({
      success: true,
      message: emailSent ? 'Invitation sent successfully' : `Invitation created successfully (email failed: ${emailError || 'unknown error'})`,
      data: {
        invitationId: invitationResult.insertedId,
        email,
        candidateName: invitation.candidateName,
        expiresAt: invitation.expiresAt,
        emailSent,
        registrationLink,
        emailError: emailError || null
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all candidate invitations (HR only)
router.get('/invitations', verifyToken, async (req, res) => {
  try {
    // Check if user has HR or ADMIN role
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR or Admin role required.'
      });
    }

    const invitations = await database.find('candidate_invitations', {}, {
      sort: { createdAt: -1 }
    });

    res.json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;