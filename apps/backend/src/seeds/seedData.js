const bcrypt = require('bcrypt');
const database = require('../database/connection');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - remove in production)
    console.log('🧹 Clearing existing data...');
    await database.deleteMany('users', {});
    await database.deleteMany('employees', {});
    await database.deleteMany('departments', {});
    await database.deleteMany('candidates', {});
    await database.deleteMany('job_postings', {});

    // Create departments
    console.log('🏢 Creating departments...');
    const departments = [
      {
        name: 'Human Resources',
        description: 'HR Department',
        costCenter: 'HR001',
        budget: 500000,
        location: 'Main Office',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Information Technology',
        description: 'IT Department',
        costCenter: 'IT001',
        budget: 750000,
        location: 'Tech Hub',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Finance',
        description: 'Finance Department',
        costCenter: 'FIN001',
        budget: 300000,
        location: 'Main Office',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Marketing',
        description: 'Marketing Department',
        costCenter: 'MKT001',
        budget: 400000,
        location: 'Creative Center',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const departmentResults = await database.insertMany('departments', departments);
    console.log(`✅ Created ${departmentResults.insertedCount} departments`);

    // Create essential users only (Admin and HR)
    console.log('👥 Creating essential users...');
    
    const users = [
      {
        email: 'admin@fwcit.com',
        username: 'admin',
        password: await bcrypt.hash('admin123', 12),
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'hr@fwchrms.com',
        username: 'hr_manager',
        password: await bcrypt.hash('HR@2024!', 12),
        role: 'HR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const userResults = await database.insertMany('users', users);
    console.log(`✅ Created ${userResults.insertedCount} users`);

    // Create 10 diverse job postings
    console.log('💼 Creating job postings...');
    const jobPostings = [
      {
        title: 'Senior Full Stack Developer',
        department: departments[1].name,
        description: 'Join our dynamic development team to build cutting-edge web applications. You\'ll work on both frontend and backend technologies, collaborating with cross-functional teams to deliver high-quality software solutions.',
        requirements: ['5+ years full-stack development', 'JavaScript/TypeScript', 'React/Vue.js', 'Node.js/Python', 'Database design', 'RESTful APIs'],
        responsibilities: ['Develop scalable web applications', 'Code reviews and mentoring', 'Architecture design', 'Performance optimization', 'Agile development'],
        salaryMin: 90000,
        salaryMax: 130000,
        location: 'Remote',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        maxApplications: 50,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'DevOps Engineer',
        department: departments[1].name,
        description: 'We\'re seeking a DevOps Engineer to streamline our deployment processes and improve our infrastructure. You\'ll work with cloud technologies and automation tools to ensure reliable and scalable systems.',
        requirements: ['3+ years DevOps experience', 'AWS/Azure/GCP', 'Docker/Kubernetes', 'CI/CD pipelines', 'Infrastructure as Code', 'Monitoring tools'],
        responsibilities: ['Manage cloud infrastructure', 'Automate deployment processes', 'Monitor system performance', 'Implement security best practices', 'Collaborate with development teams'],
        salaryMin: 85000,
        salaryMax: 120000,
        location: 'Hybrid',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxApplications: 40,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Scientist',
        department: departments[1].name,
        description: 'Join our data team to extract insights from complex datasets and build predictive models. You\'ll work with machine learning algorithms and statistical analysis to drive business decisions.',
        requirements: ['Master\'s in Data Science/Statistics', 'Python/R programming', 'Machine Learning', 'SQL', 'Statistical analysis', 'Data visualization'],
        responsibilities: ['Analyze large datasets', 'Build predictive models', 'Create data visualizations', 'Collaborate with business teams', 'Present findings to stakeholders'],
        salaryMin: 95000,
        salaryMax: 140000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        maxApplications: 35,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Digital Marketing Manager',
        department: departments[3].name,
        description: 'Lead our digital marketing initiatives and drive brand growth across multiple channels. You\'ll develop and execute comprehensive marketing strategies to increase brand awareness and customer engagement.',
        requirements: ['4+ years digital marketing', 'Google Analytics/Ads', 'Social media marketing', 'Content strategy', 'Email marketing', 'SEO/SEM'],
        responsibilities: ['Develop marketing strategies', 'Manage digital campaigns', 'Analyze campaign performance', 'Lead marketing team', 'Budget management'],
        salaryMin: 70000,
        salaryMax: 95000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        maxApplications: 30,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Financial Analyst',
        department: departments[2].name,
        description: 'Support our finance team with financial planning, analysis, and reporting. You\'ll work on budgeting, forecasting, and financial modeling to help drive strategic business decisions.',
        requirements: ['Bachelor\'s in Finance/Accounting', '2+ years financial analysis', 'Excel/Financial modeling', 'Financial reporting', 'Budgeting experience', 'CPA preferred'],
        responsibilities: ['Financial planning and analysis', 'Budget preparation', 'Financial reporting', 'Cost analysis', 'Support strategic planning'],
        salaryMin: 60000,
        salaryMax: 85000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        maxApplications: 25,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'UX/UI Designer',
        department: departments[1].name,
        description: 'Create intuitive and engaging user experiences for our digital products. You\'ll work closely with product managers and developers to design user-centered solutions that meet business objectives.',
        requirements: ['3+ years UX/UI design', 'Figma/Sketch/Adobe XD', 'User research', 'Prototyping', 'Design systems', 'Mobile design'],
        responsibilities: ['Design user interfaces', 'Conduct user research', 'Create wireframes and prototypes', 'Collaborate with development teams', 'Maintain design systems'],
        salaryMin: 75000,
        salaryMax: 105000,
        location: 'Hybrid',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        maxApplications: 40,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Sales Manager',
        department: departments[3].name,
        description: 'Lead our sales team to achieve revenue targets and drive business growth. You\'ll develop sales strategies, manage key accounts, and build relationships with clients to expand our market presence.',
        requirements: ['5+ years sales experience', 'Sales management', 'CRM systems', 'B2B sales', 'Client relationship management', 'Target achievement'],
        responsibilities: ['Lead sales team', 'Develop sales strategies', 'Manage key accounts', 'Achieve revenue targets', 'Build client relationships'],
        salaryMin: 80000,
        salaryMax: 120000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        maxApplications: 20,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'HR Business Partner',
        department: departments[0].name,
        description: 'Partner with business leaders to provide strategic HR support and drive organizational effectiveness. You\'ll work on talent management, employee relations, and organizational development initiatives.',
        requirements: ['4+ years HR experience', 'Employee relations', 'Talent management', 'HR policies', 'Organizational development', 'SHRM/HRCI certification preferred'],
        responsibilities: ['Partner with business leaders', 'Manage employee relations', 'Support talent management', 'Develop HR policies', 'Drive organizational initiatives'],
        salaryMin: 75000,
        salaryMax: 100000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
        maxApplications: 25,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Product Manager',
        department: departments[1].name,
        description: 'Drive product strategy and execution for our digital products. You\'ll work with cross-functional teams to define product requirements, prioritize features, and ensure successful product launches.',
        requirements: ['3+ years product management', 'Agile methodologies', 'Product strategy', 'Stakeholder management', 'Data analysis', 'Technical background preferred'],
        responsibilities: ['Define product strategy', 'Manage product roadmap', 'Collaborate with development teams', 'Analyze market trends', 'Drive product launches'],
        salaryMin: 90000,
        salaryMax: 130000,
        location: 'Hybrid',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
        maxApplications: 30,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Customer Success Manager',
        department: departments[3].name,
        description: 'Ensure customer satisfaction and drive product adoption. You\'ll work closely with customers to understand their needs, provide support, and help them achieve success with our products.',
        requirements: ['2+ years customer success', 'Customer relationship management', 'Product knowledge', 'Communication skills', 'Problem-solving', 'CRM systems'],
        responsibilities: ['Manage customer relationships', 'Drive product adoption', 'Provide customer support', 'Analyze customer feedback', 'Ensure customer satisfaction'],
        salaryMin: 55000,
        salaryMax: 75000,
        location: 'Remote',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(),
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        maxApplications: 35,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const jobResults = await database.insertMany('job_postings', jobPostings);
    console.log(`✅ Created ${jobResults.insertedCount} job postings`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@fwcit.com / admin123');
    console.log('HR: hr@fwchrms.com / HR@2024!');
    console.log('\n📋 Created Resources:');
    console.log(`- ${departmentResults.insertedCount} departments`);
    console.log(`- ${userResults.insertedCount} users (Admin & HR)`);
    console.log(`- ${jobResults.insertedCount} job postings`);
    console.log('\n💼 Job Postings Created:');
    jobPostings.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.department} (${job.location})`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedData };
