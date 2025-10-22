import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { performanceAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

const EmployeePerformance = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch employee's performance reviews
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError } = useQuery(
    ['employee-performance-reviews', user?.id],
    () => performanceAPI.getReviews({ employeeId: user?.id }),
    {
      enabled: !!user?.id,
      keepPreviousData: true,
    }
  )

  // Fetch employee's performance goals
  const { data: goalsData, isLoading: goalsLoading, error: goalsError } = useQuery(
    ['employee-performance-goals', user?.id],
    () => performanceAPI.getPerformanceGoals({ employeeId: user?.id }),
    {
      enabled: !!user?.id,
      keepPreviousData: true,
    }
  )

  // Fetch performance statistics
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['employee-performance-stats', user?.id],
    () => performanceAPI.getStats({ 
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      endDate: new Date().toISOString()
    }),
    {
      enabled: !!user?.id,
      keepPreviousData: true,
    }
  )

  // Navigation handlers for quick actions
  const handleUpdateProfile = () => {
    navigate('/employee/profile')
  }

  const handleViewPayroll = () => {
    navigate('/employee/payroll')
  }

  const handleRequestLeave = () => {
    navigate('/leave')
  }

  const isLoading = reviewsLoading || goalsLoading || statsLoading
  const error = reviewsError || goalsError

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading performance data</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const reviews = reviewsData?.reviews || []
  const goals = goalsData?.goals || []
  const stats = statsData?.stats || {}

  // Add sample data if no real data exists
  const sampleReviews = reviews.length === 0 ? [
    {
      id: '1',
      reviewPeriod: 'Q4 2025',
      overallRating: 4.2,
      status: 'COMPLETED',
      reviewDate: new Date('2025-10-15'),
      reviewer: {
        firstName: 'Manager',
        lastName: 'Name'
      },
      goals: [
        {
          goal: 'Complete project deliverables',
          rating: 4,
          comments: 'Met all project deadlines'
        },
        {
          goal: 'Improve code quality',
          rating: 5,
          comments: 'Excellent code reviews and documentation'
        },
        {
          goal: 'Team collaboration',
          rating: 4,
          comments: 'Good team player, helps colleagues'
        }
      ],
      strengths: ['Technical skills', 'Problem solving', 'Teamwork'],
      areasForImprovement: ['Time management', 'Communication'],
      comments: 'Overall good performance, keep up the good work!'
    },
    {
      id: '2',
      reviewPeriod: 'Q3 2025',
      overallRating: 3.8,
      status: 'COMPLETED',
      reviewDate: new Date('2025-07-15'),
      reviewer: {
        firstName: 'Manager',
        lastName: 'Name'
      },
      goals: [
        {
          goal: 'Learn new technologies',
          rating: 4,
          comments: 'Successfully learned React and Node.js'
        },
        {
          goal: 'Improve documentation',
          rating: 3,
          comments: 'Good progress, needs more detail'
        }
      ],
      strengths: ['Learning ability', 'Technical skills'],
      areasForImprovement: ['Documentation', 'Time management'],
      comments: 'Good progress, continue learning new technologies.'
    }
  ] : reviews

  const sampleGoals = goals.length === 0 ? [
    {
      id: '1',
      title: 'Complete Advanced React Course',
      description: 'Finish the complete React course and build a portfolio project',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2025-12-31'),
      progress: 65,
      createdAt: new Date('2025-10-01')
    },
    {
      id: '2',
      title: 'Improve Code Review Skills',
      description: 'Participate in more code reviews and provide constructive feedback',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date('2025-11-30'),
      progress: 40,
      createdAt: new Date('2025-09-15')
    },
    {
      id: '3',
      title: 'Lead a Team Project',
      description: 'Take leadership role in the upcoming Q1 project',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date('2026-03-31'),
      progress: 0,
      createdAt: new Date('2025-10-15')
    },
    {
      id: '4',
      title: 'Complete AWS Certification',
      description: 'Obtain AWS Solutions Architect certification',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date('2025-09-30'),
      progress: 100,
      createdAt: new Date('2025-08-01')
    }
  ] : goals

  // Calculate performance metrics
  const avgRating = sampleReviews.length > 0 
    ? sampleReviews.reduce((sum, review) => sum + review.overallRating, 0) / sampleReviews.length 
    : 0

  const completedGoals = sampleGoals.filter(goal => goal.status === 'COMPLETED').length
  const inProgressGoals = sampleGoals.filter(goal => goal.status === 'IN_PROGRESS').length
  const pendingGoals = sampleGoals.filter(goal => goal.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Performance
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Track your performance reviews, goals, and achievements
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Rating</p>
            <p className="text-2xl font-bold text-blue-600">{avgRating.toFixed(1)}/5.0</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Average Rating</h3>
              <p className="text-3xl font-bold text-blue-600">{avgRating.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Out of 5.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Completed Goals</h3>
              <p className="text-3xl font-bold text-green-600">{completedGoals}</p>
              <p className="text-sm text-gray-500">This year</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-600">{inProgressGoals}</p>
              <p className="text-sm text-gray-500">Active goals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Reviews</h3>
              <p className="text-3xl font-bold text-purple-600">{sampleReviews.length}</p>
              <p className="text-sm text-gray-500">All time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={handleUpdateProfile}
            className="flex items-center justify-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium text-green-900">Update Profile</span>
          </button>
          
          <button 
            onClick={handleViewPayroll}
            className="flex items-center justify-center space-x-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="font-medium text-yellow-900">View Payroll</span>
          </button>
          
          <button 
            onClick={handleRequestLeave}
            className="flex items-center justify-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-blue-900">Request Leave</span>
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <span className="font-medium text-purple-900">Dashboard</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Performance Overview
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Performance Reviews
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'goals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Goals & Objectives
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Performance Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trend */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trend</h3>
                  <div className="space-y-4">
                    {sampleReviews.map((review, index) => (
                      <div key={review.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{review.reviewPeriod}</p>
                          <p className="text-sm text-gray-500">{review.reviewDate.toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${(review.overallRating / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-lg font-bold text-gray-600">
                            {review.overallRating}/5
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Achievements</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Completed AWS Certification</p>
                        <p className="text-sm text-gray-500">September 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Exceeded Q3 Performance Goals</p>
                        <p className="text-sm text-gray-500">July 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Team Collaboration Award</p>
                        <p className="text-sm text-gray-500">June 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {sampleReviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{review.reviewPeriod}</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-600">
                        {review.overallRating}/5
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(review.overallRating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Goal Ratings</h4>
                      <div className="space-y-2">
                        {review.goals.map((goal, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{goal.goal}</span>
                            <span className="text-sm font-medium text-gray-900">{goal.rating}/5</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Strengths</h4>
                      <div className="space-y-1">
                        {review.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Manager Comments</h4>
                    <p className="text-sm text-gray-600">{review.comments}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {sampleGoals.map((goal) => (
                <div key={goal.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      goal.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      goal.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <p className="font-medium text-gray-900">{goal.priority}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-900">{goal.dueDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <p className="font-medium text-gray-900">{goal.progress}%</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeePerformance
