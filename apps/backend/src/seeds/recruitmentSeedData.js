const database = require('../database/connection');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

/**
 * Seed script for Recruitment Management Dashboard
 * Creates 10 sample jobs, 15 candidates, and 5 interviews
 */

const sampleJobs = [
  {
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR_LEVEL',
    salaryRange: '$120,000 - $150,000',
    description: 'We are looking for an experienced Full Stack Developer to join our dynamic engineering team. You will be responsible for developing and maintaining web applications using modern technologies.',
    summary: 'Join our engineering team as a Senior Full Stack Developer. Work on cutting-edge projects with React, Node.js, and MongoDB.',
    requirements: ['React', 'Node.js', 'MongoDB', 'TypeScript', '5+ years experience'],
    responsibilities: ['Develop scalable web applications', 'Collaborate with cross-functional teams', 'Mentor junior developers'],
    benefits: ['Health Insurance', '401k', 'Remote Work', 'Flexible Hours'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    currentApplications: 12,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'New York, NY',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$100,000 - $130,000',
    description: 'We are seeking a Product Manager to drive product strategy and execution. You will work closely with engineering, design, and business teams.',
    summary: 'Lead product initiatives and drive innovation as our Product Manager.',
    requirements: ['Product Management', 'Agile', 'Analytics', '3+ years experience'],
    responsibilities: ['Define product roadmap', 'Coordinate with stakeholders', 'Analyze user feedback'],
    benefits: ['Health Insurance', 'Stock Options', 'Remote Work'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    currentApplications: 8,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'UX Designer',
    department: 'Design',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$80,000 - $100,000',
    description: 'Join our design team as a UX Designer. Create intuitive and beautiful user experiences for our products.',
    summary: 'Design exceptional user experiences that delight our customers.',
    requirements: ['Figma', 'User Research', 'Prototyping', '2+ years experience'],
    responsibilities: ['Design user interfaces', 'Conduct user research', 'Create design systems'],
    benefits: ['Health Insurance', 'Remote Work', 'Design Budget'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    currentApplications: 15,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Data Scientist',
    department: 'Data Science',
    location: 'Seattle, WA',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR_LEVEL',
    salaryRange: '$130,000 - $160,000',
    description: 'We are looking for a Data Scientist to analyze complex data sets and build predictive models.',
    summary: 'Apply advanced analytics and machine learning to solve business problems.',
    requirements: ['Python', 'Machine Learning', 'SQL', 'Statistics', '4+ years experience'],
    responsibilities: ['Build ML models', 'Analyze data trends', 'Present insights to stakeholders'],
    benefits: ['Health Insurance', '401k', 'Learning Budget'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    currentApplications: 6,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$110,000 - $140,000',
    description: 'Join our DevOps team to build and maintain our cloud infrastructure.',
    summary: 'Manage and optimize our cloud infrastructure and CI/CD pipelines.',
    requirements: ['AWS', 'Docker', 'Kubernetes', 'Terraform', '3+ years experience'],
    responsibilities: ['Manage cloud infrastructure', 'Automate deployments', 'Monitor system performance'],
    benefits: ['Health Insurance', '401k', 'Remote Work'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    currentApplications: 9,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'Los Angeles, CA',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$90,000 - $115,000',
    description: 'Lead our marketing efforts and drive brand awareness.',
    summary: 'Develop and execute marketing strategies to grow our brand.',
    requirements: ['Digital Marketing', 'SEO', 'Content Strategy', '3+ years experience'],
    responsibilities: ['Develop marketing campaigns', 'Manage social media', 'Analyze marketing metrics'],
    benefits: ['Health Insurance', 'Marketing Budget', 'Remote Work'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    currentApplications: 11,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Sales Representative',
    department: 'Sales',
    location: 'Chicago, IL',
    employmentType: 'FULL_TIME',
    experienceLevel: 'ENTRY_LEVEL',
    salaryRange: '$60,000 - $80,000 + Commission',
    description: 'Join our sales team and help grow our customer base.',
    summary: 'Build relationships with customers and drive sales growth.',
    requirements: ['Sales Experience', 'Communication Skills', 'CRM', '1+ years experience'],
    responsibilities: ['Prospect new customers', 'Close deals', 'Maintain customer relationships'],
    benefits: ['Commission', 'Health Insurance', 'Sales Training'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    currentApplications: 18,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'QA Engineer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$85,000 - $105,000',
    description: 'Ensure quality of our products through comprehensive testing.',
    summary: 'Test and validate software to ensure high quality standards.',
    requirements: ['Testing', 'Automation', 'Selenium', '2+ years experience'],
    responsibilities: ['Write test cases', 'Automate testing', 'Report bugs'],
    benefits: ['Health Insurance', 'Remote Work', '401k'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    currentApplications: 7,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'HR Business Partner',
    department: 'Human Resources',
    location: 'Boston, MA',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$95,000 - $120,000',
    description: 'Support our teams with HR initiatives and employee relations.',
    summary: 'Partner with business leaders to drive HR strategy and employee engagement.',
    requirements: ['HR Experience', 'Employee Relations', 'HRIS', '3+ years experience'],
    responsibilities: ['Support employee relations', 'Implement HR policies', 'Talent management'],
    benefits: ['Health Insurance', '401k', 'Professional Development'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    currentApplications: 5,
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '$95,000 - $120,000',
    description: 'Build beautiful and responsive user interfaces for our web applications.',
    summary: 'Create engaging user experiences with modern frontend technologies.',
    requirements: ['React', 'TypeScript', 'CSS', '2+ years experience'],
    responsibilities: ['Develop UI components', 'Optimize performance', 'Collaborate with designers'],
    benefits: ['Health Insurance', 'Remote Work', '401k'],
    status: 'PUBLISHED',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    currentApplications: 14,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

const sampleCandidates = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0101',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
    experience: [{ company: 'Tech Corp', role: 'Senior Developer', years: 5 }],
    status: 'ACTIVE',
    fitScore: 85,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0102',
    skills: ['Product Management', 'Agile', 'Analytics'],
    experience: [{ company: 'StartupXYZ', role: 'Product Manager', years: 4 }],
    status: 'ACTIVE',
    fitScore: 78,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    phone: '+1-555-0103',
    skills: ['Figma', 'User Research', 'Prototyping'],
    experience: [{ company: 'Design Studio', role: 'UX Designer', years: 3 }],
    status: 'ACTIVE',
    fitScore: 82,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    phone: '+1-555-0104',
    skills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
    experience: [{ company: 'Data Analytics Inc', role: 'Data Scientist', years: 4 }],
    status: 'ACTIVE',
    fitScore: 90,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '+1-555-0105',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    experience: [{ company: 'Cloud Services', role: 'DevOps Engineer', years: 3 }],
    status: 'ACTIVE',
    fitScore: 75,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.martinez@example.com',
    phone: '+1-555-0106',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy'],
    experience: [{ company: 'Marketing Agency', role: 'Marketing Manager', years: 3 }],
    status: 'ACTIVE',
    fitScore: 72,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@example.com',
    phone: '+1-555-0107',
    skills: ['Sales', 'CRM', 'Communication'],
    experience: [{ company: 'Sales Corp', role: 'Sales Rep', years: 2 }],
    status: 'ACTIVE',
    fitScore: 68,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Amanda',
    lastName: 'Anderson',
    email: 'amanda.anderson@example.com',
    phone: '+1-555-0108',
    skills: ['Testing', 'Automation', 'Selenium'],
    experience: [{ company: 'QA Solutions', role: 'QA Engineer', years: 2 }],
    status: 'ACTIVE',
    fitScore: 80,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Christopher',
    lastName: 'Thomas',
    email: 'christopher.thomas@example.com',
    phone: '+1-555-0109',
    skills: ['HR', 'Employee Relations', 'HRIS'],
    experience: [{ company: 'HR Partners', role: 'HR Business Partner', years: 3 }],
    status: 'ACTIVE',
    fitScore: 77,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Lauren',
    lastName: 'Jackson',
    email: 'lauren.jackson@example.com',
    phone: '+1-555-0110',
    skills: ['React', 'TypeScript', 'CSS'],
    experience: [{ company: 'Web Dev Co', role: 'Frontend Developer', years: 2 }],
    status: 'ACTIVE',
    fitScore: 83,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'James',
    lastName: 'White',
    email: 'james.white@example.com',
    phone: '+1-555-0111',
    skills: ['React', 'Node.js', 'Express'],
    experience: [{ company: 'Software Inc', role: 'Full Stack Developer', years: 4 }],
    status: 'ACTIVE',
    fitScore: 88,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Nicole',
    lastName: 'Harris',
    email: 'nicole.harris@example.com',
    phone: '+1-555-0112',
    skills: ['Python', 'Data Analysis', 'SQL'],
    experience: [{ company: 'Analytics Pro', role: 'Data Analyst', years: 3 }],
    status: 'ACTIVE',
    fitScore: 79,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Kevin',
    lastName: 'Martin',
    email: 'kevin.martin@example.com',
    phone: '+1-555-0113',
    skills: ['JavaScript', 'React', 'Vue.js'],
    experience: [{ company: 'Frontend Labs', role: 'Frontend Developer', years: 3 }],
    status: 'ACTIVE',
    fitScore: 81,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Rachel',
    lastName: 'Thompson',
    email: 'rachel.thompson@example.com',
    phone: '+1-555-0114',
    skills: ['Marketing', 'Social Media', 'Content Creation'],
    experience: [{ company: 'Media Group', role: 'Marketing Specialist', years: 2 }],
    status: 'ACTIVE',
    fitScore: 70,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  {
    firstName: 'Daniel',
    lastName: 'Garcia',
    email: 'daniel.garcia@example.com',
    phone: '+1-555-0115',
    skills: ['Sales', 'Business Development', 'Negotiation'],
    experience: [{ company: 'Sales Force', role: 'Sales Representative', years: 1 }],
    status: 'ACTIVE',
    fitScore: 65,
    profileComplete: true,
    resumeUploaded: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  }
];

async function seedRecruitmentData() {
  try {
    console.log('🌱 Starting recruitment data seeding...');
    
    // Connect to database
    await database.connect();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing recruitment data...');
    await database.deleteMany('job_postings', {});
    await database.deleteMany('candidates', {});
    await database.deleteMany('interviews', {});
    await database.deleteMany('candidate_applications', {});
    
    // Insert jobs
    console.log('📝 Inserting sample jobs...');
    const jobResults = await database.insertMany('job_postings', sampleJobs);
    const jobIds = jobResults.insertedIds;
    const jobIdArray = Object.values(jobIds);
    console.log(`✅ Inserted ${jobResults.insertedCount} jobs`);
    
    // Insert candidates with hashed passwords
    console.log('👥 Inserting sample candidates...');
    const defaultPassword = await bcrypt.hash('password123', 12);
    const candidatesWithPassword = sampleCandidates.map(candidate => ({
      ...candidate,
      password: defaultPassword
    }));
    const candidateResults = await database.insertMany('candidates', candidatesWithPassword);
    const candidateIds = candidateResults.insertedIds;
    const candidateIdArray = Object.values(candidateIds);
    console.log(`✅ Inserted ${candidateResults.insertedCount} candidates`);
    
    // Create candidate applications (link candidates to jobs)
    console.log('📋 Creating candidate applications...');
    const applications = [];
    candidateIdArray.forEach((candidateId, index) => {
      const jobIndex = index % jobIdArray.length;
      applications.push({
        candidateId,
        jobPostingId: jobIdArray[jobIndex],
        status: ['APPLIED', 'SCREENED', 'SHORTLISTED'][index % 3],
        appliedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
      });
    });
    await database.insertMany('candidate_applications', applications);
    console.log(`✅ Created ${applications.length} candidate applications`);
    
    // Insert interviews
    console.log('🎤 Inserting sample interviews...');
    const interviewTypes = ['PHONE', 'VIDEO', 'IN_PERSON', 'AI', 'PANEL'];
    const interviewStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
    const interviews = [];
    
    for (let i = 0; i < 5; i++) {
      const candidateId = candidateIdArray[i];
      const jobId = jobIdArray[i % jobIdArray.length];
      interviews.push({
        candidateId,
        jobPostingId: jobId,
        interviewType: interviewTypes[i % interviewTypes.length],
        status: interviewStatuses[i % interviewStatuses.length],
        scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        scheduledBy: null, // Will be set if you have users
        scheduledByName: 'HR Team',
        location: i % 2 === 0 ? 'Virtual' : 'Office',
        meetingLink: i % 2 === 0 ? `https://meet.company.com/interview-${i}` : null,
        duration: 60,
        interviewNotes: `Interview notes for candidate ${i + 1}`,
        result: i < 2 ? 'PASSED' : i === 2 ? 'PENDING' : null,
        createdAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000)
      });
    }
    
    const interviewResults = await database.insertMany('interviews', interviews);
    console.log(`✅ Inserted ${interviewResults.insertedCount} interviews`);
    
    console.log('\n✅ Recruitment data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Jobs: ${jobResults.insertedCount}`);
    console.log(`   - Candidates: ${candidateResults.insertedCount}`);
    console.log(`   - Applications: ${applications.length}`);
    console.log(`   - Interviews: ${interviewResults.insertedCount}`);
    
    return {
      jobs: jobResults.insertedCount,
      candidates: candidateResults.insertedCount,
      applications: applications.length,
      interviews: interviewResults.insertedCount
    };
    
  } catch (error) {
    console.error('❌ Error seeding recruitment data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedRecruitmentData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedRecruitmentData, sampleJobs, sampleCandidates };

