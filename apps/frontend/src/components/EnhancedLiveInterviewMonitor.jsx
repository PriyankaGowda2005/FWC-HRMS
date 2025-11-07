import React, { useState, useEffect, useRef, useCallback } from 'react';
import { realtimeInterviewAPI } from '../services/api';
import {
  XMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  PlayIcon,
  StopIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const EnhancedLiveInterviewMonitor = ({ interviewId, meetingLink, onClose, candidateName, jobTitle }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [sentiment, setSentiment] = useState({ score: 0, label: 'neutral' });
  const [confidence, setConfidence] = useState(0.5);
  const [engagement, setEngagement] = useState(0.5);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const processorRef = useRef(null);
  const intervalRef = useRef(null);
  const transcriptRef = useRef([]);

  // Initialize monitoring session
  const startMonitoring = useCallback(async () => {
    try {
      setStatus('starting');
      setError(null);

      const response = await realtimeInterviewAPI.startMonitoring({
        interviewId,
        meetingLink,
        meetingPlatform: 'GENERIC'
      });

      const responseData = response.data?.data || response.data || response;
      
      if (responseData.success || response.data?.success) {
        const sessionId = responseData.data?.sessionId || responseData.sessionId;
        setSessionId(sessionId);
        setStatus('monitoring');
        return sessionId;
      } else {
        throw new Error(responseData.message || response.message || 'Failed to start monitoring');
      }
    } catch (err) {
      console.error('Start monitoring error:', err);
      setError(err.message || 'Failed to start monitoring session');
      setStatus('error');
      throw err;
    }
  }, [interviewId, meetingLink]);

  // Capture audio from browser
  const startAudioCapture = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      mediaStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      source.connect(analyser);

      // Create script processor for audio chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = async (e) => {
        if (!isRecording || !sessionId) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array for transmission
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64 for transmission
        const base64Audio = btoa(
          String.fromCharCode.apply(null, new Uint8Array(int16Data.buffer))
        );

        // Send audio chunk to backend
        try {
          await realtimeInterviewAPI.processAudio({
            sessionId,
            audioData: base64Audio,
            timestamp: Date.now() / 1000
          });
        } catch (err) {
          console.error('Error processing audio:', err);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      return true;
    } catch (err) {
      console.error('Audio capture error:', err);
      setError('Failed to access microphone. Please grant permissions.');
      return false;
    }
  }, [isRecording, sessionId]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      // Start monitoring session
      const newSessionId = await startMonitoring();
      if (!newSessionId) return;

      // Start audio capture
      const audioStarted = await startAudioCapture();
      if (!audioStarted) {
        setStatus('error');
        return;
      }

      setIsRecording(true);
      setStatus('recording');

      // Poll for live updates
      intervalRef.current = setInterval(async () => {
        try {
          const liveResponse = await realtimeInterviewAPI.getLiveData(newSessionId);
          const liveData = liveResponse.data?.data || liveResponse.data || liveResponse;
          
          if (liveData.success || liveResponse.data?.success) {
            setCurrentScore(liveData.currentScore || liveData.data?.currentScore || 0);
            setAverageScore(liveData.averageScore || liveData.data?.averageScore || 0);
            
            const analysis = liveData.latestAnalysis || liveData.data?.latestAnalysis;
            if (analysis) {
              setSentiment(analysis.sentiment || { score: 0, label: 'neutral' });
              setConfidence(analysis.confidence || 0.5);
              setEngagement(analysis.engagement || 0.5);
            }
          }
        } catch (err) {
          console.error('Error fetching live data:', err);
        }
      }, 2000); // Poll every 2 seconds

      // Fetch full session data periodically for transcript
      const fetchTranscript = async () => {
        try {
          const sessionResponse = await realtimeInterviewAPI.getSession(newSessionId);
          const sessionData = sessionResponse.data?.data || sessionResponse.data || sessionResponse;
          
          if ((sessionData.success || sessionResponse.data?.success) && sessionData.transcript) {
            setTranscript(sessionData.transcript);
            transcriptRef.current = sessionData.transcript;
          }
        } catch (err) {
          console.error('Error fetching transcript:', err);
        }
      };

      const transcriptInterval = setInterval(fetchTranscript, 5000);
      return () => clearInterval(transcriptInterval);
    } catch (err) {
      console.error('Start recording error:', err);
      setError(err.message || 'Failed to start recording');
    }
  }, [startMonitoring, startAudioCapture]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setStatus('stopping');

      // Stop audio capture
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // End monitoring and generate report
      if (sessionId) {
        const response = await realtimeInterviewAPI.endMonitoring({ sessionId });
        const responseData = response.data?.data || response.data || response;
        
        if (responseData.success || response.data?.success) {
          setFinalReport(responseData.report || responseData.data?.report);
          setStatus('completed');
        }
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      setError(err.message || 'Failed to stop recording');
    }
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getSentimentColor = (label) => {
    switch (label) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Live Interview Monitor</h2>
            <p className="text-blue-100 mt-1">
              {candidateName} - {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Status and Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full ${
                status === 'recording' ? 'bg-red-100 text-red-700' :
                status === 'monitoring' ? 'bg-blue-100 text-blue-700' :
                status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {status === 'recording' && '● Recording'}
                {status === 'monitoring' && '● Monitoring'}
                {status === 'completed' && '✓ Completed'}
                {status === 'idle' && '○ Idle'}
              </div>
              
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <PlayIcon className="w-5 h-5" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <StopIcon className="w-5 h-5" />
                  Stop Recording
                </button>
              )}
            </div>

            {meetingLink && (
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Open Meeting Link
              </a>
            )}
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Current Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                {currentScore.toFixed(0)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Average Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                {averageScore.toFixed(0)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Sentiment</div>
              <div className={`text-2xl font-bold ${getSentimentColor(sentiment.label)}`}>
                {sentiment.label}
              </div>
              <div className="text-xs text-gray-500">
                Score: {sentiment.score.toFixed(2)}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-3xl font-bold text-yellow-600">
                {(confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              Live Transcript
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {transcript.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Transcript will appear here as the interview progresses...
                </p>
              ) : (
                <div className="space-y-2">
                  {transcript.map((entry, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2">
                      <div className="text-sm text-gray-500 mb-1">
                        {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                      </div>
                      <div className="text-gray-800">{entry.text}</div>
                      {entry.sentiment && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${getSentimentColor(entry.sentiment.label)} bg-opacity-10`}>
                            {entry.sentiment.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {(entry.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Final Report */}
          {finalReport && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Final Analysis Report</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Overall AI Score</div>
                  <div className={`text-2xl font-bold ${getScoreColor(finalReport.overall_score || 0)}`}>
                    {finalReport.overall_score || 0}/100
                  </div>
                </div>
                
                {finalReport.sentiment_summary && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Sentiment Analysis</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Positive</div>
                        <div className="font-semibold text-green-700">{finalReport.sentiment_summary.positive || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Neutral</div>
                        <div className="font-semibold text-gray-700">{finalReport.sentiment_summary.neutral || 0}</div>
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Negative</div>
                        <div className="font-semibold text-red-700">{finalReport.sentiment_summary.negative || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {finalReport.strengths && finalReport.strengths.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-2">Strengths</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {finalReport.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {finalReport.weaknesses && finalReport.weaknesses.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-red-700 mb-2">Areas for Improvement</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {finalReport.weaknesses.map((weakness, idx) => (
                        <li key={idx}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {finalReport.recommendations && finalReport.recommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-blue-700 mb-2">Recommendations</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {finalReport.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLiveInterviewMonitor;

