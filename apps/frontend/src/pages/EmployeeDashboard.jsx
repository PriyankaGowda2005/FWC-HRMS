import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { employeeAPI, attendanceAPI, leaveAPI, payrollAPI, performanceAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [showClockInModal, setShowClockInModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [clockInNotes, setClockInNotes] = useState('')
  const [workFromHome, setWorkFromHome] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch employee data with better error handling
  const { data: employeeData, isLoading: employeeLoading, error: employeeError } = useQuery(
    ['employee-data', user?.id],
    () => employeeAPI.getById(user?.id),
    { 
      enabled: !!user?.id,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Employee data fetch error:', error)
        toast.error('Failed to load employee data')
      }
    }
  )

  // Fetch attendance data with better parameters
  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useQuery(
    ['employee-attendance', user?.id, selectedPeriod],
    () => attendanceAPI.getMyAttendance({ 
      period: selectedPeriod,
      page: 1,
      limit: 10
    }),
    { 
      enabled: !!user?.id,
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error('Attendance data fetch error:', error)
        toast.error('Failed to load attendance data')
      }
    }
  )

  // Fetch leave balance and requests
  const { data: leaveData, isLoading: leaveLoading, error: leaveError } = useQuery(
    ['employee-leave', user?.id],
    () => leaveAPI.getMyLeaves({ page: 1, limit: 5 }),
    { 
      enabled: !!user?.id,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Leave data fetch error:', error)
        toast.error('Failed to load leave data')
      }
    }
  )

  // Fetch payroll data (view only)
  const { data: payrollData, isLoading: payrollLoading, error: payrollError } = useQuery(
    ['employee-payroll', user?.id],
    () => payrollAPI.getMyPayroll({ 
      year: new Date().getFullYear(),
      page: 1,
      limit: 6
    }),
    { 
      enabled: !!user?.id,
      retry: 2,
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Payroll data fetch error:', error)
        toast.error('Failed to load payroll data')
      }
    }
  )

  // Fetch performance data (view only)
  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery(
    ['employee-performance', user?.id],
    () => performanceAPI.getMyReviews({ page: 1, limit: 3 }),
    { 
      enabled: !!user?.id,
      retry: 2,
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Performance data fetch error:', error)
        toast.error('Failed to load performance data')
      }
    }
  )

  // Clock in mutation
  const clockInMutation = useMutation(
    (data) => attendanceAPI.clockIn(data),
    {
      onSuccess: () => {
        toast.success('Clocked in successfully!')
        queryClient.invalidateQueries('employee-attendance')
        setShowClockInModal(false)
        setClockInNotes('')
        setWorkFromHome(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to clock in')
      }
    }
  )

  // Clock out mutation
  const clockOutMutation = useMutation(
    (data) => attendanceAPI.clockOut(data),
    {
      onSuccess: () => {
        toast.success('Clocked out successfully!')
        queryClient.invalidateQueries('employee-attendance')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to clock out')
      }
    }
  )

  // Create leave request mutation
  const createLeaveMutation = useMutation(
    (data) => leaveAPI.createLeaveRequest(data),
    {
      onSuccess: () => {
        toast.success('Leave request submitted successfully!')
        queryClient.invalidateQueries('employee-leave')
        setShowLeaveModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit leave request')
      }
    }
  )

  const handleClockIn = () => {
    clockInMutation.mutate({
      notes: clockInNotes,
      workFromHome
    })
  }

  const handleClockOut = () => {
    clockOutMutation.mutate({
      notes: ''
    })
  }

  const handleSubmitLeave = (leaveData) => {
    createLeaveMutation.mutate(leaveData)
  }

  // Show loading spinner only for critical data
  if (employeeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Get data with fallbacks
  const employee = employeeData?.employee || employeeData || {}
  const attendance = attendanceData?.attendanceRecords || []
  const attendanceSummary = attendanceData?.summary || {}
  const leaveRequests = leaveData?.leaveRequests || []
  const leaveBalance = leaveData?.leaveBalance || {}
  const payrollRecords = payrollData?.payrollRecords || []
  const yearlySummary = payrollData?.yearlySummary || {}
  const performanceReviews = performanceData?.reviews || []
  const performanceStats = performanceData?.stats || {}

  // Check if already clocked in today
  const today = new Date().toDateString()
  const todayAttendance = attendance.find(record => 
    new Date(record.date).toDateString() === today
  )
  const isClockedIn = todayAttendance?.clockIn && !todayAttendance?.clockOut

  // Calculate hours worked today
  const hoursWorkedToday = todayAttendance?.hoursWorked || 0

  // Mock data for demonstration if no real data
  const mockEmployee = {
    firstName: user?.username || 'Employee',
    lastName: 'User',
    position: 'Software Developer',
    department: 'Information Technology',
    employeeId: 'EMP001',
    hireDate: new Date().toISOString(),
    ...employee
  }

  const mockAttendanceSummary = {
    totalHours: attendanceSummary.totalHours || 160,
    daysPresent: attendanceSummary.daysPresent || 20,
    ...attendanceSummary
  }

  const mockLeaveBalance = {
    VACATION: leaveBalance.VACATION || 15,
    SICK: leaveBalance.SICK || 10,
    PERSONAL: leaveBalance.PERSONAL || 5,
    ...leaveBalance
  }

  const mockPerformanceStats = {
    averageRating: performanceStats.averageRating || 4.2,
    ...performanceStats
  }

  const mockYearlySummary = {
    averageMonthly: yearlySummary.averageMonthly || 75000,
    ...yearlySummary
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-lg text-gray-600 mt-2">
                Welcome back, {mockEmployee.firstName}! 
                <span className="text-sm text-gray-500 ml-2">
                  {currentTime.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Month</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="current">Current Month</option>
                <option value="last">Last Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {mockEmployee.firstName?.[0]}{mockEmployee.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">
                {mockEmployee.firstName} {mockEmployee.lastName}
              </h2>
              <p className="text-xl text-gray-600">{mockEmployee.position || 'Employee'}</p>
              <p className="text-lg text-gray-500">{mockEmployee.department || 'No Department'}</p>
              <div className="flex items-center space-x-6 mt-3">
                <span className="text-sm text-gray-500">
                  Employee ID: {mockEmployee.employeeId || 'N/A'}
                </span>
                <span className="text-sm text-gray-500">
                  Hire Date: {mockEmployee.hireDate ? new Date(mockEmployee.hireDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => setShowClockInModal(true)}
                disabled={isClockedIn || clockInMutation.isLoading}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isClockedIn 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isClockedIn ? 'Already Clocked In' : 'Clock In'}
              </button>
              <button 
                onClick={handleClockOut}
                disabled={!isClockedIn || clockOutMutation.isLoading}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  !isClockedIn 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                }`}
              >
                Clock Out
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Hours Worked</h3>
                <p className="text-3xl font-bold text-green-600">{mockAttendanceSummary.totalHours || 0}</p>
                <p className="text-sm text-gray-500">This {selectedPeriod}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Leave Balance</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {(mockLeaveBalance.VACATION || 0) + (mockLeaveBalance.SICK || 0) + (mockLeaveBalance.PERSONAL || 0)}
                </p>
                <p className="text-sm text-gray-500">Days remaining</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Performance</h3>
                <p className="text-3xl font-bold text-purple-600">{mockPerformanceStats.averageRating || 0}</p>
                <p className="text-sm text-gray-500">Average rating</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Net Salary</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  ${mockYearlySummary.averageMonthly ? (mockYearlySummary.averageMonthly / 1000).toFixed(0) + 'K' : 'N/A'}
                </p>
                <p className="text-sm text-gray-500">Monthly average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center justify-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-blue-900">Request Leave</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all duration-200 hover:shadow-md">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-green-900">Update Profile</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all duration-200 hover:shadow-md">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium text-purple-900">View Performance</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-all duration-200 hover:shadow-md">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="font-medium text-yellow-900">View Payroll</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Attendance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Attendance</h3>
            <div className="space-y-4">
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No attendance records found</p>
                  <p className="text-gray-400 text-sm mt-2">Your attendance will appear here once you clock in</p>
                </div>
              ) : (
                attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : 'N/A'} - 
                        {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : 'Still working'}
                      </p>
                      {record.workFromHome && (
                        <p className="text-xs text-blue-600 font-medium">🏠 Work from home</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                        record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                      {record.hoursWorked && (
                        <p className="text-sm text-gray-500 mt-2 font-medium">
                          {record.hoursWorked.toFixed(1)}h
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leave Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Leave Requests</h3>
            <div className="space-y-4">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No leave requests found</p>
                  <p className="text-gray-400 text-sm mt-2">Submit a leave request to see it here</p>
                </div>
              ) : (
                leaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">{request.leaveType}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">{request.daysRequested} days</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Leave Balance Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Leave Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-blue-900">Vacation</h4>
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {mockLeaveBalance.VACATION || 0}
              </div>
              <p className="text-sm text-blue-800">Days remaining</p>
            </div>
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-red-900">Sick Leave</h4>
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {mockLeaveBalance.SICK || 0}
              </div>
              <p className="text-sm text-red-800">Days remaining</p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-green-900">Personal</h4>
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {mockLeaveBalance.PERSONAL || 0}
              </div>
              <p className="text-sm text-green-800">Days remaining</p>
            </div>
          </div>
        </div>

        {/* Recent Performance Reviews */}
        {performanceReviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Performance Reviews</h3>
            <div className="space-y-6">
              {performanceReviews.map((review) => (
                <div key={review.id} className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900">{review.reviewPeriod}</h4>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-600">
                        {review.overallRating}/5
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(review.overallRating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Reviewed by: {review.reviewer?.firstName} {review.reviewer?.lastName}
                  </p>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    review.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    review.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {review.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clock In Modal */}
        {showClockInModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Clock In</h3>
                <button 
                  onClick={() => setShowClockInModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={clockInNotes}
                    onChange={(e) => setClockInNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Any notes about your work today..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="workFromHome"
                    checked={workFromHome}
                    onChange={(e) => setWorkFromHome(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="workFromHome" className="ml-3 text-sm text-gray-700">
                    Working from home today
                  </label>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={handleClockIn}
                    disabled={clockInMutation.isLoading}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {clockInMutation.isLoading ? 'Clocking In...' : 'Clock In'}
                  </button>
                  <button 
                    onClick={() => setShowClockInModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Request Modal */}
        {showLeaveModal && (
          <LeaveRequestModal
            onSubmit={handleSubmitLeave}
            onClose={() => setShowLeaveModal(false)}
            isLoading={createLeaveMutation.isLoading}
          />
        )}
      </div>
    </div>
  )
}

// Leave Request Modal Component
const LeaveRequestModal = ({ onSubmit, onClose, isLoading }) => {
  const [formData, setFormData] = useState({
    leaveType: 'VACATION',
    startDate: '',
    endDate: '',
    reason: '',
    workCoverage: '',
    isEmergency: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Request Leave</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="VACATION">Vacation</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal</option>
              <option value="MATERNITY">Maternity</option>
              <option value="PATERNITY">Paternity</option>
              <option value="BEREAVEMENT">Bereavement</option>
              <option value="STUDY">Study Leave</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Please provide a reason for your leave request..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Coverage</label>
            <textarea
              name="workCoverage"
              value={formData.workCoverage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="How will your work be covered during your absence?"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isEmergency"
              name="isEmergency"
              checked={formData.isEmergency}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isEmergency" className="ml-3 text-sm text-gray-700">
              This is an emergency leave request
            </label>
          </div>
          
          <div className="flex space-x-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmployeeDashboard