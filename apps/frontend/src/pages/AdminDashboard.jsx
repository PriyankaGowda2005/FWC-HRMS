import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { departmentAPI, settingsAPI, reportsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import AIInsights from '../components/AIInsights'
import AIServicesStatus from '../components/AIServicesStatus'
import SystemStatus from '../components/SystemStatus'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [realTimeData, setRealTimeData] = useState({
    currentTime: new Date().toLocaleTimeString(),
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    pendingRequests: 0,
    totalBudget: 0
  })
  const limit = 10

  // Fetch dashboard statistics
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery(
    'dashboard-stats',
    () => settingsAPI.getDashboardStats(),
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (response) => {
        const data = response.data
        if (data && data.stats) {
          setRealTimeData(prev => ({
            ...prev,
            totalEmployees: data.stats.totalEmployees || 0,
            activeEmployees: data.stats.activeEmployees || 0,
            totalDepartments: data.stats.totalDepartments || 0,
            pendingRequests: data.stats.pendingLeaveRequests || 0,
            totalBudget: data.stats.totalBudget || 0
          }))
        }
      },
      onError: (error) => {
        console.error('Failed to fetch dashboard stats:', error)
        // Keep default values if API fails
      }
    }
  )

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString()
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Update real-time data when stats are available
  useEffect(() => {
    if (statsData?.data?.stats) {
      setRealTimeData(prev => ({
        ...prev,
        totalEmployees: statsData.data.stats.totalEmployees || 0,
        activeEmployees: statsData.data.stats.activeEmployees || 0,
        totalDepartments: statsData.data.stats.totalDepartments || 0,
        pendingRequests: statsData.data.stats.pendingLeaveRequests || 0,
        totalBudget: statsData.data.stats.totalBudget || 0
      }))
    }
  }, [statsData])

  // Fetch departments for analytics
  const { data: departmentsData, error: departmentsError } = useQuery(
    'departments-analytics',
    () => departmentAPI.getDepartmentAnalytics(),
    { 
      refetchInterval: 60000, // Refetch every minute
      onError: (error) => {
        console.error('Failed to fetch department analytics:', error)
      }
    }
  )

  // Fetch report history
  const { data: reportHistoryData, isLoading: reportHistoryLoading } = useQuery(
    'report-history',
    () => reportsAPI.getHistory({ page: 1, limit: 5 }),
    { 
      refetchInterval: 60000, // Refetch every minute
      onError: (error) => {
        console.error('Failed to fetch report history:', error)
      }
    }
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  if (reportHistoryLoading) return <LoadingSpinner />
  const reportHistory = reportHistoryData?.reports || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Welcome back, {user?.employee?.firstName}!</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-500">Logged in as</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{user?.employee?.firstName} {user?.employee?.lastName}</p>
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/employees')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Manage Employees
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Real-time Status Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  System Status: <span className="font-medium">Active</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  Current Time: <span className="font-medium">{realTimeData.currentTime}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm text-gray-600">
                  Departments: <span className="font-medium">{realTimeData.totalDepartments}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  Employees: <span className="font-medium">{realTimeData.totalEmployees}</span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => queryClient.invalidateQueries('dashboard-stats')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeData.totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeData.activeEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeData.totalDepartments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeData.pendingRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status and AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemStatus />
          <AIServicesStatus />
        </div>

        {/* AI Insights */}
        <AIInsights type="hr" />

        {/* Recent Reports Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Reports</h2>
          </div>
          
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
                {reportHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No recent reports found
                    </td>
                  </tr>
                ) : (
                  reportHistory.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.reportType === 'attendance' ? 'bg-blue-100 text-blue-800' :
                          report.reportType === 'payroll' ? 'bg-green-100 text-green-800' :
                          report.reportType === 'performance' ? 'bg-purple-100 text-purple-800' :
                          report.reportType === 'recruitment' ? 'bg-yellow-100 text-yellow-800' :
                          report.reportType === 'employee' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.reportData?.dateRange?.startDate && report.reportData?.dateRange?.endDate ? 
                          `${new Date(report.reportData.dateRange.startDate).toLocaleDateString()} - ${new Date(report.reportData.dateRange.endDate).toLocaleDateString()}` :
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        System Admin
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(report.generatedAt).toLocaleDateString()} {new Date(report.generatedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
