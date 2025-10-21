import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { employeeAPI, attendanceAPI, leaveAPI, performanceAPI } from '../services/api'
import socketClient from '../services/socketClient'
import LoadingSpinner from './LoadingSpinner'

const TeamManagement = ({ managerId }) => {
  const queryClient = useQueryClient()
  const [selectedMember, setSelectedMember] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // Socket connection management
  useEffect(() => {
    const handleSocketConnected = () => {
      setIsSocketConnected(true)
    }

    const handleSocketDisconnected = () => {
      setIsSocketConnected(false)
    }

    const handleMemberUpdate = (data) => {
      toast.info(`Team member ${data.memberName} updated`)
      queryClient.invalidateQueries(['team-members'])
    }

    socketClient.on('socket:connected', handleSocketConnected)
    socketClient.on('socket:disconnected', handleSocketDisconnected)
    socketClient.on('team:member_updated', handleMemberUpdate)

    return () => {
      socketClient.off('socket:connected', handleSocketConnected)
      socketClient.off('socket:disconnected', handleSocketDisconnected)
      socketClient.off('team:member_updated', handleMemberUpdate)
    }
  }, [queryClient])

  // Fetch team members
  const { data: teamData, isLoading: teamLoading } = useQuery(
    ['team-members', managerId],
    () => employeeAPI.getTeamMembers(managerId),
    { 
      enabled: !!managerId,
      refetchInterval: 30000,
      staleTime: 10000
    }
  )

  // Fetch individual member data when selected
  const { data: memberData, isLoading: memberLoading } = useQuery(
    ['member-details', selectedMember?.userId],
    () => Promise.all([
      attendanceAPI.getEmployeeAttendance({ employeeId: selectedMember?.userId, period: '30d' }),
      leaveAPI.getLeaveRequests({ employeeId: selectedMember?.userId }),
      performanceAPI.getReviews({ employeeId: selectedMember?.userId })
    ]),
    { 
      enabled: !!selectedMember?.userId,
      refetchInterval: 30000,
      staleTime: 10000
    }
  )

  const teamMembers = teamData?.data?.teamMembers || teamData?.teamMembers || []
  const [attendanceData, leaveData, performanceData] = memberData || [[], [], []]

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    setActiveTab('overview')
  }

  const handleCreatePerformanceReview = (memberId) => {
    // This would open a performance review creation modal
    toast.info(`Creating performance review for ${teamMembers.find(m => m.userId === memberId)?.firstName}`)
  }

  const handleSendMessage = (memberId) => {
    // This would open a messaging interface
    toast.info(`Sending message to ${teamMembers.find(m => m.userId === memberId)?.firstName}`)
  }

  const handleScheduleOneOnOne = (memberId) => {
    // This would open a meeting scheduler
    toast.info(`Scheduling one-on-one with ${teamMembers.find(m => m.userId === memberId)?.firstName}`)
  }

  if (teamLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-600">Manage your team members and their performance</p>
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isSocketConnected ? 'Real-time updates' : 'Offline mode'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <span className="text-sm text-gray-500">{teamMembers.length} members</span>
            </div>
            
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member._id}
                  onClick={() => handleMemberSelect(member)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedMember?._id === member._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
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
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member Details */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Member Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {selectedMember.firstName?.charAt(0)}{selectedMember.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedMember.employeeCode} • {selectedMember.designation}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedMember.department} • {selectedMember.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCreatePerformanceReview(selectedMember.userId)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Performance Review
                    </button>
                    <button
                      onClick={() => handleSendMessage(selectedMember.userId)}
                      className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleScheduleOneOnOne(selectedMember.userId)}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md hover:bg-green-200 transition-colors"
                    >
                      Schedule 1:1
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {['overview', 'attendance', 'leaves', 'performance'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900">Recent Attendance</h4>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          {attendanceData?.length > 0 ? '95%' : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Last 30 days</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900">Leave Balance</h4>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          {leaveData?.length > 0 ? '12' : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Days remaining</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900">Performance</h4>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          {performanceData?.length > 0 ? '85%' : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Last review</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Clocked in at 9:00 AM</span>
                          <span className="text-xs text-gray-400">Today</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Submitted leave request</span>
                          <span className="text-xs text-gray-400">2 days ago</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Performance review completed</span>
                          <span className="text-xs text-gray-400">1 week ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Attendance History</h4>
                    {memberLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="space-y-3">
                        {attendanceData?.length > 0 ? (
                          attendanceData.slice(0, 10).map((record, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(record.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {record.clockIn} - {record.clockOut || 'In Progress'}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No attendance records found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'leaves' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Leave History</h4>
                    {memberLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="space-y-3">
                        {leaveData?.length > 0 ? (
                          leaveData.slice(0, 10).map((leave, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {leave.leaveType} - {leave.leaveDays} day(s)
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leave.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No leave records found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Performance Reviews</h4>
                    {memberLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="space-y-3">
                        {performanceData?.length > 0 ? (
                          performanceData.slice(0, 5).map((review, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-900">
                                  {review.reviewType} Review
                                </h5>
                                <span className="text-sm font-semibold text-gray-900">
                                  {review.overallRating}%
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                              {review.comments && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {review.comments}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No performance reviews found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a team member</h3>
                <p className="mt-1 text-sm text-gray-500">Choose a team member from the list to view their details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamManagement

