require('dotenv').config();
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const database = require('../database/connection');

const managerDashboardSeed = async () => {
  try {
    console.log('🌱 Starting Manager Dashboard seed data insertion...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Get the manager user (assuming manager@fwcit.com exists)
    const managerUser = await database.findOne('users', { email: 'manager@fwcit.com' });
    if (!managerUser) {
      console.log('❌ Manager user not found. Please run updateDemoCreds.js first');
      return;
    }

    // Get departments
    const departments = await database.find('departments', {});
    if (departments.length === 0) {
      console.log('❌ No departments found. Please run seedData.js first');
      return;
    }

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
        managerId: managerUser._id,
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
        managerId: managerUser._id,
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
        managerId: managerUser._id,
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
        managerId: managerUser._id,
        salary: 80000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-02-28'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert team members
    const createdTeamMembers = [];
    for (const member of teamMembers) {
      const existingMember = await database.findOne('employees', { email: member.email });
      if (!existingMember) {
        const result = await database.insertOne('employees', member);
        createdTeamMembers.push({ ...member, _id: result.insertedId });
        console.log(`✅ Created team member: ${member.firstName} ${member.lastName}`);
      } else {
        createdTeamMembers.push(existingMember);
        console.log(`⏭️ Team member already exists: ${member.firstName} ${member.lastName}`);
      }
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

    // Insert leave requests
    for (const leaveRequest of leaveRequests) {
      const existingLeave = await database.findOne('leaveRequests', { 
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate
      });
      if (!existingLeave) {
        await database.insertOne('leaveRequests', leaveRequest);
        console.log(`✅ Created leave request for ${createdTeamMembers.find(m => m._id.equals(leaveRequest.employeeId))?.firstName}`);
      }
    }

    // Create performance reviews
    console.log('📊 Creating performance reviews...');
    const performanceReviews = [
      {
        employeeId: createdTeamMembers[0]._id,
        userId: createdTeamMembers[0].userId,
        reviewerId: managerUser._id,
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
        reviewerId: managerUser._id,
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

    // Insert performance reviews
    for (const review of performanceReviews) {
      const existingReview = await database.findOne('performanceReviews', { 
        employeeId: review.employeeId,
        reviewPeriod: review.reviewPeriod
      });
      if (!existingReview) {
        await database.insertOne('performanceReviews', review);
        console.log(`✅ Created performance review for ${createdTeamMembers.find(m => m._id.equals(review.employeeId))?.firstName}`);
      }
    }

    console.log('\n🎉 Manager Dashboard seed data completed successfully!');
    console.log(`📊 Created ${createdTeamMembers.length} team members`);
    console.log(`⏰ Created ${attendanceRecords.length} attendance records`);
    console.log(`🏖️ Created ${leaveRequests.length} leave requests`);
    console.log(`📈 Created ${performanceReviews.length} performance reviews`);

  } catch (error) {
    console.error('❌ Error seeding manager dashboard data:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('🔌 Database disconnected');
  }
};

if (require.main === module) {
  managerDashboardSeed()
    .then(() => {
      console.log('✅ Manager dashboard seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manager dashboard seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { managerDashboardSeed };
