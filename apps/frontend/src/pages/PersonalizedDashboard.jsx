import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { employeeAPI, attendanceAPI, leaveAPI, payrollAPI, aiAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const ManagerDashboard = () => {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('week')

  // Fetch team data
  const { data: teamData, isLoading: teamLoading } = useQuery(
    ['team-data', user?.employee?.id],
    () => employeeAPI.getTeamMembers(user?.employee?.id),
    { enabled: !!user?.employee?.id }
  )

  // Fetch team attendance
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery(
    ['team-attendance', timeRange],
    () => attendanceAPI.getTeamAttendance({ 
      managerId: user?.employee?.id, 
      timeRange 
    }),
    { enabled: !!user?.employee?.id }
  )

  // Fetch team leave requests
  const { data: leaveData, isLoading: leaveLoading } = useQuery(
    ['team-leave-requests'],
    () => leaveAPI.getTeamLeaveRequests(user?.employee?.id),
    { enabled: !!user?.employee?.id }
  )

  // Fetch AI insights for team performance
  const { data: aiInsights, isLoading: aiLoading } = useQuery(
    ['team-ai-insights', user?.employee?.id],
    () => aiAPI.getTeamInsights(user?.employee?.id),
    { enabled: !!user?.employee?.id }
  )

  if (teamLoading || attendanceLoading || leaveLoading) {
    return <LoadingSpinner />
  }

  const teamMembers = teamData?.teamMembers || []
  const attendanceStats = attendanceData?.stats || {}
  const pendingLeaves = leaveData?.pendingRequests || []
  const insights = aiInsights?.insights || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600">Team management and performance insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Team Size</h3>
              <p className="text-3xl font-bold text-blue-600">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Attendance Rate</h3>
              <p className="text-3xl font-bold text-green-600">
                {attendanceStats.attendanceRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Leaves</h3>
              <p className="text-3xl font-bold text-yellow-600">{pendingLeaves.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Team Performance</h3>
              <p className="text-3xl font-bold text-purple-600">
                {insights.performanceScore || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.recommendations && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Performance Recommendations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {insights.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Team Strengths</h4>
              <ul className="text-sm text-green-800 space-y-1">
                {insights.strengths?.slice(0, 3).map((strength, index) => (
                  <li key={index}>• {strength}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.position || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${member.attendanceRate || 0}%` }}
                        ></div>
                      </div>
                      <span>{member.attendanceRate || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${member.performanceScore || 0}%` }}
                        ></div>
                      </div>
                      <span>{member.performanceScore || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Leave Requests */}
      {pendingLeaves.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Leave Requests</h3>
          <div className="space-y-3">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {leave.employee.firstName} {leave.employee.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {leave.leaveType} • {leave.daysRequested} days
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                    Approve
                  </button>
                  <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const HRDashboard = () => {
  const { user } = useAuth()
  const [selectedMetric, setSelectedMetric] = useState('overview')

  // Fetch HR analytics
  const { data: hrAnalytics, isLoading: analyticsLoading } = useQuery(
    'hr-analytics',
    () => employeeAPI.getHRAnalytics(),
    { enabled: user?.role === 'HR' || user?.role === 'ADMIN' }
  )

  // Fetch recruitment stats
  const { data: recruitmentStats, isLoading: recruitmentLoading } = useQuery(
    'recruitment-stats',
    () => employeeAPI.getRecruitmentStats(),
    { enabled: user?.role === 'HR' || user?.role === 'ADMIN' }
  )

  // Fetch AI insights
  const { data: aiInsights, isLoading: aiLoading } = useQuery(
    'hr-ai-insights',
    () => aiAPI.getHRInsights(),
    { enabled: user?.role === 'HR' || user?.role === 'ADMIN' }
  )

  if (analyticsLoading || recruitmentLoading || aiLoading) {
    return <LoadingSpinner />
  }

  const analytics = hrAnalytics?.analytics || {}
  const recruitment = recruitmentStats?.recruitment || {}
  const insights = aiInsights?.insights || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600">Human resources analytics and insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="overview">Overview</option>
            <option value="recruitment">Recruitment</option>
            <option value="retention">Retention</option>
            <option value="performance">Performance</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
              <p className="text-3xl font-bold text-blue-600">{analytics.totalEmployees || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0H8m8 0v8a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">New Hires</h3>
              <p className="text-3xl font-bold text-green-600">{recruitment.newHires || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Open Positions</h3>
              <p className="text-3xl font-bold text-yellow-600">{recruitment.openPositions || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Retention Rate</h3>
              <p className="text-3xl font-bold text-purple-600">{analytics.retentionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      {insights.predictions && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Powered HR Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Retention Risk</h4>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {insights.predictions.retentionRisk || 0}%
              </div>
              <p className="text-sm text-blue-800">
                {insights.predictions.retentionRisk > 70 
                  ? 'High risk employees identified' 
                  : 'Low retention risk'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Performance Prediction</h4>
              <div className="text-2xl font-bold text-green-600 mb-2">
                {insights.predictions.performanceScore || 0}%
              </div>
              <p className="text-sm text-green-800">
                Expected team performance for next quarter
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Salary Optimization</h4>
              <div className="text-2xl font-bold text-purple-600 mb-2">
                ${insights.predictions.salaryOptimization || 0}K
              </div>
              <p className="text-sm text-purple-800">
                Potential savings through salary optimization
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recruitment Pipeline */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recruitment Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { stage: 'Applied', count: recruitment.applied || 0, color: 'blue' },
            { stage: 'Screening', count: recruitment.screening || 0, color: 'yellow' },
            { stage: 'Interview', count: recruitment.interview || 0, color: 'purple' },
            { stage: 'Offer', count: recruitment.offer || 0, color: 'green' },
            { stage: 'Hired', count: recruitment.hired || 0, color: 'emerald' }
          ].map((stage) => (
            <div key={stage.stage} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${
                stage.color === 'blue' ? 'bg-blue-500' :
                stage.color === 'yellow' ? 'bg-yellow-500' :
                stage.color === 'purple' ? 'bg-purple-500' :
                stage.color === 'green' ? 'bg-green-500' :
                'bg-emerald-500'
              }`}>
                {stage.count}
              </div>
              <p className="text-sm font-medium text-gray-900">{stage.stage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department Analytics */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Analytics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retention Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Positions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(analytics.departments || []).map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.employeeCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${dept.avgPerformance || 0}%` }}
                        ></div>
                      </div>
                      <span>{dept.avgPerformance || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${dept.retentionRate || 0}%` }}
                        ></div>
                      </div>
                      <span>{dept.retentionRate || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.openPositions || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('current')

  // Fetch employee data
  const { data: employeeData, isLoading: employeeLoading } = useQuery(
    ['employee-data', user?.employee?.id],
    () => employeeAPI.getById(user?.employee?.id),
    { enabled: !!user?.employee?.id }
  )

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery(
    ['employee-attendance', user?.employee?.id, selectedPeriod],
    () => attendanceAPI.getEmployeeAttendance({ 
      employeeId: user?.employee?.id, 
      period: selectedPeriod 
    }),
    { enabled: !!user?.employee?.id }
  )

  // Fetch leave balance
  const { data: leaveBalance, isLoading: leaveLoading } = useQuery(
    ['employee-leave-balance', user?.employee?.id],
    () => leaveAPI.getLeaveBalance(user?.employee?.id),
    { enabled: !!user?.employee?.id }
  )

  // Fetch performance data
  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    ['employee-performance', user?.employee?.id],
    () => employeeAPI.getPerformanceData(user?.employee?.id),
    { enabled: !!user?.employee?.id }
  )

  if (employeeLoading || attendanceLoading || leaveLoading || performanceLoading) {
    return <LoadingSpinner />
  }

  const employee = employeeData?.employee || {}
  const attendance = attendanceData?.attendance || {}
  const leave = leaveBalance?.leaveBalance || {}
  const performance = performanceData?.performance || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Personal information and activities</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-gray-600">{employee.position || 'Employee'}</p>
            <p className="text-gray-500">{employee.department?.name || 'No Department'}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">
                Employee ID: {employee.employeeId || 'N/A'}
              </span>
              <span className="text-sm text-gray-500">
                Hire Date: {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Hours Worked</h3>
              <p className="text-3xl font-bold text-green-600">{attendance.hoursWorked || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Leave Balance</h3>
              <p className="text-3xl font-bold text-blue-600">{leave.available || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Performance</h3>
              <p className="text-3xl font-bold text-purple-600">{performance.score || 0}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Salary</h3>
              <p className="text-3xl font-bold text-yellow-600">
                ${employee.salary ? (employee.salary / 1000).toFixed(0) + 'K' : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {(attendance.recentRecords || []).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : 'N/A'} - 
                    {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                  record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Requests</h3>
          <div className="space-y-3">
            {(leave.recentRequests || []).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{request.leaveType}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {performance.goals && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Goals</h3>
          <div className="space-y-4">
            {performance.goals.map((goal, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                  <span className="text-sm font-medium text-gray-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Export the appropriate dashboard based on user role
const PersonalizedDashboard = () => {
  const { user } = useAuth()

  if (!user) {
    return <LoadingSpinner />
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />
    case 'HR':
      return <HRDashboard />
    case 'MANAGER':
      return <ManagerDashboard />
    case 'EMPLOYEE':
    default:
      return <EmployeeDashboard />
  }
}

export default PersonalizedDashboard
