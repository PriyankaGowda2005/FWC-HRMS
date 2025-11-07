// Resume processing job handler
const axios = require('axios');

const processResume = async (jobData) => {
  const { filePath, candidateId, jobPostingId } = jobData;
  
  try {
    console.log(`Processing resume for candidate ${candidateId}`);
    
    // Call ML service for resume processing
    const response = await axios.post('http://localhost:8000/process-resume', {
      file_path: filePath,
      candidate_id: candidateId,
      job_posting_id: jobPostingId
    }, {
      timeout: 30000 // 30 second timeout
    });

    // Update candidate with processed data
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        skills: response.data.skills,
        fitScore: response.data.fit_score,
        recommendedRole: response.data.recommended_role,
        isProcessed: true,
        processedAt: new Date()
      }
    });

    await prisma.$disconnect();

    // Trigger email notification for HR
    const { addJob } = require('../bullmq');
    await addJob('emailNotifications', 'send-email', {
      type: 'resume_processed',
      candidateId,
      hrEmail: 'hr@company.com', // This would come from job posting or company config
      data: {
        candidateName: response.data.candidate_name,
        fitScore: response.data.fit_score,
        jobTitle: response.data.job_title
      }
    });

    return {
      success: true,
      candidateId,
      skills: response.data.skills,
      fitScore: response.data.fit_score
    };

  } catch (error) {
    console.error('Resume processing failed:', error);
    
    // Log error and mark candidate as failed
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        isProcessed: false,
        processingError: error.message || 'Unknown error',
        processedAt: new Date()
      }
    });

    await prisma.$disconnect();

    throw error;
  }
};

module.exports = processResume;
