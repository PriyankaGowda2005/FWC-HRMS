require('dotenv').config();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');

const fixManagerTeamData = async () => {
  try {
    console.log('🔧 Fixing Manager Team Data...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Get the manager user
    const managerUser = await database.findOne('users', { email: 'manager@fwcit.com' });
    if (!managerUser) {
      console.log('❌ Manager user not found');
      return;
    }
    console.log('👤 Manager user found:', managerUser.email);

    // Get the manager's employee record
    const managerEmployee = await database.findOne('employees', { userId: managerUser._id });
    if (!managerEmployee) {
      console.log('❌ Manager employee record not found');
      return;
    }
    console.log('👤 Manager employee record found');

    // Create team members for the manager
    console.log('👥 Creating team members...');
    const teamMembers = [
      {
        userId: new ObjectId(),
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@fwcit.com',
        employeeCode: 'EMP001',
        designation: 'Senior Software Developer',
        department: 'Information Technology',
        managerId: managerEmployee._id,
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
        managerId: managerEmployee._id,
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
        managerId: managerEmployee._id,
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
        managerId: managerEmployee._id,
        salary: 80000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-02-28'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing team members for this manager
    await database.deleteMany('employees', { managerId: managerEmployee._id });
    console.log('🧹 Cleared existing team members');

    // Insert team members
    const createdTeamMembers = [];
    for (const member of teamMembers) {
      const result = await database.insertOne('employees', member);
      createdTeamMembers.push({ ...member, _id: result.insertedId });
      console.log(`✅ Created team member: ${member.firstName} ${member.lastName}`);
    }

    // Create attendance records for team members
    console.log('⏰ Creating attendance records...');
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      for (const member of createdTeamMembers) {
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const clockIn = new Date(date);
        clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
        
        const clockOut = new Date(date);
        clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
        
        const attendanceRecord = {
          employeeId: member._id,
          userId: member.userId,
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

    // Insert attendance records
    if (attendanceRecords.length > 0) {
      await database.insertMany('attendance', attendanceRecords);
      console.log(`✅ Created ${attendanceRecords.length} attendance records`);
    }

    // Create leave requests
    console.log('🏖️ Creating leave requests...');
    const leaveRequests = [
      {
        employeeId: createdTeamMembers[0]._id,
        userId: createdTeamMembers[0].userId,
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
        employeeId: createdTeamMembers[1]._id,
        userId: createdTeamMembers[1].userId,
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
        employeeId: createdTeamMembers[2]._id,
        userId: createdTeamMembers[2].userId,
        leaveType: 'PERSONAL',
        startDate: new Date('2024-01-25'),
        endDate: new Date('2024-01-26'),
        leaveDays: 2,
        reason: 'Personal matters',
        status: 'PENDING',
        appliedDate: new Date('2024-01-22'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing leave requests
    await database.deleteMany('leaveRequests', {});
    console.log('🧹 Cleared existing leave requests');

    // Insert leave requests
    for (const leaveRequest of leaveRequests) {
      await database.insertOne('leaveRequests', leaveRequest);
      console.log(`✅ Created leave request for ${createdTeamMembers.find(m => m._id.equals(leaveRequest.employeeId))?.firstName}`);
    }

    // Create performance reviews
    console.log('📊 Creating performance reviews...');
    const performanceReviews = [
      {
        employeeId: createdTeamMembers[0]._id,
        userId: createdTeamMembers[0].userId,
        reviewerId: managerEmployee._id,
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
        employeeId: createdTeamMembers[1]._id,
        userId: createdTeamMembers[1].userId,
        reviewerId: managerEmployee._id,
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
      }
    ];

    // Clear existing performance reviews
    await database.deleteMany('performanceReviews', {});
    console.log('🧹 Cleared existing performance reviews');

    // Insert performance reviews
    for (const review of performanceReviews) {
      await database.insertOne('performanceReviews', review);
      console.log(`✅ Created performance review for ${createdTeamMembers.find(m => m._id.equals(review.employeeId))?.firstName}`);
    }

    console.log('\n🎉 Manager Team Data Fixed Successfully!');
    console.log(`📊 Created ${createdTeamMembers.length} team members`);
    console.log(`⏰ Created ${attendanceRecords.length} attendance records`);
    console.log(`🏖️ Created ${leaveRequests.length} leave requests`);
    console.log(`📈 Created ${performanceReviews.length} performance reviews`);

  } catch (error) {
    console.error('❌ Error fixing manager team data:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('🔌 Database disconnected');
  }
};

if (require.main === module) {
  fixManagerTeamData()
    .then(() => {
      console.log('✅ Manager team data fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manager team data fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixManagerTeamData };

