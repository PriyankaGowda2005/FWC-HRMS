import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { jobPostingAPI } from '../services/api'
import Modal from './UI/Modal'
import Button from './UI/Button'
import Icon from './UI/Icon'
import LoadingSpinner from './LoadingSpinner'

const CreateJobModal = ({ isOpen, onClose, onSuccess, departments = [] }) => {
  const queryClient = useQueryClient()
  
  // Ensure departments is always an array
  const departmentList = Array.isArray(departments) ? departments : []
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryRange: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    applicationDeadline: ''
  })

  const createJobMutation = useMutation(
    (data) => jobPostingAPI.create(data),
    {
      onSuccess: (response) => {
        toast.success('Job posting created successfully! 🎉')
        queryClient.invalidateQueries('job-postings')
        if (onSuccess) onSuccess(response.data)
        onClose()
        resetForm()
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to create job posting'
        toast.error(errorMessage)
      }
    }
  )

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID_LEVEL',
      salaryRange: '',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      applicationDeadline: ''
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Job title is required')
      return
    }
    
    if (!formData.department.trim()) {
      toast.error('Department is required')
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Job description is required')
      return
    }

    // Transform requirements and responsibilities to arrays if they're strings
    const processedData = {
      ...formData,
      requirements: formData.requirements ? formData.requirements.split('\n').filter(req => req.trim()) : [],
      responsibilities: formData.responsibilities ? formData.responsibilities.split('\n').filter(resp => resp.trim()) : [],
      benefits: formData.benefits ? formData.benefits.split('\n').filter(benefit => benefit.trim()) : [],
      applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline) : null
    }

    createJobMutation.mutate(processedData)
  }

  const handleClose = () => {
    if (!createJobMutation.isLoading) {
      onClose()
      resetForm()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="plus-circle" size="sm" className="mr-3 text-blue-600" />
            Create New Job Posting
          </h2>
          <button
            onClick={handleClose}
            disabled={createJobMutation.isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="x-mark" size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departmentList.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div>
                <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>

              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ENTRY_LEVEL">Entry Level</option>
                  <option value="MID_LEVEL">Mid Level</option>
                  <option value="SENIOR_LEVEL">Senior Level</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>

              <div>
                <label htmlFor="salaryRange" className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  id="salaryRange"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., $80,000 - $120,000"
                />
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the role, company culture, and what makes this position exciting..."
                  required
                />
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List each requirement on a new line..."
                />
                <p className="text-xs text-gray-500 mt-1">Enter each requirement on a separate line</p>
              </div>

              <div>
                <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                  Responsibilities
                </label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List each responsibility on a new line..."
                />
                <p className="text-xs text-gray-500 mt-1">Enter each responsibility on a separate line</p>
              </div>

              <div>
                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                  Benefits & Perks
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List each benefit on a new line..."
                />
                <p className="text-xs text-gray-500 mt-1">Enter each benefit on a separate line</p>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
            
            <div>
              <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="datetime-local"
                id="applicationDeadline"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no deadline</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={createJobMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createJobMutation.isLoading}
              className="min-w-[120px]"
            >
              {createJobMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                <>
                  <Icon name="plus-circle" size="sm" className="mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateJobModal
