import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  DocumentIcon, 
  PaperClipIcon, 
  EyeIcon, 
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { jobAttachmentsAPI, jobPostingAPI, candidateAPI, resumeScreeningAPI } from '../services/api'
import toast from 'react-hot-toast'

const AttachmentsTab = ({ jobPostings, candidates }) => {
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [showResumeScreening, setShowResumeScreening] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const queryClient = useQueryClient()

  // Fetch job attachments
  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery(
    ['job-attachments', selectedJob?._id],
    () => jobAttachmentsAPI.getAttachments(selectedJob?._id),
    {
      enabled: !!selectedJob?._id,
      retry: 3,
      refetchInterval: 30000
    }
  )

  const attachments = attachmentsData?.data?.attachments || []

  // Create attachment mutation
  const createAttachmentMutation = useMutation(
    (data) => jobAttachmentsAPI.createAttachment(data),
    {
      onSuccess: () => {
        toast.success('Attachment created successfully')
        queryClient.invalidateQueries(['job-attachments', selectedJob?._id])
        setShowAttachmentModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create attachment')
      }
    }
  )

  const handleCreateAttachment = (attachmentData) => {
    createAttachmentMutation.mutate({
      ...attachmentData,
      jobPostingId: selectedJob?._id
    })
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
                  ? 'border-blue-500 bg-blue-50'
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
          {/* Attachments Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Attachments for {selectedJob.title}
              </h3>
              <p className="text-sm text-gray-600">
                Manage files and documents for this job posting
              </p>
            </div>
            <button
              onClick={() => setShowAttachmentModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Attachment</span>
            </button>
          </div>

          {/* Attachments List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {attachmentsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading attachments...</p>
              </div>
            ) : attachments.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attachments found</h3>
                <p className="text-gray-600">Add attachments to organize job-related files</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {attachments.map((attachment) => (
                  <motion.div
                    key={attachment._id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <PaperClipIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900">{attachment.name}</h4>
                          <p className="text-sm text-gray-600">{attachment.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          attachment.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {attachment.status}
                        </span>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Resume Screening Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resume Screening</h3>
              <button
                onClick={() => setShowResumeScreening(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Screen Resumes</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.filter(c => c.resumeUploaded).map((candidate) => (
                  <motion.div
                    key={candidate._id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          candidate.status === 'APPLIED' ? 'bg-blue-100 text-blue-800' :
                          candidate.status === 'SCREENING' ? 'bg-yellow-100 text-yellow-800' :
                          candidate.status === 'INTERVIEWED' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {candidate.status}
                        </span>
                      </div>
                      {candidate.fitScore && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Fit Score:</span>
                          <span className={`font-medium ${
                            candidate.fitScore >= 80 ? 'text-green-600' :
                            candidate.fitScore >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {candidate.fitScore}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setShowResumeScreening(true)
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Screen Resume
                    </button>
                  </motion.div>
                ))}
              </div>
              
              {candidates.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-600 mb-4">Add candidates to start the recruitment process</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Candidates
                  </button>
                </div>
              ) : candidates.filter(c => c.resumeUploaded).length === 0 ? (
                <div className="text-center py-8">
                  <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes to screen</h3>
                  <p className="text-gray-600">Candidates need to upload resumes before screening</p>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Create Attachment Modal */}
      {showAttachmentModal && (
        <CreateAttachmentModal
          isOpen={showAttachmentModal}
          onClose={() => setShowAttachmentModal(false)}
          onSubmit={handleCreateAttachment}
          isLoading={createAttachmentMutation.isLoading}
        />
      )}

      {/* Resume Screening Modal */}
      {showResumeScreening && selectedCandidate && (
        <ResumeScreeningModal
          candidate={selectedCandidate}
          jobPosting={selectedJob}
          onClose={() => {
            setShowResumeScreening(false)
            setSelectedCandidate(null)
          }}
          onSuccess={(screeningData) => {
            toast.success('Resume screening completed successfully')
            setShowResumeScreening(false)
            setSelectedCandidate(null)
          }}
        />
      )}
    </div>
  )
}

// Create Attachment Modal Component
const CreateAttachmentModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'DOCUMENT',
    description: '',
    file: null
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Add Attachment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DOCUMENT">Document</option>
              <option value="TEMPLATE">Template</option>
              <option value="FORM">Form</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">File</label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Resume Screening Modal Component
const ResumeScreeningModal = ({ candidate, jobPosting, onClose, onSuccess }) => {
  const [screeningData, setScreeningData] = useState({
    technicalScore: 0,
    experienceScore: 0,
    educationScore: 0,
    overallScore: 0,
    notes: '',
    recommendation: 'PENDING'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSuccess(screeningData)
  }

  const updateOverallScore = () => {
    const overall = Math.round((screeningData.technicalScore + screeningData.experienceScore + screeningData.educationScore) / 3)
    setScreeningData(prev => ({ ...prev, overallScore: overall }))
  }

  if (!candidate) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Resume Screening</h3>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Screening: {candidate.firstName} {candidate.lastName}
          </h4>
          <p className="text-sm text-gray-600">{candidate.email}</p>
          {jobPosting && (
            <p className="text-sm text-gray-600">For: {jobPosting.title}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Technical Skills</label>
              <input
                type="number"
                min="0"
                max="100"
                value={screeningData.technicalScore}
                onChange={(e) => {
                  setScreeningData(prev => ({ ...prev, technicalScore: parseInt(e.target.value) || 0 }))
                  setTimeout(updateOverallScore, 100)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Experience</label>
              <input
                type="number"
                min="0"
                max="100"
                value={screeningData.experienceScore}
                onChange={(e) => {
                  setScreeningData(prev => ({ ...prev, experienceScore: parseInt(e.target.value) || 0 }))
                  setTimeout(updateOverallScore, 100)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Education</label>
              <input
                type="number"
                min="0"
                max="100"
                value={screeningData.educationScore}
                onChange={(e) => {
                  setScreeningData(prev => ({ ...prev, educationScore: parseInt(e.target.value) || 0 }))
                  setTimeout(updateOverallScore, 100)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Overall Score:</span>
              <span className={`text-2xl font-bold ${
                screeningData.overallScore >= 80 ? 'text-green-600' :
                screeningData.overallScore >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {screeningData.overallScore}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Recommendation</label>
            <select
              value={screeningData.recommendation}
              onChange={(e) => setScreeningData(prev => ({ ...prev, recommendation: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Notes</label>
            <textarea
              value={screeningData.notes}
              onChange={(e) => setScreeningData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Add screening notes and observations..."
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
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              Complete Screening
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AttachmentsTab
