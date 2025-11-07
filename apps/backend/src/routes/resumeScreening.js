// Resume screening API endpoints
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const fs = require('fs');
const path = require('path');
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

    // Normalize IDs to ObjectId when possible
    const normalizedCandidateId = ObjectId.isValid(candidateId) ? new ObjectId(candidateId) : candidateId;
    const normalizedJobPostingId = ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId;

    // Get candidate and job posting details
    const candidate = await database.findOne('candidates', { _id: normalizedCandidateId });
    const jobPosting = await database.findOne('job_postings', { _id: normalizedJobPostingId });

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

    // Get resume record to get file path (handle legacy string/ObjectId)
    const normalizedResumeId = ObjectId.isValid(candidate.resumeId) ? new ObjectId(candidate.resumeId) : candidate.resumeId;
    let resumeRecord = await database.findOne('candidate_resumes', { _id: normalizedResumeId });
    // Fallbacks: some older records may only have candidateId set or mismatched types
    if (!resumeRecord) {
      resumeRecord = await database.findOne('candidate_resumes', { candidateId: normalizedCandidateId });
    }
    if (!resumeRecord && typeof normalizedCandidateId !== 'string') {
      resumeRecord = await database.findOne('candidate_resumes', { candidateId: normalizedCandidateId.toString() });
    }
    // Legacy candidate schema may have resumePath directly on candidate
    if (!resumeRecord && candidate.resumePath) {
      resumeRecord = { filePath: candidate.resumePath };
    }
    // Development fallback: use most recent file in uploads/resumes when records are missing
    if (!resumeRecord) {
      try {
        const uploadDir = path.join(__dirname, '../../uploads/resumes');
        if (fs.existsSync(uploadDir)) {
          const files = fs.readdirSync(uploadDir).filter(f => f.startsWith('resume-'));
          if (files.length > 0) {
            const filesWithTime = files.map(f => ({ f, t: fs.statSync(path.join(uploadDir, f)).mtimeMs }));
            filesWithTime.sort((a, b) => b.t - a.t);
            resumeRecord = { filePath: path.join(uploadDir, filesWithTime[0].f) };
          }
        }
      } catch (e) {
        // ignore fallback errors
      }
    }
    if (!resumeRecord || !resumeRecord.filePath) {
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
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1] || ''}`
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

    // Calculate enhanced fit score if AI analysis is available
    let fitScore = 0;
    let candidateSummary = '';
    
    if (aiAnalysis?.data) {
      fitScore = aiAnalysis.data.match_score || 0;
      
      // Generate candidate suitability summary (2-3 sentences)
      const strengths = aiAnalysis.data.strengths || [];
      const weaknesses = aiAnalysis.data.weaknesses || [];
      const skills = aiAnalysis.data.skills || [];
      const experience = aiAnalysis.data.experience || 0;
      
      candidateSummary = `${candidate.name || 'This candidate'} demonstrates `;
      
      if (fitScore >= 80) {
        candidateSummary += `strong alignment with the ${jobPosting.title} role, with `;
        if (strengths.length > 0) {
          candidateSummary += `${strengths[0].toLowerCase()}. `;
        } else {
          candidateSummary += `relevant experience and skills. `;
        }
        candidateSummary += `The candidate's ${experience > 0 ? `${experience} years of ` : ''}experience and technical expertise make them a highly suitable fit for this position.`;
      } else if (fitScore >= 60) {
        candidateSummary += `moderate alignment with the ${jobPosting.title} position. `;
        if (strengths.length > 0) {
          candidateSummary += `Key strengths include ${strengths[0].toLowerCase()}. `;
        }
        if (weaknesses.length > 0) {
          candidateSummary += `However, ${weaknesses[0].toLowerCase()}, which may require additional consideration.`;
        } else {
          candidateSummary += `Further evaluation through interview is recommended to assess fit.`;
        }
      } else {
        candidateSummary += `limited alignment with the ${jobPosting.title} role requirements. `;
        if (weaknesses.length > 0) {
          candidateSummary += `Primary concerns include ${weaknesses[0].toLowerCase()}. `;
        }
        candidateSummary += `This candidate may be better suited for alternative positions or require significant skill development.`;
      }
    } else {
      // Fallback calculation without AI
      const candidateSkills = candidate.skills || [];
      const jobRequirements = jobPosting.requirements || [];
      const matchingSkills = candidateSkills.filter(skill => 
        jobRequirements.some(req => req.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(req.toLowerCase()))
      );
      
      fitScore = jobRequirements.length > 0 
        ? Math.round((matchingSkills.length / jobRequirements.length) * 100)
        : 50;
      
      candidateSummary = `${candidate.name || 'This candidate'} shows `;
      if (fitScore >= 70) {
        candidateSummary += `good potential for the ${jobPosting.title} role based on skill overlap. `;
        candidateSummary += `Manual review recommended to assess full qualifications and cultural fit.`;
      } else {
        candidateSummary += `partial alignment with role requirements. `;
        candidateSummary += `Additional screening may be needed to determine suitability.`;
      }
    }

    // Create screening record
    const screening = {
      candidateId: normalizedCandidateId,
      jobPostingId: normalizedJobPostingId,
      screenedBy: req.user._id,
      screenedByName: req.user.name,
      screeningDate: new Date(),
      aiAnalysis: aiAnalysis?.data || null,
      manualNotes: screeningNotes || '',
      status: 'SCREENED',
      fitScore: fitScore,
      candidateSummary: candidateSummary,
      strengths: aiAnalysis?.data?.strengths || [],
      weaknesses: aiAnalysis?.data?.weaknesses || [],
      recommendations: aiAnalysis?.data?.recommendations || [],
      skillsMatch: aiAnalysis?.data?.skills_match || [],
      experienceMatch: aiAnalysis?.data?.experience_match || null,
      educationMatch: aiAnalysis?.data?.education_match || null
    };

    const screeningResult = await database.insertOne('resume_screenings', screening);

    // Update candidate application status if exists
    await database.updateOne(
      'candidate_applications',
      { candidateId: normalizedCandidateId, jobPostingId: normalizedJobPostingId },
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

// Get screening results for a job posting with ranking and filtering
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
    const { 
      minFitScore, 
      maxFitScore, 
      skills, 
      minExperience, 
      maxExperience,
      sortBy = 'fitScore',
      sortOrder = 'desc'
    } = req.query;

    // Build query filter
    let query = { jobPostingId: ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId };
    
    // Filter by fit score range
    if (minFitScore || maxFitScore) {
      query.fitScore = {};
      if (minFitScore) query.fitScore.$gte = parseInt(minFitScore);
      if (maxFitScore) query.fitScore.$lte = parseInt(maxFitScore);
    }

    // Build sort
    const sort = {};
    if (sortBy === 'fitScore') {
      sort.fitScore = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'screeningDate') {
      sort.screeningDate = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.fitScore = -1; // Default to fit score descending
    }

    // Get all screenings for this job posting
    let screenings = await database.find(
      'resume_screenings',
      query,
      { sort }
    );

    // Populate candidate and job posting details
    let populatedScreenings = await Promise.all(
      screenings.map(async (screening) => {
        const candidate = await database.findOne('candidates', { _id: screening.candidateId });
        const jobPosting = await database.findOne('job_postings', { _id: screening.jobPostingId });
        
        return {
          ...screening,
          candidate: candidate ? {
            name: candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
            email: candidate.email,
            phone: candidate.phone,
            skills: candidate.skills || [],
            experience: candidate.experience || 0,
            education: candidate.education || []
          } : null,
          jobPosting: jobPosting ? {
            title: jobPosting.title,
            department: jobPosting.department
          } : null
        };
      })
    );

    // Filter by skills if provided
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      populatedScreenings = populatedScreenings.filter(screening => {
        const candidateSkills = screening.candidate?.skills || [];
        return skillsArray.some(skill => 
          candidateSkills.some(cs => 
            cs.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(cs.toLowerCase())
          )
        );
      });
    }

    // Filter by experience range if provided
    if (minExperience || maxExperience) {
      populatedScreenings = populatedScreenings.filter(screening => {
        const experience = screening.candidate?.experience || 0;
        if (minExperience && experience < parseInt(minExperience)) return false;
        if (maxExperience && experience > parseInt(maxExperience)) return false;
        return true;
      });
    }

    // Add ranking
    populatedScreenings = populatedScreenings.map((screening, index) => ({
      ...screening,
      rank: index + 1,
      recommendationTag: screening.fitScore >= 80 ? 'Highly Suitable' :
                         screening.fitScore >= 60 ? 'Potential Fit' :
                         'Needs Review'
    }));

    res.json({
      success: true,
      data: populatedScreenings,
      total: populatedScreenings.length,
      filters: {
        minFitScore: minFitScore || null,
        maxFitScore: maxFitScore || null,
        skills: skills || null,
        minExperience: minExperience || null,
        maxExperience: maxExperience || null
      }
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

// Get ranked candidates for a job posting (sorted by fit score)
router.get('/ranked-candidates/:jobPostingId', verifyToken, async (req, res) => {
  try {
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const { jobPostingId } = req.params;
    const normalizedJobPostingId = ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId;

    // Get all screenings for this job posting, sorted by fit score
    const screenings = await database.find(
      'resume_screenings',
      { jobPostingId: normalizedJobPostingId },
      { sort: { fitScore: -1, screeningDate: -1 } }
    );

    // Populate and rank candidates
    const rankedCandidates = await Promise.all(
      screenings.map(async (screening, index) => {
        const candidate = await database.findOne('candidates', { _id: screening.candidateId });
        const jobPosting = await database.findOne('job_postings', { _id: screening.jobPostingId });
        
        return {
          rank: index + 1,
          fitScore: screening.fitScore || 0,
          candidateSummary: screening.candidateSummary || '',
          recommendationTag: screening.fitScore >= 80 ? 'Highly Suitable' :
                            screening.fitScore >= 60 ? 'Potential Fit' :
                            'Needs Review',
          candidate: candidate ? {
            _id: candidate._id,
            name: candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
            email: candidate.email,
            phone: candidate.phone,
            skills: candidate.skills || [],
            experience: candidate.experience || 0
          } : null,
          screening: {
            screeningId: screening._id,
            strengths: screening.strengths || [],
            weaknesses: screening.weaknesses || [],
            recommendations: screening.recommendations || [],
            screeningDate: screening.screeningDate
          },
          jobPosting: jobPosting ? {
            title: jobPosting.title,
            department: jobPosting.department
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: rankedCandidates,
      total: rankedCandidates.length,
      statistics: {
        highlySuitable: rankedCandidates.filter(c => c.fitScore >= 80).length,
        potentialFit: rankedCandidates.filter(c => c.fitScore >= 60 && c.fitScore < 80).length,
        needsReview: rankedCandidates.filter(c => c.fitScore < 60).length,
        averageFitScore: rankedCandidates.length > 0 
          ? Math.round(rankedCandidates.reduce((sum, c) => sum + c.fitScore, 0) / rankedCandidates.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Get ranked candidates error:', error);
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
