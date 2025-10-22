const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate report
router.post('/generate', [
  authenticate,
  authorize('reports:read'),
  body('reportType').isIn(['attendance', 'payroll', 'leave', 'performance', 'recruitment', 'employee']).withMessage('Invalid report type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { reportType, startDate, endDate } = req.body;
  const dateRange = {
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  };

  let reportData = {};

  try {
    switch (reportType) {
      case 'attendance':
        reportData = await generateAttendanceReport(dateRange);
        break;
      case 'payroll':
        reportData = await generatePayrollReport(dateRange);
        break;
      case 'leave':
        reportData = await generateLeaveReport(dateRange);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(dateRange);
        break;
      case 'recruitment':
        reportData = await generateRecruitmentReport(dateRange);
        break;
      case 'employee':
        reportData = await generateEmployeeReport(dateRange);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      reportData: {
        ...reportData,
        dateRange,
        generatedAt: new Date(),
        generatedBy: req.user.id
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
}));

// Generate attendance report
async function generateAttendanceReport(dateRange) {
  const attendanceRecords = await database.find('attendance', {
    date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const employees = await database.find('employees', { isActive: true });
  const employeeMap = new Map(employees.map(emp => [emp._id.toString(), emp]));

  const summary = {
    totalEmployees: employees.length,
    totalWorkingDays: Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)),
    totalRecords: attendanceRecords.length,
    presentCount: attendanceRecords.filter(r => r.status === 'PRESENT').length,
    lateCount: attendanceRecords.filter(r => r.status === 'LATE').length,
    absentCount: attendanceRecords.filter(r => r.status === 'ABSENT').length
  };

  summary.averageAttendance = summary.totalRecords > 0 
    ? Math.round((summary.presentCount / summary.totalRecords) * 100) 
    : 0;

  const details = attendanceRecords.map(record => {
    const employee = employeeMap.get(record.employeeId.toString());
    return {
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      department: employee ? employee.department : 'Unknown',
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      hoursWorked: record.hoursWorked || 0
    };
  });

  return {
    summary,
    attendanceRecords: details
  };
}

// Generate payroll report
async function generatePayrollReport(dateRange) {
  const payrollRecords = await database.find('payroll', {
    payPeriod: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const employees = await database.find('employees', { isActive: true });
  const employeeMap = new Map(employees.map(emp => [emp._id.toString(), emp]));

  const summary = {
    totalEmployees: payrollRecords.length,
    totalGrossSalary: payrollRecords.reduce((sum, record) => sum + (record.grossSalary || 0), 0),
    totalDeductions: payrollRecords.reduce((sum, record) => sum + (record.totalDeductions || 0), 0),
    totalNetSalary: payrollRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0)
  };

  summary.averageSalary = summary.totalEmployees > 0 
    ? Math.round(summary.totalNetSalary / summary.totalEmployees) 
    : 0;

  const details = payrollRecords.map(record => {
    const employee = employeeMap.get(record.employeeId.toString());
    return {
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      department: employee ? employee.department : 'Unknown',
      designation: employee ? employee.designation : 'Unknown',
      grossSalary: record.grossSalary || 0,
      totalDeductions: record.totalDeductions || 0,
      netSalary: record.netSalary || 0,
      payPeriod: record.payPeriod
    };
  });

  return {
    summary,
    payrollRecords: details
  };
}

// Generate leave report
async function generateLeaveReport(dateRange) {
  const leaveRequests = await database.find('leave_requests', {
    appliedAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const employees = await database.find('employees', { isActive: true });
  const employeeMap = new Map(employees.map(emp => [emp._id.toString(), emp]));

  const summary = {
    totalLeaveRequests: leaveRequests.length,
    approvedRequests: leaveRequests.filter(r => r.status === 'APPROVED').length,
    rejectedRequests: leaveRequests.filter(r => r.status === 'REJECTED').length,
    pendingRequests: leaveRequests.filter(r => r.status === 'APPLIED').length,
    totalLeaveDays: leaveRequests.reduce((sum, record) => sum + (record.days || 0), 0)
  };

  const details = leaveRequests.map(record => {
    const employee = employeeMap.get(record.employeeId.toString());
    return {
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      department: employee ? employee.department : 'Unknown',
      leaveType: record.leaveType,
      startDate: record.startDate,
      endDate: record.endDate,
      days: record.days,
      status: record.status,
      appliedAt: record.appliedAt,
      reason: record.reason
    };
  });

  return {
    summary,
    leaveRecords: details
  };
}

// Generate performance report
async function generatePerformanceReport(dateRange) {
  const performanceReviews = await database.find('performance_reviews', {
    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const performanceGoals = await database.find('performance_goals', {
    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const employees = await database.find('employees', { isActive: true });
  const employeeMap = new Map(employees.map(emp => [emp._id.toString(), emp]));

  const summary = {
    totalReviews: performanceReviews.length,
    completedReviews: performanceReviews.filter(r => r.status === 'COMPLETED').length,
    totalGoals: performanceGoals.length,
    completedGoals: performanceGoals.filter(g => g.status === 'COMPLETED').length,
    inProgressGoals: performanceGoals.filter(g => g.status === 'IN_PROGRESS').length
  };

  summary.averageRating = performanceReviews.length > 0 
    ? Math.round((performanceReviews.reduce((sum, r) => sum + r.overallRating, 0) / performanceReviews.length) * 10) / 10
    : 0;

  const reviewDetails = performanceReviews.map(review => {
    const employee = employeeMap.get(review.employeeId.toString());
    return {
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      department: employee ? employee.department : 'Unknown',
      reviewPeriod: review.reviewPeriod,
      overallRating: review.overallRating,
      goalsRating: review.goalsRating,
      skillsRating: review.skillsRating,
      teamworkRating: review.teamworkRating,
      communicationRating: review.communicationRating,
      status: review.status,
      createdAt: review.createdAt
    };
  });

  const goalDetails = performanceGoals.map(goal => {
    const employee = employeeMap.get(goal.employeeId.toString());
    return {
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      priority: goal.priority,
      status: goal.status,
      progress: goal.progress || 0,
      createdAt: goal.createdAt
    };
  });

  return {
    summary,
    performanceRecords: [...reviewDetails, ...goalDetails]
  };
}

// Generate recruitment report
async function generateRecruitmentReport(dateRange) {
  const jobPostings = await database.find('job_postings', {
    createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const candidates = await database.find('candidates', {
    appliedAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const summary = {
    totalJobPostings: jobPostings.length,
    activeJobPostings: jobPostings.filter(j => j.status === 'ACTIVE').length,
    closedJobPostings: jobPostings.filter(j => j.status === 'CLOSED').length,
    totalApplications: candidates.length,
    hiredCandidates: candidates.filter(c => c.status === 'HIRED').length,
    rejectedCandidates: candidates.filter(c => c.status === 'REJECTED').length
  };

  // Calculate average time to hire
  const hiredCandidates = candidates.filter(c => c.status === 'HIRED');
  let averageTimeToHire = 0;
  if (hiredCandidates.length > 0) {
    const totalDays = hiredCandidates.reduce((sum, candidate) => {
      const daysDiff = Math.ceil((candidate.updatedAt - candidate.appliedAt) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    averageTimeToHire = Math.round(totalDays / hiredCandidates.length);
  }
  summary.averageTimeToHire = averageTimeToHire;

  const jobDetails = jobPostings.map(job => ({
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt
  }));

  const candidateDetails = candidates.map(candidate => ({
    name: candidate.name,
    email: candidate.email,
    jobTitle: candidate.jobPostingId ? 'Applied for job' : 'General application',
    status: candidate.status,
    appliedAt: candidate.appliedAt
  }));

  return {
    summary,
    recruitmentRecords: [...jobDetails, ...candidateDetails]
  };
}

// Generate employee report
async function generateEmployeeReport(dateRange) {
  const employees = await database.find('employees', { isActive: true });
  
  const newHires = await database.find('employees', {
    hireDate: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const departures = await database.find('employees', {
    terminationDate: { $gte: dateRange.startDate, $lte: dateRange.endDate }
  });

  const summary = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.isActive).length,
    newHires: newHires.length,
    departures: departures.length
  };

  // Calculate average tenure
  const currentDate = new Date();
  const tenures = employees.map(emp => {
    const hireDate = emp.hireDate || emp.createdAt;
    return Math.floor((currentDate - new Date(hireDate)) / (1000 * 60 * 60 * 24 * 365));
  });
  summary.averageTenure = tenures.length > 0 
    ? Math.round(tenures.reduce((sum, tenure) => sum + tenure, 0) / tenures.length * 10) / 10
    : 0;

  const details = employees.map(employee => ({
    name: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    department: employee.department,
    designation: employee.designation,
    hireDate: employee.hireDate,
    isActive: employee.isActive,
    manager: employee.managerId ? 'Has Manager' : 'No Manager'
  }));

  return {
    summary,
    employeeRecords: details
  };
}

// Get report templates
router.get('/templates', [
  authenticate,
  authorize('reports:read')
], asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'monthly-summary',
      name: 'Monthly Summary',
      description: 'Comprehensive monthly HR summary',
      reportType: 'attendance',
      defaultDateRange: 'current-month'
    },
    {
      id: 'payroll-summary',
      name: 'Payroll Summary',
      description: 'Current month payroll details',
      reportType: 'payroll',
      defaultDateRange: 'current-month'
    },
    {
      id: 'employee-directory',
      name: 'Employee Directory',
      description: 'Complete employee information',
      reportType: 'employee',
      defaultDateRange: 'all-time'
    },
    {
      id: 'performance-overview',
      name: 'Performance Overview',
      description: 'Team performance summary',
      reportType: 'performance',
      defaultDateRange: 'current-year'
    },
    {
      id: 'leave-analysis',
      name: 'Leave Analysis',
      description: 'Leave patterns and trends',
      reportType: 'leave',
      defaultDateRange: 'current-year'
    },
    {
      id: 'recruitment-stats',
      name: 'Recruitment Stats',
      description: 'Hiring metrics and trends',
      reportType: 'recruitment',
      defaultDateRange: 'current-year'
    }
  ];

  res.json({
    success: true,
    templates
  });
}));

// Get report history
router.get('/history', [
  authenticate,
  authorize('reports:read')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const reports = await database.find('report_history', {}, {
    skip,
    limit: parseInt(limit),
    sort: { generatedAt: -1 }
  });

  const total = await database.count('report_history', {});

  res.json({
    success: true,
    reports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Save report to history
router.post('/history', [
  authenticate,
  authorize('reports:write'),
  body('reportType').notEmpty().withMessage('Report type is required'),
  body('reportData').isObject().withMessage('Report data is required'),
  body('dateRange').isObject().withMessage('Date range is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { reportType, reportData, dateRange } = req.body;

  const reportHistory = {
    reportType,
    reportData,
    dateRange,
    generatedBy: req.user.id,
    generatedAt: new Date()
  };

  const result = await database.insertOne('report_history', reportHistory);

  res.status(201).json({
    success: true,
    message: 'Report saved to history',
    reportId: result.insertedId
  });
}));

module.exports = router;