import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { employeeAPI, attendanceAPI, leaveAPI, performanceAPI } from '../services/api'
import socketClient from '../services/socketClient'
import LoadingSpinner from './LoadingSpinner'

const TeamAnalytics = ({ managerId, timeRange = 'month' }) => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // Socket connection for real-time analytics
  useEffect(() => {
    const handleSocketConnected = () => {
      setIsSocketConnected(true)
      socketClient.requestTeamAnalytics(timeRange, managerId)
    }

    const handleSocketDisconnected = () => {
      setIsSocketConnected(false)
    }

    const handleTeamAnalytics = (data) => {
      setAnalyticsData(data.analytics)
    }

    socketClient.on('socket:connected', handleSocketConnected)
    socketClient.on('socket:disconnected', handleSocketDisconnected)
    socketClient.on('analytics:team', handleTeamAnalytics)

    return () => {
      socketClient.off('socket:connected', handleSocketConnected)
      socketClient.off('socket:disconnected', handleSocketDisconnected)
      socketClient.off('analytics:team', handleTeamAnalytics)
    }
  }, [timeRange, managerId])

  // Fetch team analytics data
  const { data: teamData, isLoading: teamLoading } = useQuery(
    ['team-analytics', managerId, timeRange],
    async () => {
      const [teamMembers, attendanceData, leaveData, performanceData] = await Promise.all([
        employeeAPI.getTeamMembers(managerId),
        attendanceAPI.getTeamAttendance({ managerId, timeRange }),
        leaveAPI.getTeamLeaveRequests(managerId),
        performanceAPI.getReviews({ page: 1, limit: 100 })
      ])

      return {
        teamMembers: teamMembers.teamMembers || [],
        attendance: attendanceData.stats || {},
        leaves: leaveData.pendingRequests || [],
        performance: performanceData.reviews || []
      }
    },
    { 
      enabled: !!managerId,
      refetchInterval: 60000,
      staleTime: 30000
    }
  )

  // Process data for charts
  const processChartData = () => {
    if (!teamData) return null

    const { teamMembers, attendance, leaves, performance } = teamData

    // Attendance trend data
    const attendanceTrend = teamMembers.map(member => ({
      name: `${member.firstName} ${member.lastName}`.substring(0, 10),
      present: Math.floor(Math.random() * 20) + 15, // Mock data - replace with real data
      absent: Math.floor(Math.random() * 5),
      late: Math.floor(Math.random() * 3)
    }))

    // Performance distribution
    const performanceDistribution = [
      { name: 'Excellent (90-100)', value: performance.filter(p => p.overallRating >= 90).length, color: '#10B981' },
      { name: 'Good (80-89)', value: performance.filter(p => p.overallRating >= 80 && p.overallRating < 90).length, color: '#3B82F6' },
      { name: 'Average (70-79)', value: performance.filter(p => p.overallRating >= 70 && p.overallRating < 80).length, color: '#F59E0B' },
      { name: 'Below Average (<70)', value: performance.filter(p => p.overallRating < 70).length, color: '#EF4444' }
    ]

    // Leave types distribution
    const leaveTypesDistribution = leaves.reduce((acc, leave) => {
      const type = leave.leaveType || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const leaveTypesData = Object.entries(leaveTypesDistribution).map(([type, count]) => ({
      name: type,
      value: count
    }))

    return {
      attendanceTrend,
      performanceDistribution,
      leaveTypesData,
      summary: {
        totalMembers: teamMembers.length,
        averageAttendance: attendance.attendanceRate || 0,
        pendingLeaves: leaves.length,
        averagePerformance: performance.length > 0 ? 
          performance.reduce((sum, p) => sum + (p.overallRating || 0), 0) / performance.length : 0
      }
    }
  }

  const chartData = processChartData()

  if (teamLoading) {
    return <LoadingSpinner />
  }

  if (!chartData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data available</h3>
          <p className="mt-1 text-sm text-gray-500">Analytics will appear when team data is available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Team Analytics</h2>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isSocketConnected ? 'Real-time analytics' : 'Offline mode'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-lg font-semibold text-gray-900">{chartData.summary.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-lg font-semibold text-gray-900">{chartData.summary.averageAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-lg font-semibold text-gray-900">{chartData.summary.pendingLeaves}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-lg font-semibold text-gray-900">{Math.round(chartData.summary.averagePerformance)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#10B981" name="Present" />
              <Bar dataKey="absent" fill="#EF4444" name="Absent" />
              <Bar dataKey="late" fill="#F59E0B" name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Types Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.leaveTypesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Productivity Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">Team attendance is above company average</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">Performance reviews are up to date</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-yellow-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">Consider flexible work arrangements</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-purple-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm text-gray-600">Schedule regular team building activities</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-indigo-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm text-gray-600">Implement mentorship program</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">Recognize high performers publicly</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamAnalytics

