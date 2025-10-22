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

  // Clock in mutation
  const clockInMutation = useMutation(
    (data) => attendanceAPI.clockIn(data),
    {
      onSuccess: () => {
        toast.success('Clocked in successfully')
        queryClient.invalidateQueries('attendance')
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
        toast.success('Clocked out successfully')
        queryClient.invalidateQueries('attendance')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to clock out')
      }
    }
  )

  // Export attendance data
  const exportAttendance = () => {
    try {
      const csvContent = generateAttendanceCSV(sampleRecords)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `attendance_${selectedDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Attendance data exported successfully')
    } catch (error) {
      toast.error('Failed to export attendance data')
    }
  }

  // Generate attendance report
  const generateReport = () => {
    try {
      const reportData = generateAttendanceReport(sampleRecords)
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `attendance_report_${selectedDate}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Attendance report generated successfully')
    } catch (error) {
      toast.error('Failed to generate attendance report')
    }
  }

  // Helper function to generate CSV
  const generateAttendanceCSV = (records) => {
    const headers = ['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status']
    const csvRows = [headers.join(',')]
    
    records.forEach(record => {
      const row = [
        record.employeeName || 'N/A',
        new Date(record.date).toLocaleDateString(),
        record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : 'N/A',
        record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : 'N/A',
        record.hoursWorked || 'N/A',
        record.status || 'N/A'
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  // Helper function to generate report
  const generateAttendanceReport = (records) => {
    const totalRecords = records.length
    const presentCount = records.filter(r => r.status === 'PRESENT').length
    const lateCount = records.filter(r => r.status === 'LATE').length
    const absentCount = records.filter(r => r.status === 'ABSENT').length
    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0)
    
    return {
      reportDate: selectedDate,
      summary: {
        totalRecords,
        presentCount,
        lateCount,
        absentCount,
        totalHours: Math.round(totalHours * 100) / 100,
        attendanceRate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0
      },
      records: records.map(record => ({
        employee: record.employeeName || 'N/A',
        date: record.date,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        hoursWorked: record.hoursWorked,
        status: record.status
      }))
    }
  }

  const handleClockIn = () => {
    clockInMutation.mutate({
      notes: '',
      workFromHome: false,
      location: 'Office',
      deviceId: 'WEB'
    })
  }

  const handleClockOut = () => {
    clockOutMutation.mutate({
      notes: '',
      location: 'Office',
      deviceId: 'WEB'
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

  const attendanceRecords = attendanceData?.attendanceRecords || []
  
  // Add some sample data if no records exist
  const sampleRecords = attendanceRecords.length === 0 ? [
    {
      id: '1',
      employeeId: user?.id,
      employeeName: 'Employee User',
      date: new Date('2025-10-21'),
      clockIn: new Date('2025-10-21T09:00:00'),
      clockOut: new Date('2025-10-21T18:00:00'),
      hoursWorked: 8.5,
      status: 'PRESENT'
    },
    {
      id: '2',
      employeeId: user?.id,
      employeeName: 'Employee User',
      date: new Date('2025-10-20'),
      clockIn: new Date('2025-10-20T09:15:00'),
      clockOut: new Date('2025-10-20T17:45:00'),
      hoursWorked: 8.0,
      status: 'LATE'
    },
    {
      id: '3',
      employeeId: user?.id,
      employeeName: 'Employee User',
      date: new Date('2025-10-19'),
      clockIn: new Date('2025-10-19T08:45:00'),
      clockOut: new Date('2025-10-19T18:30:00'),
      hoursWorked: 9.25,
      status: 'PRESENT'
    }
  ] : attendanceRecords

  const todayRecord = sampleRecords.find(record => 
    record.employeeId === user?.id && 
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
              onClick={todayRecord?.clockIn && !todayRecord?.clockOut ? handleClockOut : handleClockIn}
              disabled={clockInMutation.isLoading || clockOutMutation.isLoading}
              className="w-full btn-primary"
            >
              {(clockInMutation.isLoading || clockOutMutation.isLoading) ? 'Processing...' : 
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
            <button 
              onClick={exportAttendance}
              className="btn-secondary"
              disabled={sampleRecords.length === 0}
            >
              Export
            </button>
            <button 
              onClick={generateReport}
              className="btn-primary"
              disabled={sampleRecords.length === 0}
            >
              Generate Report
            </button>
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
              {sampleRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                sampleRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {record.employeeName?.split(' ').map(n => n[0]).join('') || 'EU'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.employeeName || 'Employee User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Software Developer
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

      {/* Add Record Modal */}
      {showAddModal && (
        <AddAttendanceModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            // Handle add record logic here
            console.log('Add attendance record:', data)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

// Add Attendance Modal Component
const AddAttendanceModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '',
    clockOut: '',
    notes: '',
    workFromHome: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Attendance Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clock In Time</label>
              <input
                type="time"
                value={formData.clockIn}
                onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clock Out Time</label>
              <input
                type="time"
                value={formData.clockOut}
                onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="workFromHome"
                checked={formData.workFromHome}
                onChange={(e) => setFormData({ ...formData, workFromHome: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="workFromHome" className="ml-2 block text-sm text-gray-900">
                Work from home
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AttendanceManagement
