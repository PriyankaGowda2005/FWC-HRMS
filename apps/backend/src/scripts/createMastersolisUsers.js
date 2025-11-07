const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/HRMS';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get database collections
const getCollection = (name) => {
  return mongoose.connection.db.collection(name);
};

const createOrUpdateUser = async (email, password, role, additionalData = {}) => {
  const collection = getCollection('users');
  const normalizedEmail = email.toLowerCase().trim();
  
  // Find existing user by email (case-insensitive)
  const existingUsers = await collection.find({}).toArray();
  let existingUser = existingUsers.find(u => u.email && u.email.toLowerCase().trim() === normalizedEmail);
  
  // Also check by username if email not found
  if (!existingUser && role === 'ADMIN') {
    existingUser = existingUsers.find(u => u.username === 'admin');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const userData = {
    email: normalizedEmail,
    password: hashedPassword,
    role: role,
    isActive: true,
    ...additionalData
  };
  
  if (existingUser) {
    // Update existing user
    await collection.updateOne(
      { _id: existingUser._id },
      { 
        $set: {
          email: normalizedEmail,
          password: hashedPassword,
          isActive: true,
          role: role,
          ...additionalData
        }
      }
    );
    console.log(`✅ Updated ${role}: ${normalizedEmail}`);
    return existingUser._id;
  } else {
    // Create new user
    // Generate unique username
    let username = email.split('@')[0].toLowerCase();
    let counter = 1;
    while (existingUsers.some(u => u.username === username)) {
      username = `${email.split('@')[0].toLowerCase()}${counter}`;
      counter++;
    }
    
    const result = await collection.insertOne({
      ...userData,
      username: username,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Created ${role}: ${normalizedEmail} (username: ${username})`);
    return result.insertedId;
  }
};

const createOrUpdateCandidate = async (email, password, additionalData = {}) => {
  const collection = getCollection('candidates');
  const normalizedEmail = email.toLowerCase().trim();
  
  // Find existing candidate by email (case-insensitive)
  const existingCandidates = await collection.find({}).toArray();
  let existingCandidate = existingCandidates.find(c => c.email && c.email.toLowerCase().trim() === normalizedEmail);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const candidateData = {
    email: normalizedEmail,
    password: hashedPassword,
    status: 'ACTIVE',
    invitedBy: 'SELF_REGISTERED',
    profileComplete: false,
    resumeUploaded: false,
    ...additionalData
  };
  
  if (existingCandidate) {
    // Update existing candidate
    await collection.updateOne(
      { _id: existingCandidate._id },
      { 
        $set: {
          email: normalizedEmail,
          password: hashedPassword,
          status: 'ACTIVE',
          invitedBy: 'SELF_REGISTERED',
          ...additionalData
        }
      }
    );
    console.log(`✅ Updated CANDIDATE: ${normalizedEmail}`);
    return existingCandidate._id;
  } else {
    // Create new candidate
    const nameParts = normalizedEmail.split('@')[0].split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Demo';
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Candidate';
    
    const result = await collection.insertOne({
      ...candidateData,
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      phone: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Created CANDIDATE: ${normalizedEmail}`);
    return result.insertedId;
  }
};

const verifyLogin = async (email, password, isCandidate = false) => {
  const collection = getCollection(isCandidate ? 'candidates' : 'users');
  const normalizedEmail = email.toLowerCase().trim();
  
  const allRecords = await collection.find({}).toArray();
  const record = allRecords.find(r => r.email && r.email.toLowerCase().trim() === normalizedEmail);
  
  if (!record) {
    console.log(`❌ ${isCandidate ? 'CANDIDATE' : 'USER'} not found: ${normalizedEmail}`);
    return false;
  }
  
  if (!record.password) {
    console.log(`❌ ${isCandidate ? 'CANDIDATE' : 'USER'} has no password: ${normalizedEmail}`);
    return false;
  }
  
  const isValid = await bcrypt.compare(password, record.password);
  if (!isValid) {
    console.log(`❌ Password mismatch for ${isCandidate ? 'CANDIDATE' : 'USER'}: ${normalizedEmail}`);
    return false;
  }
  
  if (isCandidate) {
    if (record.status !== 'ACTIVE') {
      console.log(`❌ CANDIDATE not active: ${normalizedEmail}`);
      return false;
    }
  } else {
    if (record.isActive === false) {
      console.log(`❌ USER not active: ${normalizedEmail}`);
      return false;
    }
  }
  
  console.log(`✅ ${isCandidate ? 'CANDIDATE' : 'USER'} login verified: ${normalizedEmail}`);
  return true;
};

const main = async () => {
  try {
    await connectDB();
    
    console.log('\n🔧 Creating/Updating Mastersolis Users...\n');
    
    // Create/Update Users
    await createOrUpdateUser('admin@mastersolisinfotech.com', 'admin123', 'ADMIN', {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });
    
    await createOrUpdateUser('hr@mastersolisinfotech.com', 'HR@2024!', 'HR', {
      username: 'hr',
      firstName: 'HR',
      lastName: 'Manager'
    });
    
    await createOrUpdateUser('manager@mastersolisinfotech.com', 'manager123', 'MANAGER', {
      username: 'manager',
      firstName: 'Manager',
      lastName: 'User'
    });
    
    await createOrUpdateUser('employee@mastersolisinfotech.com', 'employee123', 'EMPLOYEE', {
      username: 'employee',
      firstName: 'Employee',
      lastName: 'User'
    });
    
    // Create/Update Candidate
    await createOrUpdateCandidate('candidate.demo@mastersolisinfotech.com', 'candidate123', {
      firstName: 'Demo',
      lastName: 'Candidate',
      name: 'Demo Candidate'
    });
    
    console.log('\n🔍 Verifying Logins...\n');
    
    // Verify all logins
    await verifyLogin('admin@mastersolisinfotech.com', 'admin123');
    await verifyLogin('hr@mastersolisinfotech.com', 'HR@2024!');
    await verifyLogin('manager@mastersolisinfotech.com', 'manager123');
    await verifyLogin('employee@mastersolisinfotech.com', 'employee123');
    await verifyLogin('candidate.demo@mastersolisinfotech.com', 'candidate123', true);
    
    console.log('\n✅ All users created/updated and verified!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

main();

