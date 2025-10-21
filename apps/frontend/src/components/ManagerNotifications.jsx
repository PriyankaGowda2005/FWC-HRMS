import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import socketClient from '../services/socketClient'

const ManagerNotifications = ({ managerId }) => {
  const [notifications, setNotifications] = useState([])
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Socket connection management
  useEffect(() => {
    const handleSocketConnected = () => {
      setIsSocketConnected(true)
    }

    const handleSocketDisconnected = () => {
      setIsSocketConnected(false)
    }

    const handleNotification = (data) => {
      const newNotification = {
        id: Date.now(),
        type: data.type,
        title: getNotificationTitle(data.type),
        message: getNotificationMessage(data.type, data.data),
        timestamp: new Date().toISOString(),
        read: false,
        data: data.data
      }

      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)

      // Show toast notification
      toast.success(newNotification.message, {
        duration: 4000,
        position: 'top-right'
      })
    }

    const handleLeaveDecision = (data) => {
      const notification = {
        id: Date.now(),
        type: 'leave_decision',
        title: 'Leave Request Processed',
        message: `Leave request for ${data.employeeName} has been ${data.status.toLowerCase()}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: data
      }

      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    const handleAttendanceUpdate = (data) => {
      const notification = {
        id: Date.now(),
        type: 'attendance_update',
        title: 'Attendance Update',
        message: `${data.employeeName} clocked ${data.type.toLowerCase()} at ${new Date(data.timestamp).toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: data
      }

      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    const handlePerformanceUpdate = (data) => {
      const notification = {
        id: Date.now(),
        type: 'performance_update',
        title: 'Performance Review Update',
        message: `Performance review for ${data.employeeName} has been completed`,
        timestamp: new Date().toISOString(),
        read: false,
        data: data
      }

      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    // Register event listeners
    socketClient.on('socket:connected', handleSocketConnected)
    socketClient.on('socket:disconnected', handleSocketDisconnected)
    socketClient.on('notification', handleNotification)
    socketClient.on('leave:decision', handleLeaveDecision)
    socketClient.on('attendance:clocked', handleAttendanceUpdate)
    socketClient.on('performance:review_created', handlePerformanceUpdate)

    return () => {
      socketClient.off('socket:connected', handleSocketConnected)
      socketClient.off('socket:disconnected', handleSocketDisconnected)
      socketClient.off('notification', handleNotification)
      socketClient.off('leave:decision', handleLeaveDecision)
      socketClient.off('attendance:clocked', handleAttendanceUpdate)
      socketClient.off('performance:review_created', handlePerformanceUpdate)
    }
  }, [])

  const getNotificationTitle = (type) => {
    const titles = {
      'leave:applied': 'New Leave Request',
      'attendance:clocked': 'Attendance Update',
      'performance:review_created': 'Performance Review',
      'team:member_updated': 'Team Update',
      'leave:decision': 'Leave Decision',
      'attendance_update': 'Attendance Update',
      'performance_update': 'Performance Update'
    }
    return titles[type] || 'Notification'
  }

  const getNotificationMessage = (type, data) => {
    switch (type) {
      case 'leave:applied':
        return `${data.employeeName} has applied for ${data.leaveType} leave from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`
      case 'attendance:clocked':
        return `${data.employeeName} clocked ${data.type.toLowerCase()} at ${new Date(data.timestamp).toLocaleTimeString()}`
      case 'performance:review_created':
        return `New performance review has been created for ${data.employeeName}`
      case 'team:member_updated':
        return `Team member ${data.memberName} has been updated`
      default:
        return 'You have a new notification'
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave:applied':
      case 'leave:decision':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'attendance:clocked':
      case 'attendance_update':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'performance:review_created':
      case 'performance_update':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
          </svg>
        )
    }
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return notificationTime.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-600">Stay updated with your team activities</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isSocketConnected ? 'Live updates' : 'Offline'}
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex space-x-2 mt-4">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
            <button
              onClick={clearAllNotifications}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">You'll see team updates and important alerts here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm mt-1 ${
                      !notification.read ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Real-time notifications powered by Socket.IO
          </p>
        </div>
      )}
    </div>
  )
}

export default ManagerNotifications


