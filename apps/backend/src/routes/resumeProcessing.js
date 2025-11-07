// Enhanced Resume Processing System
// Handles upload, parsing, ATS scoring, template conversion, and job recommendations
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../middleware/authMiddleware');
const { authenticateCandidate } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');
const multer = require('multer');

// Configure multer for resume uploads (multiple files)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Upload resume(s) and trigger automatic processing
router.post('/upload', authenticateCandidate, upload.array('resumes', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No resume files uploaded'
      });
    }

    const candidateId = req.candidateId;
    const candidate = await database.findOne('candidates', { _id: candidateId });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const uploadedResumes = [];
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Process each uploaded file
    for (const file of req.files) {
      const resumeData = {
        candidateId: candidateId,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        uploadedAt: new Date(),
        status: 'UPLOADED',
        processingStatus: 'PENDING',
        aiProcessed: false,
        extractedData: null,
        atsScore: null,
        templateGenerated: false
      };

      // Save resume record
      const resumeResult = await database.insertOne('candidate_resumes', resumeData);

      // Trigger automatic parsing in background
      try {
        const parseResponse = await fetch(`${mlServiceUrl}/api/resume/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_path: file.path,
            candidate_id: candidateId.toString(),
            resume_id: resumeResult.insertedId.toString()
          })
        });

        if (parseResponse.ok) {
          const parseResult = await parseResponse.json();
          
          // Update resume with extracted data
          await database.updateOne(
            'candidate_resumes',
            { _id: resumeResult.insertedId },
            {
              $set: {
                extractedData: parseResult.data || null,
                processingStatus: 'COMPLETED',
                aiProcessed: true,
                processedAt: new Date()
              }
            }
          );

          // Update candidate with extracted information if this is the primary resume
          if (parseResult.data) {
            const extracted = parseResult.data;
            const updateFields = {};
            
            if (extracted.fullName && !candidate.name) {
              updateFields.name = extracted.fullName;
            }
            if (extracted.email && !candidate.email) {
              updateFields.email = extracted.email;
            }
            if (extracted.phone && !candidate.phone) {
              updateFields.phone = extracted.phone;
            }
            if (extracted.skills) {
              // Handle skills as object with technical/soft/all or as array
              if (extracted.skills.all && Array.isArray(extracted.skills.all)) {
                updateFields.skills = extracted.skills.all;
              } else if (extracted.skills.technical && Array.isArray(extracted.skills.technical)) {
                updateFields.skills = extracted.skills.technical;
              } else if (Array.isArray(extracted.skills)) {
                updateFields.skills = extracted.skills;
              }
            }
            if (extracted.experience && extracted.experience.totalYears) {
              updateFields.experience = extracted.experience.totalYears;
            }
            if (extracted.education && extracted.education.length > 0) {
              updateFields.education = extracted.education;
            }

            if (Object.keys(updateFields).length > 0) {
              updateFields.updatedAt = new Date();
              await database.updateOne('candidates', { _id: candidateId }, { $set: updateFields });
            }
          }
        }
      } catch (error) {
        console.error('Error processing resume:', error);
        // Continue even if ML service fails
        await database.updateOne(
          'candidate_resumes',
          { _id: resumeResult.insertedId },
          {
            $set: {
              processingStatus: 'FAILED',
              processingError: error.message
            }
          }
        );
      }

      uploadedResumes.push({
        resumeId: resumeResult.insertedId.toString(),
        fileName: resumeData.fileName,
        originalName: resumeData.originalName,
        fileSize: resumeData.fileSize,
        status: resumeData.processingStatus
      });
    }

    // Update candidate record
    await database.updateOne(
      'candidates',
      { _id: candidateId },
      {
        $set: {
          resumeUploaded: true,
          resumeId: uploadedResumes[0].resumeId, // Set first as primary
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `${uploadedResumes.length} resume(s) uploaded and processing started`,
      data: {
        resumes: uploadedResumes,
        totalUploaded: uploadedResumes.length,
        primaryResumeId: uploadedResumes[0].resumeId
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

// Get ATS score for a resume against a job posting
router.post('/ats-score', verifyToken, async (req, res) => {
  try {
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const { resumeId, jobPostingId } = req.body;

    if (!resumeId || !jobPostingId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and Job Posting ID are required'
      });
    }

    // Get resume and job posting
    const resume = await database.findOne('candidate_resumes', { _id: ObjectId.isValid(resumeId) ? new ObjectId(resumeId) : resumeId });
    const jobPosting = await database.findOne('job_postings', { _id: ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Call ML service for ATS score calculation
    let atsScore = null;
    try {
      const response = await fetch(`${mlServiceUrl}/api/resume/ats-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: resume.filePath,
          job_requirements: jobPosting.requirements || [],
          job_title: jobPosting.title,
          job_description: jobPosting.description,
          extracted_data: resume.extractedData
        })
      });

      if (response.ok) {
        const result = await response.json();
        atsScore = result.data || null;

        // Save ATS score to resume record
        await database.updateOne(
          'candidate_resumes',
          { _id: resume._id },
          {
            $set: {
              atsScore: atsScore,
              atsScoreCalculatedAt: new Date(),
              atsScoreJobPostingId: jobPostingId
            }
          }
        );
      }
    } catch (error) {
      console.error('ATS score calculation error:', error);
      // Calculate fallback score
      const extractedSkills = resume.extractedData?.skills || [];
      const jobRequirements = jobPosting.requirements || [];
      const matchingSkills = extractedSkills.filter(skill =>
        jobRequirements.some(req => req.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(req.toLowerCase()))
      );
      atsScore = {
        overallScore: jobRequirements.length > 0
          ? Math.round((matchingSkills.length / jobRequirements.length) * 100)
          : 50,
        skillMatch: matchingSkills.length,
        totalRequiredSkills: jobRequirements.length,
        matchedSkills: matchingSkills
      };
    }

    res.json({
      success: true,
      data: {
        atsScore: atsScore,
        resumeId: resume._id,
        jobPostingId: jobPosting._id,
        jobTitle: jobPosting.title
      }
    });

  } catch (error) {
    console.error('ATS score error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Generate professional template for a resume
router.post('/generate-template/:resumeId', verifyToken, async (req, res) => {
  try {
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const { resumeId } = req.params;
    const { includeAtsScore, templateStyle = 'professional' } = req.body;

    const resume = await database.findOne('candidate_resumes', {
      _id: ObjectId.isValid(resumeId) ? new ObjectId(resumeId) : resumeId
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Call ML service to generate template
    try {
      const response = await fetch(`${mlServiceUrl}/api/resume/generate-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: resume.filePath,
          extracted_data: resume.extractedData,
          ats_score: includeAtsScore ? resume.atsScore : null,
          template_style: templateStyle
        })
      });

      if (response.ok) {
        const result = await response.json();
        const templatePath = result.data?.template_path;

        // Update resume record
        await database.updateOne(
          'candidate_resumes',
          { _id: resume._id },
          {
            $set: {
              templateGenerated: true,
              templatePath: templatePath,
              templateGeneratedAt: new Date(),
              templateStyle: templateStyle
            }
          }
        );

        res.json({
          success: true,
          message: 'Professional template generated successfully',
          data: {
            resumeId: resume._id,
            templatePath: templatePath,
            downloadUrl: `/api/resume-processing/download-template/${resumeId}`
          }
        });
      } else {
        throw new Error('Template generation failed');
      }
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Template generation failed',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Generate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Download professional template
router.get('/download-template/:resumeId', verifyToken, async (req, res) => {
  try {
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const { resumeId } = req.params;
    const resume = await database.findOne('candidate_resumes', {
      _id: ObjectId.isValid(resumeId) ? new ObjectId(resumeId) : resumeId
    });

    if (!resume || !resume.templatePath) {
      return res.status(404).json({
        success: false,
        message: 'Template not found. Please generate template first.'
      });
    }

    if (!fs.existsSync(resume.templatePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found'
      });
    }

    const candidate = await database.findOne('candidates', { _id: resume.candidateId });
    const candidateName = candidate?.name || candidate?.firstName || 'Candidate';
    const safeFileName = candidateName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    res.download(resume.templatePath, `${safeFileName}_professional_resume.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading template'
        });
      }
    });

  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get job recommendations for a candidate based on their resume
router.get('/job-recommendations/:candidateId', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const requestingUserId = req.user._id || req.user.userId;
    
    // Allow candidates to view their own recommendations, or HR/Admin/Manager
    const candidate = await database.findOne('candidates', {
      _id: ObjectId.isValid(candidateId) ? new ObjectId(candidateId) : candidateId
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check permissions
    const isOwnRequest = candidate._id.toString() === requestingUserId?.toString();
    const hasHRRole = ['HR', 'ADMIN', 'MANAGER'].includes(req.user.role);
    
    if (!isOwnRequest && !hasHRRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get candidate's primary resume
    const resume = await database.findOne('candidate_resumes', {
      candidateId: candidate._id,
      status: 'UPLOADED'
    }, { sort: { uploadedAt: -1 } });

    if (!resume || !resume.extractedData) {
      return res.status(400).json({
        success: false,
        message: 'Resume not processed yet. Please upload and process a resume first.'
      });
    }

    // Get all published job postings
    const jobPostings = await database.find('job_postings', {
      status: 'PUBLISHED'
    });

    const recommendations = [];
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Calculate ATS score for each job posting
    for (const job of jobPostings) {
      try {
        const response = await fetch(`${mlServiceUrl}/api/resume/ats-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_path: resume.filePath,
            job_requirements: job.requirements || [],
            job_title: job.title,
            job_description: job.description,
            extracted_data: resume.extractedData
          })
        });

        let atsScore = 0;
        if (response.ok) {
          const result = await response.json();
          atsScore = result.data?.overallScore || 0;
        } else {
          // Fallback calculation
          const extractedSkills = resume.extractedData.skills || [];
          const jobRequirements = job.requirements || [];
          const matchingSkills = extractedSkills.filter(skill =>
            jobRequirements.some(req => req.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(req.toLowerCase()))
          );
          atsScore = jobRequirements.length > 0
            ? Math.round((matchingSkills.length / jobRequirements.length) * 100)
            : 50;
        }

        recommendations.push({
          jobPostingId: job._id,
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          atsScore: atsScore,
          matchReason: atsScore >= 80 ? 'Excellent Match' :
                      atsScore >= 60 ? 'Good Match' :
                      atsScore >= 40 ? 'Moderate Match' : 'Low Match'
        });
      } catch (error) {
        console.error(`Error calculating score for job ${job._id}:`, error);
        // Skip this job if calculation fails
      }
    }

    // Sort by ATS score descending
    recommendations.sort((a, b) => b.atsScore - a.atsScore);

    res.json({
      success: true,
      data: {
        candidateId: candidate._id,
        candidateName: candidate.name || `${candidate.firstName} ${candidate.lastName}`,
        recommendations: recommendations,
        totalJobs: recommendations.length,
        topMatches: recommendations.filter(r => r.atsScore >= 70).length
      }
    });

  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all processed resumes with filtering (HR Dashboard)
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    if (!['HR', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HR, Admin, or Manager role required.'
      });
    }

    const {
      skills,
      minAtsScore,
      maxAtsScore,
      minExperience,
      maxExperience,
      department,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    if (status) {
      query.processingStatus = status;
    } else {
      query.processingStatus = { $in: ['COMPLETED', 'PENDING', 'FAILED'] };
    }

    // Get all resumes
    let resumes = await database.find('candidate_resumes', query, {
      sort: { uploadedAt: -1 }
    });

    // Populate candidate data
    let populatedResumes = await Promise.all(
      resumes.map(async (resume) => {
        const candidate = await database.findOne('candidates', { _id: resume.candidateId });
        return {
          ...resume,
          candidate: candidate ? {
            _id: candidate._id,
            name: candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
            email: candidate.email,
            phone: candidate.phone,
            skills: candidate.skills || resume.extractedData?.skills || [],
            experience: candidate.experience || resume.extractedData?.experience?.totalYears || 0,
            education: candidate.education || resume.extractedData?.education || []
          } : null
        };
      })
    );

    // Apply filters
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      populatedResumes = populatedResumes.filter(resume => {
        const candidateSkills = resume.candidate?.skills || resume.extractedData?.skills || [];
        return skillsArray.some(skill =>
          candidateSkills.some(cs =>
            cs.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(cs.toLowerCase())
          )
        );
      });
    }

    if (minAtsScore || maxAtsScore) {
      populatedResumes = populatedResumes.filter(resume => {
        const score = resume.atsScore?.overallScore || 0;
        if (minAtsScore && score < parseInt(minAtsScore)) return false;
        if (maxAtsScore && score > parseInt(maxAtsScore)) return false;
        return true;
      });
    }

    if (minExperience || maxExperience) {
      populatedResumes = populatedResumes.filter(resume => {
        const exp = resume.candidate?.experience || resume.extractedData?.experience?.totalYears || 0;
        if (minExperience && exp < parseFloat(minExperience)) return false;
        if (maxExperience && exp > parseFloat(maxExperience)) return false;
        return true;
      });
    }

    if (department) {
      // This would require joining with job applications or job postings
      // For now, we'll skip this filter or implement a simpler version
    }

    // Paginate
    const total = populatedResumes.length;
    const paginatedResumes = populatedResumes.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        resumes: paginatedResumes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          skills: skills || null,
          minAtsScore: minAtsScore || null,
          maxAtsScore: maxAtsScore || null,
          minExperience: minExperience || null,
          maxExperience: maxExperience || null,
          department: department || null,
          status: status || null
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;

