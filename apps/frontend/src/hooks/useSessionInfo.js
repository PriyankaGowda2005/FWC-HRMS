import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'

export const useSessionInfo = () => {
  const { user, getTimeUntilLogout, INACTIVITY_TIMEOUT, SESSION_TIMEOUT } = useAuth()
  const [timeUntilLogout, setTimeUntilLogout] = useState(0)
  const [sessionProgress, setSessionProgress] = useState(0)

  useEffect(() => {
    if (!user) {
      setTimeUntilLogout(0)
      setSessionProgress(0)
      return
    }

    const updateSessionInfo = () => {
      const remaining = getTimeUntilLogout()
      setTimeUntilLogout(remaining)
      
      // Calculate session progress (0-100%)
      const progress = ((INACTIVITY_TIMEOUT - remaining) / INACTIVITY_TIMEOUT) * 100
      setSessionProgress(Math.max(0, Math.min(100, progress)))
    }

    // Update immediately
    updateSessionInfo()

    // Update every 30 seconds
    const interval = setInterval(updateSessionInfo, 30000)

    return () => clearInterval(interval)
  }, [user, getTimeUntilLogout, INACTIVITY_TIMEOUT])

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getSessionStatus = () => {
    if (!user) return 'inactive'
    
    const warningThreshold = 5 * 60 * 1000 // 5 minutes
    const criticalThreshold = 2 * 60 * 1000 // 2 minutes
    
    if (timeUntilLogout <= criticalThreshold) return 'critical'
    if (timeUntilLogout <= warningThreshold) return 'warning'
    return 'active'
  }

  return {
    timeUntilLogout,
    sessionProgress,
    formatTime,
    getSessionStatus,
    isActive: !!user,
    INACTIVITY_TIMEOUT,
    SESSION_TIMEOUT
  }
}
