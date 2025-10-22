import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const AnalyticsTab = ({ jobPostings, candidates, insights }) => {
  // Calculate analytics data
  const analytics = {
    totalJobs: jobPostings.length,
    activeJobs: jobPostings.filter(job => job.status === 'PUBLISHED').length,
    totalCandidates: candidates.length,
    hiredCandidates: candidates.filter(c => c.status === 'HIRED').length,
    rejectedCandidates: candidates.filter(c => c.status === 'REJECTED').length,
    pendingCandidates: candidates.filter(c => ['APPLIED', 'INTERVIEW_SCHEDULED'].includes(c.status)).length,
    averageRating: candidates.length > 0 ? 
      (candidates.reduce((sum, c) => sum + (c.rating || 0), 0) / candidates.length).toFixed(1) : 0,
    applicationsThisMonth: candidates.filter(c => {
      const appliedDate = new Date(c.appliedDate || c.appliedAt)
      const now = new Date()
      return appliedDate.getMonth() === now.getMonth() && appliedDate.getFullYear() === now.getFullYear()
    }).length
  }

  // Mock chart data for demonstration
  const chartData = {
    applicationsOverTime: [
      { month: 'Jan', applications: 12 },
      { month: 'Feb', applications: 18 },
      { month: 'Mar', applications: 15 },
      { month: 'Apr', applications: 22 },
      { month: 'May', applications: 28 },
      { month: 'Jun', applications: analytics.applicationsThisMonth }
    ],
    departmentBreakdown: jobPostings.reduce((acc, job) => {
      acc[job.department] = (acc[job.department] || 0) + 1
      return acc
    }, {}),
    statusDistribution: {
      'Applied': analytics.pendingCandidates,
      'Hired': analytics.hiredCandidates,
      'Rejected': analytics.rejectedCandidates
    }
  }

  const SimpleBarChart = ({ data, title, color = 'blue' }) => {
    const maxValue = Math.max(...Object.values(data))
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 truncate">{key}</div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm text-gray-900 text-right">{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const LineChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.applications))
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="bg-blue-500 rounded-t w-full transition-all duration-500"
                style={{ height: `${(item.applications / maxValue) * 180}px` }}
              />
              <div className="text-xs text-gray-600 mt-2">{item.month}</div>
              <div className="text-xs text-gray-900 font-medium">{item.applications}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <motion.div
      className="bg-white rounded-lg border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon className={`w-8 h-8 text-${color}-500`} />
          {trend && (
            <div className={`flex items-center text-sm ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Jobs"
          value={analytics.totalJobs}
          icon={ChartBarIcon}
          trend={15}
          color="blue"
        />
        <MetricCard
          title="Active Jobs"
          value={analytics.activeJobs}
          icon={CalendarIcon}
          trend={8}
          color="green"
        />
        <MetricCard
          title="Total Candidates"
          value={analytics.totalCandidates}
          icon={UsersIcon}
          trend={22}
          color="purple"
        />
        <MetricCard
          title="Hire Rate"
          value={`${analytics.totalCandidates > 0 ? ((analytics.hiredCandidates / analytics.totalCandidates) * 100).toFixed(1) : 0}%`}
          icon={CheckCircleIcon}
          trend={5}
          color="emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart 
          data={chartData.applicationsOverTime} 
          title="Applications Over Time" 
        />
        <SimpleBarChart 
          data={chartData.statusDistribution} 
          title="Candidate Status Distribution" 
          color="green"
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart 
          data={chartData.departmentBreakdown} 
          title="Jobs by Department" 
          color="purple"
        />
        
        {/* AI Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Top Skills Demand</span>
              </div>
              <span className="text-sm text-blue-700">JavaScript, React, Python</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Hiring Trends</span>
              </div>
              <span className="text-sm text-green-700">+15% vs last month</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Avg. Time to Hire</span>
              </div>
              <span className="text-sm text-purple-700">21 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.hiredCandidates}</div>
            <div className="text-sm text-gray-600">Hired This Period</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{analytics.averageRating}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analytics.applicationsThisMonth}</div>
            <div className="text-sm text-gray-600">Applications This Month</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Optimize Job Descriptions</h4>
              <p className="text-sm text-gray-600">Improve visibility and attract better candidates</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Enhance Employer Branding</h4>
              <p className="text-sm text-gray-600">Build stronger presence on social media</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Implement Referral Programs</h4>
              <p className="text-sm text-gray-600">Leverage employee networks for quality hires</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Improve Interview Process</h4>
              <p className="text-sm text-gray-600">Streamline candidate experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab
