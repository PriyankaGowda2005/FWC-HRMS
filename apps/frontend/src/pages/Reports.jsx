import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { employeeAPI, attendanceAPI, leaveAPI, payrollAPI, performanceAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('overview')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  // Fetch various reports data
  const { data: employeeStats, isLoading: statsLoading } = useQuery(
    'employee-stats',
    () => employeeAPI.getStats()
  )

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery(
    'attendance-report',
    () => attendanceAPI.getReport(dateRange)
  )

  const { data: leaveData, isLoading: leaveLoading } = useQuery(
    'leave-report',
    () => leaveAPI.getReport(dateRange)
  )

  const { data: payrollData, isLoading: payrollLoading } = useQuery(
    'payroll-report',
    () => payrollAPI.getReport(dateRange)
  )

  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    'performance-report',
    () => performanceAPI.getReport(dateRange)
  )

  const isLoading = statsLoading || attendanceLoading || leaveLoading || payrollLoading || performanceLoading

  const generateReport = () => {
    const reportData = {
      employeeStats: employeeStats?.data,
      attendanceData: attendanceData?.data,
      leaveData: leaveData?.data,
      payrollData: payrollData?.data,
      performanceData: performanceData?.data,
      generatedAt: new Date().toISOString(),
      dateRange
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hr-report-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    // Simple CSV export for employee data
    const employees = employeeStats?.data?.employeesByDepartment || {}
    const csvData = Object.entries(employees).map(([dept, count]) => ({
      Department: dept,
      'Employee Count': count
    }))

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employee-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const stats = employeeStats?.data || {}
  const attendance = attendanceData?.data || {}
  const leave = leaveData?.data || {}
  const payroll = payrollData?.data || {}
  const performance = performanceData?.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Reports</h1>
          <p className="text-gray-600">Generate and export comprehensive HR reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'attendance', name: 'Attendance', icon: '⏰' },
            { id: 'leave', name: 'Leave', icon: '🏖️' },
            { id: 'payroll', name: 'Payroll', icon: '💰' },
            { id: 'performance', name: 'Performance', icon: '📈' }
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{report.icon}</div>
              <div className="font-medium">{report.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
        </h3>

        {selectedReport === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.totalEmployees || 0}</div>
                <div className="text-gray-600">Total Employees</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.activeEmployees || 0}</div>
                <div className="text-gray-600">Active Employees</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.totalDepartments || 0}</div>
                <div className="text-gray-600">Departments</div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Employees by Department</h4>
              <div className="space-y-2">
                {Object.entries(stats.employeesByDepartment || {}).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{dept}</span>
                    <span className="text-blue-600 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'attendance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{attendance.presentDays || 0}</div>
                <div className="text-gray-600">Present Days</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{attendance.absentDays || 0}</div>
                <div className="text-gray-600">Absent Days</div>
              </div>
            </div>
            <div className="text-gray-500 text-center py-8">
              Detailed attendance data will be available here
            </div>
          </div>
        )}

        {selectedReport === 'leave' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{leave.pendingRequests || 0}</div>
                <div className="text-gray-600">Pending Requests</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{leave.approvedRequests || 0}</div>
                <div className="text-gray-600">Approved Requests</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{leave.rejectedRequests || 0}</div>
                <div className="text-gray-600">Rejected Requests</div>
              </div>
            </div>
            <div className="text-gray-500 text-center py-8">
              Detailed leave data will be available here
            </div>
          </div>
        )}

        {selectedReport === 'payroll' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">${payroll.totalGrossSalary || 0}</div>
                <div className="text-gray-600">Total Gross Salary</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${payroll.totalNetSalary || 0}</div>
                <div className="text-gray-600">Total Net Salary</div>
              </div>
            </div>
            <div className="text-gray-500 text-center py-8">
              Detailed payroll data will be available here
            </div>
          </div>
        )}

        {selectedReport === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{performance.averageRating || 0}</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{performance.totalReviews || 0}</div>
                <div className="text-gray-600">Total Reviews</div>
              </div>
            </div>
            <div className="text-gray-500 text-center py-8">
              Detailed performance data will be available here
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
