import React, { useState, useEffect } from 'react'
import { testAPI } from '../services/api'

const BackendStatus = () => {
  const [status, setStatus] = useState('checking')
  const [lastChecked, setLastChecked] = useState(null)

  const checkBackendStatus = async () => {
    try {
      const response = await testAPI.healthCheck()
      setStatus('online')
      setLastChecked(new Date())
    } catch (error) {
      setStatus('offline')
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkBackendStatus()
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-yellow-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Backend Online'
      case 'offline': return 'Backend Offline'
      default: return 'Checking...'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span className="text-xs text-gray-500">{getStatusText()}</span>
      {lastChecked && (
        <span className="text-xs text-gray-400">
          ({lastChecked.toLocaleTimeString()})
        </span>
      )}
      <button
        onClick={checkBackendStatus}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Refresh
      </button>
    </div>
  )
}

export default BackendStatus