import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const EmployeeDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Fetch user profile data
  const { data: profileData, isLoading, error } = useQuery(
    'userProfile',
    () => authAPI.getCurrentUser(),
    {
      retry: 1
    }
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading profile</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const employee = profileData?.data.employee

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Info */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">First Name</label>
                  <div className="text-gray-900 py-2">{employee?.firstName || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Last Name</label>
                  <div className="text-gray-900 py-2">{employee?.lastName || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Email</label>
                  <div className="text-gray-900 py-2">{user?.email || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Username</label>
                  <div className="text-gray-900 py-2">{user?.username || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Phone Number</label>
                  <div className="text-gray-900 py-2">{employee?.phoneNumber || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Department</label>
                  <div className="text-gray-900 py-2">{employee?.department || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Position</label>
                  <div className="text-gray-900 py-2">{employee?.position || 'N/A'}</div>
                </div>
                
                <div>
                  <label className="label">Hire Date</label>
                  <div className="text-gray-900 py-2">
                    {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="btn-primary">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="space-y-6">
            {/* Employee Summary */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="text-gray-900 font-medium">{user?.role}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined:</span>
                  <span className="text-gray-900">
                    {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                {employee?.salary && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary:</span>
                    <span className="text-gray-900 font-medium">
                      ${employee.salary.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full btn-secondary text-left">
                  View Payroll
                </button>
                
                <button className="w-full btn-secondary text-left">
                  Update Contact Info
                </button>
                
                <button className="w-full btn-secondary text-left">
                  Request Time Off
                </button>
                
                <button className="w-full btn-secondary text-left">
                  View Company Directory
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>• Profile updated</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• Last login</p>
                  <p className="text-xs text-gray-400">Today</p>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• Account created</p>
                  <p className="text-xs text-gray-400">{employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default EmployeeDashboard
