require('dotenv').config();
const database = require('../database/connection');

async function verifyDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await database.connect();
    
    if (!database.isConnected) {
      console.log('❌ Database not connected');
      process.exit(1);
    }
    
    console.log('✅ MongoDB Connected!\n');
    
    // Count records in each collection
    const counts = {
      departments: await database.count('departments', {}),
      users: await database.count('users', {}),
      employees: await database.count('employees', {}),
      attendance: await database.count('attendance', {}),
      leave_requests: await database.count('leave_requests', {}),
      payroll: await database.count('payroll', {}),
      job_postings: await database.count('job_postings', {}),
      candidates: await database.count('candidates', {}),
      candidate_applications: await database.count('candidate_applications', {}),
      interviews: await database.count('interviews', {}),
      performance_reviews: await database.count('performance_reviews', {}),
      reports: await database.count('reports', {})
    };
    
    console.log('📊 Database Records:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Departments: ${counts.departments}`);
    console.log(`✅ Users: ${counts.users}`);
    console.log(`✅ Employees: ${counts.employees}`);
    console.log(`✅ Attendance Records: ${counts.attendance}`);
    console.log(`✅ Leave Requests: ${counts.leave_requests}`);
    console.log(`✅ Payroll Records: ${counts.payroll}`);
    console.log(`✅ Job Postings: ${counts.job_postings}`);
    console.log(`✅ Candidates: ${counts.candidates}`);
    console.log(`✅ Candidate Applications: ${counts.candidate_applications}`);
    console.log(`✅ Interviews: ${counts.interviews}`);
    console.log(`✅ Performance Reviews: ${counts.performance_reviews}`);
    console.log(`✅ Reports: ${counts.reports}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`📈 Total Records: ${total}\n`);
    
    await database.disconnect();
    console.log('✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();

