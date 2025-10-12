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

    // Create sample users and employees
    console.log('👥 Creating users and employees...');
    
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
        email: 'hr@fwcit.com',
        username: 'hr_manager',
        password: await bcrypt.hash('hr1234', 12),
        role: 'HR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'manager@fwcit.com',
        username: 'team_manager',
        password: await bcrypt.hash('manager123', 12),
        role: 'MANAGER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'employee@fwcit.com',
        username: 'employee1',
        password: await bcrypt.hash('employee123', 12),
        role: 'EMPLOYEE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'candidate@fwcit.com',
        username: 'candidate1',
        password: await bcrypt.hash('candidate123', 12),
        role: 'CANDIDATE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const userResults = await database.insertMany('users', users);
    console.log(`✅ Created ${userResults.insertedCount} users`);

    // Create employees for users (except candidate)
    const employees = [
      {
        userId: userResults.insertedIds[0], // Admin
        employeeId: 'EMP001',
        firstName: 'System',
        lastName: 'Administrator',
        position: 'System Administrator',
        department: departments[0].name,
        salary: 120000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-01-01'),
        isActive: true,
        isOnProbation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userResults.insertedIds[1], // HR
        employeeId: 'EMP002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        position: 'HR Manager',
        department: departments[0].name,
        salary: 85000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-02-01'),
        isActive: true,
        isOnProbation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userResults.insertedIds[2], // Manager
        employeeId: 'EMP003',
        firstName: 'Michael',
        lastName: 'Chen',
        position: 'IT Manager',
        department: departments[1].name,
        salary: 95000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-03-01'),
        isActive: true,
        isOnProbation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userResults.insertedIds[3], // Employee
        employeeId: 'EMP004',
        firstName: 'Emily',
        lastName: 'Davis',
        position: 'Software Developer',
        department: departments[1].name,
        salary: 75000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-04-01'),
        isActive: true,
        isOnProbation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const employeeResults = await database.insertMany('employees', employees);
    console.log(`✅ Created ${employeeResults.insertedCount} employees`);

    // Create some sample job postings
    console.log('💼 Creating job postings...');
    const jobPostings = [
      {
        title: 'Senior Software Developer',
        department: departments[1].name,
        description: 'We are looking for an experienced software developer to join our team.',
        requirements: ['5+ years experience', 'JavaScript', 'React', 'Node.js'],
        responsibilities: ['Develop web applications', 'Code reviews', 'Mentor junior developers'],
        salaryMin: 80000,
        salaryMax: 120000,
        location: 'Remote',
        employmentType: 'FULL_TIME',
        remoteAllowed: true,
        urgency: 'NORMAL',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(), // HR user
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxApplications: 50,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Marketing Specialist',
        department: departments[3].name,
        description: 'Join our marketing team to help grow our brand presence.',
        requirements: ['3+ years marketing experience', 'Social media', 'Content creation'],
        responsibilities: ['Social media management', 'Content creation', 'Campaign analysis'],
        salaryMin: 50000,
        salaryMax: 70000,
        location: 'Main Office',
        employmentType: 'FULL_TIME',
        remoteAllowed: false,
        urgency: 'HIGH',
        status: 'PUBLISHED',
        postedBy: userResults.insertedIds[1].toString(), // HR user
        postedAt: new Date(),
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        maxApplications: 30,
        currentApplications: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const jobResults = await database.insertMany('job_postings', jobPostings);
    console.log(`✅ Created ${jobResults.insertedCount} job postings`);

    // Create sample candidates
    console.log('👤 Creating sample candidates...');
    const candidates = [
      {
        email: 'john.doe@example.com',
        password: await bcrypt.hash('candidate123', 12),
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        status: 'ACTIVE',
        profileComplete: true,
        resumeUploaded: true,
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Frontend Developer',
            startDate: '2022-01-01',
            endDate: '2023-12-31',
            description: 'Developed responsive web applications using React and JavaScript'
          }
        ],
        education: [
          {
            institution: 'University of Technology',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            graduationYear: '2021',
            gpa: '3.8'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'jane.smith@example.com',
        password: await bcrypt.hash('candidate123', 12),
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567891',
        status: 'ACTIVE',
        profileComplete: true,
        resumeUploaded: false,
        skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
        experience: [
          {
            company: 'Data Solutions Inc',
            position: 'Backend Developer',
            startDate: '2021-06-01',
            endDate: '2023-11-30',
            description: 'Built scalable backend services using Python and Django'
          }
        ],
        education: [
          {
            institution: 'State University',
            degree: 'Master of Science',
            field: 'Software Engineering',
            graduationYear: '2021',
            gpa: '3.9'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const candidateResults = await database.insertMany('candidates', candidates);
    console.log(`✅ Created ${candidateResults.insertedCount} candidates`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Admin: admin@fwcit.com / admin123');
    console.log('HR: hr@fwcit.com / hr1234');
    console.log('Manager: manager@fwcit.com / manager123');
    console.log('Employee: employee@fwcit.com / employee123');
    console.log('Candidate: candidate@fwcit.com / candidate123');
    console.log('\n📋 Sample Candidate Credentials:');
    console.log('John Doe: john.doe@example.com / candidate123');
    console.log('Jane Smith: jane.smith@example.com / candidate123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = { seedData };
