import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { employeeAPI, attendanceAPI, leaveAPI, performanceAPI, aiAPI, authAPI } from '../services/api'
import socketClient from '../services/socketClient'
import LoadingSpinner from '../components/LoadingSpinner'
import AIInsights from '../components/AIInsights'
import TeamAnalytics from '../components/TeamAnalytics'
import TeamManagement from '../components/TeamManagement'
import ManagerNotifications from '../components/ManagerNotifications'
import BackendStatus from '../components/BackendStatus'

const ManagerDashboard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [timeRange, setTimeRange] = useState('week')
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [realTimeData, setRealTimeData] = useState({
    teamMembers: 0,
    attendanceRate: 0,
    pendingLeaves: 0,
    teamPerformance: 0,
    lastUpdated: null
  })

  // Socket connection management
  useEffect(() => {
    const connectSocket = async () => {
      const token = localStorage.getItem('token')
      
      if (token && user) {
        try {
          // Validate token before connecting
          const response = await authAPI.getCurrentUser()
          if (response.data.user) {
            await socketClient.connect(token)
            console.log('🔌 Socket connection initiated')
          } else {
            console.warn('🔌 Token validation failed, skipping socket connection')
            setIsSocketConnected(false)
          }
        } catch (error) {
          console.warn('🔌 Socket connection failed:', error.message)
          setIsSocketConnected(false)
        }
      }
    }

    // Add a small delay to ensure token is properly set
    const timer = setTimeout(connectSocket, 1000)
    
    return () => {
      clearTimeout(timer)
      socketClient.disconnect()
      setIsSocketConnected(false)
    }
  }, [user])

  // Socket event listeners
  useEffect(() => {
    const handleDashboardData = (data) => {
      setRealTimeData(prev => ({
        ...prev,
        teamMembers: data.teamMembers,
        attendanceRate: data.attendanceData?.attendanceRate || 0,
        pendingLeaves: data.pendingLeaves?.length || 0,
        teamPerformance: data.performanceData?.averageScore || 0,
        lastUpdated: new Date().toISOString()
      }))
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['team-data'])
      queryClient.invalidateQueries(['team-attendance'])
      queryClient.invalidateQueries(['team-leave-requests'])
      queryClient.invalidateQueries(['team-performance'])
    }

    const handleLeaveDecision = (data) => {
      toast.success(`Leave request ${data.status.toLowerCase()} for ${data.employeeName}`)
      queryClient.invalidateQueries(['team-leave-requests'])
    }

    const handleAttendanceUpdate = (data) => {
      toast.success(`${data.employeeName} clocked ${data.type.toLowerCase()}`)
      queryClient.invalidateQueries(['team-attendance'])
    }

    const handleSocketConnected = () => {
      setIsSocketConnected(true)
      // Request initial dashboard data
      socketClient.requestDashboardData(timeRange, user?.id)
    }

    const handleSocketDisconnected = () => {
      setIsSocketConnected(false)
    }

    const handleSocketError = (data) => {
      console.error('Socket error:', data)
      toast.error(data.message || 'Real-time connection error')
    }

    // Register event listeners
    socketClient.on('dashboard:data', handleDashboardData)
    socketClient.on('leave:decision', handleLeaveDecision)
    socketClient.on('attendance:clocked', handleAttendanceUpdate)
    socketClient.on('socket:connected', handleSocketConnected)
    socketClient.on('socket:disconnected', handleSocketDisconnected)
    socketClient.on('socket:error', handleSocketError)

    return () => {
      // Cleanup listeners
      socketClient.off('dashboard:data', handleDashboardData)
      socketClient.off('leave:decision', handleLeaveDecision)
      socketClient.off('attendance:clocked', handleAttendanceUpdate)
      socketClient.off('socket:connected', handleSocketConnected)
      socketClient.off('socket:disconnected', handleSocketDisconnected)
      socketClient.off('socket:error', handleSocketError)
    }
  }, [timeRange, user?.id, queryClient])

  // Fetch team data
  const { data: teamData, isLoading: teamLoading } = useQuery(
    ['team-data', user?.id],
    () => employeeAPI.getTeamMembers(user?.id),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
      retry: 3,
      retryDelay: 2000
    }
  )

  // Fetch team attendance
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery(
    ['team-attendance', timeRange],
    () => attendanceAPI.getTeamAttendance({ 
      managerId: user?.id, 
      timeRange 
    }),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000,
      staleTime: 10000
    }
  )

  // Fetch team leave requests
  const { data: leaveData, isLoading: leaveLoading } = useQuery(
    ['team-leave-requests'],
    () => leaveAPI.getTeamLeaveRequests(user?.id),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000,
      staleTime: 10000,
      retry: 1, // Only retry once
      retryDelay: 2000
    }
  )

  // Fetch AI insights for team performance
  const { data: aiInsights, isLoading: aiLoading } = useQuery(
    ['team-ai-insights', user?.id],
    () => aiAPI.getTeamInsights(user?.id),
    { 
      enabled: !!user?.id,
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000
    }
  )

  // Fetch team performance reviews
  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    ['team-performance'],
    () => performanceAPI.getReviews({ 
      page: 1, 
      limit: 10,
      sortBy: 'overallRating',
      sortOrder: 'desc'
    }),
    { 
      enabled: !!user?.id,
      refetchInterval: 60000,
      staleTime: 30000,
      retry: 1,
      retryDelay: 2000
    }
  )

  // Approve/Reject leave mutation
  const approveLeaveMutation = useMutation(
    ({ leaveId, action, rejectionReason }) => 
      leaveAPI.approveRejectLeave(leaveId, { action, rejectionReason }),
    {
      onSuccess: () => {
        toast.success('Leave request processed successfully')
        queryClient.invalidateQueries('team-leave-requests')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to process leave request')
      }
    }
  )

  const handleApproveLeave = useCallback((leaveId) => {
    approveLeaveMutation.mutate({ leaveId, action: 'APPROVED' })
  }, [approveLeaveMutation])

  const handleRejectLeave = useCallback((leaveId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      approveLeaveMutation.mutate({ leaveId, action: 'REJECTED', rejectionReason: reason })
    }
  }, [approveLeaveMutation])

  const handleTimeRangeChange = useCallback((newTimeRange) => {
    setTimeRange(newTimeRange)
    if (isSocketConnected) {
      socketClient.requestDashboardData(newTimeRange, user?.id)
    }
  }, [isSocketConnected, user?.id])

  // Update real-time data when queries complete
  useEffect(() => {
    if (teamData && attendanceData && leaveData && performanceData) {
      const teamMembers = teamData.teamMembers || teamData.data?.teamMembers || []
      const attendanceStats = attendanceData.stats || {}
      const leaveStats = leaveData.stats || {}
      const performanceStats = performanceData.stats || {}
      
      setRealTimeData({
        teamMembers: teamMembers.length,
        attendanceRate: attendanceStats.averageAttendance || 0,
        pendingLeaves: leaveStats.pendingRequests || 0,
        teamPerformance: performanceStats.averageRating || 0,
        lastUpdated: new Date()
      })
    }
  }, [teamData, attendanceData, leaveData, performanceData])

  const handleCreatePerformanceReview = useCallback(() => {
    // This would open a modal or navigate to performance review creation
    toast.success('Performance review creation feature coming soon!')
  }, [])

  const handleViewTeamMembers = useCallback(() => {
    // This would navigate to team members page
    toast.success('Team members view feature coming soon!')
  }, [])

  const handleGenerateTeamReport = useCallback(() => {
    // This would generate and download team report
    toast.success('Team report generation feature coming soon!')
  }, [])

  const handleCreateEmployee = useCallback(() => {
    // This would open a modal or navigate to employee creation
    toast.success('Employee creation feature coming soon!')
  }, [])

  const handleExportData = useCallback(() => {
    // This would export team data
    toast.success('Data export feature coming soon!')
  }, [])

  const handleImportData = useCallback(() => {
    // This would import team data
    toast.success('Data import feature coming soon!')
  }, [])

  const handleScheduleMeeting = useCallback(() => {
    // This would open meeting scheduler
    toast.success('Meeting scheduler feature coming soon!')
  }, [])

  // Show loading spinner only if we have data or are actively loading
  const isLoading = teamLoading || attendanceLoading || leaveLoading || aiLoading || performanceLoading
  const hasAnyData = teamData || attendanceData || leaveData || aiInsights || performanceData
  
  if (isLoading && !hasAnyData) {
    return <LoadingSpinner />
  }

  const teamMembers = teamData?.data?.teamMembers || teamData?.teamMembers || []
  const attendanceStats = attendanceData?.stats || {}
  const pendingLeaves = leaveData?.pendingRequests || leaveData?.leaveRequests || []
  const insights = aiInsights?.insights || {}
  const performanceReviews = performanceData?.reviews || []
  const performanceStats = performanceData?.stats || {}

  // Use real-time data if available, otherwise fallback to API data
  const displayData = {
    teamMembers: realTimeData.teamMembers || teamMembers.length,
    attendanceRate: realTimeData.attendanceRate || attendanceStats.attendanceRate || 0,
    pendingLeaves: realTimeData.pendingLeaves || pendingLeaves.length,
    teamPerformance: realTimeData.teamPerformance || performanceStats.averageScore || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600 mt-1">Team management and performance insights</p>
              <div className="flex items-center mt-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {isSocketConnected ? 'Real-time updates active' : 'Real-time updates offline'}
                </span>
                {realTimeData.lastUpdated && (
                  <span className="text-xs text-gray-400 ml-2">
                    Last updated: {new Date(realTimeData.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
                <BackendStatus />
              </div>
            </div>
            <div className="flex space-x-3">
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="performance">Performance</option>
                <option value="attendance">Attendance</option>
                <option value="leaves">Leave Management</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'team', name: 'Team Management', icon: '👥' },
              { id: 'notifications', name: 'Notifications', icon: '🔔' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{displayData.teamMembers}</p>
                <p className="text-xs text-gray-500">Direct reports</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{displayData.attendanceRate}%</p>
                <p className="text-xs text-gray-500">Team average</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{displayData.pendingLeaves}</p>
                <p className="text-xs text-gray-500">Awaiting approval</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Performance</p>
                <p className="text-2xl font-bold text-gray-900">{displayData.teamPerformance}%</p>
                <p className="text-xs text-gray-500">Average score</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <AIInsights type="team" managerId={user?.id} className="mb-6" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={handleCreatePerformanceReview}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Create Performance Review</span>
            </button>
            
            <button 
              onClick={handleViewTeamMembers}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>View Team Members</span>
            </button>
            
            <button 
              onClick={handleGenerateTeamReport}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Generate Team Report</span>
            </button>
            
            <button 
              onClick={handleScheduleMeeting}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Schedule Meeting</span>
            </button>
          </div>
          
          {/* Additional Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Team Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={handleCreateEmployee}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Employee</span>
              </button>
              
              <button 
                onClick={handleExportData}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </button>
              
              <button 
                onClick={handleImportData}
                className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Import Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h3>
            <span className="text-sm text-gray-500">{pendingLeaves.length} requests</span>
          </div>
          
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
              <p className="mt-1 text-sm text-gray-500">All leave requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map((leave) => (
                <div key={leave._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {leave.employee?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {leave.employee?.name || 'Unknown Employee'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {leave.employee?.employeeCode} • {leave.employee?.designation}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{leave.leaveType}</span> • {leave.leaveDays} day(s)
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        {leave.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Reason:</span> {leave.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApproveLeave(leave._id)}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md hover:bg-green-200 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave._id)}
                        className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <span className="text-sm text-gray-500">{teamMembers.length} members</span>
          </div>
          
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
              <p className="mt-1 text-sm text-gray-500">Start by adding team members to your department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.slice(0, 6).map((member) => (
                <div key={member._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {member.employeeCode} • {member.designation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {teamMembers.length > 6 && (
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                  <span className="text-sm text-gray-500">
                    +{teamMembers.length - 6} more members
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <TeamAnalytics managerId={user?.id} timeRange={timeRange} />
        )}

        {activeTab === 'team' && (
          <TeamManagement managerId={user?.id} />
        )}

        {activeTab === 'notifications' && (
          <ManagerNotifications managerId={user?.id} />
        )}
      </div>
    </div>
  )
}

export default ManagerDashboard