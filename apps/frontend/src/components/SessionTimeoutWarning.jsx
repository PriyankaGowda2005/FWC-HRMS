import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'

const SessionTimeoutWarning = () => {
  const { user, isAutoLoggingOut, extendSession, getTimeUntilLogout, INACTIVITY_TIMEOUT } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!user || isAutoLoggingOut) {
      setShowWarning(false)
      setIsVisible(false)
      return
    }

    const checkTimeRemaining = () => {
      const remaining = getTimeUntilLogout()
      const warningThreshold = 5 * 60 * 1000 // 5 minutes
      
      if (remaining <= warningThreshold && remaining > 0) {
        setTimeRemaining(remaining)
        setShowWarning(true)
        setIsVisible(true)
      } else {
        setShowWarning(false)
        setIsVisible(false)
      }
    }

    // Check immediately
    checkTimeRemaining()

    // Check every 30 seconds
    const interval = setInterval(checkTimeRemaining, 30000)

    return () => clearInterval(interval)
  }, [user, isAutoLoggingOut, getTimeUntilLogout])

  const handleExtendSession = () => {
    extendSession()
    setShowWarning(false)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setShowWarning(false)
    setIsVisible(false)
  }

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isVisible || !showWarning) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Timeout Warning
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You will be automatically logged out in{' '}
                <span className="font-semibold">{formatTime(timeRemaining)}</span>{' '}
                due to inactivity.
              </p>
            </div>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleExtendSession}
                className="bg-yellow-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white text-yellow-600 text-xs font-medium px-3 py-1.5 rounded-md border border-yellow-300 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="bg-yellow-50 rounded-md inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionTimeoutWarning
