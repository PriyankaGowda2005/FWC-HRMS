require('dotenv').config();
const bcrypt = require('bcrypt');
const database = require('../database/connection');
const { ObjectId } = require('mongodb');

/**
 * Comprehensive Seed Data Script
 * Populates all modules with realistic sample data for demonstration
 */

const comprehensiveSeedData = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected successfully\n');

    // ============================================
    // 1. DEPARTMENTS (3-5 departments)
    // ============================================
    console.log('🏢 Creating departments...');
    const departments = [
      {
        name: 'Human Resources',
        description: 'Manages recruitment, employee relations, and organizational development',
        costCenter: 'HR001',
        budget: 500000,
        location: 'Main Office - Floor 3',
        managerId: null, // Will be set after managers are created
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Information Technology',
        description: 'Handles software development, infrastructure, and technical support',
        costCenter: 'IT001',
        budget: 1200000,
        location: 'Tech Hub - Building B',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Finance',
        description: 'Manages financial planning, accounting, and budget control',
        costCenter: 'FIN001',
        budget: 400000,
        location: 'Main Office - Floor 2',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Marketing',
        description: 'Handles brand management, digital marketing, and customer engagement',
        costCenter: 'MKT001',
        budget: 600000,
        location: 'Creative Center - Floor 1',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sales',
        description: 'Manages client relationships, sales operations, and revenue generation',
        costCenter: 'SAL001',
        budget: 800000,
        location: 'Main Office - Floor 4',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const departmentResults = await database.insertMany('departments', departments);
    const departmentIds = Object.values(departmentResults.insertedIds);
    console.log(`✅ Created ${departmentResults.insertedCount} departments\n`);

    // ============================================
    // 2. USERS & EMPLOYEES (10 employees with different roles)
    // ============================================
    console.log('👥 Creating users and employees...');
    
    const employeeData = [
      // Admin
      {
        email: 'admin@mastersolisinfotech.com',
        username: 'admin',
        password: await bcrypt.hash('admin123', 12),
        role: 'ADMIN',
        firstName: 'Alex',
        lastName: 'Thompson',
        position: 'System Administrator',
        department: departments[0].name,
        departmentId: departmentIds[0],
        employeeId: 'EMP001',
        salary: 95000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-01-15'),
        isActive: true,
        isOnProbation: false
      },
      // HR Manager
      {
        email: 'hr@mastersolisinfotech.com',
        username: 'hr_manager',
        password: await bcrypt.hash('HR@2024!', 12),
        role: 'HR',
        firstName: 'Sarah',
        lastName: 'Johnson',
        position: 'HR Manager',
        department: departments[0].name,
        departmentId: departmentIds[0],
        employeeId: 'EMP002',
        salary: 85000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2021-06-01'),
        isActive: true,
        isOnProbation: false
      },
      // IT Manager
      {
        email: 'manager@mastersolisinfotech.com',
        username: 'it_manager',
        password: await bcrypt.hash('manager123', 12),
        role: 'MANAGER',
        firstName: 'Michael',
        lastName: 'Chen',
        position: 'IT Manager',
        department: departments[1].name,
        departmentId: departmentIds[1],
        employeeId: 'EMP003',
        salary: 110000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2020-03-10'),
        isActive: true,
        isOnProbation: false
      },
      // Finance Manager
      {
        email: 'finance.manager@mastersolisinfotech.com',
        username: 'finance_manager',
        password: await bcrypt.hash('finance123', 12),
        role: 'MANAGER',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        position: 'Finance Manager',
        department: departments[2].name,
        departmentId: departmentIds[2],
        employeeId: 'EMP004',
        salary: 90000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2021-09-15'),
        isActive: true,
        isOnProbation: false
      },
      // Marketing Manager
      {
        email: 'marketing.manager@mastersolisinfotech.com',
        username: 'marketing_manager',
        password: await bcrypt.hash('marketing123', 12),
        role: 'MANAGER',
        firstName: 'David',
        lastName: 'Williams',
        position: 'Marketing Manager',
        department: departments[3].name,
        departmentId: departmentIds[3],
        employeeId: 'EMP005',
        salary: 88000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2021-11-20'),
        isActive: true,
        isOnProbation: false
      },
      // IT Employee 1
      {
        email: 'employee@mastersolisinfotech.com',
        username: 'employee',
        password: await bcrypt.hash('employee123', 12),
        role: 'EMPLOYEE',
        firstName: 'John',
        lastName: 'Doe',
        position: 'Senior Software Developer',
        department: departments[1].name,
        departmentId: departmentIds[1],
        employeeId: 'EMP006',
        salary: 95000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-05-01'),
        isActive: true,
        isOnProbation: false,
        managerId: null // Will be set to IT Manager
      },
      // IT Employee 2
      {
        email: 'jane.smith@mastersolisinfotech.com',
        username: 'jane_smith',
        password: await bcrypt.hash('employee123', 12),
        role: 'EMPLOYEE',
        firstName: 'Jane',
        lastName: 'Smith',
        position: 'Full Stack Developer',
        department: departments[1].name,
        departmentId: departmentIds[1],
        employeeId: 'EMP007',
        salary: 85000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-08-15'),
        isActive: true,
        isOnProbation: false,
        managerId: null
      },
      // Finance Employee
      {
        email: 'robert.brown@mastersolisinfotech.com',
        username: 'robert_brown',
        password: await bcrypt.hash('employee123', 12),
        role: 'EMPLOYEE',
        firstName: 'Robert',
        lastName: 'Brown',
        position: 'Financial Analyst',
        department: departments[2].name,
        departmentId: departmentIds[2],
        employeeId: 'EMP008',
        salary: 65000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-01-10'),
        isActive: true,
        isOnProbation: true,
        managerId: null
      },
      // Marketing Employee
      {
        email: 'lisa.anderson@mastersolisinfotech.com',
        username: 'lisa_anderson',
        password: await bcrypt.hash('employee123', 12),
        role: 'EMPLOYEE',
        firstName: 'Lisa',
        lastName: 'Anderson',
        position: 'Digital Marketing Specialist',
        department: departments[3].name,
        departmentId: departmentIds[3],
        employeeId: 'EMP009',
        salary: 60000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-03-01'),
        isActive: true,
        isOnProbation: true,
        managerId: null
      },
      // HR Employee
      {
        email: 'james.wilson@mastersolisinfotech.com',
        username: 'james_wilson',
        password: await bcrypt.hash('employee123', 12),
        role: 'EMPLOYEE',
        firstName: 'James',
        lastName: 'Wilson',
        position: 'HR Coordinator',
        department: departments[0].name,
        departmentId: departmentIds[0],
        employeeId: 'EMP010',
        salary: 55000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-06-15'),
        isActive: true,
        isOnProbation: true,
        managerId: null
      }
    ];

    const users = [];
    const employees = [];
    const userIds = [];
    const employeeIds = [];

    for (const empData of employeeData) {
      // Check if user already exists
      let existingUser = await database.findOne('users', { email: empData.email });
      let userId;
      
      if (existingUser) {
        // Update existing user
        await database.updateOne('users', 
          { _id: existingUser._id },
          {
            $set: {
              username: empData.username,
              password: empData.password,
              role: empData.role,
              isActive: true,
              updatedAt: new Date()
            }
          }
        );
        userId = existingUser._id;
        console.log(`   ♻️  Updated user: ${empData.email}`);
      } else {
        // Create new user
        const userResult = await database.insertOne('users', {
          email: empData.email,
          username: empData.username,
          password: empData.password,
          role: empData.role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        userId = userResult.insertedId;
        console.log(`   ✅ Created user: ${empData.email}`);
      }
      userIds.push(userId);

      // Check if employee already exists
      let existingEmployee = await database.findOne('employees', { userId: userId });
      let employeeId;
      
      if (existingEmployee) {
        // Update existing employee
        await database.updateOne('employees',
          { _id: existingEmployee._id },
          {
            $set: {
              firstName: empData.firstName,
              lastName: empData.lastName,
              position: empData.position,
              department: empData.department,
              departmentId: empData.departmentId,
              employeeId: empData.employeeId,
              salary: empData.salary,
              employmentType: empData.employmentType,
              hireDate: empData.hireDate,
              isActive: empData.isActive,
              isOnProbation: empData.isOnProbation || false,
              managerId: empData.managerId,
              updatedAt: new Date()
            }
          }
        );
        employeeId = existingEmployee._id;
        console.log(`   ♻️  Updated employee: ${empData.firstName} ${empData.lastName}`);
      } else {
        // Create new employee
        const employeeResult = await database.insertOne('employees', {
          userId: userId,
          firstName: empData.firstName,
          lastName: empData.lastName,
          position: empData.position,
          department: empData.department,
          departmentId: empData.departmentId,
          employeeId: empData.employeeId,
          salary: empData.salary,
          employmentType: empData.employmentType,
          hireDate: empData.hireDate,
          isActive: empData.isActive,
          isOnProbation: empData.isOnProbation || false,
          managerId: empData.managerId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        employeeId = employeeResult.insertedId;
        console.log(`   ✅ Created employee: ${empData.firstName} ${empData.lastName}`);
      }
      employeeIds.push(employeeId);
    }

    // Set manager relationships
    await database.updateOne('employees', 
      { _id: employeeIds[5] }, // John Doe
      { $set: { managerId: employeeIds[2].toString() } } // IT Manager
    );
    await database.updateOne('employees', 
      { _id: employeeIds[6] }, // Jane Smith
      { $set: { managerId: employeeIds[2].toString() } } // IT Manager
    );
    await database.updateOne('employees', 
      { _id: employeeIds[7] }, // Robert Brown
      { $set: { managerId: employeeIds[3].toString() } } // Finance Manager
    );
    await database.updateOne('employees', 
      { _id: employeeIds[8] }, // Lisa Anderson
      { $set: { managerId: employeeIds[4].toString() } } // Marketing Manager
    );
    await database.updateOne('employees', 
      { _id: employeeIds[9] }, // James Wilson
      { $set: { managerId: employeeIds[1].toString() } } // HR Manager
    );

    console.log(`✅ Created ${employeeData.length} users and employees\n`);

    // ============================================
    // 3. ATTENDANCE RECORDS (Past month for all employees)
    // ============================================
    console.log('⏰ Creating attendance records...');
    const attendanceRecords = [];
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Generate attendance for each employee for the past month
    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i].toString();
      const currentDate = new Date(oneMonthAgo);
      
      while (currentDate <= today) {
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Randomly decide if employee was present (90% chance)
          const isPresent = Math.random() > 0.1;
          const isLate = isPresent && Math.random() > 0.7;
          const isEarlyLeave = isPresent && Math.random() > 0.85;
          
          let status = 'PRESENT';
          let clockIn = new Date(currentDate);
          clockIn.setHours(9, isLate ? 15 + Math.floor(Math.random() * 30) : 0, 0, 0);
          
          let clockOut = new Date(currentDate);
          clockOut.setHours(isEarlyLeave ? 15 + Math.floor(Math.random() * 30) : 18, 0, 0, 0);
          
          if (!isPresent) {
            status = Math.random() > 0.5 ? 'ABSENT' : 'SICK';
            clockIn = null;
            clockOut = null;
          }

          const hoursWorked = isPresent ? 
            ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2) : 0;

          attendanceRecords.push({
            employeeId: employeeId,
            date: new Date(currentDate),
            clockIn: clockIn,
            clockOut: clockOut,
            hoursWorked: parseFloat(hoursWorked),
            status: status,
            workFromHome: isPresent && Math.random() > 0.7,
            notes: isPresent ? (isLate ? 'Late arrival' : '') : (status === 'SICK' ? 'Sick leave' : ''),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    if (attendanceRecords.length > 0) {
      // Insert in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < attendanceRecords.length; i += batchSize) {
        const batch = attendanceRecords.slice(i, i + batchSize);
        await database.insertMany('attendance', batch);
      }
      console.log(`✅ Created ${attendanceRecords.length} attendance records\n`);
    }

    // ============================================
    // 4. LEAVE REQUESTS (Approved, Pending, Rejected)
    // ============================================
    console.log('🏖️  Creating leave requests...');
    const leaveTypes = ['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY'];
    const leaveStatuses = ['APPROVED', 'PENDING', 'REJECTED'];
    
    const leaveRequests = [
      // Approved leaves
      {
        employeeId: employeeIds[5].toString(), // John Doe
        leaveType: 'VACATION',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-19'),
        days: 5,
        reason: 'Family vacation',
        status: 'APPROVED',
        approvedBy: employeeIds[2].toString(), // IT Manager
        approvedAt: new Date('2024-01-05'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-05')
      },
      {
        employeeId: employeeIds[6].toString(), // Jane Smith
        leaveType: 'SICK',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-11'),
        days: 2,
        reason: 'Medical appointment',
        status: 'APPROVED',
        approvedBy: employeeIds[2].toString(),
        approvedAt: new Date('2024-01-08'),
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-08')
      },
      // Pending leaves
      {
        employeeId: employeeIds[7].toString(), // Robert Brown
        leaveType: 'VACATION',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        days: 5,
        reason: 'Personal time off',
        status: 'PENDING',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        employeeId: employeeIds[8].toString(), // Lisa Anderson
        leaveType: 'PERSONAL',
        startDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-10'),
        days: 1,
        reason: 'Personal errands',
        status: 'PENDING',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      },
      // Rejected leaves
      {
        employeeId: employeeIds[9].toString(), // James Wilson
        leaveType: 'VACATION',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-25'),
        days: 6,
        reason: 'Holiday trip',
        status: 'REJECTED',
        rejectedBy: employeeIds[1].toString(), // HR Manager
        rejectedAt: new Date('2024-01-15'),
        rejectionReason: 'Peak workload period',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15')
      }
    ];

    await database.insertMany('leave_requests', leaveRequests);
    console.log(`✅ Created ${leaveRequests.length} leave requests\n`);

    // ============================================
    // 5. PAYROLL RECORDS (For all employees)
    // ============================================
    console.log('💰 Creating payroll records...');
    const payrollRecords = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Generate payroll for last 3 months
    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
      const payrollMonth = new Date(currentYear, currentMonth - monthOffset, 1);
      
      for (let i = 0; i < employeeIds.length; i++) {
        const employee = employeeData[i];
        const baseSalary = employee.salary;
        
        // Calculate deductions
        const taxRate = 0.20; // 20% tax
        const insuranceRate = 0.05; // 5% insurance
        
        // Calculate bonuses (random for some employees)
        const bonus = Math.random() > 0.7 ? baseSalary * 0.1 : 0;
        
        // Calculate overtime (random)
        const overtimeHours = Math.random() > 0.6 ? Math.floor(Math.random() * 20) : 0;
        const overtimePay = overtimeHours * (baseSalary / 160) * 1.5; // 1.5x rate
        
        const grossSalary = baseSalary + bonus + overtimePay;
        const taxAmount = grossSalary * taxRate;
        const insuranceAmount = grossSalary * insuranceRate;
        const totalDeductions = taxAmount + insuranceAmount;
        const netSalary = grossSalary - totalDeductions;

        payrollRecords.push({
          employeeId: employeeIds[i].toString(),
          month: payrollMonth.getMonth() + 1,
          year: payrollMonth.getFullYear(),
          grossSalary: grossSalary,
          taxAmount: taxAmount,
          insuranceAmount: insuranceAmount,
          totalDeductions: totalDeductions,
          netSalary: netSalary,
          status: 'PAID',
          generatedAt: new Date(payrollMonth.getFullYear(), payrollMonth.getMonth(), 1),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await database.insertMany('payroll', payrollRecords);
    console.log(`✅ Created ${payrollRecords.length} payroll records\n`);

    // ============================================
    // 6. RECRUITMENT DATA (Job postings, candidates, interviews)
    // ============================================
    console.log('💼 Creating recruitment data...');
    
    // Job Postings
    const jobPostings = [
      {
        title: 'Senior Full Stack Developer',
        department: departments[1].name,
        description: 'Join our dynamic development team to build cutting-edge web applications.',
        requirements: ['5+ years full-stack development', 'JavaScript/TypeScript', 'React/Vue.js', 'Node.js/Python'],
        responsibilities: ['Develop scalable web applications', 'Code reviews and mentoring', 'Architecture design'],
        salaryMin: 90000,
        salaryMax: 130000,
        location: 'Remote',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userIds[1].toString(), // HR Manager
        postedAt: new Date('2024-01-01'),
        applicationDeadline: new Date('2024-02-15'),
        maxApplications: 50,
        currentApplications: 12,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        title: 'DevOps Engineer',
        department: departments[1].name,
        description: 'Streamline our deployment processes and improve infrastructure.',
        requirements: ['3+ years DevOps experience', 'AWS/Azure/GCP', 'Docker/Kubernetes', 'CI/CD pipelines'],
        responsibilities: ['Manage cloud infrastructure', 'Automate deployment processes', 'Monitor system performance'],
        salaryMin: 85000,
        salaryMax: 120000,
        location: 'Hybrid',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userIds[1].toString(),
        postedAt: new Date('2024-01-05'),
        applicationDeadline: new Date('2024-02-20'),
        maxApplications: 40,
        currentApplications: 8,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      },
      {
        title: 'Digital Marketing Specialist',
        department: departments[3].name,
        description: 'Drive brand growth across multiple digital channels.',
        requirements: ['2+ years digital marketing', 'Google Analytics/Ads', 'Social media marketing', 'SEO/SEM'],
        responsibilities: ['Develop marketing strategies', 'Manage digital campaigns', 'Analyze campaign performance'],
        salaryMin: 55000,
        salaryMax: 75000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userIds[1].toString(),
        postedAt: new Date('2024-01-10'),
        applicationDeadline: new Date('2024-02-25'),
        maxApplications: 30,
        currentApplications: 15,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      }
    ];

    const jobPostingResults = await database.insertMany('job_postings', jobPostings);
    const jobPostingIds = Object.values(jobPostingResults.insertedIds);
    console.log(`✅ Created ${jobPostingResults.insertedCount} job postings`);

    // Candidates
    const candidates = [
      {
        email: 'candidate.demo@mastersolisinfotech.com',
        password: await bcrypt.hash('candidate123', 12),
        firstName: 'Demo',
        lastName: 'Candidate',
        phone: '+1234567890',
        status: 'ACTIVE',
        profileComplete: true,
        resumeUploaded: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        email: 'alice.johnson@example.com',
        password: await bcrypt.hash('candidate123', 12),
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+1234567891',
        status: 'ACTIVE',
        profileComplete: true,
        resumeUploaded: true,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      },
      {
        email: 'bob.martinez@example.com',
        password: await bcrypt.hash('candidate123', 12),
        firstName: 'Bob',
        lastName: 'Martinez',
        phone: '+1234567892',
        status: 'ACTIVE',
        profileComplete: true,
        resumeUploaded: true,
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04')
      }
    ];

    const candidateIds = [];
    for (const candidate of candidates) {
      let existingCandidate = await database.findOne('candidates', { email: candidate.email });
      let candidateId;
      
      if (existingCandidate) {
        // Update existing candidate
        await database.updateOne('candidates',
          { _id: existingCandidate._id },
          {
            $set: {
              password: candidate.password,
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              phone: candidate.phone,
              status: candidate.status,
              profileComplete: candidate.profileComplete,
              resumeUploaded: candidate.resumeUploaded,
              updatedAt: new Date()
            }
          }
        );
        candidateId = existingCandidate._id;
        console.log(`   ♻️  Updated candidate: ${candidate.email}`);
      } else {
        // Create new candidate
        const candidateResult = await database.insertOne('candidates', candidate);
        candidateId = candidateResult.insertedId;
        console.log(`   ✅ Created candidate: ${candidate.email}`);
      }
      candidateIds.push(candidateId);
    }
    console.log(`✅ Processed ${candidates.length} candidates`);

    // Candidate Applications
    const applications = [
      {
        candidateId: candidateIds[0].toString(),
        jobPostingId: jobPostingIds[0].toString(),
        status: 'SHORTLISTED',
        appliedAt: new Date('2024-01-05'),
        coverLetter: 'I am excited to apply for this position...',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-10')
      },
      {
        candidateId: candidateIds[1].toString(),
        jobPostingId: jobPostingIds[0].toString(),
        status: 'INTERVIEW_SCHEDULED',
        appliedAt: new Date('2024-01-06'),
        coverLetter: 'I have extensive experience in full-stack development...',
        createdAt: new Date('2024-01-06'),
        updatedAt: new Date('2024-01-12')
      },
      {
        candidateId: candidateIds[2].toString(),
        jobPostingId: jobPostingIds[1].toString(),
        status: 'PENDING',
        appliedAt: new Date('2024-01-08'),
        coverLetter: 'I am interested in the DevOps Engineer position...',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08')
      }
    ];

    await database.insertMany('candidate_applications', applications);
    console.log(`✅ Created ${applications.length} candidate applications`);

    // Interviews
    const interviews = [
      {
        candidateId: candidateIds[1].toString(),
        jobPostingId: jobPostingIds[0].toString(),
        interviewerId: employeeIds[2].toString(), // IT Manager
        scheduledDate: new Date('2024-01-20T10:00:00'),
        status: 'SCHEDULED',
        type: 'TECHNICAL',
        location: 'Conference Room A',
        notes: 'Technical interview focusing on full-stack skills',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    await database.insertMany('interviews', interviews);
    console.log(`✅ Created ${interviews.length} interviews\n`);

    // ============================================
    // 7. PERFORMANCE REVIEWS
    // ============================================
    console.log('📊 Creating performance reviews...');
    const performanceReviews = [
      {
        employeeId: employeeIds[5].toString(), // John Doe
        reviewerId: employeeIds[2].toString(), // IT Manager
        reviewPeriod: 'Q4 2023',
        reviewDate: new Date('2024-01-15'),
        overallRating: 4.5,
        technicalSkills: 5,
        communication: 4,
        teamwork: 4.5,
        problemSolving: 5,
        leadership: 3.5,
        strengths: ['Excellent technical skills', 'Great problem-solving ability', 'Reliable team member'],
        areasForImprovement: ['Could take more leadership initiatives', 'Improve presentation skills'],
        goals: ['Lead a major project', 'Mentor junior developers', 'Improve documentation'],
        status: 'COMPLETED',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15')
      },
      {
        employeeId: employeeIds[6].toString(), // Jane Smith
        reviewerId: employeeIds[2].toString(), // IT Manager
        reviewPeriod: 'Q4 2023',
        reviewDate: new Date('2024-01-15'),
        overallRating: 4.0,
        technicalSkills: 4,
        communication: 4.5,
        teamwork: 4.5,
        problemSolving: 4,
        leadership: 3,
        strengths: ['Strong communication skills', 'Great team player', 'Quick learner'],
        areasForImprovement: ['Need to improve technical depth', 'Take on more challenging tasks'],
        goals: ['Complete advanced certification', 'Contribute to architecture decisions'],
        status: 'COMPLETED',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15')
      },
      {
        employeeId: employeeIds[7].toString(), // Robert Brown
        reviewerId: employeeIds[3].toString(), // Finance Manager
        reviewPeriod: 'Q4 2023',
        reviewDate: new Date('2024-01-20'),
        overallRating: 3.5,
        technicalSkills: 3.5,
        communication: 3.5,
        teamwork: 4,
        problemSolving: 3.5,
        leadership: 3,
        strengths: ['Good analytical skills', 'Attention to detail'],
        areasForImprovement: ['Improve Excel skills', 'Better time management', 'More proactive'],
        goals: ['Complete CPA preparation', 'Improve reporting efficiency'],
        status: 'PENDING',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      }
    ];

    await database.insertMany('performance_reviews', performanceReviews);
    console.log(`✅ Created ${performanceReviews.length} performance reviews\n`);

    // ============================================
    // 8. SUMMARY REPORTS DATA
    // ============================================
    console.log('📈 Generating summary reports data...');
    
    // Attendance Summary
    const attendanceSummary = {
      period: 'January 2024',
      totalEmployees: employeeIds.length,
      totalWorkingDays: 22,
      averageAttendanceRate: 92.5,
      totalPresent: 203,
      totalAbsent: 17,
      totalSick: 8,
      totalLate: 12,
      departmentBreakdown: [
        { department: departments[0].name, attendanceRate: 95.0 },
        { department: departments[1].name, attendanceRate: 91.5 },
        { department: departments[2].name, attendanceRate: 93.0 },
        { department: departments[3].name, attendanceRate: 90.0 }
      ],
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Leave Summary
    const leaveSummary = {
      period: 'January 2024',
      totalRequests: leaveRequests.length,
      approved: leaveRequests.filter(l => l.status === 'APPROVED').length,
      pending: leaveRequests.filter(l => l.status === 'PENDING').length,
      rejected: leaveRequests.filter(l => l.status === 'REJECTED').length,
      totalDays: leaveRequests.reduce((sum, l) => sum + l.days, 0),
      leaveTypeBreakdown: {
        VACATION: leaveRequests.filter(l => l.leaveType === 'VACATION').length,
        SICK: leaveRequests.filter(l => l.leaveType === 'SICK').length,
        PERSONAL: leaveRequests.filter(l => l.leaveType === 'PERSONAL').length
      },
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Payroll Summary
    const payrollSummary = {
      period: `January ${currentYear}`,
      totalEmployees: employeeIds.length,
      totalGrossSalary: payrollRecords
        .filter(p => p.month === currentMonth + 1 && p.year === currentYear)
        .reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      totalDeductions: payrollRecords
        .filter(p => p.month === currentMonth + 1 && p.year === currentYear)
        .reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
      totalNetSalary: payrollRecords
        .filter(p => p.month === currentMonth + 1 && p.year === currentYear)
        .reduce((sum, p) => sum + (p.netSalary || 0), 0),
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Performance Summary
    const performanceSummary = {
      period: 'Q4 2023',
      totalReviews: performanceReviews.length,
      averageRating: performanceReviews.reduce((sum, r) => sum + r.overallRating, 0) / performanceReviews.length,
      ratingDistribution: {
        excellent: performanceReviews.filter(r => r.overallRating >= 4.5).length,
        good: performanceReviews.filter(r => r.overallRating >= 3.5 && r.overallRating < 4.5).length,
        average: performanceReviews.filter(r => r.overallRating >= 2.5 && r.overallRating < 3.5).length,
        needsImprovement: performanceReviews.filter(r => r.overallRating < 2.5).length
      },
      departmentPerformance: [
        { department: departments[1].name, averageRating: 4.25 },
        { department: departments[2].name, averageRating: 3.5 }
      ],
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await database.insertOne('reports', {
      type: 'ATTENDANCE_SUMMARY',
      data: attendanceSummary,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await database.insertOne('reports', {
      type: 'LEAVE_SUMMARY',
      data: leaveSummary,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await database.insertOne('reports', {
      type: 'PAYROLL_SUMMARY',
      data: payrollSummary,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await database.insertOne('reports', {
      type: 'PERFORMANCE_SUMMARY',
      data: performanceSummary,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Created 4 summary reports\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('='.repeat(60));
    console.log('🎉 COMPREHENSIVE SEED DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`✅ ${departmentResults.insertedCount} Departments`);
    console.log(`✅ ${employeeData.length} Users & Employees`);
    console.log(`✅ ${attendanceRecords.length} Attendance Records`);
    console.log(`✅ ${leaveRequests.length} Leave Requests`);
    console.log(`✅ ${payrollRecords.length} Payroll Records`);
    console.log(`✅ ${jobPostingResults.insertedCount} Job Postings`);
    console.log(`✅ ${candidates.length} Candidates`);
    console.log(`✅ ${applications.length} Candidate Applications`);
    console.log(`✅ ${interviews.length} Interviews`);
    console.log(`✅ ${performanceReviews.length} Performance Reviews`);
    console.log(`✅ 4 Summary Reports`);
    console.log('\n🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    admin@mastersolisinfotech.com / admin123');
    console.log('HR:       hr@mastersolisinfotech.com / HR@2024!');
    console.log('Manager:  manager@mastersolisinfotech.com / manager123');
    console.log('Employee: employee@mastersolisinfotech.com / employee123');
    console.log('Candidate: candidate.demo@mastersolisinfotech.com / candidate123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Disconnect from database
    await database.disconnect();
    console.log('🔌 Database disconnected');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error(error.stack);
    // Try to disconnect even if there was an error
    try {
      await database.disconnect();
    } catch (disconnectError) {
      console.error('❌ Error disconnecting from database:', disconnectError);
    }
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  comprehensiveSeedData()
    .then(() => {
      console.log('\n✅ Comprehensive seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Comprehensive seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { comprehensiveSeedData };

