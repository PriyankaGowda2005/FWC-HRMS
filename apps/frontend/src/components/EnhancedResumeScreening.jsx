import React, { useState, useEffect } from 'react';
import { resumeScreeningAPI } from '../services/api';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EnhancedResumeScreening = ({ candidateId, jobPostingId, candidateName, jobTitle, onClose, onScreeningComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState(null);
  const [screeningNotes, setScreeningNotes] = useState('');

  const handleScreenResume = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await resumeScreeningAPI.screenResume({
        candidateId,
        jobPostingId,
        screeningNotes
      });

      if (response.success) {
        setScreeningResult(response.data);
        if (onScreeningComplete) {
          onScreeningComplete(response.data);
        }
      } else {
        setError(response.message || 'Screening failed');
      }
    } catch (err) {
      console.error('Resume screening error:', err);
      setError(err.message || 'Failed to screen resume');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircleIcon className="text-green-600 w-6 h-6" />;
    if (score >= 60) return <ExclamationCircleIcon className="text-yellow-600 w-6 h-6" />;
    return <XCircleIcon className="text-red-600 w-6 h-6" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">AI Resume Screening</h2>
            <p className="text-purple-100 mt-1">
              {candidateName} - {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!screeningResult ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">AI-Powered Screening</h3>
                <p className="text-blue-700 text-sm">
                  Our AI will analyze the candidate's resume against the job requirements, 
                  evaluating skills match, experience level, education, and overall fit. 
                  The analysis includes strengths, weaknesses, and recommendations.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Screening Notes (Optional)
                </label>
                <textarea
                  value={screeningNotes}
                  onChange={(e) => setScreeningNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Add any additional notes or observations..."
                />
              </div>

              <button
                onClick={handleScreenResume}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-5 h-5" />
                    Start AI Screening
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Card */}
              <div className={`${getScoreColor(screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0)} rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getScoreIcon(screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0)}
                    <div>
                      <div className="text-sm font-medium opacity-75">AI Fit Score</div>
                      <div className="text-4xl font-bold">
                        {screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0}/100
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium opacity-75">Recommendation</div>
                    <div className="text-lg font-semibold">
                      {(screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0) >= 80 ? 'Highly Suitable' :
                       (screeningResult.aiAnalysis?.match_score || screeningResult.fitScore || 0) >= 60 ? 'Potential Fit' :
                       'Needs Review'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Summary */}
              {screeningResult.candidateSummary && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">AI Analysis Summary</h3>
                  <p className="text-gray-700">{screeningResult.candidateSummary}</p>
                </div>
              )}

              {/* Strengths */}
              {screeningResult.strengths && screeningResult.strengths.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {screeningResult.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {screeningResult.weaknesses && screeningResult.weaknesses.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <ArrowTrendingDownIcon className="w-5 h-5" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {screeningResult.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-800">
                        <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {screeningResult.recommendations && screeningResult.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <StarIcon className="w-5 h-5" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {screeningResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-blue-800">
                        <ClockIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Match */}
              {screeningResult.skillsMatch && screeningResult.skillsMatch.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">Skills Match</h3>
                  <div className="flex flex-wrap gap-2">
                    {screeningResult.skillsMatch.map((skill, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience & Education Match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {screeningResult.experienceMatch && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Experience Match</h3>
                    <p className="text-gray-700">{screeningResult.experienceMatch}</p>
                  </div>
                )}
                {screeningResult.educationMatch && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Education Match</h3>
                    <p className="text-gray-700">{screeningResult.educationMatch}</p>
                  </div>
                )}
              </div>

              {/* Manual Notes */}
              {screeningNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Your Notes</h3>
                  <p className="text-yellow-800">{screeningNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (onScreeningComplete) {
                      onScreeningComplete(screeningResult);
                    }
                    onClose();
                  }}
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Use Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedResumeScreening;

