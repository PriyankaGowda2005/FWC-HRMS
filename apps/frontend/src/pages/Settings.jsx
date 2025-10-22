import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { settingsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'

const Settings = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Fetch settings
  const { data: settingsData, isLoading, error } = useQuery(
    'settings',
    () => settingsAPI.getSettings(),
    {
      keepPreviousData: true,
      retry: 3,
      refetchInterval: 300000 // Refetch every 5 minutes
    }
  )

  // Fetch system health
  const { data: healthData } = useQuery(
    'system-health',
    () => settingsAPI.getSystemHealth(),
    {
      refetchInterval: 60000 // Refetch every minute
    }
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (data) => settingsAPI.updateSettings(data),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully')
        queryClient.invalidateQueries('settings')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update settings')
      }
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => settingsAPI.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully')
        setShowPasswordModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  )

  const handleUpdateSettings = (formData) => {
    updateSettingsMutation.mutate(formData)
  }

  const handleChangePassword = (passwordData) => {
    changePasswordMutation.mutate(passwordData)
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading settings</h2>
          <p className="text-gray-600">{error.message}</p>
            <button 
              onClick={() => queryClient.invalidateQueries('settings')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageTransition>
    )
  }

  const settings = settingsData?.settings || {}
  const health = healthData?.health || {}

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="System Settings" 
          subtitle="Manage your HRMS configuration and preferences"
        />
        
        <div className="p-6">
          {/* System Health Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${health.database === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">Database: {health.database || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Uptime: {health.uptime ? `${Math.floor(health.uptime / 3600)}h` : 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Environment: {health.environment || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Settings Tabs */}
            <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'general', name: 'General', icon: '⚙️' },
                  { id: 'company', name: 'Company Info', icon: '🏢' },
                  { id: 'working-hours', name: 'Working Hours', icon: '🕐' },
                  { id: 'leave-policy', name: 'Leave Policy', icon: '📅' },
                  { id: 'attendance', name: 'Attendance', icon: '⏰' },
                  { id: 'notifications', name: 'Notifications', icon: '🔔' },
                  { id: 'security', name: 'Security', icon: '🔒' }
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

              <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                        </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.timezone || 'UTC'}
                      >
                          <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Format
                        </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.dateFormat || 'MM/DD/YYYY'}
                      >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.currency || 'USD'}
                      >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              {/* Company Information */}
              {activeTab === 'company' && (
                  <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.companyName || ''}
                        placeholder="Enter company name"
                      />
                      </div>
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Email
                      </label>
                      <input 
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.companyEmail || ''}
                        placeholder="Enter company email"
                      />
                      </div>
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Phone
                      </label>
                      <input 
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.companyPhone || ''}
                        placeholder="Enter company phone"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Address
                      </label>
                      <textarea 
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.companyAddress || ''}
                        placeholder="Enter company address"
                      />
                    </div>
                    </div>
                  </div>
                )}

              {/* Working Hours */}
              {activeTab === 'working-hours' && (
                  <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Working Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                        </label>
                      <input 
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.workingHours?.start || '09:00'}
                      />
                      </div>
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input 
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.workingHours?.end || '17:00'}
                      />
                        </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Working Days
                        </label>
                      <div className="grid grid-cols-7 gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <label key={day} className="flex items-center">
                            <input 
                              type="checkbox"
                              className="mr-2"
                              defaultChecked={settings.workingHours?.days?.includes(day) || (day !== 'Saturday' && day !== 'Sunday')}
                            />
                            <span className="text-sm">{day.slice(0, 3)}</span>
                        </label>
                        ))}
                      </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Leave Policy */}
              {activeTab === 'leave-policy' && (
                  <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Policy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Annual Leave (days)
                        </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.leaveSettings?.maxAnnualLeave || 20}
                        min="0"
                        max="365"
                      />
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Sick Leave (days)
                      </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.leaveSettings?.maxSickLeave || 10}
                        min="0"
                        max="365"
                      />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Personal Leave (days)
                        </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.leaveSettings?.maxPersonalLeave || 5}
                        min="0"
                        max="365"
                      />
                    </div>
                    </div>
                  </div>
                )}

              {/* Attendance Settings */}
              {activeTab === 'attendance' && (
                  <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Threshold (minutes)
                      </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.attendanceSettings?.lateThreshold || 15}
                        min="0"
                        max="120"
                      />
                          </div>
                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overtime Threshold (hours)
                      </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.attendanceSettings?.overtimeThreshold || 8}
                        min="0"
                        max="24"
                        step="0.5"
                      />
                          </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          defaultChecked={settings.attendanceSettings?.autoClockOut || true}
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Auto Clock Out</span>
                      </label>
                    </div>
                    </div>
                  </div>
                )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                  <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                    <div className="space-y-4">
                    <label className="flex items-center">
                      <input 
                        type="checkbox"
                        className="mr-2"
                        defaultChecked={settings.notificationSettings?.emailNotifications || true}
                      />
                      <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox"
                        className="mr-2"
                        defaultChecked={settings.notificationSettings?.smsNotifications || false}
                      />
                      <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox"
                        className="mr-2"
                        defaultChecked={settings.notificationSettings?.pushNotifications || true}
                      />
                      <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                        </label>
                      </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Min Length
                      </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.securitySettings?.passwordMinLength || 8}
                        min="6"
                        max="20"
                      />
                      </div>
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (hours)
                      </label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={settings.securitySettings?.sessionTimeout || 24}
                        min="1"
                        max="168"
                      />
                        </div>
                    <div className="md:col-span-2 space-y-4">
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          defaultChecked={settings.securitySettings?.passwordRequireSpecial || true}
                        />
                        <span className="text-sm font-medium text-gray-700">Require Special Characters in Password</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          defaultChecked={settings.securitySettings?.twoFactorAuth || false}
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Change Password Section */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Change Password</h4>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Change Password
                  </button>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={() => {
                    // Collect form data and save
                    toast.success('Settings saved successfully')
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export default Settings