// Responsive Dashboard Component with mobile-first design
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import ResponsiveCard from './ResponsiveLayout'
import ResponsiveGrid from './ResponsiveLayout'

const ResponsiveDashboard = ({ 
  user,
  stats = {},
  recentActivities = [],
  notifications = [],
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Default stats if none provided
  const defaultStats = {
    totalEmployees: 0,
    attendanceRate: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
    ...stats
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: defaultStats.totalEmployees,
      icon: UserGroupIcon,
      color: 'blue',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Attendance Rate',
      value: `${defaultStats.attendanceRate}%`,
      icon: ClockIcon,
      color: 'green',
      change: '+2%',
      changeType: 'positive'
    },
    {
      title: 'Pending Leaves',
      value: defaultStats.pendingLeaves,
      icon: CalendarDaysIcon,
      color: 'yellow',
      change: '-3',
      changeType: 'negative'
    },
    {
      title: 'Monthly Payroll',
      value: `$${defaultStats.monthlyPayroll?.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'purple',
      change: '+8%',
      changeType: 'positive'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-primary-100">
              Here's what's happening with your HR management today.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-right">
              <p className="text-sm text-primary-200">Current Time</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ResponsiveCard className="hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'positive' ? (
                        <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </ResponsiveCard>
            </motion.div>
          )
        })}
      </ResponsiveGrid>

      {/* Main Content Grid */}
      <ResponsiveGrid cols={{ mobile: 1, desktop: 2 }} gap="gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ResponsiveCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getColorClasses(activity.color)}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </ResponsiveCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ResponsiveCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Mark All Read
              </button>
            </div>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      notification.type === 'urgent' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          </ResponsiveCard>
        </motion.div>
      </ResponsiveGrid>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <ResponsiveCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <ResponsiveGrid cols={{ mobile: 2, tablet: 4, desktop: 4 }} gap="gap-4">
            {[
              { name: 'Clock In/Out', icon: ClockIcon, href: '/attendance', color: 'blue' },
              { name: 'Apply Leave', icon: CalendarDaysIcon, href: '/leave', color: 'green' },
              { name: 'View Payroll', icon: CurrencyDollarIcon, href: '/payroll', color: 'purple' },
              { name: 'Generate Report', icon: ChartBarIcon, href: '/reports', color: 'yellow' }
            ].map((action, index) => {
              const Icon = action.icon
              return (
                <motion.a
                  key={action.name}
                  href={action.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200
                    hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200
                    ${className}
                  `}
                >
                  <div className={`p-3 rounded-lg ${getColorClasses(action.color)} mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {action.name}
                  </span>
                </motion.a>
              )
            })}
          </ResponsiveGrid>
        </ResponsiveCard>
      </motion.div>

      {/* Charts Section - Hidden on mobile for better performance */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ResponsiveCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Analytics Overview</h2>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Charts will be rendered here</p>
                <p className="text-sm text-gray-400">Integration with Recharts coming soon</p>
              </div>
            </div>
          </ResponsiveCard>
        </motion.div>
      )}
    </div>
  )
}

export default ResponsiveDashboard
