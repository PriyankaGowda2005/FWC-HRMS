import React from 'react'
import { useSessionInfo } from '../hooks/useSessionInfo'
import { ClockIcon } from '@heroicons/react/24/outline'

const SessionIndicator = ({ showTime = true, showProgress = false }) => {
  const { timeUntilLogout, sessionProgress, formatTime, getSessionStatus, isActive } = useSessionInfo()

  if (!isActive) return null

  const status = getSessionStatus()
  
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getProgressColor = () => {
    switch (status) {
      case 'critical':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor()}`}>
      <ClockIcon className="h-3 w-3 mr-1" />
      {showTime && (
        <span className="mr-2">
          {formatTime(timeUntilLogout)}
        </span>
      )}
      {showProgress && (
        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${sessionProgress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default SessionIndicator
