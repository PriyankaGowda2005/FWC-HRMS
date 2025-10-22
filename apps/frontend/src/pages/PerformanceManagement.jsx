import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { performanceAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const PerformanceManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('reviews')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedReview, setSelectedReview] = useState(null)

  // Fetch performance reviews
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError } = useQuery(
    'performance-reviews',
    () => performanceAPI.getReviews(),
    {
      keepPreviousData: true,
    }
  )

  // Fetch performance goals
  const { data: goalsData, isLoading: goalsLoading, error: goalsError } = useQuery(
    'performance-goals',
    () => performanceAPI.getPerformanceGoals(),
    {
      keepPreviousData: true,
    }
  )

  // Fetch employees for managers
  const { data: employeesData, isLoading: employeesLoading } = useQuery(
    'employees',
    () => performanceAPI.getEmployees(),
    {
      enabled: user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN',
      keepPreviousData: true,
    }
  )

  // Create performance review mutation
  const createReviewMutation = useMutation(
    (data) => performanceAPI.createPerformanceReview(data),
    {
      onSuccess: () => {
        toast.success('Performance review created successfully')
        queryClient.invalidateQueries('performance-reviews')
        setShowReviewModal(false)
        setSelectedEmployee(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create performance review')
      }
    }
  )

  // Update performance review mutation
  const updateReviewMutation = useMutation(
    ({ id, data }) => performanceAPI.updatePerformanceReview(id, data),
    {
      onSuccess: () => {
        toast.success('Performance review updated successfully')
        queryClient.invalidateQueries('performance-reviews')
        setShowReviewModal(false)
        setSelectedReview(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update performance review')
      }
    }
  )

  // Create performance goal mutation
  const createGoalMutation = useMutation(
    (data) => performanceAPI.createPerformanceGoal(data),
    {
      onSuccess: () => {
        toast.success('Performance goal created successfully')
        queryClient.invalidateQueries('performance-goals')
        setShowGoalModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create performance goal')
      }
    }
  )

  // Update goal status mutation
  const updateGoalStatusMutation = useMutation(
    ({ id, status }) => performanceAPI.updateGoalStatus(id, status),
    {
      onSuccess: () => {
        toast.success('Goal status updated successfully')
        queryClient.invalidateQueries('performance-goals')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update goal status')
      }
    }
  )

  const handleCreateReview = (data) => {
    createReviewMutation.mutate(data)
  }

  const handleUpdateReview = (data) => {
    updateReviewMutation.mutate({ id: selectedReview._id, data })
  }

  const handleCreateGoal = (data) => {
    createGoalMutation.mutate(data)
  }

  const handleUpdateGoalStatus = (goalId, status) => {
    updateGoalStatusMutation.mutate({ id: goalId, status })
  }

  const handleEditReview = (review) => {
    setSelectedReview(review)
    setShowReviewModal(true)
  }

  const handleNewReview = (employee) => {
    setSelectedEmployee(employee)
    setShowReviewModal(true)
  }

  const isLoading = reviewsLoading || goalsLoading || employeesLoading
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
  const employees = employeesData?.employees || []

  // Filter data based on user role
  const filteredReviews = user?.role === 'EMPLOYEE' 
    ? reviews.filter(review => review.employeeId === user.employee?.id)
    : reviews

  const filteredGoals = user?.role === 'EMPLOYEE'
    ? goals.filter(goal => goal.employeeId === user.employee?.id)
    : goals

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Performance Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track employee performance reviews and goals
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          {(user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN') && (
            <>
              <button
                onClick={() => setShowReviewModal(true)}
                className="btn-primary"
              >
                New Review
              </button>
              <button
                onClick={() => setShowGoalModal(true)}
                className="btn-secondary"
              >
                Set Goal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Reviews</h3>
          <p className="text-3xl font-bold text-blue-600">{filteredReviews.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Reviews</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {filteredReviews.filter(r => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Active Goals</h3>
          <p className="text-3xl font-bold text-green-600">
            {filteredGoals.filter(g => g.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Completed Goals</h3>
          <p className="text-3xl font-bold text-purple-600">
            {filteredGoals.filter(g => g.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance Reviews
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'goals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance Goals
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employee Performance
          </button>
        </nav>
      </div>

      {/* Performance Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Performance Reviews</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => exportPerformanceReviews(filteredReviews)}
                className="btn-secondary"
                disabled={filteredReviews.length === 0}
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No performance reviews found
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-sm">
                                {review.employeeName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {review.employeeName}
                            </div>
                            <div className="text-sm text-gray-500">{review.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {review.reviewPeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.overallRating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {review.overallRating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          review.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {review.reviewerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN') && (
                          <>
                            <button
                              onClick={() => handleEditReview(review)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => exportPerformanceReview(review)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Export
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Goals Tab */}
      {activeTab === 'goals' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Performance Goals</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => exportPerformanceGoals(filteredGoals)}
                className="btn-secondary"
                disabled={filteredGoals.length === 0}
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGoals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No performance goals found
                    </td>
                  </tr>
                ) : (
                  filteredGoals.map((goal) => (
                    <tr key={goal._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-sm">
                                {goal.employeeName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {goal.employeeName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{goal.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${goal.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{goal.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          goal.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          goal.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          goal.status === 'NOT_STARTED' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {goal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN') && (
                          <select
                            value={goal.status}
                            onChange={(e) => handleUpdateGoalStatus(goal._id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Performance Tab */}
      {activeTab === 'employees' && (user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN') && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Employee Performance Overview</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => {
              const employeeReviews = reviews.filter(r => r.employeeId === employee._id)
              const employeeGoals = goals.filter(g => g.employeeId === employee._id)
              const avgRating = employeeReviews.length > 0 
                ? employeeReviews.reduce((sum, r) => sum + r.overallRating, 0) / employeeReviews.length
                : 0

              return (
                <div key={employee._id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-lg">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-lg font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{employee.designation}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Rating:</span>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgRating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {avgRating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reviews:</span>
                      <span className="text-sm text-gray-900">{employeeReviews.length}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Goals:</span>
                      <span className="text-sm text-gray-900">
                        {employeeGoals.filter(g => g.status === 'IN_PROGRESS').length}
                      </span>
                    </div>

                    <div className="pt-3">
                      <button
                        onClick={() => handleNewReview(employee)}
                        className="w-full text-sm bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                      >
                        New Review
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Performance Review Modal */}
      {showReviewModal && (
        <PerformanceReviewModal
          employee={selectedEmployee}
          review={selectedReview}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedEmployee(null)
            setSelectedReview(null)
          }}
          onSubmit={selectedReview ? handleUpdateReview : handleCreateReview}
          isLoading={createReviewMutation.isLoading || updateReviewMutation.isLoading}
        />
      )}

      {/* Performance Goal Modal */}
      {showGoalModal && (
        <PerformanceGoalModal
          onClose={() => setShowGoalModal(false)}
          onSubmit={handleCreateGoal}
          isLoading={createGoalMutation.isLoading}
        />
      )}
    </div>
  )
}

// Performance Review Modal Component
const PerformanceReviewModal = ({ employee, review, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    employeeId: employee?._id || review?.employeeId || '',
    reviewPeriod: review?.reviewPeriod || '',
    overallRating: review?.overallRating || 3,
    goalsRating: review?.goalsRating || 3,
    skillsRating: review?.skillsRating || 3,
    teamworkRating: review?.teamworkRating || 3,
    communicationRating: review?.communicationRating || 3,
    strengths: review?.strengths || '',
    areasForImprovement: review?.areasForImprovement || '',
    comments: review?.comments || '',
    status: review?.status || 'PENDING'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {review ? 'Edit Performance Review' : 'Create Performance Review'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Review Period *
                </label>
                <input
                  type="text"
                  name="reviewPeriod"
                  value={formData.reviewPeriod}
                  onChange={handleChange}
                  placeholder="e.g., Q1 2024"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Performance Ratings</h4>
              
              {[
                { name: 'overallRating', label: 'Overall Performance' },
                { name: 'goalsRating', label: 'Goal Achievement' },
                { name: 'skillsRating', label: 'Technical Skills' },
                { name: 'teamworkRating', label: 'Teamwork' },
                { name: 'communicationRating', label: 'Communication' }
              ].map(({ name, label }) => (
                <div key={name} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      min="1"
                      max="5"
                      className="w-16 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <span className="ml-2 text-sm text-gray-600">/5</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Strengths
              </label>
              <textarea
                name="strengths"
                value={formData.strengths}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Areas for Improvement
              </label>
              <textarea
                name="areasForImprovement"
                value={formData.areasForImprovement}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (review ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Performance Goal Modal Component
const PerformanceGoalModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    priority: 'MEDIUM',
    status: 'NOT_STARTED'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Set Performance Goal</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Goal Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Date *
              </label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Export functions
const exportPerformanceReviews = (reviews) => {
  try {
    const csvContent = generatePerformanceReviewsCSV(reviews)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `performance_reviews_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Performance reviews exported successfully')
  } catch (error) {
    toast.error('Failed to export performance reviews')
  }
}

const exportPerformanceGoals = (goals) => {
  try {
    const csvContent = generatePerformanceGoalsCSV(goals)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `performance_goals_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Performance goals exported successfully')
  } catch (error) {
    toast.error('Failed to export performance goals')
  }
}

const exportPerformanceReview = (review) => {
  try {
    const reportData = {
      employee: review.employeeName,
      reviewPeriod: review.reviewPeriod,
      ratings: {
        overall: review.overallRating,
        goals: review.goalsRating,
        skills: review.skillsRating,
        teamwork: review.teamworkRating,
        communication: review.communicationRating
      },
      strengths: review.strengths,
      areasForImprovement: review.areasForImprovement,
      comments: review.comments,
      status: review.status,
      reviewedBy: review.reviewerName,
      reviewDate: review.createdAt
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `performance_review_${review.employeeName.replace(/\s+/g, '_')}_${review.reviewPeriod.replace(/\s+/g, '_')}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Performance review exported successfully')
  } catch (error) {
    toast.error('Failed to export performance review')
  }
}

// Helper functions to generate CSV
const generatePerformanceReviewsCSV = (reviews) => {
  const headers = ['Employee', 'Review Period', 'Overall Rating', 'Goals Rating', 'Skills Rating', 'Teamwork Rating', 'Communication Rating', 'Status', 'Reviewed By', 'Review Date']
  const csvRows = [headers.join(',')]
  
  reviews.forEach(review => {
    const row = [
      review.employeeName,
      review.reviewPeriod,
      review.overallRating,
      review.goalsRating,
      review.skillsRating,
      review.teamworkRating,
      review.communicationRating,
      review.status,
      review.reviewerName,
      new Date(review.createdAt).toLocaleDateString()
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

const generatePerformanceGoalsCSV = (goals) => {
  const headers = ['Employee', 'Goal Title', 'Description', 'Target Date', 'Progress', 'Status', 'Priority', 'Created Date']
  const csvRows = [headers.join(',')]
  
  goals.forEach(goal => {
    const row = [
      goal.employeeName,
      goal.title,
      goal.description,
      new Date(goal.targetDate).toLocaleDateString(),
      goal.progress || 0,
      goal.status,
      goal.priority,
      new Date(goal.createdAt).toLocaleDateString()
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

export default PerformanceManagement