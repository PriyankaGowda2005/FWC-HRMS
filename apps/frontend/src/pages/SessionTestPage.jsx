import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSessionInfo } from '../hooks/useSessionInfo'
import SessionIndicator from '../components/SessionIndicator'
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const SessionTestPage = () => {
  const { user, logout, extendSession, isAutoLoggingOut } = useAuth()
  const { timeUntilLogout, sessionProgress, formatTime, getSessionStatus, INACTIVITY_TIMEOUT } = useSessionInfo()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Test Page</h1>
          <p className="text-gray-600">Please log in to test the automatic logout functionality.</p>
        </div>
      </div>
    )
  }

  const status = getSessionStatus()
  
  const getStatusIcon = () => {
    switch (status) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Session Management Test</h1>
            <SessionIndicator showTime={true} showProgress={true} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Session Status */}
            <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
              <div className="flex items-center mb-2">
                {getStatusIcon()}
                <h3 className="text-lg font-semibold ml-2">Session Status</h3>
              </div>
              <p className="text-sm text-gray-600 capitalize">{status}</p>
            </div>

            {/* Time Remaining */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <ClockIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold ml-2">Time Remaining</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatTime(timeUntilLogout)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Session Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  status === 'critical' ? 'bg-red-500' : 
                  status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${sessionProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">{sessionProgress.toFixed(1)}% of inactivity timeout used</p>
          </div>

          {/* Configuration Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold mb-2">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Inactivity Timeout:</span>
                <span className="ml-2">{formatTime(INACTIVITY_TIMEOUT)}</span>
              </div>
              <div>
                <span className="font-medium">Auto Logout Status:</span>
                <span className={`ml-2 ${isAutoLoggingOut ? 'text-red-600' : 'text-green-600'}`}>
                  {isAutoLoggingOut ? 'Logging out...' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={extendSession}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Extend Session
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Manual Logout
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stop interacting with the page to trigger inactivity detection</li>
              <li>• You'll see a warning 5 minutes before automatic logout</li>
              <li>• The session will automatically expire after 30 minutes of inactivity</li>
              <li>• Click "Extend Session" to reset the inactivity timer</li>
              <li>• The progress bar shows how much of the inactivity timeout has been used</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionTestPage
