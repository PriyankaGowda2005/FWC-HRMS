import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  HeartIcon,
  CpuChipIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  SignalIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const ZoomInterviewDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [confidenceData, setConfidenceData] = useState([]);
  const [stressData, setStressData] = useState([]);
  const [currentScores, setCurrentScores] = useState({
    overall: 0,
    sentiment: 0,
    confidence: 0,
    stress: 0,
    engagement: 0
  });
  const [aiFeedback, setAiFeedback] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({
    meetingId: '',
    jobRole: '',
    duration: 0,
    participants: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const websocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analysisIntervalRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      if (sessionId) {
        const wsUrl = `ws://localhost:8000/api/zoom/live-feed/${sessionId}`;
        websocketRef.current = new WebSocket(wsUrl);

        websocketRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        websocketRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };

        websocketRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        websocketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      }
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [sessionId]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'transcription_result':
        handleTranscriptionResult(data.data);
        break;
      case 'analysis_result':
        handleAnalysisResult(data.data);
        break;
      case 'session_data':
        setSessionInfo(data.data);
        break;
      case 'session_ended':
        handleSessionEnd(data.data);
        break;
      case 'error':
        console.error('WebSocket error:', data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleTranscriptionResult = (data) => {
    const newTranscript = {
      id: Date.now(),
      text: data.text,
      timestamp: data.timestamp,
      confidence: data.confidence
    };

    setTranscriptHistory(prev => [...prev, newTranscript]);
    setCurrentTranscript(data.text);

    // Add to sentiment data
    setSentimentData(prev => [...prev, {
      timestamp: data.timestamp,
      score: data.sentiment_score * 100
    }]);

    // Add to confidence data
    setConfidenceData(prev => [...prev, {
      timestamp: data.timestamp,
      score: data.confidence * 100
    }]);
  };

  const handleAnalysisResult = (data) => {
    // Update current scores
    setCurrentScores({
      overall: data.overall_score,
      sentiment: data.sentiment_score * 100,
      confidence: data.confidence_score * 100,
      stress: data.stress_level * 100,
      engagement: data.engagement_score * 100
    });

    // Add to emotion data
    if (data.emotion_scores) {
      const emotionEntry = {
        timestamp: data.timestamp,
        ...data.emotion_scores
      };
      setEmotionData(prev => [...prev, emotionEntry]);
    }

    // Add to stress data
    setStressData(prev => [...prev, {
      timestamp: data.timestamp,
      level: data.stress_level * 100
    }]);

    // Generate AI feedback
    generateAIFeedback(data);
  };

  const generateAIFeedback = (data) => {
    const feedback = [];
    
    if (data.sentiment_score > 0.7) {
      feedback.push({ type: 'positive', message: 'Great positive sentiment!' });
    } else if (data.sentiment_score < -0.3) {
      feedback.push({ type: 'warning', message: 'Negative sentiment detected' });
    }

    if (data.confidence_score > 0.8) {
      feedback.push({ type: 'positive', message: 'High confidence level' });
    } else if (data.confidence_score < 0.4) {
      feedback.push({ type: 'suggestion', message: 'Consider building more confidence' });
    }

    if (data.stress_level > 0.7) {
      feedback.push({ type: 'warning', message: 'High stress levels detected' });
    }

    if (data.technical_skills && data.technical_skills.length > 0) {
      feedback.push({ 
        type: 'info', 
        message: `Technical skills mentioned: ${data.technical_skills.join(', ')}` 
      });
    }

    if (feedback.length > 0) {
      setAiFeedback(prev => [...prev, ...feedback.map(f => ({
        ...f,
        id: Date.now() + Math.random(),
        timestamp: data.timestamp
      }))]);
    }
  };

  const handleSessionEnd = (data) => {
    setIsRecording(false);
    setIsAnalyzing(false);
    
    if (data.final_summary) {
      setAiFeedback(prev => [...prev, {
        id: Date.now(),
        type: 'summary',
        message: `Interview completed! Final score: ${data.final_summary.overall_score.toFixed(1)}%`,
        timestamp: Date.now()
      }]);
    }
  };

  const startInterviewSession = async () => {
    try {
      const response = await fetch('/api/zoom/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: 'demo-meeting-123',
          job_role: 'Software Engineer',
          job_requirements: ['JavaScript', 'React', 'Node.js', 'Python'],
          candidate_id: 'candidate-123'
        })
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(data.session_id);
        setSessionInfo({
          meetingId: 'demo-meeting-123',
          jobRole: 'Software Engineer',
          duration: 0,
          participants: ['Interviewer', 'Candidate']
        });
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioChunk(audioBlob);
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setIsAnalyzing(true);

      // Start analysis interval
      analysisIntervalRef.current = setInterval(() => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            type: 'ping'
          }));
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnalyzing(false);

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    }
  };

  const sendAudioChunk = async (audioBlob) => {
    if (!sessionId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result.split(',')[1];
      
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'audio_chunk',
          session_id: sessionId,
          audio_data: base64Audio,
          timestamp: Date.now() / 1000
        }));
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const endInterviewSession = async () => {
    try {
      const response = await fetch(`/api/zoom/session/${sessionId}/end`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        console.log('Session ended:', data);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/zoom/session/${sessionId}/scores`);
      const data = await response.json();
      
      if (data.success) {
        // Generate and download report
        const reportData = {
          sessionInfo,
          transcriptHistory,
          scores: data,
          emotionData,
          sentimentData,
          confidenceData,
          stressData,
          aiFeedback
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-report-${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <VideoCameraIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Zoom Interview Analysis</h1>
                <p className="text-sm text-gray-600">Real-time AI-powered interview monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <SignalIcon className="h-4 w-4" />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              
              {!sessionId ? (
                <button
                  onClick={startInterviewSession}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Session
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <StopIcon className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <MicrophoneIcon className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={endInterviewSession}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    End Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!sessionId ? (
          <div className="text-center py-12">
            <VideoCameraIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Interview Session</h3>
            <p className="mt-2 text-sm text-gray-500">
              Click "Start Session" to begin real-time interview analysis
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Transcript and Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Session Information</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{sessionInfo.duration}m</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{sessionInfo.participants.length} participants</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Meeting ID</p>
                    <p className="font-medium">{sessionInfo.meetingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Job Role</p>
                    <p className="font-medium">{sessionInfo.jobRole}</p>
                  </div>
                </div>
              </div>

              {/* Live Transcript */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
                  <div className="flex items-center space-x-2">
                    {isAnalyzing && (
                      <div className="flex items-center space-x-1 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Analyzing...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <AnimatePresence>
                    {transcriptHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-2 p-2 bg-white rounded border-l-4 border-blue-500"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-900">{item.text}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{item.confidence.toFixed(1)}%</span>
                            <span>{new Date(item.timestamp * 1000).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {currentTranscript && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-2 bg-blue-50 rounded border-l-4 border-blue-600"
                    >
                      <p className="text-sm text-gray-900 font-medium">{currentTranscript}</p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* AI Feedback Feed */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Feedback</h3>
                
                <div className="h-48 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {aiFeedback.map((feedback) => (
                      <motion.div
                        key={feedback.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-3 rounded-lg border-l-4 ${
                          feedback.type === 'positive' ? 'bg-green-50 border-green-500' :
                          feedback.type === 'warning' ? 'bg-red-50 border-red-500' :
                          feedback.type === 'suggestion' ? 'bg-yellow-50 border-yellow-500' :
                          feedback.type === 'info' ? 'bg-blue-50 border-blue-500' :
                          'bg-gray-50 border-gray-500'
                        }`}
                      >
                        <p className="text-sm text-gray-900">{feedback.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(feedback.timestamp * 1000).toLocaleTimeString()}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right Column - Analytics and Charts */}
            <div className="space-y-6">
              {/* Current Scores */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Scores</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Overall Score</span>
                      <span className="text-sm font-bold text-blue-600">{currentScores.overall.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentScores.overall}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Confidence</span>
                      <span className="text-sm font-bold text-green-600">{currentScores.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentScores.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Stress Level</span>
                      <span className="text-sm font-bold text-red-600">{currentScores.stress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentScores.stress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Engagement</span>
                      <span className="text-sm font-bold text-purple-600">{currentScores.engagement.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentScores.engagement}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Trend Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trend</h3>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value * 1000).toLocaleTimeString()}
                      />
                      <YAxis domain={[-100, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value * 1000).toLocaleTimeString()}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Sentiment']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Confidence vs Stress Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence vs Stress</h3>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value * 1000).toLocaleTimeString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value * 1000).toLocaleTimeString()}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Confidence']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Download Report */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Report</h3>
                
                <button
                  onClick={downloadReport}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoomInterviewDashboard;
