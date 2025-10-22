require('dotenv').config();
const bcrypt = require('bcrypt');
const database = require('../database/connection');
const { ObjectId } = require('mongodb');

const seedEmployeeData = async () => {
  try {
    console.log('🌱 Starting employee seed data insertion...');
    
    // Connect to database first
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected successfully');

    // 1. Create Employee User
    console.log('👤 Creating employee user...');
    const employeeUser = {
      email: 'employee@fwchrms.com',
      username: 'employee',
      password: await bcrypt.hash('employee123', 12),
      role: 'EMPLOYEE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if employee user already exists
    let existingUser = await database.findOne('users', { email: employeeUser.email });
    if (!existingUser) {
      // Try to find by username if email doesn't exist
      existingUser = await database.findOne('users', { username: employeeUser.username });
    }
    
    if (!existingUser) {
      const userResult = await database.insertOne('users', employeeUser);
      existingUser = { ...employeeUser, _id: userResult.insertedId };
      console.log('✅ Created employee user');
    } else {
      console.log('⏭️  Employee user already exists');
    }

    // 2. Create Employee Profile
    console.log('👥 Creating employee profile...');
    const employeeProfile = {
      userId: existingUser._id,
      firstName: 'employee',
      lastName: 'User',
      email: 'employee@fwchrms.com',
      employeeCode: 'EMP001',
      designation: 'Software Developer',
      department: 'Information Technology',
      departmentId: null, // Will be set after department creation
      salary: 75000,
      employmentType: 'FULL_TIME',
      hireDate: new Date('2025-10-22'),
      isActive: true,
      managerId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Get IT department
    const itDepartment = await database.findOne('departments', { name: 'Information Technology' });
    if (itDepartment) {
      employeeProfile.departmentId = itDepartment._id;
    }

    // Check if employee profile already exists
    let existingEmployee = await database.findOne('employees', { userId: existingUser._id });
    if (!existingEmployee) {
      const employeeResult = await database.insertOne('employees', employeeProfile);
      existingEmployee = { ...employeeProfile, _id: employeeResult.insertedId };
      console.log('✅ Created employee profile');
    } else {
      console.log('⏭️  Employee profile already exists');
    }

    // 3. Create Leave Types if they don't exist
    console.log('📝 Creating leave types...');
    const leaveTypes = [
      {
        name: 'Vacation',
        daysAllowedPerYear: 15,
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
        name: 'Personal',
        daysAllowedPerYear: 5,
        description: 'Personal time off',
        isPaid: false,
        requiresApproval: true,
        createdAt: new Date()
      }
    ];

    const createdLeaveTypes = [];
    for (const leaveType of leaveTypes) {
      const existing = await database.findOne('leave_types', { name: leaveType.name });
      if (!existing) {
        const result = await database.insertOne('leave_types', leaveType);
        createdLeaveTypes.push({ ...leaveType, _id: result.insertedId });
        console.log(`✅ Created leave type: ${leaveType.name}`);
      } else {
        createdLeaveTypes.push(existing);
        console.log(`⏭️  Leave type already exists: ${leaveType.name}`);
      }
    }

    // 4. Create Attendance Records for the past month
    console.log('⏰ Creating attendance records...');
    const attendanceRecords = [];
    const currentDate = new Date();
    
    // Create records for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Random clock in time between 8:30-9:30 AM
      const clockIn = new Date(date);
      clockIn.setHours(8, 30 + Math.floor(Math.random() * 60), 0, 0);
      
      // Random clock out time between 5:30-6:30 PM
      const clockOut = new Date(date);
      clockOut.setHours(17, 30 + Math.floor(Math.random() * 60), 0, 0);
      
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      
      const attendanceRecord = {
        employeeId: existingEmployee._id,
        userId: existingUser._id,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        clockIn: clockIn,
        clockOut: clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        status: hoursWorked >= 8 ? 'PRESENT' : 'LATE',
        location: 'Office',
        notes: '',
        createdAt: new Date()
      };
      
      // Check if record already exists
      const existing = await database.findOne('attendance', { 
        employeeId: existingEmployee._id, 
        date: attendanceRecord.date
      });
      
      if (!existing) {
        await database.insertOne('attendance', attendanceRecord);
        attendanceRecords.push(attendanceRecord);
      }
    }
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // 5. Create Attendance Logs for real-time functionality
    console.log('📊 Creating attendance logs...');
    const attendanceLogs = [];
    
    // Create logs for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Clock in log
      const clockInLog = {
        employeeId: existingUser._id,
        type: 'IN',
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0),
        location: 'Office',
        deviceId: 'WEB',
        source: 'web',
        createdAt: new Date()
      };
      
      // Clock out log
      const clockOutLog = {
        employeeId: existingUser._id,
        type: 'OUT',
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0),
        location: 'Office',
        deviceId: 'WEB',
        source: 'web',
        createdAt: new Date()
      };
      
      // Check if logs already exist
      const existingInLog = await database.findOne('attendance_logs', {
        employeeId: existingUser._id,
        type: 'IN',
        timestamp: { $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
      });
      
      if (!existingInLog) {
        await database.insertOne('attendance_logs', clockInLog);
        attendanceLogs.push(clockInLog);
      }
      
      const existingOutLog = await database.findOne('attendance_logs', {
        employeeId: existingUser._id,
        type: 'OUT',
        timestamp: { $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
      });
      
      if (!existingOutLog) {
        await database.insertOne('attendance_logs', clockOutLog);
        attendanceLogs.push(clockOutLog);
      }
    }
    console.log(`✅ Created ${attendanceLogs.length} attendance logs`);

    // 6. Create Leave Requests
    console.log('🏖️ Creating leave requests...');
    const leaveRequests = [
      {
        employeeId: existingUser._id,
        leaveTypeId: createdLeaveTypes[0]._id, // Vacation
        startDate: new Date('2025-11-15'),
        endDate: new Date('2025-11-17'),
        leaveDays: 3,
        status: 'APPLIED',
        reason: 'Family vacation',
        notes: 'Planning a short family trip',
        appliedAt: new Date('2025-10-15'),
        createdAt: new Date()
      },
      {
        employeeId: existingUser._id,
        leaveTypeId: createdLeaveTypes[1]._id, // Sick Leave
        startDate: new Date('2025-10-25'),
        endDate: new Date('2025-10-25'),
        leaveDays: 1,
        status: 'APPROVED',
        reason: 'Medical appointment',
        notes: 'Annual health checkup',
        appliedAt: new Date('2025-10-20'),
        decidedBy: existingUser._id,
        decidedAt: new Date('2025-10-21'),
        createdAt: new Date()
      },
      {
        employeeId: existingUser._id,
        leaveTypeId: createdLeaveTypes[2]._id, // Personal
        startDate: new Date('2025-12-24'),
        endDate: new Date('2025-12-24'),
        leaveDays: 1,
        status: 'APPLIED',
        reason: 'Personal matters',
        notes: 'Need to handle personal errands',
        appliedAt: new Date('2025-10-22'),
        createdAt: new Date()
      }
    ];

    for (const leaveRequest of leaveRequests) {
      const existing = await database.findOne('leave_requests', { 
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate
      });
      
      if (!existing) {
        await database.insertOne('leave_requests', leaveRequest);
        console.log(`✅ Created leave request for ${leaveRequest.startDate.toDateString()}`);
      }
    }

    // 7. Create Performance Review
    console.log('📈 Creating performance review...');
    const performanceReview = {
      employeeId: existingEmployee._id,
      reviewerId: existingUser._id, // Self-review for demo
      reviewPeriod: 'Q4 2025',
      overallRating: 4.2,
      goals: [
        {
          goal: 'Complete project deliverables',
          rating: 4,
          comments: 'Met all project deadlines'
        },
        {
          goal: 'Improve code quality',
          rating: 5,
          comments: 'Excellent code reviews and documentation'
        },
        {
          goal: 'Team collaboration',
          rating: 4,
          comments: 'Good team player, helps colleagues'
        }
      ],
      strengths: ['Technical skills', 'Problem solving', 'Teamwork'],
      areasForImprovement: ['Time management', 'Communication'],
      comments: 'Overall good performance, keep up the good work!',
      status: 'COMPLETED',
      reviewDate: new Date(),
      createdAt: new Date()
    };

    const existingReview = await database.findOne('performance_reviews', {
      employeeId: existingEmployee._id,
      reviewPeriod: performanceReview.reviewPeriod
    });

    if (!existingReview) {
      await database.insertOne('performance_reviews', performanceReview);
      console.log('✅ Created performance review');
    }

    // 8. Create Payroll Record
    console.log('💰 Creating payroll record...');
    const payrollRecord = {
      employeeId: existingEmployee._id,
      payPeriodStart: new Date('2025-10-01'),
      payPeriodEnd: new Date('2025-10-31'),
      grossSalary: 75000,
      basicSalary: 60000,
      allowances: {
        housing: 7500,
        transport: 3750,
        medical: 3750
      },
      deductions: {
        incomeTax: 7500,
        socialSecurity: 4500,
        healthInsurance: 2250
      },
      overtimePay: 800,
      bonus: 2000,
      totalDeductions: 14250,
      netSalary: 62550,
      taxAmount: 7500,
      currency: 'USD',
      status: 'PAID',
      paidAt: new Date(),
      createdAt: new Date()
    };

    const existingPayroll = await database.findOne('payroll', {
      employeeId: existingEmployee._id,
      payPeriodStart: payrollRecord.payPeriodStart
    });

    if (!existingPayroll) {
      await database.insertOne('payroll', payrollRecord);
      console.log('✅ Created payroll record');
    }

    console.log('🎉 Employee seed data insertion completed successfully!');
    console.log('\n📋 Employee Login Credentials:');
    console.log('Email: employee@fwchrms.com');
    console.log('Password: employee123');
    console.log('\n📋 Created Resources:');
    console.log(`- Employee user and profile`);
    console.log(`- ${attendanceRecords.length} attendance records`);
    console.log(`- ${attendanceLogs.length} attendance logs`);
    console.log(`- ${leaveRequests.length} leave requests`);
    console.log(`- 1 performance review`);
    console.log(`- 1 payroll record`);

    // Disconnect from database
    await database.disconnect();
    console.log('🔌 Database disconnected');

  } catch (error) {
    console.error('❌ Error seeding employee data:', error);
    // Try to disconnect even if there was an error
    try {
      await database.disconnect();
    } catch (disconnectError) {
      console.error('❌ Error disconnecting from database:', disconnectError);
    }
    throw error;
  }
};

module.exports = { seedEmployeeData };

// Run seed data if this file is executed directly
if (require.main === module) {
  seedEmployeeData()
    .then(() => {
      console.log('✅ Employee seed data script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Employee seed data script failed:', error);
      process.exit(1);
    });
}
