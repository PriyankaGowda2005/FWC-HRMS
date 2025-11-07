import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Real-time data indicator component
 * Shows when data was last updated and provides refresh functionality
 */
const RealTimeDataIndicator = ({ lastUpdated, onRefresh, autoRefresh = false, refreshInterval = 30000 }) => {
  const [timeAgo, setTimeAgo] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update time ago display
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) {
        setTimeAgo('Never')
        return
      }

      const now = new Date()
      const updated = new Date(lastUpdated)
      const diff = now - updated
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (seconds < 10) {
        setTimeAgo('Just now')
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`)
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`)
      } else {
        setTimeAgo(`${hours}h ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        handleRefresh()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, onRefresh])

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className="flex items-center space-x-1">
        <motion.div
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs">Live</span>
      </div>
      <span className="text-gray-400">•</span>
      <span className="text-xs">Updated {timeAgo}</span>
      {onRefresh && (
        <>
          <span className="text-gray-400">•</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-blue-600 hover:text-blue-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}

export default RealTimeDataIndicator

