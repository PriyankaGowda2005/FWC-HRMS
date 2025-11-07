// Resume screening API endpoints
const express = require('express');
const router = express.Router();
const database = require('../database/connection');
const { verifyToken } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

// Resume screening endpoint
router.post('/screen', verifyToken, async (req, res) => {
  try {
    // Check if user has HR or ADMIN role
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR or Admin role required.'
      });
    }

    const { candidateId, jobPostingId, screeningNotes } = req.body;

    if (!candidateId || !jobPostingId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID and Job Posting ID are required'
      });
    }

    // Get candidate and job posting details
    const candidate = await database.findOne('candidates', { _id: candidateId });
    const jobPosting = await database.findOne('job_postings', { _id: jobPostingId });

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

    // Check if candidate has uploaded resume
    if (!candidate.resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate has not uploaded a resume'
      });
    }

    // Get resume record to get file path
    const resumeRecord = await database.findOne('candidate_resumes', { _id: candidate.resumeId });
    if (!resumeRecord) {
      return res.status(400).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // Call ML service for resume analysis
    let aiAnalysis = null;
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const response = await fetch(`${mlServiceUrl}/api/resume/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
        },
        body: JSON.stringify({
          file_path: resumeRecord.filePath,
          job_requirements: jobPosting.requirements || [],
          job_title: jobPosting.title,
          job_description: jobPosting.description
        })
      });

      if (response.ok) {
        aiAnalysis = await response.json();
      }
    } catch (error) {
      console.warn('ML service not available, proceeding without AI analysis:', error.message);
    }

    // Create screening record
    const screening = {
      candidateId,
      jobPostingId,
      screenedBy: req.user._id,
      screenedByName: req.user.name,
      screeningDate: new Date(),
      aiAnalysis: aiAnalysis?.data || null,
      manualNotes: screeningNotes || '',
      status: 'SCREENED',
      fitScore: aiAnalysis?.data?.match_score || null,
      strengths: aiAnalysis?.data?.strengths || [],
      weaknesses: aiAnalysis?.data?.weaknesses || [],
      recommendations: aiAnalysis?.data?.recommendations || []
    };

    const screeningResult = await database.insertOne('resume_screenings', screening);

    // Update candidate application status if exists
    await database.updateOne(
      'candidate_applications',
      { candidateId, jobPostingId },
      { 
        $set: { 
          status: 'SCREENED',
          screeningId: screeningResult.insertedId,
          screenedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Resume screening completed successfully',
      data: {
        screeningId: screeningResult.insertedId,
        candidate: {
          name: candidate.name,
          email: candidate.email
        },
        jobPosting: {
          title: jobPosting.title,
          department: jobPosting.department
        },
        aiAnalysis: aiAnalysis?.data || null,
        screeningNotes: screeningNotes || ''
      }
    });

  } catch (error) {
    console.error('Resume screening error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get screening results for a job posting
router.get('/screenings/:jobPostingId', verifyToken, async (req, res) => {
  try {
    // Check if user has HR, ADMIN, or MANAGER role
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const { jobPostingId } = req.params;

    // Get all screenings for this job posting
    const screenings = await database.find(
      'resume_screenings',
      { jobPostingId },
      { sort: { screeningDate: -1 } }
    );

    // Populate candidate and job posting details
    const populatedScreenings = await Promise.all(
      screenings.map(async (screening) => {
        const candidate = await database.findOne('candidates', { _id: screening.candidateId });
        const jobPosting = await database.findOne('job_postings', { _id: screening.jobPostingId });
        
        return {
          ...screening,
          candidate: candidate ? {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone
          } : null,
          jobPosting: jobPosting ? {
            title: jobPosting.title,
            department: jobPosting.department
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: populatedScreenings
    });

  } catch (error) {
    console.error('Get screenings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get screening details
router.get('/screening/:screeningId', verifyToken, async (req, res) => {
  try {
    const { screeningId } = req.params;

    const screening = await database.findOne('resume_screenings', { _id: screeningId });
    
    if (!screening) {
      return res.status(404).json({
        success: false,
        message: 'Screening not found'
      });
    }

    // Get candidate and job posting details
    const candidate = await database.findOne('candidates', { _id: screening.candidateId });
    const jobPosting = await database.findOne('job_postings', { _id: screening.jobPostingId });

    res.json({
      success: true,
      data: {
        ...screening,
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
        } : null
      }
    });

  } catch (error) {
    console.error('Get screening error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update screening status (approve/reject)
router.put('/screening/:screeningId/status', verifyToken, async (req, res) => {
  try {
    // Check if user has HR or ADMIN role
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR or Admin role required.'
      });
    }

    const { screeningId } = req.params;
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED', 'NEEDS_REVIEW'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED, REJECTED, or NEEDS_REVIEW'
      });
    }

    const screening = await database.findOne('resume_screenings', { _id: screeningId });
    
    if (!screening) {
      return res.status(404).json({
        success: false,
        message: 'Screening not found'
      });
    }

    // Update screening status
    await database.updateOne(
      'resume_screenings',
      { _id: screeningId },
      { 
        $set: { 
          status,
          statusNotes: notes || '',
          statusUpdatedBy: req.user._id,
          statusUpdatedAt: new Date()
        }
      }
    );

    // Update candidate application status
    await database.updateOne(
      'candidate_applications',
      { candidateId: screening.candidateId, jobPostingId: screening.jobPostingId },
      { 
        $set: { 
          status: status === 'APPROVED' ? 'SHORTLISTED' : status === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW',
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Screening ${status.toLowerCase()} successfully`,
      data: { status, notes: notes || '' }
    });

  } catch (error) {
    console.error('Update screening status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
