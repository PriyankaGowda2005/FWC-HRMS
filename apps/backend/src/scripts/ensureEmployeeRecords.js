// Ensure all users have employee records
const database = require('../database/connection');
const bcrypt = require('bcrypt');

async function ensureEmployeeRecords() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Connected\n');

    // Get all users (excluding candidates)
    const users = await database.find('users', {});
    console.log(`📋 Found ${users.length} users\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      // Skip CANDIDATE role - they don't need employee records
      if (user.role === 'CANDIDATE') {
        skipped++;
        continue;
      }

      const existingEmployee = await database.findOne('employees', { userId: user._id });
      
      if (!existingEmployee) {
        // Create employee record
        const employeeData = {
          userId: user._id,
          firstName: user.firstName || user.username || 'User',
          lastName: user.lastName || '',
          position: user.role === 'ADMIN' ? 'System Administrator' : 
                   user.role === 'HR' ? 'HR Manager' :
                   user.role === 'MANAGER' ? 'Team Manager' : 'Software Developer',
          department: 'Information Technology',
          hireDate: new Date(),
          isActive: true,
          isOnProbation: user.role === 'EMPLOYEE',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await database.insertOne('employees', employeeData);
        console.log(`✅ Created employee record for: ${user.email} (${user.role})`);
        created++;
      } else {
        // Update existing employee record if needed
        const updateData = {};
        if (!existingEmployee.firstName && user.firstName) {
          updateData.firstName = user.firstName;
        }
        if (!existingEmployee.lastName && user.lastName) {
          updateData.lastName = user.lastName;
        }
        if (existingEmployee.isActive === undefined || existingEmployee.isActive === null) {
          updateData.isActive = true;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          await database.updateOne('employees', { _id: existingEmployee._id }, { $set: updateData });
          console.log(`♻️  Updated employee record for: ${user.email}`);
          updated++;
        } else {
          skipped++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`\n✅ Employee records ensured!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

ensureEmployeeRecords();

