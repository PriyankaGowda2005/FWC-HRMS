import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { leaveAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

const LeaveManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)

  // Fetch leave requests
  const { data: leaveData, isLoading, error } = useQuery(
    'leaveRequests',
    () => leaveAPI.getLeaveRequests(),
    {
      keepPreviousData: true,
    }
  )

  // Approve/Reject leave mutation
  const approveRejectMutation = useMutation(
    ({ leaveId, action, reason }) => leaveAPI.approveRejectLeave(leaveId, { action, reason }),
    {
      onSuccess: () => {
        toast.success('Leave request updated successfully')
        queryClient.invalidateQueries('leaveRequests')
        setShowApprovalModal(false)
        setSelectedLeave(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update leave request')
      }
    }
  )

  // Cancel leave mutation
  const cancelLeaveMutation = useMutation(
    (leaveId) => leaveAPI.cancelLeave(leaveId),
    {
      onSuccess: () => {
        toast.success('Leave request cancelled successfully')
        queryClient.invalidateQueries('leaveRequests')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel leave request')
      }
    }
  )

  const handleApproveReject = (leaveId, action, reason = '') => {
    approveRejectMutation.mutate({ leaveId, action, reason })
  }

  const handleCancelLeave = (leaveId) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      cancelLeaveMutation.mutate(leaveId)
    }
  }

  // Navigation handlers for quick actions
  const handleUpdateProfile = () => {
    navigate('/employee/profile')
  }

  const handleViewPerformance = () => {
    navigate('/employee/performance')
  }

  const handleViewPayroll = () => {
    navigate('/employee/payroll')
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading leave requests</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const leaveRequests = leaveData?.leaveRequests || []
  
  // Add sample data if no real data exists
  const sampleLeaveRequests = leaveRequests.length === 0 ? [
    {
      id: '1',
      employeeId: user?.id,
      leaveType: 'Vacation',
      startDate: new Date('2025-11-15'),
      endDate: new Date('2025-11-17'),
      daysRequested: 3,
      status: 'APPLIED',
      appliedOn: new Date('2025-10-15'),
      createdAt: new Date('2025-10-15'),
      reason: 'Family vacation',
      employee: {
        firstName: 'Employee',
        lastName: 'User',
        position: 'Software Developer'
      }
    },
    {
      id: '2',
      employeeId: user?.id,
      leaveType: 'Sick Leave',
      startDate: new Date('2025-10-25'),
      endDate: new Date('2025-10-25'),
      daysRequested: 1,
      status: 'APPROVED',
      appliedOn: new Date('2025-10-20'),
      createdAt: new Date('2025-10-20'),
      reason: 'Medical appointment',
      employee: {
        firstName: 'Employee',
        lastName: 'User',
        position: 'Software Developer'
      }
    },
    {
      id: '3',
      employeeId: user?.id,
      leaveType: 'Personal',
      startDate: new Date('2025-12-24'),
      endDate: new Date('2025-12-24'),
      daysRequested: 1,
      status: 'APPLIED',
      appliedOn: new Date('2025-10-22'),
      createdAt: new Date('2025-10-22'),
      reason: 'Personal matters',
      employee: {
        firstName: 'Employee',
        lastName: 'User',
        position: 'Software Developer'
      }
    },
    {
      id: '4',
      employeeId: user?.id,
      leaveType: 'Emergency Leave',
      startDate: new Date('2025-11-05'),
      endDate: new Date('2025-11-05'),
      daysRequested: 1,
      status: 'REJECTED',
      appliedOn: new Date('2025-10-30'),
      createdAt: new Date('2025-10-30'),
      reason: 'Family emergency',
      employee: {
        firstName: 'Employee',
        lastName: 'User',
        position: 'Software Developer'
      }
    }
  ] : leaveRequests

  const pendingRequests = sampleLeaveRequests.filter(req => req.status === 'APPLIED')
  const myRequests = sampleLeaveRequests.filter(req => req.employeeId === user?.id)
  const approvedThisMonth = sampleLeaveRequests.filter(req => 
    req.status === 'APPROVED' && 
    new Date(req.appliedOn).getMonth() === new Date().getMonth()
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Leave Management
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-primary"
          >
            Request Leave
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">My Requests</h3>
          <p className="text-3xl font-bold text-blue-600">{myRequests.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Approved This Month</h3>
          <p className="text-3xl font-bold text-green-600">{approvedThisMonth}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Leave Balance</h3>
          <p className="text-3xl font-bold text-purple-600">15 days</p>
        </div>
      </div>

      {/* Leave Balance Card */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <div className="text-sm text-gray-600">Annual Leave</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">10</div>
            <div className="text-sm text-gray-600">Sick Leave</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Personal Leave</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <div className="text-sm text-gray-600">Emergency Leave</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals (HR/Admin only) */}
      {(user?.role === 'ADMIN' || user?.role === 'HR') && pendingRequests.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.employee?.firstName} {request.employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee?.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.leaveType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.daysRequested}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveReject(request.id, 'APPROVED')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLeave(request)
                          setShowApprovalModal(true)
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Leave Requests */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">My Leave Requests</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                myRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.leaveType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.daysRequested}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'PENDING' && (
                        <button 
                          onClick={() => handleCancelLeave(request.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={cancelLeaveMutation.isLoading}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowRequestModal(true)}
            className="flex items-center justify-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-blue-900">Request Leave</span>
          </button>
          
          <button 
            onClick={handleUpdateProfile}
            className="flex items-center justify-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium text-green-900">Update Profile</span>
          </button>
          
          <button 
            onClick={handleViewPerformance}
            className="flex items-center justify-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium text-purple-900">View Performance</span>
          </button>
          
          <button 
            onClick={handleViewPayroll}
            className="flex items-center justify-center space-x-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="font-medium text-yellow-900">View Payroll</span>
          </button>
        </div>
      </div>

      {/* Request Leave Modal */}
      {showRequestModal && (
        <RequestLeaveModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={(data) => {
            // Handle leave request logic here
            console.log('Request leave:', data)
            setShowRequestModal(false)
          }}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedLeave && (
        <ApprovalModal
          leave={selectedLeave}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedLeave(null)
          }}
          onApprove={(reason) => {
            handleApproveReject(selectedLeave.id, 'APPROVED', reason)
          }}
          onReject={(reason) => {
            handleApproveReject(selectedLeave.id, 'REJECTED', reason)
          }}
        />
      )}
    </div>
  )
}

// Request Leave Modal Component
const RequestLeaveModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    handoverNotes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select
                required
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="PERSONAL">Personal Leave</option>
                <option value="EMERGENCY">Emergency Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Please provide a reason for your leave request..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Emergency contact number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Handover Notes</label>
              <textarea
                rows={3}
                value={formData.handoverNotes}
                onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Any important handover information..."
              />
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
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Approval Modal Component
const ApprovalModal = ({ leave, onClose, onApprove, onReject }) => {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Request Decision</h3>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">
              {leave.employee?.firstName} {leave.employee?.lastName}
            </h4>
            <p className="text-sm text-gray-600">
              {leave.leaveType} • {leave.daysRequested} days
            </p>
            <p className="text-sm text-gray-500">
              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
            </p>
            {leave.reason && (
              <p className="text-sm text-gray-500 mt-2">Reason: {leave.reason}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Reason for decision</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Optional reason for approval/rejection..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onReject(reason)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(reason)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaveManagement
