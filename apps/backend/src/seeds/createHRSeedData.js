require('dotenv').config();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const bcrypt = require('bcrypt');

const createHRSeedData = async () => {
  try {
    console.log('🌱 Creating Comprehensive HR Seed Data...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Get or create HR user
    let hrUser = await database.findOne('users', { email: 'hr@fwchrms.com' });
    if (!hrUser) {
      console.log('👤 Creating HR user...');
      const hashedPassword = await bcrypt.hash('HR@2024!', 12);
      const hrUserData = {
        email: 'hr@fwchrms.com',
        username: 'hr_manager',
        password: hashedPassword,
        role: 'HR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await database.insertOne('users', hrUserData);
      hrUser = { ...hrUserData, _id: result.insertedId };
      console.log('✅ Created HR user');
    } else {
      console.log('👤 HR user found:', hrUser.email);
    }

    // Get or create HR employee record
    let hrEmployee = await database.findOne('employees', { userId: hrUser._id });
    if (!hrEmployee) {
      console.log('👤 Creating HR employee record...');
      const hrEmployeeData = {
        userId: hrUser._id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: hrUser.email,
        employeeCode: 'HR001',
        designation: 'HR Manager',
        department: 'Human Resources',
        salary: 85000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-01-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await database.insertOne('employees', hrEmployeeData);
      hrEmployee = { ...hrEmployeeData, _id: result.insertedId };
      console.log('✅ Created HR employee record');
    } else {
      console.log('👤 HR employee record found');
    }

    // Get existing departments or create them
    let departments = await database.find('departments', {});
    if (departments.length === 0) {
      console.log('🏢 Creating departments...');
      const departmentData = [
        {
          name: 'Information Technology',
          description: 'Software development and IT infrastructure',
          managerId: hrEmployee._id,
          budget: 500000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Human Resources',
          description: 'Employee relations and talent management',
          managerId: hrEmployee._id,
          budget: 200000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Finance',
          description: 'Financial planning and accounting',
          managerId: hrEmployee._id,
          budget: 300000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Marketing',
          description: 'Brand management and digital marketing',
          managerId: hrEmployee._id,
          budget: 250000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Operations',
          description: 'Business operations and process improvement',
          managerId: hrEmployee._id,
          budget: 400000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const dept of departmentData) {
        const result = await database.insertOne('departments', dept);
        departments.push({ ...dept, _id: result.insertedId });
        console.log(`✅ Created department: ${dept.name}`);
      }
    } else {
      console.log(`🏢 Found ${departments.length} existing departments`);
    }

    // Create comprehensive employee data for HR dashboard
    console.log('👥 Creating comprehensive employee data...');
    const employees = [
      // IT Department
      {
        userId: new ObjectId(),
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@fwcit.com',
        employeeCode: 'EMP001',
        designation: 'Senior Software Developer',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        managerId: hrEmployee._id,
        salary: 85000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-01-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@fwcit.com',
        employeeCode: 'EMP002',
        designation: 'Software Developer',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        managerId: hrEmployee._id,
        salary: 75000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-03-10'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@fwcit.com',
        employeeCode: 'EMP003',
        designation: 'QA Engineer',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        managerId: hrEmployee._id,
        salary: 70000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-05-20'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@fwcit.com',
        employeeCode: 'EMP004',
        designation: 'DevOps Engineer',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        managerId: hrEmployee._id,
        salary: 80000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-02-28'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Eva',
        lastName: 'Brown',
        email: 'eva.brown@fwcit.com',
        employeeCode: 'EMP005',
        designation: 'Frontend Developer',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        managerId: hrEmployee._id,
        salary: 72000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-07-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // HR Department
      {
        userId: new ObjectId(),
        firstName: 'Frank',
        lastName: 'Miller',
        email: 'frank.miller@fwcit.com',
        employeeCode: 'EMP006',
        designation: 'Recruitment Specialist',
        department: 'Human Resources',
        departmentId: departments.find(d => d.name === 'Human Resources')?._id,
        managerId: hrEmployee._id,
        salary: 65000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-07-10'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Grace',
        lastName: 'Taylor',
        email: 'grace.taylor@fwcit.com',
        employeeCode: 'EMP007',
        designation: 'HR Coordinator',
        department: 'Human Resources',
        departmentId: departments.find(d => d.name === 'Human Resources')?._id,
        managerId: hrEmployee._id,
        salary: 58000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-09-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Finance Department
      {
        userId: new ObjectId(),
        firstName: 'Henry',
        lastName: 'Anderson',
        email: 'henry.anderson@fwcit.com',
        employeeCode: 'EMP008',
        designation: 'Financial Analyst',
        department: 'Finance',
        departmentId: departments.find(d => d.name === 'Finance')?._id,
        managerId: hrEmployee._id,
        salary: 72000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-11-20'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Ivy',
        lastName: 'Thomas',
        email: 'ivy.thomas@fwcit.com',
        employeeCode: 'EMP009',
        designation: 'Accountant',
        department: 'Finance',
        departmentId: departments.find(d => d.name === 'Finance')?._id,
        managerId: hrEmployee._id,
        salary: 68000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-04-05'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Marketing Department
      {
        userId: new ObjectId(),
        firstName: 'Jack',
        lastName: 'Jackson',
        email: 'jack.jackson@fwcit.com',
        employeeCode: 'EMP010',
        designation: 'Marketing Manager',
        department: 'Marketing',
        departmentId: departments.find(d => d.name === 'Marketing')?._id,
        managerId: hrEmployee._id,
        salary: 76000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-09-12'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Kate',
        lastName: 'White',
        email: 'kate.white@fwcit.com',
        employeeCode: 'EMP011',
        designation: 'Digital Marketing Specialist',
        department: 'Marketing',
        departmentId: departments.find(d => d.name === 'Marketing')?._id,
        managerId: hrEmployee._id,
        salary: 62000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-06-18'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Operations Department
      {
        userId: new ObjectId(),
        firstName: 'Liam',
        lastName: 'Harris',
        email: 'liam.harris@fwcit.com',
        employeeCode: 'EMP012',
        designation: 'Operations Manager',
        department: 'Operations',
        departmentId: departments.find(d => d.name === 'Operations')?._id,
        managerId: hrEmployee._id,
        salary: 82000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-12-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Maya',
        lastName: 'Garcia',
        email: 'maya.garcia@fwcit.com',
        employeeCode: 'EMP013',
        designation: 'Business Analyst',
        department: 'Operations',
        departmentId: departments.find(d => d.name === 'Operations')?._id,
        managerId: hrEmployee._id,
        salary: 70000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-08-22'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Noah',
        lastName: 'Martinez',
        email: 'noah.martinez@fwcit.com',
        employeeCode: 'EMP014',
        designation: 'Project Coordinator',
        department: 'Operations',
        departmentId: departments.find(d => d.name === 'Operations')?._id,
        managerId: hrEmployee._id,
        salary: 65000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-10-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Olivia',
        lastName: 'Lee',
        email: 'olivia.lee@fwcit.com',
        employeeCode: 'EMP015',
        designation: 'Customer Success Manager',
        department: 'Operations',
        departmentId: departments.find(d => d.name === 'Operations')?._id,
        managerId: hrEmployee._id,
        salary: 68000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-11-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing employees (except HR employee)
    await database.deleteMany('employees', { _id: { $ne: hrEmployee._id } });
    console.log('🧹 Cleared existing employees (except HR)');

    const createdEmployees = [];
    for (const emp of employees) {
      const result = await database.insertOne('employees', emp);
      createdEmployees.push({ ...emp, _id: result.insertedId });
      console.log(`✅ Created employee: ${emp.firstName} ${emp.lastName}`);
    }

    // Add HR employee to the list
    createdEmployees.push(hrEmployee);

    // Create comprehensive job postings
    console.log('💼 Creating comprehensive job postings...');
    const jobPostings = [
      {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced full-stack developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        employmentType: 'FULL_TIME',
        location: 'San Francisco, CA',
        salaryRange: { min: 90000, max: 120000 },
        requirements: [
          '5+ years of experience in full-stack development',
          'Proficiency in React, Node.js, and MongoDB',
          'Experience with cloud platforms (AWS/Azure)',
          'Strong problem-solving skills'
        ],
        responsibilities: [
          'Develop and maintain web applications',
          'Collaborate with cross-functional teams',
          'Write clean, maintainable code',
          'Participate in code reviews'
        ],
        status: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applicationCount: 15,
        createdBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Marketing Coordinator',
        description: 'Join our marketing team to help drive brand awareness and lead generation. You will work on various marketing campaigns and coordinate with different teams.',
        department: 'Marketing',
        departmentId: departments.find(d => d.name === 'Marketing')?._id,
        employmentType: 'FULL_TIME',
        location: 'New York, NY',
        salaryRange: { min: 50000, max: 65000 },
        requirements: [
          '2+ years of marketing experience',
          'Proficiency in social media marketing',
          'Experience with marketing automation tools',
          'Strong communication skills'
        ],
        responsibilities: [
          'Execute marketing campaigns',
          'Manage social media presence',
          'Coordinate with external vendors',
          'Analyze campaign performance'
        ],
        status: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        applicationCount: 8,
        createdBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Financial Analyst',
        description: 'We are seeking a financial analyst to support our finance team with budgeting, forecasting, and financial reporting.',
        department: 'Finance',
        departmentId: departments.find(d => d.name === 'Finance')?._id,
        employmentType: 'FULL_TIME',
        location: 'Chicago, IL',
        salaryRange: { min: 65000, max: 80000 },
        requirements: [
          'Bachelor\'s degree in Finance or related field',
          '2+ years of financial analysis experience',
          'Proficiency in Excel and financial modeling',
          'Strong analytical skills'
        ],
        responsibilities: [
          'Prepare financial reports and analysis',
          'Support budgeting and forecasting processes',
          'Analyze financial data and trends',
          'Collaborate with various departments'
        ],
        status: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        applicationCount: 12,
        createdBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'UX/UI Designer',
        description: 'Join our design team to create beautiful and intuitive user experiences. You will work closely with product managers and developers.',
        department: 'Information Technology',
        departmentId: departments.find(d => d.name === 'Information Technology')?._id,
        employmentType: 'FULL_TIME',
        location: 'Remote',
        salaryRange: { min: 70000, max: 90000 },
        requirements: [
          '3+ years of UX/UI design experience',
          'Proficiency in Figma, Sketch, or Adobe XD',
          'Strong portfolio showcasing design skills',
          'Understanding of user research methods'
        ],
        responsibilities: [
          'Design user interfaces and experiences',
          'Conduct user research and testing',
          'Create wireframes and prototypes',
          'Collaborate with development teams'
        ],
        status: 'DRAFT',
        applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        applicationCount: 0,
        createdBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'HR Generalist',
        description: 'Support our HR team with various human resources functions including recruitment, employee relations, and HR administration.',
        department: 'Human Resources',
        departmentId: departments.find(d => d.name === 'Human Resources')?._id,
        employmentType: 'FULL_TIME',
        location: 'Austin, TX',
        salaryRange: { min: 55000, max: 70000 },
        requirements: [
          'Bachelor\'s degree in HR or related field',
          '2+ years of HR experience',
          'Knowledge of employment laws',
          'Strong interpersonal skills'
        ],
        responsibilities: [
          'Assist with recruitment and onboarding',
          'Handle employee relations matters',
          'Maintain HR records and systems',
          'Support HR initiatives and programs'
        ],
        status: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        applicationCount: 6,
        createdBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing job postings
    await database.deleteMany('job_postings', {});
    console.log('🧹 Cleared existing job postings');

    const createdJobPostings = [];
    for (const job of jobPostings) {
      const result = await database.insertOne('job_postings', job);
      createdJobPostings.push({ ...job, _id: result.insertedId });
      console.log(`✅ Created job posting: ${job.title}`);
    }

    // Create comprehensive candidates
    console.log('👤 Creating comprehensive candidates...');
    const candidates = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101',
        position: 'Senior Full Stack Developer',
        jobPostingId: createdJobPostings[0]._id,
        experience: '6 years',
        skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'TypeScript'],
        resumeUrl: '/uploads/resumes/john-doe-resume.pdf',
        status: 'APPLIED',
        appliedDate: new Date('2024-01-15'),
        source: 'LinkedIn',
        notes: 'Strong technical background, good communication skills',
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0102',
        position: 'Marketing Coordinator',
        jobPostingId: createdJobPostings[1]._id,
        experience: '3 years',
        skills: ['Social Media Marketing', 'Google Analytics', 'Content Creation', 'Email Marketing'],
        resumeUrl: '/uploads/resumes/jane-smith-resume.pdf',
        status: 'INTERVIEW_SCHEDULED',
        appliedDate: new Date('2024-01-12'),
        source: 'Company Website',
        notes: 'Creative and enthusiastic, good portfolio',
        rating: 4.2,
        interviewDate: new Date('2024-01-25'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        phone: '+1-555-0103',
        position: 'Financial Analyst',
        jobPostingId: createdJobPostings[2]._id,
        experience: '4 years',
        skills: ['Financial Modeling', 'Excel', 'SQL', 'Power BI', 'Budgeting'],
        resumeUrl: '/uploads/resumes/mike-johnson-resume.pdf',
        status: 'OFFER_MADE',
        appliedDate: new Date('2024-01-10'),
        source: 'Indeed',
        notes: 'Excellent analytical skills, CPA certified',
        rating: 4.8,
        offerDate: new Date('2024-01-20'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@example.com',
        phone: '+1-555-0104',
        position: 'UX/UI Designer',
        jobPostingId: createdJobPostings[3]._id,
        experience: '5 years',
        skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Prototyping'],
        resumeUrl: '/uploads/resumes/sarah-wilson-resume.pdf',
        status: 'APPLIED',
        appliedDate: new Date('2024-01-18'),
        source: 'Dribbble',
        notes: 'Strong design portfolio, experience with mobile apps',
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@example.com',
        phone: '+1-555-0105',
        position: 'HR Generalist',
        jobPostingId: createdJobPostings[4]._id,
        experience: '3 years',
        skills: ['Recruitment', 'Employee Relations', 'HRIS', 'Compliance', 'Training'],
        resumeUrl: '/uploads/resumes/david-brown-resume.pdf',
        status: 'REJECTED',
        appliedDate: new Date('2024-01-08'),
        source: 'Glassdoor',
        notes: 'Good experience but lacks specific industry knowledge',
        rating: 3.2,
        rejectionReason: 'Not the right fit for our current needs',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        phone: '+1-555-0106',
        position: 'Senior Full Stack Developer',
        jobPostingId: createdJobPostings[0]._id,
        experience: '7 years',
        skills: ['React', 'Vue.js', 'Python', 'Django', 'PostgreSQL', 'Docker'],
        resumeUrl: '/uploads/resumes/emily-davis-resume.pdf',
        status: 'HIRED',
        appliedDate: new Date('2024-01-05'),
        source: 'GitHub',
        notes: 'Excellent technical skills, great cultural fit',
        rating: 4.9,
        hireDate: new Date('2024-01-22'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing candidates
    await database.deleteMany('candidates', {});
    console.log('🧹 Cleared existing candidates');

    const createdCandidates = [];
    for (const candidate of candidates) {
      const result = await database.insertOne('candidates', candidate);
      createdCandidates.push({ ...candidate, _id: result.insertedId });
      console.log(`✅ Created candidate: ${candidate.firstName} ${candidate.lastName}`);
    }

    // Create comprehensive performance reviews
    console.log('📊 Creating comprehensive performance reviews...');
    const performanceReviews = [
      {
        employeeId: createdEmployees[0]._id,
        userId: createdEmployees[0].userId,
        reviewerId: hrEmployee._id,
        reviewType: 'QUARTERLY',
        reviewPeriod: 'Q4 2023',
        overallRating: 4.5,
        goals: [
          { goal: 'Complete project delivery', rating: 5, comments: 'Excellent work on the new feature' },
          { goal: 'Code quality improvement', rating: 4, comments: 'Good progress on refactoring' },
          { goal: 'Team collaboration', rating: 4.5, comments: 'Great team player' }
        ],
        strengths: ['Technical expertise', 'Problem solving', 'Leadership'],
        areasForImprovement: ['Documentation', 'Time management'],
        comments: 'Alice has been an outstanding team member with excellent technical skills.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[1]._id,
        userId: createdEmployees[1].userId,
        reviewerId: hrEmployee._id,
        reviewType: 'QUARTERLY',
        reviewPeriod: 'Q4 2023',
        overallRating: 3.8,
        goals: [
          { goal: 'Feature development', rating: 4, comments: 'Good progress on new features' },
          { goal: 'Code reviews', rating: 3.5, comments: 'Needs improvement in review quality' },
          { goal: 'Learning new technologies', rating: 4, comments: 'Showing initiative' }
        ],
        strengths: ['Coding skills', 'Learning ability'],
        areasForImprovement: ['Code review quality', 'Communication'],
        comments: 'Bob is a solid developer who needs to focus on code review quality.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[5]._id,
        userId: createdEmployees[5].userId,
        reviewerId: hrEmployee._id,
        reviewType: 'ANNUAL',
        reviewPeriod: '2023',
        overallRating: 4.2,
        goals: [
          { goal: 'Recruitment efficiency', rating: 4.5, comments: 'Great results in hiring' },
          { goal: 'Candidate experience', rating: 4, comments: 'Good progress' },
          { goal: 'Process improvement', rating: 4, comments: 'Well executed' }
        ],
        strengths: ['Recruitment skills', 'Communication', 'Process management'],
        areasForImprovement: ['Data analysis', 'Technology adoption'],
        comments: 'Frank has been an excellent recruitment specialist.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[7]._id,
        userId: createdEmployees[7].userId,
        reviewerId: hrEmployee._id,
        reviewType: 'QUARTERLY',
        reviewPeriod: 'Q4 2023',
        overallRating: 4.0,
        goals: [
          { goal: 'Financial reporting accuracy', rating: 4.5, comments: 'Excellent' },
          { goal: 'Budget optimization', rating: 3.5, comments: 'Good progress' },
          { goal: 'Process improvement', rating: 4, comments: 'Well done' }
        ],
        strengths: ['Analytical skills', 'Attention to detail', 'Reliability'],
        areasForImprovement: ['Presentation skills', 'Cross-department collaboration'],
        comments: 'Henry is a reliable financial analyst with strong analytical skills.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[9]._id,
        userId: createdEmployees[9].userId,
        reviewerId: hrEmployee._id,
        reviewType: 'QUARTERLY',
        reviewPeriod: 'Q4 2023',
        overallRating: 4.3,
        goals: [
          { goal: 'Brand awareness increase', rating: 4.5, comments: 'Excellent results' },
          { goal: 'Lead generation', rating: 4, comments: 'Good progress' },
          { goal: 'Team leadership', rating: 4, comments: 'Well managed' }
        ],
        strengths: ['Creative thinking', 'Leadership', 'Market knowledge'],
        areasForImprovement: ['Data analysis', 'ROI measurement'],
        comments: 'Jack has been a strong marketing manager with creative ideas.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing performance reviews
    await database.deleteMany('performanceReviews', {});
    console.log('🧹 Cleared existing performance reviews');

    for (const review of performanceReviews) {
      await database.insertOne('performanceReviews', review);
      console.log(`✅ Created performance review for ${createdEmployees.find(e => e._id.equals(review.employeeId))?.firstName}`);
    }

    // Create comprehensive leave requests
    console.log('🏖️ Creating comprehensive leave requests...');
    const leaveRequests = [
      {
        employeeId: createdEmployees[0]._id,
        userId: createdEmployees[0].userId,
        leaveType: 'ANNUAL',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-17'),
        leaveDays: 3,
        reason: 'Family vacation',
        status: 'PENDING',
        appliedDate: new Date('2024-01-10'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[1]._id,
        userId: createdEmployees[1].userId,
        leaveType: 'SICK',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-20'),
        leaveDays: 1,
        reason: 'Medical appointment',
        status: 'APPROVED',
        appliedDate: new Date('2024-01-18'),
        approvedDate: new Date('2024-01-19'),
        approvedBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[2]._id,
        userId: createdEmployees[2].userId,
        leaveType: 'PERSONAL',
        startDate: new Date('2024-01-25'),
        endDate: new Date('2024-01-26'),
        leaveDays: 2,
        reason: 'Personal matters',
        status: 'PENDING',
        appliedDate: new Date('2024-01-22'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[5]._id,
        userId: createdEmployees[5].userId,
        leaveType: 'ANNUAL',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        leaveDays: 5,
        reason: 'Holiday trip',
        status: 'APPROVED',
        appliedDate: new Date('2024-01-25'),
        approvedDate: new Date('2024-01-26'),
        approvedBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[7]._id,
        userId: createdEmployees[7].userId,
        leaveType: 'SICK',
        startDate: new Date('2024-01-30'),
        endDate: new Date('2024-01-31'),
        leaveDays: 2,
        reason: 'Flu',
        status: 'PENDING',
        appliedDate: new Date('2024-01-29'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[9]._id,
        userId: createdEmployees[9].userId,
        leaveType: 'ANNUAL',
        startDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-14'),
        leaveDays: 5,
        reason: 'Winter break',
        status: 'REJECTED',
        appliedDate: new Date('2024-01-28'),
        rejectionReason: 'Too many people on leave during this period',
        rejectedBy: hrEmployee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing leave requests
    await database.deleteMany('leaveRequests', {});
    console.log('🧹 Cleared existing leave requests');

    for (const leaveRequest of leaveRequests) {
      await database.insertOne('leaveRequests', leaveRequest);
      console.log(`✅ Created leave request for ${createdEmployees.find(e => e._id.equals(leaveRequest.employeeId))?.firstName}`);
    }

    // Create comprehensive attendance records
    console.log('⏰ Creating comprehensive attendance records...');
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      for (const emp of createdEmployees) {
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const clockIn = new Date(date);
        clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
        
        const clockOut = new Date(date);
        clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        const attendanceRecord = {
          employeeId: emp._id,
          userId: emp.userId,
          date: date,
          clockIn: clockIn,
          clockOut: clockOut,
          hoursWorked: Math.round((clockOut - clockIn) / (1000 * 60 * 60) * 100) / 100,
          status: 'PRESENT',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        attendanceRecords.push(attendanceRecord);
      }
    }

    // Clear existing attendance records
    await database.deleteMany('attendance', {});
    console.log('🧹 Cleared existing attendance records');

    if (attendanceRecords.length > 0) {
      await database.insertMany('attendance', attendanceRecords);
      console.log(`✅ Created ${attendanceRecords.length} attendance records`);
    }

    // Create comprehensive payroll records
    console.log('💰 Creating comprehensive payroll records...');
    const payrollRecords = [];
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month

    for (const emp of createdEmployees) {
      const basicSalary = emp.salary;
      const allowances = Math.round(basicSalary * 0.15); // 15% allowances
      const overtime = Math.round(basicSalary * 0.05); // 5% overtime
      const grossSalary = basicSalary + allowances + overtime;
      
      const incomeTax = Math.round(grossSalary * 0.20); // 20% tax
      const socialSecurity = Math.round(grossSalary * 0.05); // 5% social security
      const healthInsurance = Math.round(grossSalary * 0.03); // 3% health insurance
      const otherDeductions = Math.round(grossSalary * 0.02); // 2% other deductions
      const totalDeductions = incomeTax + socialSecurity + healthInsurance + otherDeductions;
      
      const netSalary = grossSalary - totalDeductions;

      const payrollRecord = {
        employeeId: emp._id,
        userId: emp.userId,
        payPeriod: currentMonth,
        basicSalary: basicSalary,
        allowances: allowances,
        overtime: overtime,
        grossSalary: grossSalary,
        deductions: {
          incomeTax: incomeTax,
          socialSecurity: socialSecurity,
          healthInsurance: healthInsurance,
          otherDeductions: otherDeductions
        },
        totalDeductions: totalDeductions,
        netSalary: netSalary,
        status: 'PAID',
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      payrollRecords.push(payrollRecord);
    }

    // Clear existing payroll records
    await database.deleteMany('payroll', {});
    console.log('🧹 Cleared existing payroll records');

    for (const payroll of payrollRecords) {
      await database.insertOne('payroll', payroll);
      console.log(`✅ Created payroll record for ${createdEmployees.find(e => e._id.equals(payroll.employeeId))?.firstName}`);
    }

    // Create interview records
    console.log('🎤 Creating interview records...');
    const interviews = [
      {
        candidateId: createdCandidates[1]._id,
        interviewerId: hrEmployee._id,
        interviewType: 'TECHNICAL',
        scheduledDate: new Date('2024-01-25'),
        duration: 60,
        status: 'SCHEDULED',
        notes: 'Technical interview for marketing coordinator position',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        candidateId: createdCandidates[2]._id,
        interviewerId: hrEmployee._id,
        interviewType: 'BEHAVIORAL',
        scheduledDate: new Date('2024-01-18'),
        duration: 45,
        status: 'COMPLETED',
        notes: 'Strong candidate, good analytical skills',
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        candidateId: createdCandidates[5]._id,
        interviewerId: hrEmployee._id,
        interviewType: 'FINAL',
        scheduledDate: new Date('2024-01-20'),
        duration: 90,
        status: 'COMPLETED',
        notes: 'Excellent technical skills and cultural fit',
        rating: 4.9,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing interviews
    await database.deleteMany('interviews', {});
    console.log('🧹 Cleared existing interviews');

    for (const interview of interviews) {
      await database.insertOne('interviews', interview);
      console.log(`✅ Created interview for ${createdCandidates.find(c => c._id.equals(interview.candidateId))?.firstName}`);
    }

    // Final summary
    console.log('\n🎉 HR Seed Data Created Successfully!');
    console.log('📊 Final Summary:');
    console.log(`👤 HR User: ${hrUser.email}`);
    console.log(`👥 Employees: ${createdEmployees.length}`);
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`💼 Job Postings: ${createdJobPostings.length}`);
    console.log(`👤 Candidates: ${createdCandidates.length}`);
    console.log(`📈 Performance Reviews: ${performanceReviews.length}`);
    console.log(`🏖️ Leave Requests: ${leaveRequests.length}`);
    console.log(`⏰ Attendance Records: ${attendanceRecords.length}`);
    console.log(`💰 Payroll Records: ${payrollRecords.length}`);
    console.log(`🎤 Interviews: ${interviews.length}`);
    console.log('\n🔑 HR Login Credentials:');
    console.log('Email: hr@fwchrms.com');
    console.log('Password: HR@2024!');

  } catch (error) {
    console.error('❌ Error creating HR seed data:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('🔌 Database disconnected');
  }
};

if (require.main === module) {
  createHRSeedData()
    .then(() => {
      console.log('✅ HR seed data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ HR seed data creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createHRSeedData };
