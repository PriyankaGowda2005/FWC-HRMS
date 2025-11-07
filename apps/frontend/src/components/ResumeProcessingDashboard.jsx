import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Card from './UI/Card'
import Button from './UI/Button'
import Icon from './UI/Icon'
import LoadingSpinner from './LoadingSpinner'
import api from '../services/api'
import toast from 'react-hot-toast'

const ResumeProcessingDashboard = () => {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    skills: '',
    minAtsScore: '',
    maxAtsScore: '',
    minExperience: '',
    maxExperience: '',
    department: '',
    status: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchResumes()
  }, [filters, pagination.page])

  const fetchResumes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      })

      const response = await api.get(`/resume-processing/dashboard?${params}`)
      
      if (response.data.success) {
        setResumes(response.data.data.resumes || [])
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0,
          pages: response.data.data.pagination?.pages || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTemplate = async (resumeId) => {
    try {
      toast.loading('Generating professional template...')
      const response = await api.post(`/resume-processing/generate-template/${resumeId}`, {
        includeAtsScore: true,
        templateStyle: 'professional'
      })

      if (response.data.success) {
        toast.success('Template generated successfully!')
        // Trigger download
        window.open(`/api/resume-processing/download-template/${resumeId}`, '_blank')
      }
    } catch (error) {
      console.error('Error generating template:', error)
      toast.error('Failed to generate template')
    }
  }

  const handleCalculateAtsScore = async (resumeId, jobPostingId) => {
    try {
      toast.loading('Calculating ATS score...')
      const response = await api.post('/resume-processing/ats-score', {
        resumeId,
        jobPostingId
      })

      if (response.data.success) {
        toast.success(`ATS Score: ${response.data.data.atsScore.overallScore}%`)
        fetchResumes() // Refresh to show updated score
      }
    } catch (error) {
      console.error('Error calculating ATS score:', error)
      toast.error('Failed to calculate ATS score')
    }
  }

  const getAtsScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: 'check-circle' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: 'clock' },
      'FAILED': { color: 'bg-red-100 text-red-800', icon: 'exclamation-triangle' }
    }
    const config = statusConfig[status] || statusConfig['PENDING']
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon name={config.icon} size="xs" className="mr-1" />
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resume Processing Dashboard</h1>
          <p className="text-gray-600 mt-1">View and manage all processed resumes</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <input
              type="text"
              value={filters.skills}
              onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
              placeholder="e.g. Python, React"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min ATS Score</label>
            <input
              type="number"
              value={filters.minAtsScore}
              onChange={(e) => setFilters({ ...filters, minAtsScore: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max ATS Score</label>
            <input
              type="number"
              value={filters.maxAtsScore}
              onChange={(e) => setFilters({ ...filters, maxAtsScore: e.target.value })}
              placeholder="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience</label>
            <input
              type="number"
              value={filters.minExperience}
              onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
              placeholder="Years"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={fetchResumes}
              className="w-full"
            >
              <Icon name="magnifying-glass" size="sm" className="mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Resumes List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : resumes.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="document-text" size="xl" className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <Card key={resume._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="document-text" size="lg" className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {resume.candidate?.name || 'Unknown Candidate'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {resume.candidate?.email} • {resume.originalName}
                      </p>
                    </div>
                    {getStatusBadge(resume.processingStatus)}
                  </div>

                  {/* Extracted Data */}
                  {resume.extractedData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {(resume.extractedData.skills?.technical || []).slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Experience</p>
                        <p className="text-sm text-gray-900">
                          {resume.extractedData.experience?.totalYears || 0} years
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Education</p>
                        <p className="text-sm text-gray-900">
                          {resume.extractedData.education?.length || 0} entries
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ATS Score */}
                  {resume.atsScore && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">ATS Match Score</p>
                          <p className={`text-2xl font-bold ${getAtsScoreColor(resume.atsScore.overallScore)} px-3 py-1 rounded`}>
                            {resume.atsScore.overallScore}%
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Matched: {resume.atsScore.matchedSkillsCount || 0} / {resume.atsScore.totalRequiredSkills || 0} skills</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {resume.extractedData && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateTemplate(resume._id)}
                    >
                      <Icon name="document-arrow-down" size="sm" className="mr-2" />
                      Generate Template
                    </Button>
                  )}
                  {resume.templateGenerated && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(`/api/resume-processing/download-template/${resume._id}`, '_blank')}
                    >
                      <Icon name="arrow-down-tray" size="sm" className="mr-2" />
                      Download Template
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} resumes
          </p>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeProcessingDashboard

