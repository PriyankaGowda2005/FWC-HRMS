import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { attendanceAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const AttendanceManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch attendance records
  const { data: attendanceData, isLoading, error } = useQuery(
    ['attendance', selectedDate],
    () => attendanceAPI.getAttendance({ date: selectedDate }),
    {
      keepPreviousData: true,
    }
  )

  // Clock in/out mutation
  const clockInOutMutation = useMutation(
    (data) => attendanceAPI.clockInOut(data),
    {
      onSuccess: () => {
        toast.success('Attendance recorded successfully')
        queryClient.invalidateQueries('attendance')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record attendance')
      }
    }
  )

  const handleClockInOut = () => {
    clockInOutMutation.mutate({
      employeeId: user.employee.id,
      date: selectedDate
    })
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading attendance</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const attendanceRecords = attendanceData?.data || []
  const todayRecord = attendanceRecords.find(record => 
    record.employeeId === user.employee?.id && 
    new Date(record.date).toDateString() === new Date(selectedDate).toDateString()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Attendance Management
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field mr-4"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary"
          >
            Add Record
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clock In/Out Card */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Attendance</h3>
          <div className="space-y-4">
            {todayRecord ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Clock In:</span>
                  <span className="font-medium">
                    {todayRecord.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString() : 'Not clocked in'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clock Out:</span>
                  <span className="font-medium">
                    {todayRecord.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString() : 'Not clocked out'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours Worked:</span>
                  <span className="font-medium">
                    {todayRecord.hoursWorked ? `${todayRecord.hoursWorked}h` : '0h'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No attendance record for today</p>
            )}
            
            <button
              onClick={handleClockInOut}
              disabled={clockInOutMutation.isLoading}
              className="w-full btn-primary"
            >
              {clockInOutMutation.isLoading ? 'Processing...' : 
               todayRecord?.clockIn && !todayRecord?.clockOut ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Days Present:</span>
              <span className="font-medium">22</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Hours:</span>
              <span className="font-medium">176h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overtime:</span>
              <span className="font-medium">8h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attendance Rate:</span>
              <span className="font-medium text-green-600">95%</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Late Arrivals:</span>
              <span className="font-medium text-yellow-600">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Early Departures:</span>
              <span className="font-medium text-red-600">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Absences:</span>
              <span className="font-medium text-red-600">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Work From Home:</span>
              <span className="font-medium text-blue-600">5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
          <div className="flex space-x-2">
            <button className="btn-secondary">Export</button>
            <button className="btn-primary">Generate Report</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {record.employee?.firstName?.[0]}{record.employee?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.employee?.firstName} {record.employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.employee?.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.hoursWorked ? `${record.hoursWorked}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                        record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                        record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-4">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
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
  )
}

export default AttendanceManagement
