import React, { useState } from 'react'
import { useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { reportsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const ReportsManagement = () => {
  const { user } = useAuth()
  const [selectedReport, setSelectedReport] = useState('attendance')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch report data based on selected report type
  const { data: reportData, isLoading, error } = useQuery(
    ['reports', selectedReport, dateRange],
    () => reportsAPI.generateReport(selectedReport, dateRange),
    {
      enabled: false, // Only fetch when explicitly requested
      keepPreviousData: true,
    }
  )

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const data = await reportsAPI.generateReport(selectedReport, dateRange)
      
      // Generate and download the report
      switch (selectedReport) {
        case 'attendance':
          generateAttendanceReport(data)
          break
        case 'payroll':
          generatePayrollReport(data)
          break
        case 'leave':
          generateLeaveReport(data)
          break
        case 'performance':
          generatePerformanceReport(data)
          break
        case 'recruitment':
          generateRecruitmentReport(data)
          break
        case 'employee':
          generateEmployeeReport(data)
          break
        default:
          generateGenericReport(data, selectedReport)
      }
      
      toast.success('Report generated and downloaded successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const reportTypes = [
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Employee attendance summary and statistics',
      icon: '📅',
      access: ['ADMIN', 'HR', 'MANAGER']
    },
    {
      id: 'payroll',
      name: 'Payroll Report',
      description: 'Salary and compensation details',
      icon: '💰',
      access: ['ADMIN', 'HR']
    },
    {
      id: 'leave',
      name: 'Leave Report',
      description: 'Leave requests and balances',
      icon: '🏖️',
      access: ['ADMIN', 'HR', 'MANAGER']
    },
    {
      id: 'performance',
      name: 'Performance Report',
      description: 'Employee performance reviews and goals',
      icon: '📊',
      access: ['ADMIN', 'HR', 'MANAGER']
    },
    {
      id: 'recruitment',
      name: 'Recruitment Report',
      description: 'Job postings and candidate applications',
      icon: '👥',
      access: ['ADMIN', 'HR']
    },
    {
      id: 'employee',
      name: 'Employee Report',
      description: 'Employee demographics and information',
      icon: '👤',
      access: ['ADMIN', 'HR']
    }
  ]

  const filteredReportTypes = reportTypes.filter(report => 
    report.access.includes(user?.role)
  )

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading reports</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Reports Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export various HR reports
          </p>
        </div>
      </div>

      {/* Report Generation Form */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Generate Report</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Report Type
            </label>
            <div className="space-y-3">
              {filteredReportTypes.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{report.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Date Range
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDateRange({
                    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateRange({
                    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  This Year
                </button>
                <button
                  onClick={() => setDateRange({
                    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
                    endDate: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0]
                  })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Last Year
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="btn-primary disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Quick Report Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">📊</span>
              <h4 className="font-medium text-gray-900">Monthly Summary</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">Comprehensive monthly HR summary</p>
            <button
              onClick={() => {
                setSelectedReport('attendance')
                setDateRange({
                  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })
                handleGenerateReport()
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate →
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">💰</span>
              <h4 className="font-medium text-gray-900">Payroll Summary</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">Current month payroll details</p>
            <button
              onClick={() => {
                setSelectedReport('payroll')
                setDateRange({
                  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })
                handleGenerateReport()
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate →
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">👥</span>
              <h4 className="font-medium text-gray-900">Employee Directory</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">Complete employee information</p>
            <button
              onClick={() => {
                setSelectedReport('employee')
                handleGenerateReport()
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate →
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">📈</span>
              <h4 className="font-medium text-gray-900">Performance Overview</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">Team performance summary</p>
            <button
              onClick={() => {
                setSelectedReport('performance')
                setDateRange({
                  startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })
                handleGenerateReport()
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate →
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">🏖️</span>
              <h4 className="font-medium text-gray-900">Leave Analysis</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">Leave patterns and trends</p>
            <button
              onClick={() => {
                setSelectedReport('leave')
                setDateRange({
                  startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })
                handleGenerateReport()
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate →
            </button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">🎯</span>
              <h4 className="font-medium text-gray-900">Recruitment Stats</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">Hiring metrics and trends</p>
            <button
              onClick={() => {
                setSelectedReport('recruitment')
                setDateRange({
                  startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })
                handleGenerateReport()
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate →
            </button>
          </div>
        </div>
      </div>

      {/* Report History */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Reports</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No recent reports found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Report generation functions
const generateAttendanceReport = (data) => {
  const reportData = {
    reportType: 'Attendance Report',
    dateRange: data.dateRange,
    summary: {
      totalEmployees: data.totalEmployees || 0,
      totalWorkingDays: data.totalWorkingDays || 0,
      averageAttendance: data.averageAttendance || 0,
      totalAbsences: data.totalAbsences || 0,
      totalLateArrivals: data.totalLateArrivals || 0
    },
    details: data.attendanceRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, 'attendance_report')
}

const generatePayrollReport = (data) => {
  const reportData = {
    reportType: 'Payroll Report',
    dateRange: data.dateRange,
    summary: {
      totalEmployees: data.totalEmployees || 0,
      totalGrossSalary: data.totalGrossSalary || 0,
      totalDeductions: data.totalDeductions || 0,
      totalNetSalary: data.totalNetSalary || 0,
      averageSalary: data.averageSalary || 0
    },
    details: data.payrollRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, 'payroll_report')
}

const generateLeaveReport = (data) => {
  const reportData = {
    reportType: 'Leave Report',
    dateRange: data.dateRange,
    summary: {
      totalLeaveRequests: data.totalLeaveRequests || 0,
      approvedRequests: data.approvedRequests || 0,
      rejectedRequests: data.rejectedRequests || 0,
      pendingRequests: data.pendingRequests || 0,
      totalLeaveDays: data.totalLeaveDays || 0
    },
    details: data.leaveRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, 'leave_report')
}

const generatePerformanceReport = (data) => {
  const reportData = {
    reportType: 'Performance Report',
    dateRange: data.dateRange,
    summary: {
      totalReviews: data.totalReviews || 0,
      averageRating: data.averageRating || 0,
      totalGoals: data.totalGoals || 0,
      completedGoals: data.completedGoals || 0,
      inProgressGoals: data.inProgressGoals || 0
    },
    details: data.performanceRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, 'performance_report')
}

const generateRecruitmentReport = (data) => {
  const reportData = {
    reportType: 'Recruitment Report',
    dateRange: data.dateRange,
    summary: {
      totalJobPostings: data.totalJobPostings || 0,
      activeJobPostings: data.activeJobPostings || 0,
      totalApplications: data.totalApplications || 0,
      hiredCandidates: data.hiredCandidates || 0,
      averageTimeToHire: data.averageTimeToHire || 0
    },
    details: data.recruitmentRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, 'recruitment_report')
}

const generateEmployeeReport = (data) => {
  const reportData = {
    reportType: 'Employee Report',
    dateRange: data.dateRange,
    summary: {
      totalEmployees: data.totalEmployees || 0,
      activeEmployees: data.activeEmployees || 0,
      newHires: data.newHires || 0,
      departures: data.departures || 0,
      averageTenure: data.averageTenure || 0
    },
    details: data.employeeRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, 'employee_report')
}

const generateGenericReport = (data, reportType) => {
  const reportData = {
    reportType: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    dateRange: data.dateRange,
    summary: data.summary || {},
    details: data.details || [],
    generatedAt: new Date().toISOString(),
    generatedBy: data.generatedBy || 'System'
  }

  downloadReport(reportData, `${reportType}_report`)
}

const downloadReport = (reportData, filename) => {
  try {
    // Generate CSV content
    const csvContent = generateReportCSV(reportData)
    
    // Create and download CSV
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const csvLink = document.createElement('a')
    const csvUrl = URL.createObjectURL(csvBlob)
    csvLink.setAttribute('href', csvUrl)
    csvLink.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    csvLink.style.visibility = 'hidden'
    document.body.appendChild(csvLink)
    csvLink.click()
    document.body.removeChild(csvLink)

    // Also generate JSON report
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const jsonLink = document.createElement('a')
    const jsonUrl = URL.createObjectURL(jsonBlob)
    jsonLink.setAttribute('href', jsonUrl)
    jsonLink.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
    jsonLink.style.visibility = 'hidden'
    document.body.appendChild(jsonLink)
    jsonLink.click()
    document.body.removeChild(jsonLink)

    // Generate HTML report
    const htmlContent = generateReportHTML(reportData)
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' })
    const htmlLink = document.createElement('a')
    const htmlUrl = URL.createObjectURL(htmlBlob)
    htmlLink.setAttribute('href', htmlUrl)
    htmlLink.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.html`)
    htmlLink.style.visibility = 'hidden'
    document.body.appendChild(htmlLink)
    htmlLink.click()
    document.body.removeChild(htmlLink)

  } catch (error) {
    console.error('Error downloading report:', error)
    throw error
  }
}

const generateReportCSV = (reportData) => {
  const headers = ['Field', 'Value']
  const csvRows = [headers.join(',')]
  
  // Add summary data
  Object.entries(reportData.summary).forEach(([key, value]) => {
    csvRows.push([key, value].join(','))
  })
  
  // Add details if available
  if (reportData.details && reportData.details.length > 0) {
    csvRows.push(['', '']) // Empty row separator
    csvRows.push(['Details', '']) // Section header
    
    // Get headers from first detail record
    const detailHeaders = Object.keys(reportData.details[0])
    csvRows.push(detailHeaders.join(','))
    
    // Add detail rows
    reportData.details.forEach(detail => {
      const row = detailHeaders.map(header => detail[header] || '')
      csvRows.push(row.join(','))
    })
  }
  
  return csvRows.join('\n')
}

const generateReportHTML = (reportData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportData.reportType}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .summary { margin-bottom: 30px; }
        .summary h3 { color: #333; margin-bottom: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .summary-item h4 { margin: 0 0 5px 0; color: #666; font-size: 14px; }
        .summary-item p { margin: 0; font-size: 24px; font-weight: bold; color: #333; }
        .details { margin-top: 30px; }
        .details h3 { color: #333; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportData.reportType}</h1>
        <p>Generated on ${new Date(reportData.generatedAt).toLocaleString()}</p>
        <p>Date Range: ${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}</p>
      </div>
      
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-grid">
          ${Object.entries(reportData.summary).map(([key, value]) => `
            <div class="summary-item">
              <h4>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
              <p>${value}</p>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${reportData.details && reportData.details.length > 0 ? `
        <div class="details">
          <h3>Details</h3>
          <table>
            <thead>
              <tr>
                ${Object.keys(reportData.details[0]).map(key => `<th>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportData.details.map(detail => `
                <tr>
                  ${Object.values(detail).map(value => `<td>${value || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated by ${reportData.generatedBy} | ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `
}

export default ReportsManagement
