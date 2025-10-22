const database = require('../database/connection');
const { ObjectId } = require('mongodb');
const { seedAllModules } = require('./seedAllModules');

// Seed data for HRMS system
const seedData = async () => {
  try {
    console.log('🌱 Starting seed data insertion...');
    
    // Connect to database first
    await database.connect();
    console.log('✅ Connected to database');

    // 1. Create Leave Types
    const leaveTypes = [
      {
        name: 'Annual Leave',
        daysAllowedPerYear: 20,
        description: 'Annual vacation leave',
        isPaid: true,
        requiresApproval: true,
        createdAt: new Date()
      },
      {
        name: 'Sick Leave',
        daysAllowedPerYear: 10,
        description: 'Medical leave for illness',
        isPaid: true,
        requiresApproval: true,
        createdAt: new Date()
      },
      {
        name: 'Personal Leave',
        daysAllowedPerYear: 5,
        description: 'Personal time off',
        isPaid: false,
        requiresApproval: true,
        createdAt: new Date()
      },
      {
        name: 'Emergency Leave',
        daysAllowedPerYear: 3,
        description: 'Emergency situations',
        isPaid: true,
        requiresApproval: false,
        createdAt: new Date()
      }
    ];

    console.log('📝 Creating leave types...');
    for (const leaveType of leaveTypes) {
      const existing = await database.findOne('leave_types', { name: leaveType.name });
      if (!existing) {
        await database.insertOne('leave_types', leaveType);
        console.log(`✅ Created leave type: ${leaveType.name}`);
      } else {
        console.log(`⏭️  Leave type already exists: ${leaveType.name}`);
      }
    }

    // 2. Create Departments
    const departments = [
      {
        name: 'Human Resources',
        description: 'HR Department',
        managerId: null,
        budget: 500000,
        createdAt: new Date()
      },
      {
        name: 'Information Technology',
        description: 'IT Department',
        managerId: null,
        budget: 750000,
        createdAt: new Date()
      },
      {
        name: 'Finance',
        description: 'Finance Department',
        managerId: null,
        budget: 300000,
        createdAt: new Date()
      },
      {
        name: 'Marketing',
        description: 'Marketing Department',
        managerId: null,
        budget: 400000,
        createdAt: new Date()
      }
    ];

    console.log('🏢 Creating departments...');
    const createdDepartments = [];
    for (const dept of departments) {
      const existing = await database.findOne('departments', { name: dept.name });
      if (!existing) {
        const result = await database.insertOne('departments', dept);
        createdDepartments.push({ ...dept, _id: result.insertedId });
        console.log(`✅ Created department: ${dept.name}`);
      } else {
        createdDepartments.push(existing);
        console.log(`⏭️  Department already exists: ${dept.name}`);
      }
    }

    // 3. Create Sample Employees
    const employees = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        employeeCode: 'EMP001',
        designation: 'Software Engineer',
        departmentId: createdDepartments[1]._id, // IT
        salary: 75000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-01-15'),
        isActive: true,
        userId: new ObjectId(), // Generate a new ObjectId for userId
        createdAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        employeeCode: 'EMP002',
        designation: 'HR Manager',
        departmentId: createdDepartments[0]._id, // HR
        salary: 85000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2022-06-01'),
        isActive: true,
        userId: new ObjectId(), // Generate a new ObjectId for userId
        createdAt: new Date()
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@company.com',
        employeeCode: 'EMP003',
        designation: 'Financial Analyst',
        departmentId: createdDepartments[2]._id, // Finance
        salary: 65000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-03-10'),
        isActive: true,
        userId: new ObjectId(), // Generate a new ObjectId for userId
        createdAt: new Date()
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@company.com',
        employeeCode: 'EMP004',
        designation: 'Marketing Specialist',
        departmentId: createdDepartments[3]._id, // Marketing
        salary: 60000,
        employmentType: 'FULL_TIME',
        hireDate: new Date('2023-05-20'),
        isActive: true,
        userId: new ObjectId(), // Generate a new ObjectId for userId
        createdAt: new Date()
      }
    ];

    console.log('👥 Creating employees...');
    const createdEmployees = [];
    for (const emp of employees) {
      const existing = await database.findOne('employees', { email: emp.email });
      if (!existing) {
        const result = await database.insertOne('employees', emp);
        createdEmployees.push({ ...emp, _id: result.insertedId });
        console.log(`✅ Created employee: ${emp.firstName} ${emp.lastName}`);
      } else {
        createdEmployees.push(existing);
        console.log(`⏭️  Employee already exists: ${emp.firstName} ${emp.lastName}`);
      }
    }

    // 4. Create Sample Attendance Records
    console.log('⏰ Creating attendance records...');
    const attendanceRecords = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      for (const employee of createdEmployees) {
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const clockIn = new Date(date);
        clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM
        
        const clockOut = new Date(date);
        clockOut.setHours(17, Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM
        
        const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
        
        const attendanceRecord = {
          employeeId: employee._id,
          date: date,
          clockIn: clockIn,
          clockOut: clockOut,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          status: hoursWorked >= 8 ? 'PRESENT' : 'LATE',
          location: 'Office',
          createdAt: new Date()
        };
        
        const existing = await database.findOne('attendance', { 
          employeeId: employee._id, 
          date: { $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
        });
        
        if (!existing) {
          await database.insertOne('attendance', attendanceRecord);
          attendanceRecords.push(attendanceRecord);
        }
      }
    }
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // 5. Create Sample Leave Requests
    console.log('🏖️ Creating leave requests...');
    const leaveTypesData = await database.find('leave_types', {});
    
    const leaveRequests = [
      {
        employeeId: createdEmployees[0]._id,
        leaveTypeId: leaveTypesData[0]._id, // Annual Leave
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-22'),
        leaveDays: 3,
        status: 'APPLIED',
        reason: 'Family vacation',
        appliedAt: new Date('2024-12-01'),
        createdAt: new Date()
      },
      {
        employeeId: createdEmployees[1]._id,
        leaveTypeId: leaveTypesData[1]._id, // Sick Leave
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-15'),
        leaveDays: 1,
        status: 'APPROVED',
        reason: 'Medical appointment',
        appliedAt: new Date('2024-12-10'),
        decidedBy: createdEmployees[1]._id,
        decidedAt: new Date('2024-12-11'),
        createdAt: new Date()
      },
      {
        employeeId: createdEmployees[2]._id,
        leaveTypeId: leaveTypesData[2]._id, // Personal Leave
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
        leaveDays: 1,
        status: 'REJECTED',
        reason: 'Personal matters',
        appliedAt: new Date('2024-12-05'),
        decidedBy: createdEmployees[1]._id,
        decidedAt: new Date('2024-12-06'),
        notes: 'Not approved due to year-end workload',
        createdAt: new Date()
      }
    ];

    for (const leaveRequest of leaveRequests) {
      const existing = await database.findOne('leave_requests', { 
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate
      });
      
      if (!existing) {
        await database.insertOne('leave_requests', leaveRequest);
        console.log(`✅ Created leave request for ${leaveRequest.employeeId}`);
      }
    }

    // 6. Create Sample Payroll Records
    console.log('💰 Creating payroll records...');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    for (const employee of createdEmployees) {
      const payrollRecord = {
        employeeId: employee._id,
        payPeriodStart: new Date(currentYear, currentMonth, 1),
        payPeriodEnd: new Date(currentYear, currentMonth + 1, 0),
        grossSalary: employee.salary,
        basicSalary: employee.salary * 0.8,
        allowances: {
          housing: employee.salary * 0.1,
          transport: employee.salary * 0.05,
          medical: employee.salary * 0.05
        },
        deductions: {
          incomeTax: employee.salary * 0.1,
          socialSecurity: employee.salary * 0.06,
          healthInsurance: employee.salary * 0.03
        },
        overtimePay: Math.floor(Math.random() * 1000),
        bonus: Math.floor(Math.random() * 2000),
        totalDeductions: employee.salary * 0.19,
        netSalary: employee.salary * 0.81 + Math.floor(Math.random() * 1000),
        taxAmount: employee.salary * 0.1,
        currency: 'USD',
        status: 'PAID',
        paidAt: new Date(),
        createdAt: new Date()
      };
      
      const existing = await database.findOne('payroll', { 
        employeeId: employee._id,
        payPeriodStart: payrollRecord.payPeriodStart
      });
      
      if (!existing) {
        await database.insertOne('payroll', payrollRecord);
        console.log(`✅ Created payroll record for ${employee.firstName} ${employee.lastName}`);
      }
    }

    console.log('🎉 Basic seed data insertion completed successfully!');
    
    // 7. Seed all HRMS modules
    console.log('🌱 Seeding all HRMS modules...');
    await seedAllModules();
    
    console.log('🎉 Complete seed data insertion completed successfully!');
    
    // Disconnect from database
    await database.disconnect();
    console.log('✅ Disconnected from database');
    
  } catch (error) {
    console.error('❌ Error inserting seed data:', error);
    await database.disconnect();
    throw error;
  }
};

// Run seed data if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seed data script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed data script failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;
