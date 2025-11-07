import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { jobPostingAPI, candidateAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const RecruitmentManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('job-postings')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [showAIInterview, setShowAIInterview] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [interviewSession, setInterviewSession] = useState(null)

  // Fetch job postings
  const { data: jobPostings, isLoading: jobsLoading } = useQuery(
    'job-postings',
    () => jobPostingAPI.getAll(),
    { enabled: activeTab === 'job-postings' }
  )

  // Fetch candidates
  const { data: candidates, isLoading: candidatesLoading } = useQuery(
    'candidates',
    () => candidateAPI.getAll(),
    { enabled: activeTab === 'candidates' }
  )

  // Create job posting mutation
  const createJobMutation = useMutation(
    (jobData) => jobPostingAPI.create(jobData),
    {
      onSuccess: () => {
        toast.success('Job posting created successfully')
        queryClient.invalidateQueries('job-postings')
        setShowCreateJob(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create job posting')
      }
    }
  )

  // Start AI interview mutation
  const startInterviewMutation = useMutation(
    async ({ candidateId, jobRole }) => {
      const response = await fetch(`${process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000'}/api/interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ candidate_id: candidateId, job_role: jobRole })
      })
      return response.json()
    },
    {
      onSuccess: (data) => {
        if (data.success) {
          setInterviewSession(data)
          setShowAIInterview(true)
          toast.success('AI Interview session started')
        } else {
          toast.error('Failed to start AI interview')
        }
      },
      onError: () => {
        toast.error('Failed to start AI interview')
      }
    }
  )

  const handleCreateJob = (jobData) => {
    createJobMutation.mutate(jobData)
  }

  const handleStartAIInterview = (candidate) => {
    setSelectedCandidate(candidate)
    startInterviewMutation.mutate({
      candidateId: candidate.id,
      jobRole: candidate.jobPosting?.title || 'General Position'
    })
  }

  const handleAnalyzeResume = async (candidateId, resumePath) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000'}/api/resume/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          file_path: resumePath,
          job_requirements: selectedJob ? {
            skills: selectedJob.requirements?.skills || [],
            experience_level: selectedJob.requirements?.experience_level || 'mid',
            industry: selectedJob.requirements?.industry || 'technology'
          } : null
        })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Resume analyzed successfully')
        // Update candidate with AI analysis results
        await candidateAPI.update(candidateId, {
          fitScore: result.job_fit_analysis?.overall_score,
          skills: result.candidate_profile?.skills_detected,
          aiAnalysis: result
        })
        queryClient.invalidateQueries('candidates')
      } else {
        toast.error('Failed to analyze resume')
      }
    } catch (error) {
      toast.error('Error analyzing resume')
    }
  }

  if (jobsLoading || candidatesLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment Management</h1>
          <p className="text-gray-600">AI-powered recruitment and candidate screening</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateJob(true)}
            className="btn-primary"
          >
            Create Job Posting
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'job-postings', label: 'Job Postings', count: jobPostings?.length || 0 },
            { id: 'candidates', label: 'Candidates', count: candidates?.length || 0 },
            { id: 'ai-interviews', label: 'AI Interviews', count: 0 },
            { id: 'analytics', label: 'Analytics', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'job-postings' && (
        <JobPostingsTab
          jobPostings={jobPostings || []}
          onSelectJob={setSelectedJob}
          selectedJob={selectedJob}
        />
      )}

      {activeTab === 'candidates' && (
        <CandidatesTab
          candidates={candidates || []}
          onStartAIInterview={handleStartAIInterview}
          onAnalyzeResume={handleAnalyzeResume}
          selectedJob={selectedJob}
        />
      )}

      {activeTab === 'ai-interviews' && (
        <AIInterviewsTab />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab />
      )}

      {/* Create Job Modal */}
      {showCreateJob && (
        <CreateJobModal
          onClose={() => setShowCreateJob(false)}
          onSubmit={handleCreateJob}
        />
      )}

      {/* AI Interview Modal */}
      {showAIInterview && interviewSession && (
        <AIInterviewModal
          session={interviewSession}
          candidate={selectedCandidate}
          onClose={() => {
            setShowAIInterview(false)
            setInterviewSession(null)
            setSelectedCandidate(null)
          }}
        />
      )}
    </div>
  )
}

// Job Postings Tab Component
const JobPostingsTab = ({ jobPostings, onSelectJob, selectedJob }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Job List */}
      <div className="lg:col-span-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Job Postings</h3>
          <div className="space-y-4">
            {jobPostings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No job postings found. Create your first job posting to get started.
              </div>
            ) : (
              jobPostings.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedJob?.id === job.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{job.location}</span>
                        <span>{job.employmentType}</span>
                        <span>{job.currentApplications} applications</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      job.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      job.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="lg:col-span-1">
        {selectedJob ? (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-gray-900">{selectedJob.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Department</label>
                <p className="text-gray-900">{selectedJob.department?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900">{selectedJob.location || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Employment Type</label>
                <p className="text-gray-900">{selectedJob.employmentType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Salary Range</label>
                <p className="text-gray-900">
                  {selectedJob.salaryMin && selectedJob.salaryMax
                    ? `$${selectedJob.salaryMin.toLocaleString()} - $${selectedJob.salaryMax.toLocaleString()}`
                    : 'Not specified'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Applications</label>
                <p className="text-gray-900">{selectedJob.currentApplications}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="text-center py-8 text-gray-500">
              Select a job posting to view details
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Candidates Tab Component
const CandidatesTab = ({ candidates, onStartAIInterview, onAnalyzeResume, selectedJob }) => {
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredCandidates = candidates.filter(candidate => 
    filterStatus === 'all' || candidate.status === filterStatus
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Candidates</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Screening</option>
              <option value="INTERVIEWED">Interviewed</option>
              <option value="OFFERED">Offered</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredCandidates.length} candidates
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-600">
                    {candidate.firstName[0]}{candidate.lastName[0]}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {candidate.firstName} {candidate.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{candidate.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                candidate.status === 'APPLIED' ? 'bg-blue-100 text-blue-800' :
                candidate.status === 'SCREENING' ? 'bg-yellow-100 text-yellow-800' :
                candidate.status === 'INTERVIEWED' ? 'bg-purple-100 text-purple-800' :
                candidate.status === 'OFFERED' ? 'bg-green-100 text-green-800' :
                candidate.status === 'HIRED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {candidate.status}
              </span>
            </div>

            {/* AI Analysis Results */}
            {candidate.fitScore && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">AI Fit Score</span>
                  <span className={`text-sm font-bold ${
                    candidate.fitScore >= 80 ? 'text-green-600' :
                    candidate.fitScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {candidate.fitScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      candidate.fitScore >= 80 ? 'bg-green-500' :
                      candidate.fitScore >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${candidate.fitScore}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Skills */}
            {candidate.skills && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Top Skills</h5>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(candidate.skills).slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => onAnalyzeResume(candidate.id, candidate.resumeFile)}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!candidate.resumeFile}
              >
                Analyze Resume
              </button>
              <button
                onClick={() => onStartAIInterview(candidate)}
                className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                AI Interview
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Applied: {new Date(candidate.appliedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// AI Interviews Tab Component
const AIInterviewsTab = () => {
  return (
    <div className="card">
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-purple-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">AI Interview Sessions</h3>
        <p className="mt-2 text-gray-600">
          Manage and review AI-powered interview sessions with candidates
        </p>
        <div className="mt-6">
          <button className="btn-primary">
            View All Sessions
          </button>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
const AnalyticsTab = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stats Cards */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Total Applications</h3>
        <p className="text-3xl font-bold text-blue-600">1,247</p>
        <p className="text-sm text-gray-600 mt-1">+12% from last month</p>
      </div>
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI Interviews</h3>
        <p className="text-3xl font-bold text-purple-600">89</p>
        <p className="text-sm text-gray-600 mt-1">+8% from last month</p>
      </div>
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hire Rate</h3>
        <p className="text-3xl font-bold text-green-600">23%</p>
        <p className="text-sm text-gray-600 mt-1">+3% from last month</p>
      </div>
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Avg. Fit Score</h3>
        <p className="text-3xl font-bold text-yellow-600">76%</p>
        <p className="text-sm text-gray-600 mt-1">+5% from last month</p>
      </div>
    </div>
  )
}

// Create Job Modal Component
const CreateJobModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salaryMin: '',
    salaryMax: '',
    location: '',
    employmentType: 'FULL_TIME',
    departmentId: '',
    urgency: 'NORMAL'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Job Posting</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Requirements</label>
              <textarea
                rows={3}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Salary</label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Salary</label>
                <input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Create Job
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// AI Interview Modal Component
const AIInterviewModal = ({ session, candidate, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(session.first_question)
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [assessment, setAssessment] = useState(null)

  const submitAnswer = async () => {
    if (!answer.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000'}/api/interview/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          session_id: session.session_id,
          answer_text: answer,
          question_id: currentQuestion.question_id
        })
      })

      const result = await response.json()
      
      if (result.status === 'interview_completed') {
        setInterviewComplete(true)
        setAssessment(result.assessment)
      } else {
        setCurrentQuestion(result.next_question)
        setAnswer('')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (interviewComplete && assessment) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Interview Complete!</h3>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Overall Assessment</h4>
                <p className="text-gray-700 mb-4">{assessment.overall_assessment}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{assessment.technical_score.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Technical Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{assessment.communication_score.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Communication Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{assessment.problem_solving_score.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Problem Solving</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{assessment.confidence_level.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Confidence Level</div>
                  </div>
                </div>

                <div className="text-left">
                  <h5 className="font-medium text-gray-900 mb-2">Strengths:</h5>
                  <ul className="list-disc list-inside text-gray-700 mb-4">
                    {assessment.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                  
                  <h5 className="font-medium text-gray-900 mb-2">Areas for Improvement:</h5>
                  <ul className="list-disc list-inside text-gray-700">
                    {assessment.areas_for_improvement.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Close Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">AI Interview Session</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h4>
                <p className="text-sm text-gray-600">{candidate.email}</p>
              </div>
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentQuestion.progress}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {currentQuestion.category}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{currentQuestion.question_text}</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Type your answer here..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  End Interview
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecruitmentManagement
