require('dotenv').config();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');

const verifyAndFixManagerData = async () => {
  try {
    console.log('🔍 Verifying Manager Data...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Get the manager user
    const managerUser = await database.findOne('users', { email: 'manager@fwcit.com' });
    if (!managerUser) {
      console.log('❌ Manager user not found');
      return;
    }
    console.log('👤 Manager user found:', managerUser.email, 'ID:', managerUser._id);

    // Get or create the manager's employee record
    let managerEmployee = await database.findOne('employees', { userId: managerUser._id });
    if (!managerEmployee) {
      console.log('👤 Creating manager employee record...');
      const managerEmployeeData = {
        userId: managerUser._id,
        firstName: 'Manager',
        lastName: 'User',
        email: managerUser.email,
        employeeCode: 'MGR001',
        designation: 'Team Manager',
        department: 'Information Technology',
        salary: 90000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-01-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await database.insertOne('employees', managerEmployeeData);
      managerEmployee = { ...managerEmployeeData, _id: result.insertedId };
      console.log('✅ Created manager employee record');
    } else {
      console.log('👤 Manager employee record found:', managerEmployee.firstName, managerEmployee.lastName);
    }

    // Check team members
    const teamMembers = await database.find('employees', { managerId: managerEmployee._id });
    console.log('👥 Team members found:', teamMembers.length);
    
    if (teamMembers.length === 0) {
      console.log('👥 No team members found, creating them...');
      
      // Create team members
      const teamMembersData = [
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

      for (const member of teamMembersData) {
        const result = await database.insertOne('employees', member);
        console.log(`✅ Created team member: ${member.firstName} ${member.lastName}`);
      }
    }

    // Check leave requests
    const leaveRequests = await database.find('leaveRequests', {});
    console.log('🏖️ Leave requests found:', leaveRequests.length);
    
    if (leaveRequests.length === 0) {
      console.log('🏖️ No leave requests found, creating them...');
      
      const teamMembers = await database.find('employees', { managerId: managerEmployee._id });
      const leaveRequestsData = [
        {
          employeeId: teamMembers[0]._id,
          userId: teamMembers[0].userId,
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
          employeeId: teamMembers[1]._id,
          userId: teamMembers[1].userId,
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
          employeeId: teamMembers[2]._id,
          userId: teamMembers[2].userId,
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

      for (const leaveRequest of leaveRequestsData) {
        await database.insertOne('leaveRequests', leaveRequest);
        console.log(`✅ Created leave request for ${teamMembers.find(m => m._id.equals(leaveRequest.employeeId))?.firstName}`);
      }
    }

    // Check performance reviews
    const performanceReviews = await database.find('performanceReviews', {});
    console.log('📊 Performance reviews found:', performanceReviews.length);
    
    if (performanceReviews.length === 0) {
      console.log('📊 No performance reviews found, creating them...');
      
      const teamMembers = await database.find('employees', { managerId: managerEmployee._id });
      const performanceReviewsData = [
        {
          employeeId: teamMembers[0]._id,
          userId: teamMembers[0].userId,
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
          employeeId: teamMembers[1]._id,
          userId: teamMembers[1].userId,
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

      for (const review of performanceReviewsData) {
        await database.insertOne('performanceReviews', review);
        console.log(`✅ Created performance review for ${teamMembers.find(m => m._id.equals(review.employeeId))?.firstName}`);
      }
    }

    // Final verification
    const finalTeamMembers = await database.find('employees', { managerId: managerEmployee._id });
    const finalLeaveRequests = await database.find('leaveRequests', {});
    const finalPerformanceReviews = await database.find('performanceReviews', {});
    const finalAttendance = await database.find('attendance', {});

    console.log('\n📊 Final Data Summary:');
    console.log(`👥 Team Members: ${finalTeamMembers.length}`);
    console.log(`🏖️ Leave Requests: ${finalLeaveRequests.length}`);
    console.log(`📈 Performance Reviews: ${finalPerformanceReviews.length}`);
    console.log(`⏰ Attendance Records: ${finalAttendance.length}`);

    console.log('\n🎉 Manager Data Verification Complete!');

  } catch (error) {
    console.error('❌ Error verifying manager data:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('🔌 Database disconnected');
  }
};

if (require.main === module) {
  verifyAndFixManagerData()
    .then(() => {
      console.log('✅ Manager data verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manager data verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyAndFixManagerData };

