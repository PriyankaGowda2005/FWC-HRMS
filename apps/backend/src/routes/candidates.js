const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const database = require('../database/connection');
const { authenticateCandidate } = require('../middleware/authMiddleware');
const { candidateSchemas, validateSchema } = require('../middleware/validation');

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
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if candidate already exists
    const existingCandidate = await database.findOne('candidates', { email });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this email already exists'
      });
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

module.exports = router;