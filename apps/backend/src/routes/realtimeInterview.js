// Real-time Interview Monitoring API endpoints
const express = require('express');
const router = express.Router();
const database = require('../database/connection');
const { verifyToken } = require('../middleware/authMiddleware');
const axios = require('axios');
const { ObjectId } = require('mongodb');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Start real-time interview monitoring session
router.post('/start-monitoring', verifyToken, async (req, res) => {
  try {
    if (!['MANAGER', 'HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager, HR, or Admin role required.'
      });
    }

    const { interviewId, meetingLink, meetingPlatform } = req.body;

    if (!interviewId || !meetingLink) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID and meeting link are required'
      });
    }

    // Verify interview exists
    const interview = await database.findOne('interviews', { _id: interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Get job posting and candidate details
    const jobPosting = await database.findOne('job_postings', { _id: interview.jobPostingId });
    const candidate = await database.findOne('candidates', { _id: interview.candidateId });

    // Create monitoring session
    const sessionId = new ObjectId().toString();
    const monitoringSession = {
      sessionId,
      interviewId,
      meetingLink,
      meetingPlatform: meetingPlatform || 'GENERIC',
      startedBy: req.user._id,
      startedAt: new Date(),
      status: 'MONITORING',
      transcript: [],
      realTimeAnalysis: [],
      scores: {
        current: 0,
        average: 0,
        trend: 'stable'
      },
      metadata: {
        jobTitle: jobPosting?.title,
        jobRequirements: jobPosting?.requirements || [],
        candidateName: candidate?.name,
        candidateId: candidate?._id
      }
    };

    // Store session in database
    await database.insertOne('interview_monitoring_sessions', monitoringSession);

    // Initialize Python ML service session
    try {
      await axios.post(`${ML_SERVICE_URL}/api/realtime-interview/start-session`, {
        session_id: sessionId,
        interview_id: interviewId,
        job_requirements: jobPosting?.requirements || [],
        candidate_name: candidate?.name
      });
    } catch (mlError) {
      console.warn('ML service not available, continuing without it:', mlError.message);
    }

    // Update interview status
    await database.updateOne(
      'interviews',
      { _id: interviewId },
      {
        $set: {
          status: 'IN_PROGRESS',
          monitoringSessionId: sessionId,
          startedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Interview monitoring started',
      data: {
        sessionId,
        status: 'MONITORING',
        meetingLink,
        meetingPlatform: meetingPlatform || 'GENERIC'
      }
    });

  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Receive real-time audio/transcript data
router.post('/process-audio', verifyToken, async (req, res) => {
  try {
    const { sessionId, audioData, transcript, timestamp } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get monitoring session
    const session = await database.findOne('interview_monitoring_sessions', { sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Monitoring session not found'
      });
    }

    // Process audio/transcript with ML service
    let analysisResult = null;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/realtime-interview/analyze`, {
        session_id: sessionId,
        audio_data: audioData,
        transcript: transcript,
        timestamp: timestamp || Date.now() / 1000
      }, {
        timeout: 10000
      });
      analysisResult = mlResponse.data;
    } catch (mlError) {
      console.warn('ML service error, using fallback:', mlError.message);
      // Fallback analysis
      analysisResult = {
        sentiment: { score: 0, label: 'neutral' },
        confidence: 0.5,
        engagement: 0.5,
        keywords: [],
        technical_skills: []
      };
    }

    // Update session with new transcript and analysis
    const transcriptEntry = {
      text: transcript || '',
      timestamp: timestamp || Date.now() / 1000,
      sentiment: analysisResult.sentiment,
      confidence: analysisResult.confidence,
      engagement: analysisResult.engagement,
      keywords: analysisResult.keywords || [],
      technical_skills: analysisResult.technical_skills || []
    };

    await database.updateOne(
      'interview_monitoring_sessions',
      { sessionId },
      {
        $push: {
          transcript: transcriptEntry,
          realTimeAnalysis: {
            timestamp: timestamp || Date.now() / 1000,
            score: analysisResult.overall_score || 0,
            sentiment: analysisResult.sentiment,
            confidence: analysisResult.confidence,
            engagement: analysisResult.engagement
          }
        },
        $set: {
          lastUpdated: new Date(),
          'scores.current': analysisResult.overall_score || 0
        }
      }
    );

    // Calculate average score
    const updatedSession = await database.findOne('interview_monitoring_sessions', { sessionId });
    if (updatedSession.realTimeAnalysis && updatedSession.realTimeAnalysis.length > 0) {
      const scores = updatedSession.realTimeAnalysis.map(a => a.score);
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      await database.updateOne(
        'interview_monitoring_sessions',
        { sessionId },
        {
          $set: {
            'scores.average': average,
            'scores.trend': calculateTrend(scores)
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Audio processed successfully',
      data: {
        analysis: analysisResult,
        currentScore: analysisResult.overall_score || 0
      }
    });

  } catch (error) {
    console.error('Process audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get real-time monitoring status
router.get('/session/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await database.findOne('interview_monitoring_sessions', { sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Monitoring session not found'
      });
    }

    // Get interview details
    const interview = await database.findOne('interviews', { _id: session.interviewId });

    res.json({
      success: true,
      data: {
        ...session,
        interview: {
          scheduledAt: interview?.scheduledAt,
          interviewType: interview?.interviewType,
          duration: interview?.duration
        }
      }
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// End monitoring and generate final report
router.post('/end-monitoring', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get monitoring session
    const session = await database.findOne('interview_monitoring_sessions', { sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Monitoring session not found'
      });
    }

    // Generate final report using ML service
    let finalReport = null;
    try {
      const reportResponse = await axios.post(`${ML_SERVICE_URL}/api/realtime-interview/generate-report`, {
        session_id: sessionId,
        transcript: session.transcript,
        analysis: session.realTimeAnalysis,
        job_requirements: session.metadata.jobRequirements,
        candidate_name: session.metadata.candidateName
      }, {
        timeout: 30000
      });
      finalReport = reportResponse.data;
    } catch (mlError) {
      console.warn('ML service error, generating fallback report:', mlError.message);
      finalReport = generateFallbackReport(session);
    }

    // Update session with final report
    await database.updateOne(
      'interview_monitoring_sessions',
      { sessionId },
      {
        $set: {
          status: 'COMPLETED',
          endedAt: new Date(),
          finalReport: finalReport,
          'scores.final': finalReport.overall_score || session.scores.average
        }
      }
    );

    // Create interview transcript record
    const transcriptRecord = {
      interviewId: session.interviewId,
      transcript: session.transcript.map(t => t.text).join(' '),
      analysis: finalReport,
      scores: {
        aiScore: finalReport.overall_score || 0,
        sentimentScore: finalReport.sentiment_summary?.average || 0,
        confidenceScore: finalReport.confidence_average || 0,
        engagementScore: finalReport.engagement_average || 0
      },
      status: 'ANALYZED',
      duration: (new Date() - new Date(session.startedAt)) / 1000,
      createdAt: new Date()
    };

    const transcriptResult = await database.insertOne('interview_transcripts', transcriptRecord);

    // Update interview with transcript and scores
    await database.updateOne(
      'interviews',
      { _id: session.interviewId },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: new Date(),
          transcriptId: transcriptResult.insertedId,
          aiScore: finalReport.overall_score || 0
        }
      }
    );

    res.json({
      success: true,
      message: 'Monitoring ended and report generated',
      data: {
        sessionId,
        transcriptId: transcriptResult.insertedId,
        report: finalReport
      }
    });

  } catch (error) {
    console.error('End monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get live monitoring data (for real-time updates)
router.get('/session/:sessionId/live', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await database.findOne('interview_monitoring_sessions', { sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Monitoring session not found'
      });
    }

    // Return latest analysis data
    const latestAnalysis = session.realTimeAnalysis && session.realTimeAnalysis.length > 0
      ? session.realTimeAnalysis[session.realTimeAnalysis.length - 1]
      : null;

    res.json({
      success: true,
      data: {
        currentScore: session.scores.current,
        averageScore: session.scores.average,
        trend: session.scores.trend,
        latestAnalysis,
        transcriptLength: session.transcript?.length || 0,
        status: session.status
      }
    });

  } catch (error) {
    console.error('Get live data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper function to calculate trend
function calculateTrend(scores) {
  if (scores.length < 2) return 'stable';
  
  const recent = scores.slice(-5);
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

// Fallback report generator
function generateFallbackReport(session) {
  const transcript = session.transcript || [];
  const analysis = session.realTimeAnalysis || [];
  
  const allText = transcript.map(t => t.text).join(' ');
  const scores = analysis.map(a => a.score || 0);
  const sentiments = analysis.map(a => a.sentiment?.score || 0);
  const confidences = analysis.map(a => a.confidence || 0);
  const engagements = analysis.map(a => a.engagement || 0);
  
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const sentimentAvg = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;
  const confidenceAvg = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  const engagementAvg = engagements.length > 0 ? engagements.reduce((a, b) => a + b, 0) / engagements.length : 0;
  
  return {
    overall_score: Math.round(averageScore),
    sentiment_summary: {
      average: sentimentAvg,
      positive: sentiments.filter(s => s > 0.1).length,
      neutral: sentiments.filter(s => s >= -0.1 && s <= 0.1).length,
      negative: sentiments.filter(s => s < -0.1).length
    },
    confidence_average: confidenceAvg,
    engagement_average: engagementAvg,
    transcript: allText,
    strengths: [],
    weaknesses: [],
    recommendations: []
  };
}

module.exports = router;

