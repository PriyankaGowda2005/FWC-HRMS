require('dotenv').config();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const bcrypt = require('bcrypt');

const createAdminSeedData = async () => {
  try {
    console.log('🌱 Creating Comprehensive Admin Seed Data...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Get admin user
    const adminUser = await database.findOne('users', { email: 'admin@fwcit.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    console.log('👤 Admin user found:', adminUser.email);

    // Get or create admin employee record
    let adminEmployee = await database.findOne('employees', { userId: adminUser._id });
    if (!adminEmployee) {
      console.log('👤 Creating admin employee record...');
      const adminEmployeeData = {
        userId: adminUser._id,
        firstName: 'Admin',
        lastName: 'User',
        email: adminUser.email,
        employeeCode: 'ADM001',
        designation: 'System Administrator',
        department: 'Administration',
        salary: 120000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2020-01-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await database.insertOne('employees', adminEmployeeData);
      adminEmployee = { ...adminEmployeeData, _id: result.insertedId };
      console.log('✅ Created admin employee record');
    } else {
      console.log('👤 Admin employee record found');
    }

    // Create departments
    console.log('🏢 Creating departments...');
    const departments = [
      {
        name: 'Information Technology',
        description: 'Software development and IT infrastructure',
        managerId: adminEmployee._id,
        budget: 500000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Human Resources',
        description: 'Employee relations and talent management',
        managerId: adminEmployee._id,
        budget: 200000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Finance',
        description: 'Financial planning and accounting',
        managerId: adminEmployee._id,
        budget: 300000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Marketing',
        description: 'Brand management and digital marketing',
        managerId: adminEmployee._id,
        budget: 250000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Operations',
        description: 'Business operations and process improvement',
        managerId: adminEmployee._id,
        budget: 400000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing departments
    await database.deleteMany('departments', {});
    console.log('🧹 Cleared existing departments');

    const createdDepartments = [];
    for (const dept of departments) {
      const result = await database.insertOne('departments', dept);
      createdDepartments.push({ ...dept, _id: result.insertedId });
      console.log(`✅ Created department: ${dept.name}`);
    }

    // Create comprehensive employee data
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
        departmentId: createdDepartments[0]._id,
        managerId: adminEmployee._id,
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
        departmentId: createdDepartments[0]._id,
        managerId: adminEmployee._id,
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
        departmentId: createdDepartments[0]._id,
        managerId: adminEmployee._id,
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
        departmentId: createdDepartments[0]._id,
        managerId: adminEmployee._id,
        salary: 80000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-02-28'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // HR Department
      {
        userId: new ObjectId(),
        firstName: 'Emma',
        lastName: 'Brown',
        email: 'emma.brown@fwcit.com',
        employeeCode: 'EMP005',
        designation: 'HR Manager',
        department: 'Human Resources',
        departmentId: createdDepartments[1]._id,
        managerId: adminEmployee._id,
        salary: 78000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-08-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Frank',
        lastName: 'Miller',
        email: 'frank.miller@fwcit.com',
        employeeCode: 'EMP006',
        designation: 'Recruitment Specialist',
        department: 'Human Resources',
        departmentId: createdDepartments[1]._id,
        managerId: adminEmployee._id,
        salary: 65000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-07-10'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Finance Department
      {
        userId: new ObjectId(),
        firstName: 'Grace',
        lastName: 'Taylor',
        email: 'grace.taylor@fwcit.com',
        employeeCode: 'EMP007',
        designation: 'Financial Analyst',
        department: 'Finance',
        departmentId: createdDepartments[2]._id,
        managerId: adminEmployee._id,
        salary: 72000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-11-20'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Henry',
        lastName: 'Anderson',
        email: 'henry.anderson@fwcit.com',
        employeeCode: 'EMP008',
        designation: 'Accountant',
        department: 'Finance',
        departmentId: createdDepartments[2]._id,
        managerId: adminEmployee._id,
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
        firstName: 'Ivy',
        lastName: 'Thomas',
        email: 'ivy.thomas@fwcit.com',
        employeeCode: 'EMP009',
        designation: 'Marketing Manager',
        department: 'Marketing',
        departmentId: createdDepartments[3]._id,
        managerId: adminEmployee._id,
        salary: 76000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-09-12'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Jack',
        lastName: 'Jackson',
        email: 'jack.jackson@fwcit.com',
        employeeCode: 'EMP010',
        designation: 'Digital Marketing Specialist',
        department: 'Marketing',
        departmentId: createdDepartments[3]._id,
        managerId: adminEmployee._id,
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
        firstName: 'Kate',
        lastName: 'White',
        email: 'kate.white@fwcit.com',
        employeeCode: 'EMP011',
        designation: 'Operations Manager',
        department: 'Operations',
        departmentId: createdDepartments[4]._id,
        managerId: adminEmployee._id,
        salary: 82000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-12-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: new ObjectId(),
        firstName: 'Liam',
        lastName: 'Harris',
        email: 'liam.harris@fwcit.com',
        employeeCode: 'EMP012',
        designation: 'Business Analyst',
        department: 'Operations',
        departmentId: createdDepartments[4]._id,
        managerId: adminEmployee._id,
        salary: 70000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-08-22'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing employees
    await database.deleteMany('employees', {});
    console.log('🧹 Cleared existing employees');

    const createdEmployees = [];
    for (const emp of employees) {
      const result = await database.insertOne('employees', emp);
      createdEmployees.push({ ...emp, _id: result.insertedId });
      console.log(`✅ Created employee: ${emp.firstName} ${emp.lastName}`);
    }

    // Create performance reviews
    console.log('📊 Creating performance reviews...');
    const performanceReviews = [
      {
        employeeId: createdEmployees[0]._id,
        userId: createdEmployees[0].userId,
        reviewerId: adminEmployee._id,
        reviewType: 'QUARTERLY',
        reviewPeriod: 'Q4 2023',
        overallRating: 4.5,
        goals: [
          { goal: 'Complete project delivery', rating: 5, comments: 'Excellent work' },
          { goal: 'Code quality improvement', rating: 4, comments: 'Good progress' },
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
        reviewerId: adminEmployee._id,
        reviewType: 'QUARTERLY',
        reviewPeriod: 'Q4 2023',
        overallRating: 3.8,
        goals: [
          { goal: 'Feature development', rating: 4, comments: 'Good progress' },
          { goal: 'Code reviews', rating: 3.5, comments: 'Needs improvement' },
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
        employeeId: createdEmployees[4]._id,
        userId: createdEmployees[4].userId,
        reviewerId: adminEmployee._id,
        reviewType: 'ANNUAL',
        reviewPeriod: '2023',
        overallRating: 4.2,
        goals: [
          { goal: 'Employee satisfaction improvement', rating: 4.5, comments: 'Great results' },
          { goal: 'Recruitment efficiency', rating: 4, comments: 'Good progress' },
          { goal: 'Policy implementation', rating: 4, comments: 'Well executed' }
        ],
        strengths: ['People management', 'Strategic thinking', 'Communication'],
        areasForImprovement: ['Data analysis', 'Technology adoption'],
        comments: 'Emma has been an excellent HR manager with strong people skills.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[6]._id,
        userId: createdEmployees[6].userId,
        reviewerId: adminEmployee._id,
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
        comments: 'Grace is a reliable financial analyst with strong analytical skills.',
        status: 'COMPLETED',
        reviewDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[8]._id,
        userId: createdEmployees[8].userId,
        reviewerId: adminEmployee._id,
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
        comments: 'Ivy has been a strong marketing manager with creative ideas.',
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

    // Create payroll records
    console.log('💰 Creating payroll records...');
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

    // Create leave requests
    console.log('🏖️ Creating leave requests...');
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
        employeeId: createdEmployees[4]._id,
        userId: createdEmployees[4].userId,
        leaveType: 'ANNUAL',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
        leaveDays: 5,
        reason: 'Holiday trip',
        status: 'APPROVED',
        appliedDate: new Date('2024-01-25'),
        approvedDate: new Date('2024-01-26'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        employeeId: createdEmployees[6]._id,
        userId: createdEmployees[6].userId,
        leaveType: 'SICK',
        startDate: new Date('2024-01-30'),
        endDate: new Date('2024-01-31'),
        leaveDays: 2,
        reason: 'Flu',
        status: 'PENDING',
        appliedDate: new Date('2024-01-29'),
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

    // Create attendance records
    console.log('⏰ Creating attendance records...');
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

    // Final summary
    console.log('\n🎉 Admin Seed Data Created Successfully!');
    console.log('📊 Final Summary:');
    console.log(`👥 Employees: ${createdEmployees.length}`);
    console.log(`🏢 Departments: ${createdDepartments.length}`);
    console.log(`📈 Performance Reviews: ${performanceReviews.length}`);
    console.log(`💰 Payroll Records: ${payrollRecords.length}`);
    console.log(`🏖️ Leave Requests: ${leaveRequests.length}`);
    console.log(`⏰ Attendance Records: ${attendanceRecords.length}`);

  } catch (error) {
    console.error('❌ Error creating admin seed data:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('🔌 Database disconnected');
  }
};

if (require.main === module) {
  createAdminSeedData()
    .then(() => {
      console.log('✅ Admin seed data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin seed data creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminSeedData };

