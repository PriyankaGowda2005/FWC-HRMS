const { ObjectId } = require('mongodb');
const database = require('../database/connection');

// Add sample report history for admin dashboard
const addSampleReportHistory = async () => {
  try {
    console.log('📊 Adding sample report history...');
    
    // Connect to database
    await database.connect();
    console.log('✅ Connected to database');

    // Get a random employee to use as the report generator
    const employees = await database.find('employees', {});
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];

    const reportHistory = [
      {
        reportType: 'attendance',
        reportData: {
          summary: {
            totalEmployees: employees.length,
            totalWorkingDays: 22,
            averageAttendance: 95,
            totalAbsences: 8,
            totalLateArrivals: 12
          },
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        },
        generatedBy: randomEmployee.userId,
        generatedAt: new Date('2024-02-01')
      },
      {
        reportType: 'payroll',
        reportData: {
          summary: {
            totalEmployees: employees.length,
            totalGrossSalary: employees.reduce((sum, emp) => sum + emp.salary, 0),
            totalDeductions: employees.reduce((sum, emp) => sum + emp.salary * 0.19, 0),
            totalNetSalary: employees.reduce((sum, emp) => sum + emp.salary * 0.81, 0),
            averageSalary: Math.round(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length)
          },
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        },
        generatedBy: randomEmployee.userId,
        generatedAt: new Date('2024-02-05')
      },
      {
        reportType: 'performance',
        reportData: {
          summary: {
            totalReviews: 5,
            completedReviews: 5,
            totalGoals: 5,
            completedGoals: 1,
            inProgressGoals: 4,
            averageRating: 4.0
          },
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-03-31'
          }
        },
        generatedBy: randomEmployee.userId,
        generatedAt: new Date('2024-04-01')
      },
      {
        reportType: 'recruitment',
        reportData: {
          summary: {
            totalJobPostings: 10,
            activeJobPostings: 8,
            closedJobPostings: 2,
            totalApplications: 10,
            hiredCandidates: 2,
            rejectedCandidates: 1,
            averageTimeToHire: 21
          },
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-03-31'
          }
        },
        generatedBy: randomEmployee.userId,
        generatedAt: new Date('2024-04-05')
      },
      {
        reportType: 'employee',
        reportData: {
          summary: {
            totalEmployees: employees.length,
            activeEmployees: employees.filter(emp => emp.isActive).length,
            newHires: 3,
            departures: 1,
            averageTenure: 2.5
          },
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-03-31'
          }
        },
        generatedBy: randomEmployee.userId,
        generatedAt: new Date('2024-04-10')
      },
      {
        reportType: 'leave',
        reportData: {
          summary: {
            totalLeaveRequests: 15,
            approvedRequests: 12,
            rejectedRequests: 2,
            pendingRequests: 1,
            totalLeaveDays: 45
          },
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-03-31'
          }
        },
        generatedBy: randomEmployee.userId,
        generatedAt: new Date('2024-04-15')
      }
    ];

    // Clear existing report history
    await database.deleteMany('report_history', {});
    
    // Insert new report history
    await database.insertMany('report_history', reportHistory);
    
    console.log(`✅ Added ${reportHistory.length} report history records`);
    console.log('🎉 Sample report history creation completed!');
    
    // Disconnect from database
    await database.disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error adding sample report history:', error);
    await database.disconnect();
    throw error;
  }
};

module.exports = { addSampleReportHistory };

// Run if this file is executed directly
if (require.main === module) {
  addSampleReportHistory()
    .then(() => {
      console.log('✅ Sample report history script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sample report history script failed:', error);
      process.exit(1);
    });
}



