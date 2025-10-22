require('dotenv').config();
const { ObjectId } = require('mongodb');
const database = require('../database/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const testManagerLogin = async () => {
  try {
    console.log('🔐 Testing Manager Login...');
    
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

    // Test password verification
    const testPassword = 'manager123';
    const isPasswordValid = await bcrypt.compare(testPassword, managerUser.password);
    console.log('🔑 Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    if (isPasswordValid) {
      // Generate token
      const token = jwt.sign(
        { 
          userId: managerUser._id, 
          email: managerUser.email, 
          role: managerUser.role 
        }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '24h' }
      );
      console.log('🎫 Token generated successfully');
      console.log('Token:', token);

      // Test API call with token
      const managerEmployee = await database.findOne('employees', { userId: managerUser._id });
      if (managerEmployee) {
        console.log('👤 Manager employee record found');
        const teamMembers = await database.find('employees', { managerId: managerEmployee._id });
        console.log('👥 Team members found:', teamMembers.length);
        
        if (teamMembers.length > 0) {
          console.log('✅ Manager login test successful!');
          console.log('📊 Data available:');
          console.log(`  - Team Members: ${teamMembers.length}`);
          
          const leaveRequests = await database.find('leaveRequests', {});
          console.log(`  - Leave Requests: ${leaveRequests.length}`);
          
          const performanceReviews = await database.find('performanceReviews', {});
          console.log(`  - Performance Reviews: ${performanceReviews.length}`);
          
          const attendance = await database.find('attendance', {});
          console.log(`  - Attendance Records: ${attendance.length}`);
        } else {
          console.log('❌ No team members found for manager');
        }
      } else {
        console.log('❌ Manager employee record not found');
      }
    } else {
      console.log('❌ Password verification failed');
    }

  } catch (error) {
    console.error('❌ Error testing manager login:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('🔌 Database disconnected');
  }
};

if (require.main === module) {
  testManagerLogin()
    .then(() => {
      console.log('✅ Manager login test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manager login test failed:', error);
      process.exit(1);
    });
}

module.exports = { testManagerLogin };

