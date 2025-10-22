const { ObjectId } = require('mongodb');
const database = require('./connection');

// Seed data for all HRMS modules
const seedAllModules = async () => {
  try {
    console.log('🌱 Starting comprehensive HRMS data seeding...');

    // 1. Seed Departments
    await seedDepartments();
    
    // 2. Seed Job Postings
    await seedJobPostings();
    
    // 3. Seed Candidates
    await seedCandidates();
    
    // 4. Seed Performance Reviews
    await seedPerformanceReviews();
    
    // 5. Seed Performance Goals
    await seedPerformanceGoals();
    
    // 6. Seed System Settings
    await seedSystemSettings();
    
    // 7. Seed Report History
    await seedReportHistory();

    console.log('✅ All HRMS modules seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding HRMS modules:', error);
    throw error;
  }
};

// Seed Departments
const seedDepartments = async () => {
  console.log('📁 Seeding departments...');
  
  const departments = [
    {
      name: 'Human Resources',
      description: 'Manages employee relations, recruitment, and HR policies',
      budget: 500000,
      managerId: null, // Will be set after employees are created
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    },
    {
      name: 'Information Technology',
      description: 'Handles all technology infrastructure and software development',
      budget: 1200000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    },
    {
      name: 'Finance',
      description: 'Manages financial planning, accounting, and budgeting',
      budget: 800000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    },
    {
      name: 'Marketing',
      description: 'Handles brand management, advertising, and customer acquisition',
      budget: 600000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    },
    {
      name: 'Operations',
      description: 'Manages day-to-day business operations and process improvement',
      budget: 400000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    },
    {
      name: 'Sales',
      description: 'Handles customer acquisition and revenue generation',
      budget: 700000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    }
  ];

  await database.insertMany('departments', departments);
  console.log(`✅ Seeded ${departments.length} departments`);
};

// Seed Job Postings
const seedJobPostings = async () => {
  console.log('💼 Seeding job postings...');
  
  const jobPostings = [
    {
      title: 'Senior Software Engineer',
      description: 'We are looking for an experienced software engineer to join our development team. You will be responsible for designing and implementing scalable software solutions.',
      requirements: 'Bachelor\'s degree in Computer Science, 5+ years of experience with React/Node.js, experience with cloud platforms (AWS/Azure), strong problem-solving skills',
      department: 'Information Technology',
      location: 'San Francisco, CA',
      type: 'FULL_TIME',
      salary: '$120,000 - $150,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'HR Business Partner',
      description: 'Join our HR team as a Business Partner to support our growing organization. You will work closely with managers to develop and implement HR strategies.',
      requirements: 'Bachelor\'s degree in HR or related field, 3+ years of HR experience, strong communication skills, knowledge of employment laws',
      department: 'Human Resources',
      location: 'New York, NY',
      type: 'FULL_TIME',
      salary: '$80,000 - $100,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Financial Analyst',
      description: 'We need a detail-oriented Financial Analyst to support our finance team with budgeting, forecasting, and financial reporting.',
      requirements: 'Bachelor\'s degree in Finance or Accounting, 2+ years of financial analysis experience, proficiency in Excel and financial modeling',
      department: 'Finance',
      location: 'Chicago, IL',
      type: 'FULL_TIME',
      salary: '$70,000 - $90,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Marketing Specialist',
      description: 'Join our marketing team to help drive brand awareness and customer acquisition through innovative marketing campaigns.',
      requirements: 'Bachelor\'s degree in Marketing or Communications, 2+ years of marketing experience, knowledge of digital marketing tools',
      department: 'Marketing',
      location: 'Los Angeles, CA',
      type: 'FULL_TIME',
      salary: '$60,000 - $80,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Operations Manager',
      description: 'We are seeking an Operations Manager to oversee our daily operations and drive process improvements across the organization.',
      requirements: 'Bachelor\'s degree in Business Administration, 4+ years of operations experience, strong leadership skills',
      department: 'Operations',
      location: 'Austin, TX',
      type: 'FULL_TIME',
      salary: '$90,000 - $110,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Sales Representative',
      description: 'Join our sales team to help grow our customer base and drive revenue growth through relationship building and strategic selling.',
      requirements: 'Bachelor\'s degree preferred, 2+ years of sales experience, excellent communication skills, results-driven mindset',
      department: 'Sales',
      location: 'Remote',
      type: 'FULL_TIME',
      salary: '$50,000 - $70,000 + Commission',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Frontend Developer Intern',
      description: 'Great opportunity for a computer science student to gain hands-on experience with modern frontend technologies.',
      requirements: 'Currently enrolled in Computer Science program, basic knowledge of HTML/CSS/JavaScript, eagerness to learn',
      department: 'Information Technology',
      location: 'San Francisco, CA',
      type: 'INTERNSHIP',
      salary: '$25/hour',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Data Scientist',
      description: 'We are looking for a Data Scientist to help us extract insights from our data and build predictive models.',
      requirements: 'Master\'s degree in Data Science or related field, 3+ years of experience with Python/R, knowledge of machine learning algorithms',
      department: 'Information Technology',
      location: 'Seattle, WA',
      type: 'FULL_TIME',
      salary: '$110,000 - $140,000',
      status: 'CLOSED',
      createdBy: new ObjectId(),
      createdAt: new Date()
    }
  ];

  await database.insertMany('job_postings', jobPostings);
  console.log(`✅ Seeded ${jobPostings.length} job postings`);
};

// Seed Candidates
const seedCandidates = async () => {
  console.log('👥 Seeding candidates...');
  
  const candidates = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0123',
      jobPostingId: null, // Will be set to reference job postings
      experience: '5 years',
      skills: 'React, Node.js, AWS, MongoDB, JavaScript, TypeScript',
      resume: 'john_smith_resume.pdf',
      status: 'APPLIED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0124',
      jobPostingId: null,
      experience: '3 years',
      skills: 'HR Management, Employee Relations, Recruitment, Training',
      resume: 'sarah_johnson_resume.pdf',
      status: 'SHORTLISTED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1-555-0125',
      jobPostingId: null,
      experience: '2 years',
      skills: 'Financial Analysis, Excel, Budgeting, Forecasting',
      resume: 'michael_brown_resume.pdf',
      status: 'INTERVIEWED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1-555-0126',
      jobPostingId: null,
      experience: '2 years',
      skills: 'Digital Marketing, Social Media, Content Creation, Analytics',
      resume: 'emily_davis_resume.pdf',
      status: 'HIRED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'David Wilson',
      email: 'david.wilson@email.com',
      phone: '+1-555-0127',
      jobPostingId: null,
      experience: '4 years',
      skills: 'Operations Management, Process Improvement, Leadership, Project Management',
      resume: 'david_wilson_resume.pdf',
      status: 'REJECTED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Lisa Anderson',
      email: 'lisa.anderson@email.com',
      phone: '+1-555-0128',
      jobPostingId: null,
      experience: '2 years',
      skills: 'Sales, Customer Relations, CRM, Lead Generation',
      resume: 'lisa_anderson_resume.pdf',
      status: 'APPLIED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Robert Taylor',
      email: 'robert.taylor@email.com',
      phone: '+1-555-0129',
      jobPostingId: null,
      experience: 'Student',
      skills: 'HTML, CSS, JavaScript, React Basics, Git',
      resume: 'robert_taylor_resume.pdf',
      status: 'SHORTLISTED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Jennifer Martinez',
      email: 'jennifer.martinez@email.com',
      phone: '+1-555-0130',
      jobPostingId: null,
      experience: '3 years',
      skills: 'Python, R, Machine Learning, Data Analysis, SQL',
      resume: 'jennifer_martinez_resume.pdf',
      status: 'HIRED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    }
  ];

  await database.insertMany('candidates', candidates);
  console.log(`✅ Seeded ${candidates.length} candidates`);
};

// Seed Performance Reviews
const seedPerformanceReviews = async () => {
  console.log('📊 Seeding performance reviews...');
  
  const performanceReviews = [
    {
      employeeId: new ObjectId(),
      reviewerId: new ObjectId(),
      reviewPeriod: 'Q1 2024',
      overallRating: 4,
      goalsRating: 4,
      skillsRating: 5,
      teamworkRating: 4,
      communicationRating: 4,
      strengths: 'Excellent technical skills, proactive problem-solving, great team collaboration',
      areasForImprovement: 'Could improve time management and delegation skills',
      comments: 'Strong performance this quarter. Continue focusing on leadership development.',
      status: 'COMPLETED',
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      reviewerId: new ObjectId(),
      reviewPeriod: 'Q1 2024',
      overallRating: 3,
      goalsRating: 3,
      skillsRating: 3,
      teamworkRating: 4,
      communicationRating: 3,
      strengths: 'Good team player, reliable attendance, positive attitude',
      areasForImprovement: 'Needs to improve technical skills and take more initiative',
      comments: 'Satisfactory performance. Recommend additional training opportunities.',
      status: 'COMPLETED',
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      reviewerId: new ObjectId(),
      reviewPeriod: 'Q1 2024',
      overallRating: 5,
      goalsRating: 5,
      skillsRating: 5,
      teamworkRating: 5,
      communicationRating: 5,
      strengths: 'Outstanding performance in all areas, excellent leadership, innovative thinking',
      areasForImprovement: 'None identified',
      comments: 'Exceptional performance. Consider for promotion opportunities.',
      status: 'COMPLETED',
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      reviewerId: new ObjectId(),
      reviewPeriod: 'Q2 2024',
      overallRating: 4,
      goalsRating: 4,
      skillsRating: 4,
      teamworkRating: 4,
      communicationRating: 4,
      strengths: 'Consistent performance, good communication skills, meets deadlines',
      areasForImprovement: 'Could take on more challenging projects',
      comments: 'Good performance. Encourage to seek more challenging assignments.',
      status: 'IN_PROGRESS',
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      reviewerId: new ObjectId(),
      reviewPeriod: 'Q2 2024',
      overallRating: 2,
      goalsRating: 2,
      skillsRating: 3,
      teamworkRating: 2,
      communicationRating: 2,
      strengths: 'Some technical skills present',
      areasForImprovement: 'Needs significant improvement in teamwork, communication, and goal achievement',
      comments: 'Performance below expectations. Performance improvement plan required.',
      status: 'PENDING',
      createdAt: new Date()
    }
  ];

  await database.insertMany('performance_reviews', performanceReviews);
  console.log(`✅ Seeded ${performanceReviews.length} performance reviews`);
};

// Seed Performance Goals
const seedPerformanceGoals = async () => {
  console.log('🎯 Seeding performance goals...');
  
  const performanceGoals = [
    {
      employeeId: new ObjectId(),
      title: 'Complete Advanced React Certification',
      description: 'Obtain certification in advanced React development to enhance technical skills',
      targetDate: new Date('2024-06-30'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 60,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Lead Team Project',
      description: 'Successfully lead a cross-functional team project from initiation to completion',
      targetDate: new Date('2024-08-15'),
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      progress: 0,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Improve Customer Satisfaction Score',
      description: 'Increase customer satisfaction rating from 4.2 to 4.5 through improved service delivery',
      targetDate: new Date('2024-12-31'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 30,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Complete Leadership Training Program',
      description: 'Complete the company\'s leadership development program to prepare for management role',
      targetDate: new Date('2024-09-30'),
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      progress: 40,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Reduce Process Time by 20%',
      description: 'Identify and implement process improvements to reduce average processing time by 20%',
      targetDate: new Date('2024-07-31'),
      priority: 'HIGH',
      status: 'COMPLETED',
      progress: 100,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Mentor Junior Team Members',
      description: 'Provide mentorship to 2 junior team members to help with their professional development',
      targetDate: new Date('2024-10-31'),
      priority: 'LOW',
      status: 'NOT_STARTED',
      progress: 0,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Increase Sales Revenue by 15%',
      description: 'Achieve 15% increase in sales revenue compared to previous quarter',
      targetDate: new Date('2024-06-30'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 75,
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      employeeId: new ObjectId(),
      title: 'Complete Data Analysis Course',
      description: 'Complete online course in advanced data analysis techniques',
      targetDate: new Date('2024-08-31'),
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      progress: 50,
      createdBy: new ObjectId(),
      createdAt: new Date()
    }
  ];

  await database.insertMany('performance_goals', performanceGoals);
  console.log(`✅ Seeded ${performanceGoals.length} performance goals`);
};

// Seed System Settings
const seedSystemSettings = async () => {
  console.log('⚙️ Seeding system settings...');
  
  const systemSettings = {
    general: {
      systemName: 'FWC HRMS',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12',
      language: 'en',
      currency: 'USD',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '09:00', end: '17:00' }
    },
    company: {
      companyName: 'Future Work Company',
      companyAddress: '123 Business Street, Suite 100, New York, NY 10001',
      companyPhone: '+1-555-0123',
      companyEmail: 'info@futureworkcompany.com',
      companyWebsite: 'https://www.futureworkcompany.com',
      taxId: '12-3456789',
      registrationNumber: 'REG-2024-001',
      industry: 'Technology',
      companySize: '201-500',
      foundedYear: 2020
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: 'noreply@futureworkcompany.com',
      smtpPassword: 'encrypted_password_here',
      smtpSecure: true,
      fromEmail: 'noreply@futureworkcompany.com',
      fromName: 'FWC HRMS System',
      emailNotifications: true,
      autoEmailReports: false
    },
    security: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttempts: 5,
      accountLockout: 15,
      ipWhitelist: '',
      auditLogging: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      leaveNotifications: true,
      attendanceNotifications: true,
      payrollNotifications: true,
      performanceNotifications: true,
      systemNotifications: true
    },
    integrations: {
      googleCalendar: false,
      googleCalendarApiKey: '',
      slackIntegration: false,
      slackWebhookUrl: '',
      zoomIntegration: false,
      zoomApiKey: '',
      zoomApiSecret: '',
      ldapIntegration: false,
      ldapServer: '',
      ldapPort: 389
    },
    createdAt: new Date(),
    createdBy: new ObjectId()
  };

  await database.insertOne('system_settings', systemSettings);
  console.log('✅ Seeded system settings');
};

// Seed Report History
const seedReportHistory = async () => {
  console.log('📈 Seeding report history...');
  
  const reportHistory = [
    {
      reportType: 'attendance',
      reportData: {
        summary: {
          totalEmployees: 150,
          totalWorkingDays: 22,
          averageAttendance: 95,
          totalAbsences: 8,
          totalLateArrivals: 12
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      },
      generatedBy: new ObjectId(),
      generatedAt: new Date('2024-02-01')
    },
    {
      reportType: 'payroll',
      reportData: {
        summary: {
          totalEmployees: 150,
          totalGrossSalary: 1200000,
          totalDeductions: 180000,
          totalNetSalary: 1020000,
          averageSalary: 6800
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      },
      generatedBy: new ObjectId(),
      generatedAt: new Date('2024-02-05')
    },
    {
      reportType: 'performance',
      reportData: {
        summary: {
          totalReviews: 45,
          completedReviews: 40,
          totalGoals: 120,
          completedGoals: 25,
          inProgressGoals: 80,
          averageRating: 4.2
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-03-31'
        }
      },
      generatedBy: new ObjectId(),
      generatedAt: new Date('2024-04-01')
    },
    {
      reportType: 'recruitment',
      reportData: {
        summary: {
          totalJobPostings: 8,
          activeJobPostings: 6,
          closedJobPostings: 2,
          totalApplications: 45,
          hiredCandidates: 5,
          rejectedCandidates: 15,
          averageTimeToHire: 21
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-03-31'
        }
      },
      generatedBy: new ObjectId(),
      generatedAt: new Date('2024-04-05')
    },
    {
      reportType: 'employee',
      reportData: {
        summary: {
          totalEmployees: 150,
          activeEmployees: 145,
          newHires: 8,
          departures: 3,
          averageTenure: 2.5
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-03-31'
        }
      },
      generatedBy: new ObjectId(),
      generatedAt: new Date('2024-04-10')
    }
  ];

  await database.insertMany('report_history', reportHistory);
  console.log(`✅ Seeded ${reportHistory.length} report history records`);
};

module.exports = { seedAllModules };
