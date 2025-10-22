require('dotenv').config();
const bcrypt = require('bcrypt');
const database = require('../database/connection');

const createSimpleCandidate = async () => {
  try {
    console.log('🌱 Creating simple candidate user...');
    
    // Connect to database first
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected successfully');

    // Create simple candidate user
    const candidateData = {
      email: 'candidate.demo@fwc.com',
      username: 'candidate_demo',
      password: await bcrypt.hash('candidate123', 12),
      role: 'CANDIDATE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if user already exists
    const existingUser = await database.findOne('users', { email: candidateData.email });
    if (existingUser) {
      console.log('♻️ Candidate user already exists, updating...');
      await database.updateOne('users', { _id: existingUser._id }, {
        $set: {
          password: candidateData.password,
          updatedAt: new Date()
        }
      });
      console.log('✅ Updated candidate user');
    } else {
      console.log('➕ Creating new candidate user...');
      const userResult = await database.insertOne('users', candidateData);
      console.log('✅ Created candidate user');
    }

    // Create candidate record
    const candidateRecord = {
      firstName: 'Demo',
      lastName: 'Candidate',
      email: 'candidate.demo@fwc.com',
      password: await bcrypt.hash('candidate123', 12),
      phone: '+1234567890',
      status: 'ACTIVE',
      profileComplete: false,
      resumeUploaded: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if candidate record already exists
    const existingCandidate = await database.findOne('candidates', { email: candidateRecord.email });
    if (existingCandidate) {
      console.log('♻️ Candidate record already exists, updating...');
      await database.updateOne('candidates', { _id: existingCandidate._id }, {
        $set: {
          ...candidateRecord,
          updatedAt: new Date()
        }
      });
      console.log('✅ Updated candidate record');
    } else {
      console.log('➕ Creating new candidate record...');
      await database.insertOne('candidates', candidateRecord);
      console.log('✅ Created candidate record');
    }

    console.log('\n🎉 Simple candidate creation completed successfully!');
    console.log('\n📋 Candidate Login Credentials:');
    console.log('Email: candidate.demo@fwc.com');
    console.log('Password: candidate123');

  } catch (err) {
    console.error('❌ Failed to create simple candidate:', err);
  } finally {
    await database.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the function
createSimpleCandidate();
