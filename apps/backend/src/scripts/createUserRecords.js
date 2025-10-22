const { ObjectId } = require('mongodb');
const database = require('../database/connection');

// Create user records for all employees
const createUserRecords = async () => {
  try {
    console.log('👤 Creating user records for employees...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Connected to database');

    // Get all employees
    const employees = await database.find('employees', {});
    console.log(`📋 Found ${employees.length} employees`);

    // Create user records for each employee
    for (const employee of employees) {
      // Check if user already exists
      const existingUser = await database.findOne('users', { _id: employee.userId });
      
      if (!existingUser) {
        const userRecord = {
          _id: employee.userId,
          username: employee.email.split('@')[0],
          email: employee.email,
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: getRoleFromDesignation(employee.designation),
          isActive: employee.isActive,
          createdAt: employee.createdAt || new Date(),
          updatedAt: new Date()
        };

        await database.insertOne('users', userRecord);
        console.log(`✅ Created user record for ${employee.firstName} ${employee.lastName}`);
      } else {
        console.log(`⏭️  User already exists for ${employee.firstName} ${employee.lastName}`);
      }
    }

    console.log('🎉 User records creation completed!');
    
    // Disconnect from database
    await database.disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error creating user records:', error);
    await database.disconnect();
    throw error;
  }
};

// Helper function to determine role from designation
const getRoleFromDesignation = (designation) => {
  const designationLower = designation.toLowerCase();
  
  if (designationLower.includes('director') || designationLower.includes('cto') || designationLower.includes('cfo')) {
    return 'ADMIN';
  } else if (designationLower.includes('manager') || designationLower.includes('lead')) {
    return 'MANAGER';
  } else if (designationLower.includes('hr') || designationLower.includes('human resources')) {
    return 'HR';
  } else {
    return 'EMPLOYEE';
  }
};

module.exports = { createUserRecords };

// Run if this file is executed directly
if (require.main === module) {
  createUserRecords()
    .then(() => {
      console.log('✅ User records script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User records script failed:', error);
      process.exit(1);
    });
}

