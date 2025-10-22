import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { settingsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const SystemSettings = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch system settings
  const { data: settingsData, isLoading, error } = useQuery(
    'system-settings',
    () => settingsAPI.getSettings(),
    {
      keepPreviousData: true,
    }
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    ({ category, settings }) => settingsAPI.updateSettings(category, settings),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully')
        queryClient.invalidateQueries('system-settings')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update settings')
      }
    }
  )

  const handleSaveSettings = async (category, settings) => {
    setIsSaving(true)
    try {
      await updateSettingsMutation.mutateAsync({ category, settings })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading settings</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const settings = settingsData?.settings || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            System Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure system-wide settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', name: 'General', icon: '⚙️' },
            { id: 'company', name: 'Company', icon: '🏢' },
            { id: 'email', name: 'Email', icon: '📧' },
            { id: 'security', name: 'Security', icon: '🔒' },
            { id: 'notifications', name: 'Notifications', icon: '🔔' },
            { id: 'integrations', name: 'Integrations', icon: '🔗' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

      {/* General Settings */}
      {activeTab === 'general' && (
        <GeneralSettings 
          settings={settings.general || {}} 
          onSave={(settings) => handleSaveSettings('general', settings)}
          isSaving={isSaving}
        />
      )}

      {/* Company Settings */}
      {activeTab === 'company' && (
        <CompanySettings 
          settings={settings.company || {}} 
          onSave={(settings) => handleSaveSettings('company', settings)}
          isSaving={isSaving}
        />
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <EmailSettings 
          settings={settings.email || {}} 
          onSave={(settings) => handleSaveSettings('email', settings)}
          isSaving={isSaving}
        />
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <SecuritySettings 
          settings={settings.security || {}} 
          onSave={(settings) => handleSaveSettings('security', settings)}
          isSaving={isSaving}
        />
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <NotificationSettings 
          settings={settings.notifications || {}} 
          onSave={(settings) => handleSaveSettings('notifications', settings)}
          isSaving={isSaving}
        />
      )}

      {/* Integration Settings */}
      {activeTab === 'integrations' && (
        <IntegrationSettings 
          settings={settings.integrations || {}} 
          onSave={(settings) => handleSaveSettings('integrations', settings)}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

// General Settings Component
const GeneralSettings = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    systemName: settings.systemName || 'FWC HRMS',
    timezone: settings.timezone || 'UTC',
    dateFormat: settings.dateFormat || 'MM/DD/YYYY',
    timeFormat: settings.timeFormat || '12',
    language: settings.language || 'en',
    currency: settings.currency || 'USD',
    workingDays: settings.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHours: settings.workingHours || { start: '09:00', end: '17:00' }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleWorkingDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }))
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Name
            </label>
            <input
              type="text"
              name="systemName"
              value={formData.systemName}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              name="dateFormat"
              value={formData.dateFormat}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              name="timeFormat"
              value={formData.timeFormat}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="12">12 Hour (AM/PM)</option>
              <option value="24">24 Hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Days
          </label>
          <div className="flex flex-wrap gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.workingDays.includes(day)}
                  onChange={() => handleWorkingDayChange(day)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Hours Start
            </label>
            <input
              type="time"
              value={formData.workingHours.start}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                workingHours: { ...prev.workingHours, start: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Working Hours End
            </label>
            <input
              type="time"
              value={formData.workingHours.end}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                workingHours: { ...prev.workingHours, end: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Company Settings Component
const CompanySettings = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    companyName: settings.companyName || '',
    companyAddress: settings.companyAddress || '',
    companyPhone: settings.companyPhone || '',
    companyEmail: settings.companyEmail || '',
    companyWebsite: settings.companyWebsite || '',
    taxId: settings.taxId || '',
    registrationNumber: settings.registrationNumber || '',
    industry: settings.industry || '',
    companySize: settings.companySize || '',
    foundedYear: settings.foundedYear || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Company Information</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Phone
            </label>
            <input
              type="tel"
              name="companyPhone"
              value={formData.companyPhone}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Email
            </label>
            <input
              type="email"
              name="companyEmail"
              value={formData.companyEmail}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Size
            </label>
            <select
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Founded Year
            </label>
            <input
              type="number"
              name="foundedYear"
              value={formData.foundedYear}
              onChange={handleChange}
              min="1800"
              max={new Date().getFullYear()}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Address
          </label>
          <textarea
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleChange}
            rows={3}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Email Settings Component
const EmailSettings = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    smtpHost: settings.smtpHost || '',
    smtpPort: settings.smtpPort || 587,
    smtpUsername: settings.smtpUsername || '',
    smtpPassword: settings.smtpPassword || '',
    smtpSecure: settings.smtpSecure || false,
    fromEmail: settings.fromEmail || '',
    fromName: settings.fromName || '',
    emailNotifications: settings.emailNotifications || true,
    autoEmailReports: settings.autoEmailReports || false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }))
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Email Configuration</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              name="smtpHost"
              value={formData.smtpHost}
              onChange={handleChange}
              placeholder="smtp.gmail.com"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              name="smtpPort"
              value={formData.smtpPort}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              name="smtpUsername"
              value={formData.smtpUsername}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              name="smtpPassword"
              value={formData.smtpPassword}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Email
            </label>
            <input
              type="email"
              name="fromEmail"
              value={formData.fromEmail}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <input
              type="text"
              name="fromName"
              value={formData.fromName}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="smtpSecure"
              checked={formData.smtpSecure}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Use SSL/TLS
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable Email Notifications
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="autoEmailReports"
              checked={formData.autoEmailReports}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Auto-send Reports via Email
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Security Settings Component
const SecuritySettings = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    passwordMinLength: settings.passwordMinLength || 8,
    passwordRequireUppercase: settings.passwordRequireUppercase || true,
    passwordRequireLowercase: settings.passwordRequireLowercase || true,
    passwordRequireNumbers: settings.passwordRequireNumbers || true,
    passwordRequireSymbols: settings.passwordRequireSymbols || false,
    sessionTimeout: settings.sessionTimeout || 30,
    twoFactorAuth: settings.twoFactorAuth || false,
    loginAttempts: settings.loginAttempts || 5,
    accountLockout: settings.accountLockout || 15,
    ipWhitelist: settings.ipWhitelist || '',
    auditLogging: settings.auditLogging || true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }))
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Password Policy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Password Length
              </label>
              <input
                type="number"
                name="passwordMinLength"
                value={formData.passwordMinLength}
                onChange={handleChange}
                min="6"
                max="32"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="sessionTimeout"
                value={formData.sessionTimeout}
                onChange={handleChange}
                min="5"
                max="480"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="passwordRequireUppercase"
                checked={formData.passwordRequireUppercase}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Require Uppercase Letters
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="passwordRequireLowercase"
                checked={formData.passwordRequireLowercase}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Require Lowercase Letters
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="passwordRequireNumbers"
                checked={formData.passwordRequireNumbers}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Require Numbers
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="passwordRequireSymbols"
                checked={formData.passwordRequireSymbols}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Require Special Characters
              </label>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Access Control</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                name="loginAttempts"
                value={formData.loginAttempts}
                onChange={handleChange}
                min="3"
                max="10"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Lockout Duration (minutes)
              </label>
              <input
                type="number"
                name="accountLockout"
                value={formData.accountLockout}
                onChange={handleChange}
                min="5"
                max="60"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="twoFactorAuth"
                checked={formData.twoFactorAuth}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable Two-Factor Authentication
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="auditLogging"
                checked={formData.auditLogging}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable Audit Logging
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IP Whitelist (comma-separated)
          </label>
          <textarea
            name="ipWhitelist"
            value={formData.ipWhitelist}
            onChange={handleChange}
            rows={3}
            placeholder="192.168.1.1, 10.0.0.1"
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Notification Settings Component
const NotificationSettings = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    emailNotifications: settings.emailNotifications || true,
    pushNotifications: settings.pushNotifications || true,
    smsNotifications: settings.smsNotifications || false,
    leaveNotifications: settings.leaveNotifications || true,
    attendanceNotifications: settings.attendanceNotifications || true,
    payrollNotifications: settings.payrollNotifications || true,
    performanceNotifications: settings.performanceNotifications || true,
    systemNotifications: settings.systemNotifications || true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Notification Channels</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Email Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="pushNotifications"
                checked={formData.pushNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Push Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={formData.smsNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                SMS Notifications
              </label>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Notification Types</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="leaveNotifications"
                checked={formData.leaveNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Leave Request Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="attendanceNotifications"
                checked={formData.attendanceNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Attendance Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="payrollNotifications"
                checked={formData.payrollNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Payroll Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="performanceNotifications"
                checked={formData.performanceNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Performance Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="systemNotifications"
                checked={formData.systemNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                System Notifications
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Integration Settings Component
const IntegrationSettings = ({ settings, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    googleCalendar: settings.googleCalendar || false,
    googleCalendarApiKey: settings.googleCalendarApiKey || '',
    slackIntegration: settings.slackIntegration || false,
    slackWebhookUrl: settings.slackWebhookUrl || '',
    zoomIntegration: settings.zoomIntegration || false,
    zoomApiKey: settings.zoomApiKey || '',
    zoomApiSecret: settings.zoomApiSecret || '',
    ldapIntegration: settings.ldapIntegration || false,
    ldapServer: settings.ldapServer || '',
    ldapPort: settings.ldapPort || 389
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }))
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Integration Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Google Calendar</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="googleCalendar"
                checked={formData.googleCalendar}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable Google Calendar Integration
              </label>
            </div>

            {formData.googleCalendar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Calendar API Key
                </label>
                <input
                  type="text"
                  name="googleCalendarApiKey"
                  value={formData.googleCalendarApiKey}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Slack</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="slackIntegration"
                checked={formData.slackIntegration}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable Slack Integration
              </label>
            </div>

            {formData.slackIntegration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slack Webhook URL
                </label>
                <input
                  type="url"
                  name="slackWebhookUrl"
                  value={formData.slackWebhookUrl}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Zoom</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="zoomIntegration"
                checked={formData.zoomIntegration}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable Zoom Integration
              </label>
            </div>

            {formData.zoomIntegration && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom API Key
                  </label>
                  <input
                    type="text"
                    name="zoomApiKey"
                    value={formData.zoomApiKey}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom API Secret
                  </label>
                  <input
                    type="password"
                    name="zoomApiSecret"
                    value={formData.zoomApiSecret}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">LDAP</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="ldapIntegration"
                checked={formData.ldapIntegration}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable LDAP Integration
              </label>
            </div>

            {formData.ldapIntegration && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LDAP Server
                  </label>
                  <input
                    type="text"
                    name="ldapServer"
                    value={formData.ldapServer}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LDAP Port
                  </label>
                  <input
                    type="number"
                    name="ldapPort"
                    value={formData.ldapPort}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SystemSettings
