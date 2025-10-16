const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/HRMS";
      
      this.client = new MongoClient(uri);

      await this.client.connect();
      this.db = this.client.db('HRMS');
      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB successfully');
      console.log('📊 Database: HRMS');
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  getCollection(name) {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db.collection(name);
  }

  // Helper methods for common operations
  async findOne(collection, query) {
    return await this.getCollection(collection).findOne(query);
  }

  async find(collection, query = {}, options = {}) {
    return await this.getCollection(collection).find(query, options).toArray();
  }

  async insertOne(collection, document) {
    return await this.getCollection(collection).insertOne(document);
  }

  async insertMany(collection, documents) {
    return await this.getCollection(collection).insertMany(documents);
  }

  async updateOne(collection, filter, update) {
    return await this.getCollection(collection).updateOne(filter, update);
  }

  async updateMany(collection, filter, update) {
    return await this.getCollection(collection).updateMany(filter, update);
  }

  async deleteOne(collection, filter) {
    return await this.getCollection(collection).deleteOne(filter);
  }

  async deleteMany(collection, filter) {
    return await this.getCollection(collection).deleteMany(filter);
  }

  async count(collection, query = {}) {
    return await this.getCollection(collection).countDocuments(query);
  }

  // Create indexes for better performance
  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');
      
      // Users collection indexes
      await this.createIndexIfNotExists('users', { email: 1 }, { unique: true });
      await this.createIndexIfNotExists('users', { username: 1 }, { unique: true });
      await this.createIndexIfNotExists('users', { role: 1 });

      // Employees collection indexes
      await this.createIndexIfNotExists('employees', { userId: 1 }, { unique: true });
      await this.createIndexIfNotExists('employees', { employeeId: 1 }, { unique: true, sparse: true });
      await this.createIndexIfNotExists('employees', { departmentId: 1 });
      await this.createIndexIfNotExists('employees', { isActive: 1 });

      // Attendance collection indexes
      await this.createIndexIfNotExists('attendance', { employeeId: 1, date: 1 }, { unique: true });
      await this.createIndexIfNotExists('attendance', { date: 1 });

      // Leave requests indexes
      await this.createIndexIfNotExists('leave_requests', { employeeId: 1 });
      await this.createIndexIfNotExists('leave_requests', { status: 1 });
      await this.createIndexIfNotExists('leave_requests', { startDate: 1, endDate: 1 });

      // Job postings indexes
      await this.createIndexIfNotExists('job_postings', { status: 1 });
      await this.createIndexIfNotExists('job_postings', { departmentId: 1 });
      await this.createIndexIfNotExists('job_postings', { postedAt: -1 });

      // Candidates indexes
      await this.createIndexIfNotExists('candidates', { email: 1 }, { unique: true });
      await this.createIndexIfNotExists('candidates', { status: 1 });
      await this.createIndexIfNotExists('candidates', { createdAt: -1 });

      // Candidate applications indexes
      await this.createIndexIfNotExists('candidate_applications', { candidateId: 1 });
      await this.createIndexIfNotExists('candidate_applications', { jobPostingId: 1 });
      await this.createIndexIfNotExists('candidate_applications', { status: 1 });
      await this.createIndexIfNotExists('candidate_applications', { appliedAt: -1 });

      // Interview sessions indexes
      await this.createIndexIfNotExists('interview_sessions', { candidateId: 1 });
      await this.createIndexIfNotExists('interview_sessions', { managerId: 1 });
      await this.createIndexIfNotExists('interview_sessions', { jobPostingId: 1 });
      await this.createIndexIfNotExists('interview_sessions', { status: 1 });
      await this.createIndexIfNotExists('interview_sessions', { scheduledAt: 1 });

      // Candidate resumes indexes
      await this.createIndexIfNotExists('candidate_resumes', { candidateId: 1 });
      await this.createIndexIfNotExists('candidate_resumes', { uploadedAt: -1 });

      // Job invitations indexes
      await this.createIndexIfNotExists('job_invitations', { candidateId: 1 });
      await this.createIndexIfNotExists('job_invitations', { jobPostingId: 1 });
      await this.createIndexIfNotExists('job_invitations', { status: 1 });
      await this.createIndexIfNotExists('job_invitations', { invitationDate: -1 });

      // Resume screenings indexes
      await this.createIndexIfNotExists('resume_screenings', { candidateId: 1 });
      await this.createIndexIfNotExists('resume_screenings', { jobPostingId: 1 });
      await this.createIndexIfNotExists('resume_screenings', { status: 1 });
      await this.createIndexIfNotExists('resume_screenings', { screeningDate: -1 });

      console.log('✅ Database indexes ready');
    } catch (error) {
      console.log('⚠️ Index creation completed with warnings (some indexes may already exist)');
    }
  }

  // Helper method to create index only if it doesn't exist
  async createIndexIfNotExists(collectionName, indexSpec, options = {}) {
    try {
      const collection = this.getCollection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      
      // Check if index already exists
      const indexExists = indexes.some(index => 
        JSON.stringify(index.key) === JSON.stringify(indexSpec)
      );
      
      if (!indexExists) {
        await collection.createIndex(indexSpec, options);
        console.log(`✅ Created index on ${collectionName}:`, JSON.stringify(indexSpec));
      } else {
        console.log(`⏭️ Index already exists on ${collectionName}:`, JSON.stringify(indexSpec));
      }
    } catch (error) {
      // Ignore index creation errors (they might already exist)
      console.log(`⚠️ Index creation skipped for ${collectionName}:`, error.message);
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
