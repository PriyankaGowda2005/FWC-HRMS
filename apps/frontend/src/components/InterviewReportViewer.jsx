import React, { useState, useEffect } from 'react';
import api from '../services/api';

const InterviewReportViewer = ({ transcriptId, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [transcriptId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/interview-transcripts/transcript/${transcriptId}`);
      
      if (response.data.success) {
        const transcript = response.data.data;
        setReport({
          transcript: transcript.transcript,
          analysis: transcript.analysis,
          scores: transcript.scores,
          interview: transcript.interview,
          candidate: transcript.candidate,
          jobPosting: transcript.jobPosting
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSentimentLabel = (score) => {
    if (score > 0.2) return { label: 'Positive', color: 'text-green-600' };
    if (score < -0.2) return { label: 'Negative', color: 'text-red-600' };
    return { label: 'Neutral', color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const analysis = report.analysis || {};
  const scores = report.scores || {};
  const sentimentInfo = getSentimentLabel(analysis.sentiment_summary?.average || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Interview Analysis Report</h2>
            {report.candidate && (
              <p className="text-sm text-blue-100 mt-1">
                {report.candidate.name} - {report.jobPosting?.title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overall Score */}
          <div className="mb-6">
            <div className={`${getScoreColor(scores.aiScore || 0)} p-6 rounded-lg text-center`}>
              <div className="text-sm font-medium mb-2">AI Performance Score</div>
              <div className="text-5xl font-bold">
                {Math.round(scores.aiScore || 0)}/100
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Sentiment Score</div>
              <div className="text-2xl font-bold">
                {Math.round((analysis.sentiment_summary?.average || 0) * 100)}
              </div>
              <div className={`text-sm mt-1 ${sentimentInfo.color}`}>
                {sentimentInfo.label}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Confidence Score</div>
              <div className="text-2xl font-bold">
                {Math.round((scores.confidenceScore || 0) * 100)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Engagement Score</div>
              <div className="text-2xl font-bold">
                {Math.round((scores.engagementScore || 0) * 100)}%
              </div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          {analysis.sentiment_summary && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">Sentiment Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-green-600 text-2xl font-bold">
                    {analysis.sentiment_summary.positive || 0}
                  </div>
                  <div className="text-sm text-gray-600">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 text-2xl font-bold">
                    {analysis.sentiment_summary.neutral || 0}
                  </div>
                  <div className="text-sm text-gray-600">Neutral</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 text-2xl font-bold">
                    {analysis.sentiment_summary.negative || 0}
                  </div>
                  <div className="text-sm text-gray-600">Negative</div>
                </div>
              </div>
            </div>
          )}

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">Strengths</h3>
              <ul className="space-y-2">
                {(analysis.strengths || []).length > 0 ? (
                  analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <span className="mr-2">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">No specific strengths identified</li>
                )}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-3">Areas for Improvement</h3>
              <ul className="space-y-2">
                {(analysis.weaknesses || []).length > 0 ? (
                  analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start">
                      <span className="mr-2">⚠</span>
                      <span>{weakness}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">No specific weaknesses identified</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="mr-2">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Skills */}
          {analysis.technical_skills_mentioned && analysis.technical_skills_mentioned.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-purple-800 mb-3">Technical Skills Mentioned</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.technical_skills_mentioned.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Transcript */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Complete Interview Transcript</h3>
            <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {report.transcript || 'No transcript available'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewReportViewer;

