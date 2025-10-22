import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jobAttachmentsAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Icon from './UI/Icon';
import Button from './UI/Button';

const JobAttachmentsTab = ({ jobPosting, onScheduleInterview }) => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('attachmentDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch job attachments
  const { data: attachmentsData, isLoading, error } = useQuery(
    ['job-attachments', jobPosting._id, filterStatus, filterPriority, sortBy, sortOrder],
    () => jobAttachmentsAPI.getJobAttachments(jobPosting._id, {
      status: filterStatus !== 'all' ? filterStatus : undefined,
      priority: filterPriority !== 'all' ? filterPriority : undefined,
      sortBy,
      sortOrder
    }),
    {
      enabled: !!jobPosting._id,
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  const attachments = attachmentsData?.data || [];

  // Update attachment status mutation
  const updateStatusMutation = useMutation(
    ({ attachmentId, data }) => jobAttachmentsAPI.updateAttachmentStatus(attachmentId, data),
    {
      onSuccess: () => {
        toast.success('Attachment status updated successfully!');
        queryClient.invalidateQueries(['job-attachments', jobPosting._id]);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to update status';
        toast.error(errorMessage);
      },
    }
  );

  // Remove attachment mutation
  const removeAttachmentMutation = useMutation(
    (attachmentId) => jobAttachmentsAPI.removeAttachment(attachmentId),
    {
      onSuccess: () => {
        toast.success('Attachment removed successfully!');
        queryClient.invalidateQueries(['job-attachments', jobPosting._id]);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to remove attachment';
        toast.error(errorMessage);
      },
    }
  );

  const handleStatusUpdate = async (attachmentId, status) => {
    await updateStatusMutation.mutateAsync({
      attachmentId,
      data: { status }
    });
  };

  const handleRemoveAttachment = async (attachmentId) => {
    if (window.confirm('Are you sure you want to remove this attachment?')) {
      await removeAttachmentMutation.mutateAsync(attachmentId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ATTACHED': return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED': return 'bg-green-100 text-green-800';
      case 'INTERVIEW_SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-800';
      case 'OFFERED': return 'bg-orange-100 text-orange-800';
      case 'HIRED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Icon name="exclamation-triangle" size="lg" className="text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load attachments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attached Candidates</h3>
          <p className="text-sm text-gray-600">
            {attachments.length} candidate{attachments.length !== 1 ? 's' : ''} attached to "{jobPosting.title}"
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="ATTACHED">Attached</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
          <option value="INTERVIEWED">Interviewed</option>
          <option value="OFFERED">Offered</option>
          <option value="HIRED">Hired</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Priority</option>
          <option value="HIGH">High Priority</option>
          <option value="NORMAL">Normal Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="attachmentDate-desc">Newest First</option>
          <option value="attachmentDate-asc">Oldest First</option>
          <option value="fitScore-desc">Highest Score</option>
          <option value="fitScore-asc">Lowest Score</option>
          <option value="priority-desc">Priority (High to Low)</option>
          <option value="priority-asc">Priority (Low to High)</option>
        </select>
      </div>

      {/* Attachments Grid */}
      {attachments.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="user-group" size="lg" className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attached Candidates</h3>
          <p className="text-gray-600">No candidates have been attached to this job posting yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attachments.map((attachment) => (
            <motion.div
              key={attachment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {attachment.candidate?.name?.split(' ').map(n => n[0]).join('') || '??'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {attachment.candidate?.name || 'Unknown Candidate'}
                    </h4>
                    <p className="text-sm text-gray-600">{attachment.candidate?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(attachment.status)}`}>
                    {attachment.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(attachment.priority)}`}>
                    {attachment.priority}
                  </span>
                </div>
              </div>

              {/* Fit Score */}
              {attachment.fitScore && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Fit Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(attachment.fitScore)}`}>
                      {attachment.fitScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        attachment.fitScore >= 80 ? 'bg-green-500' :
                        attachment.fitScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${attachment.fitScore}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Key Strengths */}
              {attachment.screening?.strengths && attachment.screening.strengths.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Key Strengths</h5>
                  <div className="space-y-1">
                    {attachment.screening.strengths.slice(0, 2).map((strength, index) => (
                      <div key={index} className="flex items-start text-xs text-green-700">
                        <Icon name="check" size="xs" className="mt-0.5 mr-1 flex-shrink-0" />
                        <span className="line-clamp-2">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment Notes */}
              {attachment.attachmentNotes && (
                <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800 line-clamp-2">{attachment.attachmentNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {/* Status Update Buttons */}
                <div className="flex space-x-1">
                  {attachment.status === 'ATTACHED' && (
                    <button
                      onClick={() => handleStatusUpdate(attachment._id, 'SHORTLISTED')}
                      disabled={updateStatusMutation.isLoading}
                      className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Shortlist
                    </button>
                  )}
                  {attachment.status === 'SHORTLISTED' && onScheduleInterview && (
                    <button
                      onClick={() => onScheduleInterview(attachment)}
                      className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule Interview
                    </button>
                  )}
                  {attachment.status === 'INTERVIEWED' && (
                    <button
                      onClick={() => handleStatusUpdate(attachment._id, 'OFFERED')}
                      disabled={updateStatusMutation.isLoading}
                      className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Offer
                    </button>
                  )}
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => {
                    // Open attachment details in a new tab or modal
                    const attachmentUrl = `/attachments/${attachment._id}`
                    window.open(attachmentUrl, '_blank')
                  }}
                  className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Details
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveAttachment(attachment._id)}
                  disabled={removeAttachmentMutation.isLoading}
                  className="w-full px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Attachment
                </button>
              </div>

              {/* Footer */}
              <div className="mt-3 text-xs text-gray-500">
                Attached: {new Date(attachment.attachmentDate).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobAttachmentsTab;
