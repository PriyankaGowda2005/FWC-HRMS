const { ObjectId } = require('mongodb');
const database = require('../database/connection');

// Enhanced seed data for comprehensive HRMS system
const seedComprehensiveData = async () => {
  try {
    console.log('🌱 Starting comprehensive HRMS data seeding...');

    // Connect to database first
    await database.connect();
    console.log('✅ Connected to database');

    // 1. Create comprehensive departments
    await seedComprehensiveDepartments();
    
    // 2. Create comprehensive employees with users
    await seedComprehensiveEmployees();
    
    // 3. Create comprehensive job postings
    await seedComprehensiveJobPostings();
    
    // 4. Create comprehensive candidates
    await seedComprehensiveCandidates();
    
    // 5. Create comprehensive performance data
    await seedComprehensivePerformance();
    
    // 6. Create comprehensive leave data
    await seedComprehensiveLeaveData();
    
    // 7. Create comprehensive attendance data
    await seedComprehensiveAttendance();
    
    // 8. Create comprehensive payroll data
    await seedComprehensivePayroll();
    
    // 9. Create comprehensive report history
    await seedComprehensiveReportHistory();

    console.log('✅ Comprehensive HRMS data seeding completed!');
    
    // Disconnect from database
    await database.disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error seeding comprehensive data:', error);
    await database.disconnect();
    throw error;
  }
};

// Seed comprehensive departments
const seedComprehensiveDepartments = async () => {
  console.log('📁 Seeding comprehensive departments...');
  
  const departments = [
    {
      name: 'Human Resources',
      description: 'Manages employee relations, recruitment, and HR policies',
      budget: 500000,
      managerId: null,
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
    },
    {
      name: 'Customer Support',
      description: 'Provides customer service and technical support',
      budget: 300000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    },
    {
      name: 'Research & Development',
      description: 'Focuses on innovation and product development',
      budget: 900000,
      managerId: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: new ObjectId()
    }
  ];

  // Clear existing departments
  await database.deleteMany('departments', {});
  
  const result = await database.insertMany('departments', departments);
  console.log(`✅ Seeded ${departments.length} departments`);
  
  return result.insertedIds;
};

// Seed comprehensive employees with users
const seedComprehensiveEmployees = async () => {
  console.log('👥 Seeding comprehensive employees...');
  
  const departments = await database.find('departments', {});
  const departmentMap = new Map(departments.map(dept => [dept.name, dept._id]));

  const employees = [
    // HR Department
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      employeeCode: 'EMP001',
      designation: 'HR Director',
      department: 'Human Resources',
      departmentId: departmentMap.get('Human Resources'),
      salary: 95000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-01-15'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@company.com',
      employeeCode: 'EMP002',
      designation: 'HR Manager',
      department: 'Human Resources',
      departmentId: departmentMap.get('Human Resources'),
      salary: 75000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-06-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@company.com',
      employeeCode: 'EMP003',
      designation: 'HR Specialist',
      department: 'Human Resources',
      departmentId: departmentMap.get('Human Resources'),
      salary: 55000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2023-03-10'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // IT Department
    {
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@company.com',
      employeeCode: 'EMP004',
      designation: 'CTO',
      department: 'Information Technology',
      departmentId: departmentMap.get('Information Technology'),
      salary: 150000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2021-08-15'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@company.com',
      employeeCode: 'EMP005',
      designation: 'Senior Software Engineer',
      department: 'Information Technology',
      departmentId: departmentMap.get('Information Technology'),
      salary: 120000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-02-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'robert.taylor@company.com',
      employeeCode: 'EMP006',
      designation: 'Software Engineer',
      department: 'Information Technology',
      departmentId: departmentMap.get('Information Technology'),
      salary: 85000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2023-01-15'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Jennifer',
      lastName: 'Martinez',
      email: 'jennifer.martinez@company.com',
      employeeCode: 'EMP007',
      designation: 'DevOps Engineer',
      department: 'Information Technology',
      departmentId: departmentMap.get('Information Technology'),
      salary: 100000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-09-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // Finance Department
    {
      firstName: 'Christopher',
      lastName: 'Garcia',
      email: 'christopher.garcia@company.com',
      employeeCode: 'EMP008',
      designation: 'CFO',
      department: 'Finance',
      departmentId: departmentMap.get('Finance'),
      salary: 140000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2021-12-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Amanda',
      lastName: 'Lee',
      email: 'amanda.lee@company.com',
      employeeCode: 'EMP009',
      designation: 'Financial Analyst',
      department: 'Finance',
      departmentId: departmentMap.get('Finance'),
      salary: 65000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2023-02-15'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // Marketing Department
    {
      firstName: 'Kevin',
      lastName: 'White',
      email: 'kevin.white@company.com',
      employeeCode: 'EMP010',
      designation: 'Marketing Director',
      department: 'Marketing',
      departmentId: departmentMap.get('Marketing'),
      salary: 110000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-04-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'Rachel',
      lastName: 'Thompson',
      email: 'rachel.thompson@company.com',
      employeeCode: 'EMP011',
      designation: 'Marketing Specialist',
      department: 'Marketing',
      departmentId: departmentMap.get('Marketing'),
      salary: 60000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2023-05-20'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // Operations Department
    {
      firstName: 'Daniel',
      lastName: 'Clark',
      email: 'daniel.clark@company.com',
      employeeCode: 'EMP012',
      designation: 'Operations Manager',
      department: 'Operations',
      departmentId: departmentMap.get('Operations'),
      salary: 80000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-07-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // Sales Department
    {
      firstName: 'Michelle',
      lastName: 'Rodriguez',
      email: 'michelle.rodriguez@company.com',
      employeeCode: 'EMP013',
      designation: 'Sales Director',
      department: 'Sales',
      departmentId: departmentMap.get('Sales'),
      salary: 100000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-03-15'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },
    {
      firstName: 'James',
      lastName: 'Lewis',
      email: 'james.lewis@company.com',
      employeeCode: 'EMP014',
      designation: 'Sales Representative',
      department: 'Sales',
      departmentId: departmentMap.get('Sales'),
      salary: 50000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2023-06-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // Customer Support Department
    {
      firstName: 'Ashley',
      lastName: 'Walker',
      email: 'ashley.walker@company.com',
      employeeCode: 'EMP015',
      designation: 'Customer Support Manager',
      department: 'Customer Support',
      departmentId: departmentMap.get('Customer Support'),
      salary: 65000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2022-08-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    },

    // R&D Department
    {
      firstName: 'Matthew',
      lastName: 'Hall',
      email: 'matthew.hall@company.com',
      employeeCode: 'EMP016',
      designation: 'R&D Director',
      department: 'Research & Development',
      departmentId: departmentMap.get('Research & Development'),
      salary: 130000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2021-10-01'),
      isActive: true,
      userId: new ObjectId(),
      managerId: null,
      createdAt: new Date()
    }
  ];

  // Clear existing employees
  await database.deleteMany('employees', {});
  
  const result = await database.insertMany('employees', employees);
  console.log(`✅ Seeded ${employees.length} employees`);
  
  return result.insertedIds;
};

// Seed comprehensive job postings
const seedComprehensiveJobPostings = async () => {
  console.log('💼 Seeding comprehensive job postings...');
  
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
    },
    {
      title: 'Customer Support Specialist',
      description: 'Join our customer support team to provide excellent service to our clients and help resolve their issues.',
      requirements: 'High school diploma or equivalent, 1+ years of customer service experience, excellent communication skills',
      department: 'Customer Support',
      location: 'Remote',
      type: 'FULL_TIME',
      salary: '$40,000 - $50,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      title: 'Research Scientist',
      description: 'We are seeking a Research Scientist to lead innovative research projects and contribute to our product development.',
      requirements: 'PhD in relevant field, 3+ years of research experience, strong analytical skills, publication record',
      department: 'Research & Development',
      location: 'Boston, MA',
      type: 'FULL_TIME',
      salary: '$100,000 - $130,000',
      status: 'ACTIVE',
      createdBy: new ObjectId(),
      createdAt: new Date()
    }
  ];

  // Clear existing job postings
  await database.deleteMany('job_postings', {});
  
  const result = await database.insertMany('job_postings', jobPostings);
  console.log(`✅ Seeded ${jobPostings.length} job postings`);
  
  return result.insertedIds;
};

// Seed comprehensive candidates
const seedComprehensiveCandidates = async () => {
  console.log('👥 Seeding comprehensive candidates...');
  
  const jobPostings = await database.find('job_postings', {});
  const jobMap = new Map(jobPostings.map(job => [job.title, job._id]));

  const candidates = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0123',
      jobPostingId: jobMap.get('Senior Software Engineer'),
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
      jobPostingId: jobMap.get('HR Business Partner'),
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
      jobPostingId: jobMap.get('Financial Analyst'),
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
      jobPostingId: jobMap.get('Marketing Specialist'),
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
      jobPostingId: jobMap.get('Operations Manager'),
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
      jobPostingId: jobMap.get('Sales Representative'),
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
      jobPostingId: jobMap.get('Frontend Developer Intern'),
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
      jobPostingId: jobMap.get('Data Scientist'),
      experience: '3 years',
      skills: 'Python, R, Machine Learning, Data Analysis, SQL',
      resume: 'jennifer_martinez_resume.pdf',
      status: 'HIRED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Christopher Garcia',
      email: 'christopher.garcia@email.com',
      phone: '+1-555-0131',
      jobPostingId: jobMap.get('Customer Support Specialist'),
      experience: '1 year',
      skills: 'Customer Service, Communication, Problem Solving, CRM',
      resume: 'christopher_garcia_resume.pdf',
      status: 'APPLIED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    },
    {
      name: 'Amanda Lee',
      email: 'amanda.lee@email.com',
      phone: '+1-555-0132',
      jobPostingId: jobMap.get('Research Scientist'),
      experience: '4 years',
      skills: 'Research, Data Analysis, Scientific Writing, Laboratory Techniques',
      resume: 'amanda_lee_resume.pdf',
      status: 'INTERVIEWED',
      appliedAt: new Date(),
      createdBy: new ObjectId(),
      createdAt: new Date()
    }
  ];

  // Clear existing candidates
  await database.deleteMany('candidates', {});
  
  const result = await database.insertMany('candidates', candidates);
  console.log(`✅ Seeded ${candidates.length} candidates`);
  
  return result.insertedIds;
};

// Seed comprehensive performance data
const seedComprehensivePerformance = async () => {
  console.log('📊 Seeding comprehensive performance data...');
  
  const employees = await database.find('employees', {});
  const employeeMap = new Map(employees.map(emp => [emp.employeeCode, emp]));

  // Performance Reviews
  const performanceReviews = [
    {
      employeeId: employeeMap.get('EMP001').userId,
      reviewerId: employeeMap.get('EMP002').userId,
      reviewPeriod: 'Q1 2024',
      overallRating: 4,
      goalsRating: 4,
      skillsRating: 5,
      teamworkRating: 4,
      communicationRating: 4,
      strengths: 'Excellent leadership skills, proactive problem-solving, great team collaboration',
      areasForImprovement: 'Could improve time management and delegation skills',
      comments: 'Strong performance this quarter. Continue focusing on leadership development.',
      status: 'COMPLETED',
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP004').userId,
      reviewerId: employeeMap.get('EMP001').userId,
      reviewPeriod: 'Q1 2024',
      overallRating: 5,
      goalsRating: 5,
      skillsRating: 5,
      teamworkRating: 5,
      communicationRating: 5,
      strengths: 'Outstanding technical leadership, innovative thinking, excellent team management',
      areasForImprovement: 'None identified',
      comments: 'Exceptional performance. Consider for promotion opportunities.',
      status: 'COMPLETED',
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP005').userId,
      reviewerId: employeeMap.get('EMP004').userId,
      reviewPeriod: 'Q1 2024',
      overallRating: 4,
      goalsRating: 4,
      skillsRating: 4,
      teamworkRating: 4,
      communicationRating: 4,
      strengths: 'Strong technical skills, reliable team member, meets deadlines consistently',
      areasForImprovement: 'Could take on more challenging projects',
      comments: 'Good performance. Encourage to seek more challenging assignments.',
      status: 'COMPLETED',
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP006').userId,
      reviewerId: employeeMap.get('EMP004').userId,
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
      employeeId: employeeMap.get('EMP008').userId,
      reviewerId: employeeMap.get('EMP001').userId,
      reviewPeriod: 'Q1 2024',
      overallRating: 4,
      goalsRating: 4,
      skillsRating: 4,
      teamworkRating: 4,
      communicationRating: 4,
      strengths: 'Strong financial analysis skills, excellent attention to detail',
      areasForImprovement: 'Could improve presentation skills',
      comments: 'Good performance in financial management. Focus on communication skills.',
      status: 'COMPLETED',
      createdAt: new Date()
    }
  ];

  // Performance Goals
  const performanceGoals = [
    {
      employeeId: employeeMap.get('EMP001').userId,
      title: 'Complete Advanced HR Certification',
      description: 'Obtain certification in advanced HR management to enhance leadership skills',
      targetDate: new Date('2024-06-30'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 60,
      createdBy: employeeMap.get('EMP002').userId,
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP004').userId,
      title: 'Lead Technical Architecture Project',
      description: 'Successfully lead the redesign of our technical architecture',
      targetDate: new Date('2024-08-15'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 40,
      createdBy: employeeMap.get('EMP001').userId,
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP005').userId,
      title: 'Complete React Advanced Course',
      description: 'Complete advanced React development course to enhance technical skills',
      targetDate: new Date('2024-07-31'),
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      progress: 75,
      createdBy: employeeMap.get('EMP004').userId,
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP008').userId,
      title: 'Implement New Financial Reporting System',
      description: 'Successfully implement and deploy new financial reporting system',
      targetDate: new Date('2024-09-30'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 30,
      createdBy: employeeMap.get('EMP001').userId,
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP010').userId,
      title: 'Increase Brand Awareness by 25%',
      description: 'Develop and execute marketing campaigns to increase brand awareness',
      targetDate: new Date('2024-12-31'),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 45,
      createdBy: employeeMap.get('EMP001').userId,
      createdAt: new Date()
    }
  ];

  // Clear existing performance data
  await database.deleteMany('performance_reviews', {});
  await database.deleteMany('performance_goals', {});
  
  await database.insertMany('performance_reviews', performanceReviews);
  await database.insertMany('performance_goals', performanceGoals);
  
  console.log(`✅ Seeded ${performanceReviews.length} performance reviews and ${performanceGoals.length} performance goals`);
};

// Seed comprehensive leave data
const seedComprehensiveLeaveData = async () => {
  console.log('🏖️ Seeding comprehensive leave data...');
  
  const employees = await database.find('employees', {});
  const employeeMap = new Map(employees.map(emp => [emp.employeeCode, emp]));

  // Leave Types
  const leaveTypes = [
    {
      name: 'Annual Leave',
      daysAllowedPerYear: 20,
      description: 'Annual vacation leave',
      isPaid: true,
      requiresApproval: true,
      createdAt: new Date()
    },
    {
      name: 'Sick Leave',
      daysAllowedPerYear: 10,
      description: 'Medical leave for illness',
      isPaid: true,
      requiresApproval: true,
      createdAt: new Date()
    },
    {
      name: 'Personal Leave',
      daysAllowedPerYear: 5,
      description: 'Personal time off',
      isPaid: false,
      requiresApproval: true,
      createdAt: new Date()
    },
    {
      name: 'Emergency Leave',
      daysAllowedPerYear: 3,
      description: 'Emergency situations',
      isPaid: true,
      requiresApproval: false,
      createdAt: new Date()
    },
    {
      name: 'Maternity Leave',
      daysAllowedPerYear: 90,
      description: 'Maternity leave for new mothers',
      isPaid: true,
      requiresApproval: true,
      createdAt: new Date()
    },
    {
      name: 'Paternity Leave',
      daysAllowedPerYear: 14,
      description: 'Paternity leave for new fathers',
      isPaid: true,
      requiresApproval: true,
      createdAt: new Date()
    }
  ];

  // Clear existing leave types
  await database.deleteMany('leave_types', {});
  const leaveTypesResult = await database.insertMany('leave_types', leaveTypes);
  const leaveTypeMap = new Map();
  leaveTypes.forEach((leaveType, index) => {
    leaveTypeMap.set(leaveType.name, leaveTypesResult.insertedIds[index]);
  });

  // Leave Requests
  const leaveRequests = [
    {
      employeeId: employeeMap.get('EMP001')._id,
      leaveTypeId: leaveTypeMap.get('Annual Leave'),
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-22'),
      leaveDays: 3,
      status: 'APPLIED',
      reason: 'Family vacation',
      appliedAt: new Date('2024-12-01'),
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP002')._id,
      leaveTypeId: leaveTypeMap.get('Sick Leave'),
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-15'),
      leaveDays: 1,
      status: 'APPROVED',
      reason: 'Medical appointment',
      appliedAt: new Date('2024-12-10'),
      decidedBy: employeeMap.get('EMP001')._id,
      decidedAt: new Date('2024-12-11'),
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP004')._id,
      leaveTypeId: leaveTypeMap.get('Personal Leave'),
      startDate: new Date('2024-12-25'),
      endDate: new Date('2024-12-25'),
      leaveDays: 1,
      status: 'REJECTED',
      reason: 'Personal matters',
      appliedAt: new Date('2024-12-05'),
      decidedBy: employeeMap.get('EMP001')._id,
      decidedAt: new Date('2024-12-06'),
      notes: 'Not approved due to year-end workload',
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP005')._id,
      leaveTypeId: leaveTypeMap.get('Annual Leave'),
      startDate: new Date('2024-12-30'),
      endDate: new Date('2025-01-03'),
      leaveDays: 5,
      status: 'APPROVED',
      reason: 'Holiday vacation',
      appliedAt: new Date('2024-12-01'),
      decidedBy: employeeMap.get('EMP004')._id,
      decidedAt: new Date('2024-12-02'),
      createdAt: new Date()
    },
    {
      employeeId: employeeMap.get('EMP006')._id,
      leaveTypeId: leaveTypeMap.get('Sick Leave'),
      startDate: new Date('2024-12-18'),
      endDate: new Date('2024-12-19'),
      leaveDays: 2,
      status: 'APPLIED',
      reason: 'Flu symptoms',
      appliedAt: new Date('2024-12-17'),
      createdAt: new Date()
    }
  ];

  // Clear existing leave requests
  await database.deleteMany('leave_requests', {});
  await database.insertMany('leave_requests', leaveRequests);
  
  console.log(`✅ Seeded ${leaveTypes.length} leave types and ${leaveRequests.length} leave requests`);
};

// Seed comprehensive attendance data
const seedComprehensiveAttendance = async () => {
  console.log('⏰ Seeding comprehensive attendance data...');
  
  const employees = await database.find('employees', {});
  
  // Clear existing attendance
  await database.deleteMany('attendance', {});
  
  const attendanceRecords = [];
  const currentDate = new Date();
  
  // Generate attendance for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    for (const employee of employees) {
      const clockIn = new Date(date);
      clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM
      
      const clockOut = new Date(date);
      clockOut.setHours(17, Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM
      
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      
      const attendanceRecord = {
        employeeId: employee._id,
        date: date,
        clockIn: clockIn,
        clockOut: clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        status: hoursWorked >= 8 ? 'PRESENT' : 'LATE',
        location: 'Office',
        createdAt: new Date()
      };
      
      attendanceRecords.push(attendanceRecord);
    }
  }
  
  await database.insertMany('attendance', attendanceRecords);
  console.log(`✅ Seeded ${attendanceRecords.length} attendance records`);
};

// Seed comprehensive payroll data
const seedComprehensivePayroll = async () => {
  console.log('💰 Seeding comprehensive payroll data...');
  
  const employees = await database.find('employees', {});
  
  // Clear existing payroll
  await database.deleteMany('payroll', {});
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  for (const employee of employees) {
    const payrollRecord = {
      employeeId: employee._id,
      payPeriodStart: new Date(currentYear, currentMonth, 1),
      payPeriodEnd: new Date(currentYear, currentMonth + 1, 0),
      grossSalary: employee.salary,
      basicSalary: employee.salary * 0.8,
      allowances: {
        housing: employee.salary * 0.1,
        transport: employee.salary * 0.05,
        medical: employee.salary * 0.05
      },
      deductions: {
        incomeTax: employee.salary * 0.1,
        socialSecurity: employee.salary * 0.06,
        healthInsurance: employee.salary * 0.03
      },
      overtimePay: Math.floor(Math.random() * 1000),
      bonus: Math.floor(Math.random() * 2000),
      totalDeductions: employee.salary * 0.19,
      netSalary: employee.salary * 0.81 + Math.floor(Math.random() * 1000),
      taxAmount: employee.salary * 0.1,
      currency: 'USD',
      status: 'PAID',
      paidAt: new Date(),
      createdAt: new Date()
    };
    
    await database.insertOne('payroll', payrollRecord);
  }
  
  console.log(`✅ Seeded payroll records for ${employees.length} employees`);
};

// Seed comprehensive report history
const seedComprehensiveReportHistory = async () => {
  console.log('📈 Seeding comprehensive report history...');
  
  const employees = await database.find('employees', {});
  const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
  
  const reportHistory = [
    {
      reportType: 'attendance',
      reportData: {
        summary: {
          totalEmployees: employees.length,
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
      generatedBy: randomEmployee.userId,
      generatedAt: new Date('2024-02-01')
    },
    {
      reportType: 'payroll',
      reportData: {
        summary: {
          totalEmployees: employees.length,
          totalGrossSalary: employees.reduce((sum, emp) => sum + emp.salary, 0),
          totalDeductions: employees.reduce((sum, emp) => sum + emp.salary * 0.19, 0),
          totalNetSalary: employees.reduce((sum, emp) => sum + emp.salary * 0.81, 0),
          averageSalary: Math.round(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length)
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      },
      generatedBy: randomEmployee.userId,
      generatedAt: new Date('2024-02-05')
    },
    {
      reportType: 'performance',
      reportData: {
        summary: {
          totalReviews: 5,
          completedReviews: 5,
          totalGoals: 5,
          completedGoals: 1,
          inProgressGoals: 4,
          averageRating: 4.0
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-03-31'
        }
      },
      generatedBy: randomEmployee.userId,
      generatedAt: new Date('2024-04-01')
    },
    {
      reportType: 'recruitment',
      reportData: {
        summary: {
          totalJobPostings: 10,
          activeJobPostings: 8,
          closedJobPostings: 2,
          totalApplications: 10,
          hiredCandidates: 2,
          rejectedCandidates: 1,
          averageTimeToHire: 21
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-03-31'
        }
      },
      generatedBy: randomEmployee.userId,
      generatedAt: new Date('2024-04-05')
    },
    {
      reportType: 'employee',
      reportData: {
        summary: {
          totalEmployees: employees.length,
          activeEmployees: employees.filter(emp => emp.isActive).length,
          newHires: 3,
          departures: 1,
          averageTenure: 2.5
        },
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-03-31'
        }
      },
      generatedBy: randomEmployee.userId,
      generatedAt: new Date('2024-04-10')
    }
  ];

  // Clear existing report history
  await database.deleteMany('report_history', {});
  await database.insertMany('report_history', reportHistory);
  
  console.log(`✅ Seeded ${reportHistory.length} report history records`);
};

module.exports = { seedComprehensiveData };

// Run seed data if this file is executed directly
if (require.main === module) {
  seedComprehensiveData()
    .then(() => {
      console.log('✅ Comprehensive seed data script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Comprehensive seed data script failed:', error);
      process.exit(1);
    });
}
