import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { resumeScreeningAPI } from '../services/api';
import Modal from './UI/Modal';
import Button from './UI/Button';
import Icon from './UI/Icon';
import LoadingSpinner from './LoadingSpinner';

const ResumeScreeningModal = ({ candidate, jobPosting, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [screeningNotes, setScreeningNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const screenResumeMutation = useMutation(
    (data) => resumeScreeningAPI.screenResume(data),
    {
      onSuccess: (response) => {
        toast.success('Resume screening completed successfully!');
        queryClient.invalidateQueries('candidates');
        queryClient.invalidateQueries('job-postings');
        if (onSuccess) onSuccess(response.data);
        onClose();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to screen resume';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await screenResumeMutation.mutateAsync({
        candidateId: candidate._id,
        jobPostingId: jobPosting._id,
        screeningNotes
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Screen Resume">
      <div className="space-y-6">
        {/* Candidate Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Candidate Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="font-medium">{candidate.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-medium">{candidate.email}</p>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <p className="font-medium">{candidate.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600">Resume:</span>
              <p className="font-medium text-green-600">
                {candidate.resumeUploaded ? 'Uploaded' : 'Not uploaded'}
              </p>
            </div>
          </div>
        </div>

        {/* Job Posting Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Job Posting</h3>
          <div className="text-sm">
            <div className="mb-1">
              <span className="text-gray-600">Position:</span>
              <p className="font-medium">{jobPosting.title}</p>
            </div>
            <div>
              <span className="text-gray-600">Department:</span>
              <p className="font-medium">{jobPosting.department}</p>
            </div>
          </div>
        </div>

        {/* AI Analysis Notice */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start">
            <Icon name="cpu" size="sm" className="text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">AI-Powered Analysis</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This resume will be automatically analyzed using AI to extract skills, 
                experience, and calculate a job fit score. You can add your manual notes below.
              </p>
            </div>
          </div>
        </div>

        {/* Screening Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="screeningNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Screening Notes (Optional)
            </label>
            <textarea
              id="screeningNotes"
              value={screeningNotes}
              onChange={(e) => setScreeningNotes(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="Add your observations, concerns, or additional notes about this candidate..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isProcessing || !candidate.resumeUploaded}
            >
              {isProcessing ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <Icon name="search" size="sm" className="mr-2" />
              )}
              {isProcessing ? 'Screening...' : 'Screen Resume'}
            </Button>
          </div>
        </form>

        {/* Warning if no resume */}
        {!candidate.resumeUploaded && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start">
              <Icon name="alert-triangle" size="sm" className="text-red-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-red-800">Resume Required</h4>
                <p className="text-sm text-red-700 mt-1">
                  This candidate has not uploaded a resume yet. Please ask them to upload 
                  their resume before screening.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ResumeScreeningModal;
