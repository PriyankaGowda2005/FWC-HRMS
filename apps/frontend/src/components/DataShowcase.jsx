import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  employeeAPI, 
  attendanceAPI, 
  leaveAPI, 
  payrollAPI, 
  performanceAPI, 
  jobPostingAPI, 
  departmentAPI,
  candidateAPI 
} from '../services/api'
import RealTimeDataIndicator from './RealTimeDataIndicator'
import LoadingSpinner from './LoadingSpinner'
import {
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

/**
 * Comprehensive Data Showcase Component
 * Displays all database data in real-time with auto-refresh
 */
const DataShowcase = () => {
  const { user } = useAuth()
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch all data with real-time updates
  const { data: employeesData, refetch: refetchEmployees } = useQuery(
    'showcase-employees',
    () => employeeAPI.getAll({ page: 1, limit: 10 }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: attendanceData, refetch: refetchAttendance } = useQuery(
    'showcase-attendance',
    () => attendanceAPI.getAttendance({}),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: leaveData, refetch: refetchLeave } = useQuery(
    'showcase-leave',
    () => leaveAPI.getLeaveRequests(),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: payrollData, refetch: refetchPayroll } = useQuery(
    'showcase-payroll',
    () => payrollAPI.getPayroll({}),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: performanceData, refetch: refetchPerformance } = useQuery(
    'showcase-performance',
    () => performanceAPI.getReviews({}),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: jobPostingsData, refetch: refetchJobs } = useQuery(
    'showcase-jobs',
    () => jobPostingAPI.getAll({ page: 1, limit: 10 }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: departmentsData, refetch: refetchDepartments } = useQuery(
    'showcase-departments',
    () => departmentAPI.getDepartments(),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const { data: candidatesData, refetch: refetchCandidates } = useQuery(
    'showcase-candidates',
    () => candidateAPI.getAll({ page: 1, limit: 10 }),
    {
      refetchInterval: autoRefresh ? 30000 : false,
      refetchOnWindowFocus: true,
      enabled: user?.role === 'HR' || user?.role === 'ADMIN',
      onSuccess: () => setLastUpdated(new Date())
    }
  )

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchEmployees(),
      refetchAttendance(),
      refetchLeave(),
      refetchPayroll(),
      refetchPerformance(),
      refetchJobs(),
      refetchDepartments(),
      refetchCandidates()
    ])
    setLastUpdated(new Date())
  }

  const employees = employeesData?.employees || []
  const attendanceRecords = attendanceData?.attendanceRecords || []
  const leaveRequests = leaveData?.leaveRequests || []
  const payrollRecords = payrollData?.payrollRecords || []
  const performanceReviews = performanceData?.reviews || []
  const jobPostings = jobPostingsData?.jobPostings || []
  const departments = departmentsData?.departments || []
  const candidates = candidatesData?.candidates || []

  const stats = [
    {
      name: 'Employees',
      value: employees.length,
      total: employeesData?.pagination?.total || 0,
      icon: UserGroupIcon,
      color: 'blue',
      data: employees.slice(0, 5)
    },
    {
      name: 'Attendance Records',
      value: attendanceRecords.length,
      total: attendanceData?.pagination?.total || attendanceRecords.length,
      icon: ClockIcon,
      color: 'green',
      data: attendanceRecords.slice(0, 5)
    },
    {
      name: 'Leave Requests',
      value: leaveRequests.length,
      total: leaveData?.pagination?.total || leaveRequests.length,
      icon: CalendarIcon,
      color: 'yellow',
      data: leaveRequests.slice(0, 5)
    },
    {
      name: 'Payroll Records',
      value: payrollRecords.length,
      total: payrollData?.pagination?.total || payrollRecords.length,
      icon: CurrencyDollarIcon,
      color: 'purple',
      data: payrollRecords.slice(0, 5)
    },
    {
      name: 'Performance Reviews',
      value: performanceReviews.length,
      total: performanceData?.pagination?.total || performanceReviews.length,
      icon: ChartBarIcon,
      color: 'indigo',
      data: performanceReviews.slice(0, 5)
    },
    {
      name: 'Job Postings',
      value: jobPostings.length,
      total: jobPostingsData?.pagination?.total || jobPostings.length,
      icon: BriefcaseIcon,
      color: 'orange',
      data: jobPostings.slice(0, 5)
    },
    {
      name: 'Departments',
      value: departments.length,
      total: departments.length,
      icon: BuildingOfficeIcon,
      color: 'pink',
      data: departments.slice(0, 5)
    },
    {
      name: 'Candidates',
      value: candidates.length,
      total: candidatesData?.pagination?.total || candidates.length,
      icon: AcademicCapIcon,
      color: 'teal',
      data: candidates.slice(0, 5),
      show: user?.role === 'HR' || user?.role === 'ADMIN'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Real-time Indicator */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Data Showcase</h1>
          <p className="text-gray-600">Real-time view of all MongoDB data</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
          </label>
          <RealTimeDataIndicator 
            lastUpdated={lastUpdated} 
            onRefresh={handleRefreshAll}
            autoRefresh={autoRefresh}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.filter(stat => stat.show !== false).map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
            green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
            pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-500' },
            teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-500' }
          }
          const colors = colorClasses[stat.color] || colorClasses.blue
          
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${colors.border}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                    {stat.total > stat.value && (
                      <span className="text-lg text-gray-500"> / {stat.total}</span>
                    )}
                  </p>
                </div>
                <div className={`p-3 ${colors.bg} rounded-lg`}>
                  <Icon className={`w-8 h-8 ${colors.text}`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
                Employees ({employees.length})
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {employees.slice(0, 5).map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                    <p className="text-sm text-gray-500">{emp.position} • {emp.department}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {employees.length === 0 && (
                <p className="text-center text-gray-500 py-4">No employees found</p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-green-600" />
                Attendance ({attendanceRecords.length})
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {attendanceRecords.slice(0, 5).map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.hoursWorked || 0} hours • {record.status}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                    record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
              {attendanceRecords.length === 0 && (
                <p className="text-center text-gray-500 py-4">No attendance records found</p>
              )}
            </div>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-yellow-600" />
                Leave Requests ({leaveRequests.length})
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {leaveRequests.slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{leave.leaveType}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="text-center text-gray-500 py-4">No leave requests found</p>
              )}
            </div>
          </div>
        </div>

        {/* Payroll */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2 text-purple-600" />
                Payroll ({payrollRecords.length})
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {payrollRecords.slice(0, 5).map((payroll, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {payroll.month}/{payroll.year}
                    </p>
                    <p className="text-sm text-gray-500">
                      Net: ${(payroll.netSalary || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payroll.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payroll.status}
                  </span>
                </div>
              ))}
              {payrollRecords.length === 0 && (
                <p className="text-center text-gray-500 py-4">No payroll records found</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Postings */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BriefcaseIcon className="w-5 h-5 mr-2 text-orange-600" />
                Job Postings ({jobPostings.length})
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {jobPostings.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.department} • {job.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
              {jobPostings.length === 0 && (
                <p className="text-center text-gray-500 py-4">No job postings found</p>
              )}
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-pink-50 border-b border-pink-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2 text-pink-600" />
                Departments ({departments.length})
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {departments.slice(0, 5).map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-500">{dept.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {departments.length === 0 && (
                <p className="text-center text-gray-500 py-4">No departments found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataShowcase

