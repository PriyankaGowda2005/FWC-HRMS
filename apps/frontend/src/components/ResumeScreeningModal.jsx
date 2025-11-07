import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { resumeScreeningAPI, jobPostingAPI } from '../services/api';
import Modal from './UI/Modal';
import Button from './UI/Button';
import Icon from './UI/Icon';
import LoadingSpinner from './LoadingSpinner';

const ResumeScreeningModal = ({ candidate, jobPosting, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [screeningNotes, setScreeningNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(jobPosting?._id || '');

  // Fetch job postings for selection
  const { data: jobPostingsData, isLoading: jobPostingsLoading, error: jobPostingsError } = useQuery(
    'job-postings-screening',
    () => jobPostingAPI.getForScreening({ status: 'PUBLISHED' }),
    {
      retry: 1,
      enabled: isOpen, // Only fetch when modal is open
      onError: (error) => {
        console.error('Job postings API error:', error)
        console.error('Error details:', error.response?.data)
      },
      onSuccess: (data) => {
        console.log('Job postings fetched successfully:', data)
      }
    }
  );

  // Support both response shapes:
  // - { success, data: { jobPostings: [...] } }
  // - { jobPostings: [...] }
  const jobPostings =
    jobPostingsData?.data?.data?.jobPostings ||
    jobPostingsData?.data?.jobPostings ||
    jobPostingsData?.jobPostings ||
    [];

  const [screeningResult, setScreeningResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const screenResumeMutation = useMutation(
    (data) => resumeScreeningAPI.screenResume(data),
    {
      onSuccess: (response) => {
        if (response.data?.success) {
          setScreeningResult(response.data.data);
          setShowResults(true);
          toast.success('Resume screening completed successfully!');
          queryClient.invalidateQueries('candidates');
          queryClient.invalidateQueries('job-postings');
        } else {
          toast.error(response.data?.message || 'Screening completed but no results');
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to screen resume';
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedJobId) {
      toast.error('Please select a job posting first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await screenResumeMutation.mutateAsync({
        candidateId: candidate._id,
        jobPostingId: selectedJobId,
        screeningNotes
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Screen Resume">
      <div className="space-y-6">
        {/* Candidate Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Candidate Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="font-medium">{candidate?.firstName} {candidate?.lastName}</p>
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
            {selectedJobId ? (
              <>
                <div className="mb-1">
                  <span className="text-gray-600">Position:</span>
                  <p className="font-medium">
                    {jobPostings.find(job => job._id === selectedJobId)?.title || 'Loading...'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Department:</span>
                  <p className="font-medium">
                    {jobPostings.find(job => job._id === selectedJobId)?.department || 'Loading...'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Please select a job posting below</p>
            )}
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
        {!showResults && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="jobPosting" className="block text-sm font-medium text-gray-700 mb-2">
              Select Job Posting *
            </label>
            <select
              id="jobPosting"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="input-field"
              required
              disabled={jobPostingsLoading}
            >
              <option value="">
                {jobPostingsLoading ? 'Loading job postings...' : 
                 jobPostingsError ? 'Error loading job postings' :
                 jobPostings.length === 0 ? 'No job postings available' :
                 'Choose a job posting...'}
              </option>
              {jobPostings.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
            {jobPostingsError && (
              <p className="text-red-500 text-sm mt-1">
                Error: {jobPostingsError.message || 'Failed to load job postings'}
              </p>
            )}
            {!jobPostingsLoading && !jobPostingsError && jobPostings.length === 0 && (
              <p className="text-yellow-600 text-sm mt-1">
                No published job postings found. Please publish some jobs first.
              </p>
            )}
          </div>

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
        )}

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

        {/* Screening Results */}
        {showResults && screeningResult && (
          <div className="mt-6 border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">AI Screening Results</h3>
            
            {/* Fit Score */}
            <div className={`p-4 rounded-lg ${
              (screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0) >= 80 ? 'bg-green-50 border border-green-200' :
              (screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0) >= 60 ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">AI Fit Score</div>
                  <div className="text-3xl font-bold">
                    {screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0}/100
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Recommendation</div>
                  <div className="font-semibold">
                    {(screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0) >= 80 ? 'Highly Suitable' :
                     (screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0) >= 60 ? 'Potential Fit' :
                     'Needs Review'}
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Summary */}
            {screeningResult.candidateSummary && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700 text-sm">{screeningResult.candidateSummary}</p>
              </div>
            )}

            {/* Strengths */}
            {screeningResult.strengths && screeningResult.strengths.length > 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  {screeningResult.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {screeningResult.weaknesses && screeningResult.weaknesses.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">Areas for Improvement</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {screeningResult.weaknesses.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {screeningResult.recommendations && screeningResult.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {screeningResult.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowResults(false);
                  setScreeningResult(null);
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (onSuccess) onSuccess(screeningResult);
                  onClose();
                }}
              >
                Use Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ResumeScreeningModal;
