// Test candidate login endpoint
const database = require('../database/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function testCandidateLogin() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Connected\n');

    const email = 'candidate.demo@mastersolisinfotech.com';
    const password = 'candidate123';

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 Testing login for: ${normalizedEmail}\n`);

    // Find candidate
    let candidate = await database.findOne('candidates', { email: normalizedEmail });
    
    if (!candidate) {
      const allCandidates = await database.find('candidates', {});
      candidate = allCandidates.find(c => c.email && c.email.toLowerCase().trim() === normalizedEmail);
    }

    if (!candidate) {
      console.log('❌ Candidate not found!');
      process.exit(1);
    }

    console.log('✅ Candidate found:');
    console.log(`   Email: ${candidate.email}`);
    console.log(`   Status: ${candidate.status}`);
    console.log(`   InvitedBy: ${candidate.invitedBy || 'NOT_SET'}`);
    console.log(`   Has password: ${!!candidate.password}\n`);

    // Check invitation (if needed)
    if (candidate.invitedBy === 'INVITATION') {
      const invitation = await database.findOne('candidate_invitations', {
        email: candidate.email,
        status: 'ACCEPTED'
      });
      if (!invitation) {
        console.log('❌ Invitation not accepted!');
        process.exit(1);
      }
      console.log('✅ Invitation verified\n');
    } else {
      console.log('✅ Self-registered candidate (no invitation needed)\n');
    }

    // Check password
    if (!candidate.password) {
      console.log('❌ No password set!');
      process.exit(1);
    }

    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    console.log(`🔐 Password check: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}\n`);

    if (!isPasswordValid) {
      console.log('❌ Password mismatch!');
      process.exit(1);
    }

    // Check status
    if (candidate.status !== 'ACTIVE') {
      console.log(`❌ Status is ${candidate.status}, should be ACTIVE`);
      process.exit(1);
    }
    console.log('✅ Status is ACTIVE\n');

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'fwc-hrms-super-secret-jwt-key-2024';
    const token = jwt.sign(
      { 
        candidateId: candidate._id.toString(),
        email: candidate.email,
        role: 'CANDIDATE'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated successfully!');
    console.log(`\n📋 Login Response would be:`);
    console.log(`   success: true`);
    console.log(`   candidateId: ${candidate._id}`);
    console.log(`   email: ${candidate.email}`);
    console.log(`   token: ${token.substring(0, 50)}...`);
    console.log(`\n🎉 Login test PASSED! Candidate can login successfully.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCandidateLogin();

