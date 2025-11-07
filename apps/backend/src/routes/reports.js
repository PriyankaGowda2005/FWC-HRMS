const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get attendance report
router.get('/attendance', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { startDate, endDate, departmentId, employeeId } = req.query;
  
  let query = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (departmentId) query.departmentId = departmentId;
  if (employeeId) query.employeeId = employeeId;

  const attendanceRecords = await database.find('attendance', query, {
    sort: { date: -1 }
  });

  // Calculate statistics
  const stats = {
    totalRecords: attendanceRecords.length,
    presentDays: attendanceRecords.filter(r => r.status === 'PRESENT').length,
    absentDays: attendanceRecords.filter(r => r.status === 'ABSENT').length,
    lateDays: attendanceRecords.filter(r => r.status === 'LATE').length,
    totalHours: attendanceRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0)
  };

  res.json({
    attendanceRecords,
    stats,
    dateRange: { startDate, endDate }
  });
}));

// Get payroll report
router.get('/payroll', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { month, year, departmentId } = req.query;
  
  let query = {};
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    query.payPeriod = { $gte: startDate, $lte: endDate };
  }
  if (departmentId) query.departmentId = departmentId;

  const payrollRecords = await database.find('payroll', query, {
    sort: { payPeriod: -1 }
  });

  // Calculate statistics
  const stats = {
    totalRecords: payrollRecords.length,
    totalGrossPay: payrollRecords.reduce((sum, r) => sum + (r.grossPay || 0), 0),
    totalNetPay: payrollRecords.reduce((sum, r) => sum + (r.netPay || 0), 0),
    totalTaxes: payrollRecords.reduce((sum, r) => sum + (r.taxes || 0), 0),
    averageGrossPay: payrollRecords.length > 0 ? 
      payrollRecords.reduce((sum, r) => sum + (r.grossPay || 0), 0) / payrollRecords.length : 0
  };

  res.json({
    payrollRecords,
    stats,
    period: { month, year }
  });
}));

// Get leave report
router.get('/leave', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { startDate, endDate, departmentId, status } = req.query;
  
  let query = {};
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (departmentId) query.departmentId = departmentId;
  if (status) query.status = status;

  const leaveRequests = await database.find('leave_requests', query, {
    sort: { startDate: -1 }
  });

  // Calculate statistics
  const stats = {
    totalRequests: leaveRequests.length,
    approvedRequests: leaveRequests.filter(r => r.status === 'APPROVED').length,
    pendingRequests: leaveRequests.filter(r => r.status === 'PENDING').length,
    rejectedRequests: leaveRequests.filter(r => r.status === 'REJECTED').length,
    totalDays: leaveRequests.reduce((sum, r) => sum + (r.daysRequested || 0), 0)
  };

  res.json({
    leaveRequests,
    stats,
    dateRange: { startDate, endDate }
  });
}));

// Get performance report
router.get('/performance', checkRole('ADMIN', 'HR', 'MANAGER'), asyncHandler(async (req, res) => {
  const { year, departmentId, reviewType } = req.query;
  
  let query = {};
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    query.reviewDate = { $gte: startDate, $lte: endDate };
  }
  if (departmentId) query.departmentId = departmentId;
  if (reviewType) query.reviewType = reviewType;

  const performanceReviews = await database.find('performance_reviews', query, {
    sort: { reviewDate: -1 }
  });

  // Calculate statistics
  const stats = {
    totalReviews: performanceReviews.length,
    averageRating: performanceReviews.length > 0 ? 
      performanceReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / performanceReviews.length : 0,
    highPerformers: performanceReviews.filter(r => (r.overallRating || 0) >= 4).length,
    needsImprovement: performanceReviews.filter(r => (r.overallRating || 0) < 3).length
  };

  res.json({
    performanceReviews,
    stats,
    period: { year }
  });
}));

// Get recruitment dashboard insights and reports
router.get('/recruitment/insights', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { period = '30d', departmentId } = req.query;
  
  // Calculate date range
  let startDate, endDate;
  const now = new Date();
  const days = parseInt(period.replace('d', '')) || 30;
  startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  endDate = now;

  // Build query
  let jobQuery = {};
  let candidateQuery = {};
  if (departmentId) {
    jobQuery.department = departmentId;
    candidateQuery.department = departmentId;
  }

  // Get recruitment data
  const [jobPostings, candidates, applications, screenings, interviews] = await Promise.all([
    database.find('job_postings', jobQuery),
    database.find('candidates', candidateQuery),
    database.find('candidate_applications', { appliedAt: { $gte: startDate, $lte: endDate } }),
    database.find('resume_screenings', { screeningDate: { $gte: startDate, $lte: endDate } }),
    database.find('interviews', { scheduledAt: { $gte: startDate, $lte: endDate } })
  ]);

  // Calculate metrics
  const totalApplications = applications.length;
  const interviewsScheduled = interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'COMPLETED').length;
  const offersExtended = interviews.filter(i => i.status === 'SELECTED' || i.status === 'OFFER_EXTENDED').length;
  const hiresCompleted = candidates.filter(c => c.status === 'HIRED' || c.status === 'SELECTED').length;
  
  // Calculate average time to hire
  const completedHires = candidates.filter(c => c.hiredAt && c.appliedAt);
  const averageTimeToHire = completedHires.length > 0
    ? Math.round(completedHires.reduce((sum, c) => {
        const days = (new Date(c.hiredAt) - new Date(c.appliedAt)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / completedHires.length)
    : 0;

  // Calculate candidate quality score (average fit score)
  const screeningsWithScores = screenings.filter(s => s.fitScore);
  const candidateQualityScore = screeningsWithScores.length > 0
    ? Math.round(screeningsWithScores.reduce((sum, s) => sum + (s.fitScore || 0), 0) / screeningsWithScores.length)
    : 0;

  // Calculate trends
  const applicationTrend = totalApplications > 0 ? 'increasing' : 'stable';
  const interviewConversionRate = totalApplications > 0 
    ? Math.round((interviewsScheduled / totalApplications) * 100)
    : 0;
  const offerAcceptanceRate = interviewsScheduled > 0
    ? Math.round((offersExtended / interviewsScheduled) * 100)
    : 0;

  // Get top sources (if available in applications)
  const sourceCounts = {};
  applications.forEach(app => {
    const source = app.source || 'Company Website';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      applications: count,
      conversion: Math.round((count / totalApplications) * 100)
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  // AI-generated predictions
  const predictions = {
    nextMonthApplications: Math.round(totalApplications * 1.1), // 10% increase estimate
    hiringVelocity: Math.round((hiresCompleted / days) * 30), // Projected hires per month
    skillGaps: jobPostings
      .flatMap(job => job.requirements || [])
      .filter((req, index, self) => self.indexOf(req) === index)
      .slice(0, 5)
  };

  // AI-generated recommendations
  const recommendations = [];
  if (interviewConversionRate < 50) {
    recommendations.push('Optimize job descriptions for better candidate matching');
  }
  if (averageTimeToHire > 30) {
    recommendations.push('Streamline interview process to reduce time-to-hire');
  }
  if (candidateQualityScore < 70) {
    recommendations.push('Enhance screening criteria to improve candidate quality');
  }
  if (topSources.length === 0 || topSources[0].applications < 10) {
    recommendations.push('Expand recruitment channels and improve employer branding');
  }
  if (offersExtended === 0 && interviewsScheduled > 0) {
    recommendations.push('Review interview feedback and adjust selection criteria');
  }

  res.json({
    success: true,
    period,
    metrics: {
      totalApplications,
      interviewsScheduled,
      offersExtended,
      hiresCompleted,
      averageTimeToHire,
      candidateQualityScore
    },
    trends: {
      applicationTrend,
      interviewConversionRate,
      offerAcceptanceRate,
      timeToHireTrend: averageTimeToHire < 20 ? 'decreasing' : 'stable'
    },
    topSources,
    predictions,
    recommendations,
    generatedAt: new Date()
  });
}));

// Get candidate trends analysis
router.get('/recruitment/candidate-trends', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { period = '90d' } = req.query;
  const days = parseInt(period.replace('d', '')) || 90;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const applications = await database.find('candidate_applications', {
    appliedAt: { $gte: startDate }
  });

  // Group by date
  const dailyApplications = {};
  applications.forEach(app => {
    const date = new Date(app.appliedAt).toISOString().split('T')[0];
    dailyApplications[date] = (dailyApplications[date] || 0) + 1;
  });

  // Group by department
  const departmentCounts = {};
  applications.forEach(async (app) => {
    const jobPosting = await database.findOne('job_postings', { _id: app.jobPostingId });
    if (jobPosting) {
      const dept = jobPosting.department || 'Unknown';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    }
  });

  // Calculate average fit scores by department
  const screenings = await database.find('resume_screenings', {
    screeningDate: { $gte: startDate }
  });

  const fitScoresByDept = {};
  for (const screening of screenings) {
    const jobPosting = await database.findOne('job_postings', { _id: screening.jobPostingId });
    if (jobPosting && screening.fitScore) {
      const dept = jobPosting.department || 'Unknown';
      if (!fitScoresByDept[dept]) {
        fitScoresByDept[dept] = [];
      }
      fitScoresByDept[dept].push(screening.fitScore);
    }
  }

  const avgFitScores = Object.entries(fitScoresByDept).map(([dept, scores]) => ({
    department: dept,
    averageFitScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    totalCandidates: scores.length
  }));

  res.json({
    success: true,
    period,
    dailyApplications,
    departmentDistribution: departmentCounts,
    averageFitScoresByDepartment: avgFitScores,
    totalApplications: applications.length,
    generatedAt: new Date()
  });
}));

// Get role difficulty analysis
router.get('/recruitment/role-difficulty', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const jobPostings = await database.find('job_postings', { status: 'PUBLISHED' });
  
  const roleAnalysis = await Promise.all(
    jobPostings.map(async (job) => {
      const applications = await database.find('candidate_applications', {
        jobPostingId: job._id
      });
      
      const screenings = await database.find('resume_screenings', {
        jobPostingId: job._id
      });
      
      const avgFitScore = screenings.length > 0
        ? screenings.reduce((sum, s) => sum + (s.fitScore || 0), 0) / screenings.length
        : 0;
      
      const interviews = await database.find('interviews', {
        jobPostingId: job._id
      });
      
      const timeToFill = applications.length > 0
        ? (new Date() - new Date(job.publishedAt || job.createdAt)) / (1000 * 60 * 60 * 24)
        : 0;
      
      // Calculate difficulty score (0-100, higher = more difficult)
      const difficultyScore = Math.round(
        (100 - avgFitScore) * 0.4 + // Lower fit scores = harder
        (timeToFill > 30 ? 30 : timeToFill / 30 * 30) * 0.3 + // Longer time = harder
        (applications.length < 10 ? 30 : 0) * 0.3 // Fewer applications = harder
      );
      
      return {
        jobTitle: job.title,
        department: job.department,
        totalApplications: applications.length,
        averageFitScore: Math.round(avgFitScore),
        interviewsScheduled: interviews.length,
        timeToFill: Math.round(timeToFill),
        difficultyScore: Math.min(100, difficultyScore),
        difficultyLevel: difficultyScore >= 70 ? 'High' : difficultyScore >= 40 ? 'Medium' : 'Low'
      };
    })
  );

  res.json({
    success: true,
    roles: roleAnalysis.sort((a, b) => b.difficultyScore - a.difficultyScore),
    generatedAt: new Date()
  });
}));

// Get hiring time predictions
router.get('/recruitment/hiring-predictions', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { jobPostingId } = req.query;
  
  let query = {};
  if (jobPostingId) {
    query._id = ObjectId.isValid(jobPostingId) ? new ObjectId(jobPostingId) : jobPostingId;
  }

  const jobPostings = await database.find('job_postings', query);
  
  const predictions = await Promise.all(
    jobPostings.map(async (job) => {
      const applications = await database.find('candidate_applications', {
        jobPostingId: job._id
      });
      
      const screenings = await database.find('resume_screenings', {
        jobPostingId: job._id
      });
      
      const avgFitScore = screenings.length > 0
        ? screenings.reduce((sum, s) => sum + (s.fitScore || 0), 0) / screenings.length
        : 0;
      
      // Historical data for similar roles
      const similarJobs = await database.find('job_postings', {
        department: job.department,
        _id: { $ne: job._id }
      });
      
      let avgHistoricalTime = 0;
      if (similarJobs.length > 0) {
        const historicalTimes = [];
        for (const similarJob of similarJobs) {
          const similarApplications = await database.find('candidate_applications', {
            jobPostingId: similarJob._id,
            status: 'SELECTED'
          });
          
          for (const app of similarApplications) {
            if (app.appliedAt && app.selectedAt) {
              const days = (new Date(app.selectedAt) - new Date(app.appliedAt)) / (1000 * 60 * 60 * 24);
              historicalTimes.push(days);
            }
          }
        }
        
        if (historicalTimes.length > 0) {
          avgHistoricalTime = historicalTimes.reduce((a, b) => a + b, 0) / historicalTimes.length;
        }
      }
      
      // Predict time to hire
      const baseTime = avgHistoricalTime || 30; // Default 30 days
      const fitScoreAdjustment = (100 - avgFitScore) / 100 * 10; // Adjust based on fit score
      const predictedDays = Math.round(baseTime + fitScoreAdjustment);
      
      // Predict number of candidates needed
      const interviewConversionRate = 0.6; // 60% conversion
      const offerAcceptanceRate = 0.7; // 70% acceptance
      const candidatesNeeded = Math.ceil(1 / (interviewConversionRate * offerAcceptanceRate));
      
      return {
        jobTitle: job.title,
        department: job.department,
        currentApplications: applications.length,
        averageFitScore: Math.round(avgFitScore),
        predictedTimeToHire: predictedDays,
        predictedCandidatesNeeded: candidatesNeeded,
        confidence: avgHistoricalTime > 0 ? 'High' : 'Medium',
        factors: [
          avgFitScore < 60 ? 'Low candidate fit scores' : null,
          applications.length < 5 ? 'Limited applications received' : null,
          avgHistoricalTime > 0 ? `Based on ${similarJobs.length} similar roles` : 'Limited historical data'
        ].filter(Boolean)
      };
    })
  );

  res.json({
    success: true,
    predictions,
    generatedAt: new Date()
  });
}));

// Get general analytics
router.get('/analytics', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { period } = req.query;
  
  // Calculate date range based on period
  let startDate, endDate;
  const now = new Date();
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      endDate = now;
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      break;
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
  }

  // Get various statistics
  const [employees, attendance, leaveRequests, payroll] = await Promise.all([
    database.find('employees', { isActive: true }),
    database.find('attendance', { date: { $gte: startDate, $lte: endDate } }),
    database.find('leave_requests', { startDate: { $gte: startDate, $lte: endDate } }),
    database.find('payroll', { payPeriod: { $gte: startDate, $lte: endDate } })
  ]);

  const analytics = {
    employees: {
      total: employees.length,
      byDepartment: employees.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {})
    },
    attendance: {
      totalRecords: attendance.length,
      averageHours: attendance.length > 0 ? 
        attendance.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) / attendance.length : 0,
      attendanceRate: attendance.length > 0 ? 
        (attendance.filter(r => r.status === 'PRESENT').length / attendance.length) * 100 : 0
    },
    leave: {
      totalRequests: leaveRequests.length,
      approvalRate: leaveRequests.length > 0 ? 
        (leaveRequests.filter(r => r.status === 'APPROVED').length / leaveRequests.length) * 100 : 0
    },
    payroll: {
      totalPaid: payroll.reduce((sum, r) => sum + (r.netPay || 0), 0),
      averagePay: payroll.length > 0 ? 
        payroll.reduce((sum, r) => sum + (r.grossPay || 0), 0) / payroll.length : 0
    }
  };

  res.json({
    analytics,
    period: { startDate, endDate },
    generatedAt: new Date()
  });
}));

// Export report
router.get('/:type/export', checkRole('ADMIN', 'HR'), asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = 'pdf', dateRange } = req.query;
  
  // For now, return a mock export response
  // In a real system, you would generate actual PDF/Excel files
  res.json({
    message: `Exporting ${type} report in ${format} format`,
    downloadUrl: `/api/files/exports/${type}_${Date.now()}.${format}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });
}));

module.exports = router;

