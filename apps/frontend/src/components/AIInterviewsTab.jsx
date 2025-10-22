import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  VideoCameraIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { interviewsAPI, candidateAPI } from '../services/api'
import toast from 'react-hot-toast'

const AIInterviewsTab = ({ jobPostings, candidates }) => {
  const [selectedJob, setSelectedJob] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [activeInterview, setActiveInterview] = useState(null)
  const queryClient = useQueryClient()

  // Fetch AI interviews for selected job
  const { data: interviewsData, isLoading: interviewsLoading } = useQuery(
    ['ai-interviews', selectedJob?._id],
    () => interviewsAPI.getAIInterviews(selectedJob?._id),
    {
      enabled: !!selectedJob?._id,
      retry: 3,
      refetchInterval: 30000
    }
  )

  const aiInterviews = interviewsData?.data?.interviews || []

  // Schedule AI interview mutation
  const scheduleAIMutation = useMutation(
    (data) => interviewsAPI.scheduleAIInterview(data),
    {
      onSuccess: () => {
        toast.success('AI interview scheduled successfully')
        queryClient.invalidateQueries(['ai-interviews', selectedJob?._id])
        setShowScheduleModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to schedule AI interview')
      }
    }
  )

  const handleScheduleAIInterview = (interviewData) => {
    scheduleAIMutation.mutate({
      ...interviewData,
      jobPostingId: selectedJob?._id,
      candidateId: selectedCandidate?._id,
      interviewType: 'AI'
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />
      case 'IN_PROGRESS':
        return <PlayIcon className="w-4 h-4 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'CANCELLED':
        return <XCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const startInterview = (interview) => {
    setActiveInterview(interview)
    toast.success('AI interview session started')
  }

  const stopInterview = () => {
    setActiveInterview(null)
    toast.success('AI interview session ended')
  }

  return (
    <div className="space-y-6">
      {/* Job Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Job Posting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobPostings.map((job) => (
            <motion.div
              key={job._id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedJob?._id === job._id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedJob(job)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4 className="font-medium text-gray-900">{job.title}</h4>
              <p className="text-sm text-gray-600">{job.department}</p>
              <p className="text-xs text-gray-500 mt-1">{job.location}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedJob && (
        <>
          {/* AI Interviews Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                <span>AI Interviews for {selectedJob.title}</span>
              </h3>
              <p className="text-sm text-gray-600">
                Manage AI-powered interview sessions with candidates
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Schedule AI Interview</span>
            </button>
          </div>

          {/* AI Interviews List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {interviewsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading AI interviews...</p>
              </div>
            ) : aiInterviews.length === 0 ? (
              <div className="p-8 text-center">
                <VideoCameraIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI interviews completed yet</h3>
                <p className="text-gray-600">Schedule AI interviews to assess candidates with AI technology</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {aiInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledAt)
                  const candidate = candidates.find(c => c._id === interview.candidateId)
                  
                  return (
                    <motion.div
                      key={interview._id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <VideoCameraIcon className="w-5 h-5 text-purple-500" />
                            {getStatusIcon(interview.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              AI Interview • {date} at {time}
                            </p>
                            <p className="text-xs text-gray-500">
                              Duration: {interview.duration} minutes
                            </p>
                            {interview.aiScore && (
                              <p className="text-xs text-purple-600 font-medium">
                                AI Score: {interview.aiScore}/100
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                          {interview.status === 'SCHEDULED' && (
                            <button
                              onClick={() => startInterview(interview)}
                              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <PlayIcon className="w-3 h-3" />
                              <span>Start</span>
                            </button>
                          )}
                          {interview.status === 'IN_PROGRESS' && (
                            <button
                              onClick={stopInterview}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <StopIcon className="w-3 h-3" />
                              <span>Stop</span>
                            </button>
                          )}
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {interview.meetingLink && (
                        <div className="mt-2">
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-800"
                          >
                            Join AI Interview →
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Active Interview Session */}
      {activeInterview && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900 flex items-center space-x-2">
              <VideoCameraIcon className="w-5 h-5" />
              <span>AI Interview in Progress</span>
            </h3>
            <button
              onClick={stopInterview}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <StopIcon className="w-4 h-4" />
              <span>End Interview</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Real-time Analysis</h4>
              <p className="text-sm text-gray-600">AI is analyzing responses...</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Emotion Detection</h4>
              <p className="text-sm text-gray-600">Confidence: 85%</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Skill Assessment</h4>
              <p className="text-sm text-gray-600">Technical: 78%</p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule AI Interview Modal */}
      {showScheduleModal && (
        <ScheduleAIModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSubmit={handleScheduleAIInterview}
          isLoading={scheduleAIMutation.isLoading}
          candidates={candidates}
          onSelectCandidate={setSelectedCandidate}
          selectedCandidate={selectedCandidate}
        />
      )}
    </div>
  )
}

// Schedule AI Interview Modal Component
const ScheduleAIModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  candidates, 
  onSelectCandidate, 
  selectedCandidate 
}) => {
  const [formData, setFormData] = useState({
    scheduledAt: '',
    meetingLink: '',
    duration: 45,
    interviewNotes: '',
    aiQuestions: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <span>Schedule AI Interview</span>
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Candidate</label>
            <select
              value={selectedCandidate?._id || ''}
              onChange={(e) => {
                const candidate = candidates.find(c => c._id === e.target.value)
                onSelectCandidate(candidate)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Select candidate...</option>
              {candidates.map(candidate => (
                <option key={candidate._id} value={candidate._id}>
                  {candidate.firstName} {candidate.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              min="15"
              max="120"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Meeting Link (optional)</label>
            <input
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">AI Interview Notes</label>
            <textarea
              value={formData.interviewNotes}
              onChange={(e) => setFormData({ ...formData, interviewNotes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
              placeholder="Special instructions for the AI interviewer..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedCandidate}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
            >
              {isLoading ? 'Scheduling...' : 'Schedule AI Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AIInterviewsTab
