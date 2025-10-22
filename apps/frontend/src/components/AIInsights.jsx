import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { aiAPI } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const AIInsights = ({ type = 'hr', managerId = null, className = '' }) => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Debug logging
  console.log('AIInsights - type:', type, 'managerId:', managerId, 'typeof managerId:', typeof managerId)

  // Fetch AI insights based on type
  const { data: aiData, isLoading, error: queryError, refetch } = useQuery(
    ['ai-insights', type, managerId],
    () => {
      if (type === 'hr') {
        return aiAPI.getHRInsights()
      } else if (type === 'team' && managerId) {
        return aiAPI.getTeamInsights(managerId)
      } else if (type === 'recruitment') {
        return aiAPI.getRecruitmentInsights()
      }
      return Promise.resolve({ insights: null })
    },
    {
      enabled: Boolean(type === 'hr' || (type === 'team' && managerId) || type === 'recruitment'),
      refetchInterval: 60000, // Refetch every minute for real-time insights
      refetchOnWindowFocus: true,
      staleTime: 30000, // Consider data stale after 30 seconds
      refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    }
  )

  useEffect(() => {
    if (aiData) {
      console.log('AI Data received:', aiData)
      setInsights(aiData.insights || aiData)
      setLoading(false)
    }
    if (queryError) {
      console.error('AI Query Error:', queryError)
      setError(queryError)
      setLoading(false)
    }
    // If query is disabled, stop loading
    if (!Boolean(type === 'hr' || (type === 'team' && managerId) || type === 'recruitment')) {
      setLoading(false)
    }
  }, [aiData, queryError, type, managerId])

  if ((loading || isLoading) && Boolean(type === 'hr' || (type === 'team' && managerId) || type === 'recruitment')) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading AI insights...</span>
        </div>
      </div>
    )
  }

  if (error || !insights) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">AI Insights Unavailable</h3>
          <p className="mt-2 text-gray-600">
            Unable to load AI insights at this time. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {type === 'hr' ? 'AI-Powered HR Insights' : 
           type === 'recruitment' ? 'AI-Powered Recruitment Insights' : 
           'AI Team Insights'}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Live</span>
          {insights.generatedAt && (
            <span className="text-xs text-gray-400">
              • {new Date(insights.generatedAt).toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={() => refetch()}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh AI Insights"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Recruitment-specific insights */}
      {type === 'recruitment' && insights.metrics && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Recruitment Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-900">Total Applications</h5>
                <span className="text-sm font-bold text-blue-600">
                  {insights.metrics.totalApplications}
                </span>
              </div>
              <p className="text-sm text-blue-800">
                {insights.trends?.applicationTrend === 'increasing' ? '↗️ Increasing' : '↘️ Decreasing'}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-green-900">Hires Completed</h5>
                <span className="text-sm font-bold text-green-600">
                  {insights.metrics.hiresCompleted}
                </span>
              </div>
              <p className="text-sm text-green-800">
                Avg. {insights.metrics.averageTimeToHire} days to hire
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-purple-900">Quality Score</h5>
                <span className="text-sm font-bold text-purple-600">
                  {insights.metrics.candidateQualityScore}%
                </span>
              </div>
              <p className="text-sm text-purple-800">
                Candidate assessment quality
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Section */}
      {insights.predictions && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Predictions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.predictions.retentionRisk !== undefined && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-blue-900">Retention Risk</h5>
                  <span className={`text-sm font-bold ${
                    insights.predictions.retentionRisk > 70 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {insights.predictions.retentionRisk}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      insights.predictions.retentionRisk > 70 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${insights.predictions.retentionRisk}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-800 mt-2">
                  {insights.predictions.retentionRisk > 70 
                    ? 'High risk employees identified' 
                    : 'Low retention risk'}
                </p>
              </div>
            )}

            {insights.predictions.performanceScore !== undefined && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-green-900">Performance Score</h5>
                  <span className="text-sm font-bold text-green-600">
                    {insights.predictions.performanceScore}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${insights.predictions.performanceScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-green-800 mt-2">
                  Expected team performance for next quarter
                </p>
              </div>
            )}

            {insights.predictions.salaryOptimization !== undefined && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-purple-900">Salary Optimization</h5>
                  <span className="text-sm font-bold text-purple-600">
                    ${insights.predictions.salaryOptimization}K
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(insights.predictions.salaryOptimization / 10, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-purple-800 mt-2">
                  Potential savings through salary optimization
                </p>
              </div>
            )}

            {/* Recruitment-specific predictions */}
            {type === 'recruitment' && insights.predictions.nextMonthApplications !== undefined && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-orange-900">Next Month Applications</h5>
                  <span className="text-sm font-bold text-orange-600">
                    {insights.predictions.nextMonthApplications}
                  </span>
                </div>
                <p className="text-sm text-orange-800">
                  Predicted application volume
                </p>
              </div>
            )}

            {type === 'recruitment' && insights.predictions.hiringVelocity !== undefined && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-indigo-900">Hiring Velocity</h5>
                  <span className="text-sm font-bold text-indigo-600">
                    {insights.predictions.hiringVelocity}%
                  </span>
                </div>
                <p className="text-sm text-indigo-800">
                  Speed of hiring process
                </p>
              </div>
            )}

            {type === 'recruitment' && insights.predictions.skillGaps && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-red-900">Skill Gaps</h5>
                  <span className="text-sm font-bold text-red-600">
                    {insights.predictions.skillGaps.length}
                  </span>
                </div>
                <div className="text-sm text-red-800">
                  {insights.predictions.skillGaps.slice(0, 2).join(', ')}
                  {insights.predictions.skillGaps.length > 2 && '...'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trends Section */}
      {insights.trends && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Trends</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.trends.employeeSatisfaction !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Employee Satisfaction</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${insights.trends.employeeSatisfaction}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {insights.trends.employeeSatisfaction}%
                  </span>
                </div>
              </div>
            )}

            {insights.trends.productivityTrend && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Productivity Trend</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${
                    insights.trends.productivityTrend === 'increasing' ? 'text-green-600' :
                    insights.trends.productivityTrend === 'decreasing' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {insights.trends.productivityTrend}
                  </span>
                  <svg className={`w-4 h-4 ${
                    insights.trends.productivityTrend === 'increasing' ? 'text-green-600' :
                    insights.trends.productivityTrend === 'decreasing' ? 'text-red-600' :
                    'text-yellow-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {insights.trends.productivityTrend === 'increasing' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    ) : insights.trends.productivityTrend === 'decreasing' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    )}
                  </svg>
                </div>
              </div>
            )}

            {/* Recruitment-specific trends */}
            {type === 'recruitment' && insights.trends.interviewConversionRate !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Interview Conversion Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${insights.trends.interviewConversionRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {insights.trends.interviewConversionRate}%
                  </span>
                </div>
              </div>
            )}

            {type === 'recruitment' && insights.trends.offerAcceptanceRate !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Offer Acceptance Rate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${insights.trends.offerAcceptanceRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {insights.trends.offerAcceptanceRate}%
                  </span>
                </div>
              </div>
            )}

            {type === 'recruitment' && insights.trends.timeToHireTrend && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Time to Hire Trend</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${
                    insights.trends.timeToHireTrend === 'decreasing' ? 'text-green-600' :
                    insights.trends.timeToHireTrend === 'increasing' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {insights.trends.timeToHireTrend === 'decreasing' ? '↘️ Decreasing' :
                     insights.trends.timeToHireTrend === 'increasing' ? '↗️ Increasing' : '→ Stable'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">AI Recommendations</h4>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Sources Section for Recruitment */}
      {type === 'recruitment' && insights.topSources && insights.topSources.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Top Application Sources</h4>
          <div className="space-y-3">
            {insights.topSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{source.source}</h5>
                    <p className="text-sm text-gray-600">{source.applications} applications</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">{source.conversion}%</span>
                  <p className="text-xs text-gray-500">conversion rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths and Areas for Improvement */}
      {(insights.strengths || insights.areasForImprovement) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.strengths && insights.strengths.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-green-900 mb-3">Strengths</h4>
              <div className="space-y-2">
                {insights.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.areasForImprovement && insights.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-yellow-900 mb-3">Areas for Improvement</h4>
              <div className="space-y-2">
                {insights.areasForImprovement.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-yellow-800">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated timestamp */}
      {insights.generatedAt && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(insights.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

export default AIInsights

