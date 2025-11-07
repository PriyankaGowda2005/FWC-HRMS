// Test password verification for all users
const database = require('../database/connection');
const bcrypt = require('bcrypt');

async function testPasswordVerification() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Connected\n');

    // Test credentials
    const testUsers = [
      { email: 'admin@mastersolisinfotech.com', password: 'admin123', role: 'ADMIN' },
      { email: 'hr@mastersolisinfotech.com', password: 'HR@2024!', role: 'HR' },
      { email: 'manager@mastersolisinfotech.com', password: 'manager123', role: 'MANAGER' },
      { email: 'employee@mastersolisinfotech.com', password: 'employee123', role: 'EMPLOYEE' }
    ];

    const testCandidate = {
      email: 'candidate.demo@mastersolisinfotech.com',
      password: 'candidate123'
    };

    console.log('🔍 Testing Password Verification for Users...\n');

    for (const userData of testUsers) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      
      // Find user
      let user = await database.findOne('users', { email: normalizedEmail });
      if (!user) {
        const allUsers = await database.find('users', {});
        user = allUsers.find(u => u.email && u.email.toLowerCase().trim() === normalizedEmail);
      }

      if (!user) {
        console.log(`❌ User not found: ${normalizedEmail}`);
        continue;
      }

      console.log(`\n📋 Testing: ${normalizedEmail}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has password: ${!!user.password}`);
      
      if (!user.password) {
        console.log(`   ⚠️  No password - needs to be set`);
        // Hash and set password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await database.updateOne('users', { _id: user._id }, {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Password set`);
        user.password = hashedPassword;
      }

      // Test password
      console.log(`   Testing password: "${userData.password}"`);
      console.log(`   Stored hash: ${user.password.substring(0, 20)}...`);
      
      try {
        const isValid = await bcrypt.compare(userData.password, user.password);
        console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!isValid) {
          console.log(`   ⚠️  Password mismatch - rehashing...`);
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          await database.updateOne('users', { _id: user._id }, {
            $set: {
              password: hashedPassword,
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Password rehashed and updated`);
          
          // Test again
          const newIsValid = await bcrypt.compare(userData.password, hashedPassword);
          console.log(`   Re-test result: ${newIsValid ? '✅ VALID' : '❌ INVALID'}`);
        }
      } catch (compareError) {
        console.log(`   ❌ Error comparing password: ${compareError.message}`);
        console.log(`   ⚠️  Rehashing password...`);
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await database.updateOne('users', { _id: user._id }, {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Password rehashed`);
      }
    }

    console.log('\n🔍 Testing Candidate Password Verification...\n');
    
    const normalizedCandidateEmail = testCandidate.email.toLowerCase().trim();
    let candidate = await database.findOne('candidates', { email: normalizedCandidateEmail });
    
    if (!candidate) {
      const allCandidates = await database.find('candidates', {});
      candidate = allCandidates.find(c => c.email && c.email.toLowerCase().trim() === normalizedCandidateEmail);
    }

    if (!candidate) {
      console.log(`❌ Candidate not found: ${normalizedCandidateEmail}`);
    } else {
      console.log(`📋 Testing: ${normalizedCandidateEmail}`);
      console.log(`   Candidate ID: ${candidate._id}`);
      console.log(`   Has password: ${!!candidate.password}`);
      
      if (!candidate.password) {
        console.log(`   ⚠️  No password - needs to be set`);
        const hashedPassword = await bcrypt.hash(testCandidate.password, 12);
        await database.updateOne('candidates', { _id: candidate._id }, {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Password set`);
        candidate.password = hashedPassword;
      }

      console.log(`   Testing password: "${testCandidate.password}"`);
      console.log(`   Stored hash: ${candidate.password.substring(0, 20)}...`);
      
      try {
        const isValid = await bcrypt.compare(testCandidate.password, candidate.password);
        console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!isValid) {
          console.log(`   ⚠️  Password mismatch - rehashing...`);
          const hashedPassword = await bcrypt.hash(testCandidate.password, 12);
          await database.updateOne('candidates', { _id: candidate._id }, {
            $set: {
              password: hashedPassword,
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Password rehashed and updated`);
        }
      } catch (compareError) {
        console.log(`   ❌ Error comparing password: ${compareError.message}`);
        console.log(`   ⚠️  Rehashing password...`);
        const hashedPassword = await bcrypt.hash(testCandidate.password, 12);
        await database.updateOne('candidates', { _id: candidate._id }, {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Password rehashed`);
      }
    }

    console.log('\n✅ Password verification test completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPasswordVerification();

