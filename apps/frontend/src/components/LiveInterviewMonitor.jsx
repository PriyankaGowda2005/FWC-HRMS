import React, { useState, useEffect, useRef } from 'react';
import api, { realtimeInterviewAPI } from '../services/api';
import JitsiInterviewRoom from './JitsiInterviewRoom';

const LiveInterviewMonitor = ({ interviewId, onClose }) => {
  const [sessionId, setSessionId] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [trend, setTrend] = useState('stable');
  const [sentiment, setSentiment] = useState({ score: 0, label: 'neutral' });
  const [confidence, setConfidence] = useState(0.5);
  const [engagement, setEngagement] = useState(0.5);
  const [error, setError] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('GENERIC');
  const [useJitsi, setUseJitsi] = useState(false);
  const [jitsiRoomName, setJitsiRoomName] = useState('');
  const [candidateName, setCandidateName] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const transcriptIntervalRef = useRef(null);

  // Start monitoring session
  const startMonitoring = async () => {
    try {
      setError(null);
      
      // Get interview details to get meeting link
      const interviewResponse = await api.get(`/interviews/${interviewId}`);
      const interview = interviewResponse.data.data;
      
      if (!interview.meetingLink) {
        setError('Meeting link not found. Please add a meeting link to the interview.');
        return;
      }
      
      setMeetingLink(interview.meetingLink);
      setCandidateName(interview.candidate?.name || interview.candidateName || 'Candidate');
      
      // Check if using Jitsi Meet
      const platform = detectMeetingPlatform(interview.meetingLink);
      const isJitsi = platform === 'JITSI' || interview.meetingLink?.includes('meet.jit.si') || interview.meetingLink?.includes('jitsi');
      
      if (isJitsi) {
        setUseJitsi(true);
        // Extract room name from Jitsi URL or generate one
        const urlParts = interview.meetingLink.split('/');
        const roomName = urlParts[urlParts.length - 1].split('?')[0] || `interview-${interviewId}-${Date.now()}`;
        setJitsiRoomName(roomName);
      }
      
      // Start monitoring session on backend
      const response = await realtimeInterviewAPI.startMonitoring({
        interviewId,
        meetingLink: interview.meetingLink,
        meetingPlatform: platform
      });
      
      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        setMeetingPlatform(response.data.data.meetingPlatform);
        setIsMonitoring(true);
        
        // Start audio capture
        await startAudioCapture();
        
        // Start periodic updates
        startPeriodicUpdates(response.data.data.sessionId);
      }
    } catch (err) {
      console.error('Error starting monitoring:', err);
      setError(err.response?.data?.message || 'Failed to start monitoring');
    }
  };

  // Detect meeting platform from URL
  const detectMeetingPlatform = (url) => {
    if (!url) return 'GENERIC';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('meet.jit.si') || lowerUrl.includes('jitsi')) return 'JITSI';
    if (lowerUrl.includes('zoom.us') || lowerUrl.includes('zoom.com')) return 'ZOOM';
    if (lowerUrl.includes('meet.google.com')) return 'GOOGLE_MEET';
    if (lowerUrl.includes('teams.microsoft.com')) return 'TEAMS';
    if (lowerUrl.includes('webex.com')) return 'WEBEX';
    if (lowerUrl.includes('openvidu')) return 'OPENVIDU';
    return 'GENERIC';
  };

  // Start capturing audio from browser
  const startAudioCapture = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      
      // Create AudioContext for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && sessionId) {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            
            // Send to backend for processing
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
          reader.readAsDataURL(event.data);
        }
      };
      
      // Start recording in chunks (every 3 seconds)
      mediaRecorder.start(3000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please allow microphone access to monitor the interview.');
    }
  };

  // Start periodic updates to get latest analysis
  const startPeriodicUpdates = (sessionId) => {
    // Update every 2 seconds
        transcriptIntervalRef.current = setInterval(async () => {
          try {
            const response = await realtimeInterviewAPI.getLiveData(sessionId);
        if (response.data.success) {
          const data = response.data.data;
          setCurrentScore(data.currentScore || 0);
          setAverageScore(data.averageScore || 0);
          setTrend(data.trend || 'stable');
          
          if (data.latestAnalysis) {
            setSentiment(data.latestAnalysis.sentiment || { score: 0, label: 'neutral' });
            setConfidence(data.latestAnalysis.confidence || 0.5);
            setEngagement(data.latestAnalysis.engagement || 0.5);
          }
        }
      } catch (err) {
        console.error('Error fetching live data:', err);
      }
    }, 2000);
    
        // Get full session data every 10 seconds
        intervalRef.current = setInterval(async () => {
          try {
            const response = await realtimeInterviewAPI.getSession(sessionId);
        if (response.data.success) {
          const session = response.data.data;
          if (session.transcript) {
            setTranscript(session.transcript);
          }
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
      }
    }, 10000);
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    try {
      // Stop audio capture
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Clear intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (transcriptIntervalRef.current) {
        clearInterval(transcriptIntervalRef.current);
      }
      
      // End monitoring session and generate report
      if (sessionId) {
        await realtimeInterviewAPI.endMonitoring({ sessionId });
      }
      
      setIsMonitoring(false);
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error stopping monitoring:', err);
      setError('Error stopping monitoring: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (transcriptIntervalRef.current) {
        clearInterval(transcriptIntervalRef.current);
      }
    };
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentColor = (label) => {
    if (label === 'positive') return 'text-green-600';
    if (label === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Live Interview Monitor</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!isMonitoring ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Start monitoring to capture and analyze the interview in real-time.
              </p>
              <button
                onClick={startMonitoring}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Start Monitoring
              </button>
              <p className="text-sm text-gray-500 mt-4">
                {useJitsi 
                  ? 'Jitsi Meet room will open automatically for video/audio.'
                  : 'Note: You\'ll need to allow microphone access to capture audio from the meeting.'}
              </p>
            </div>
          ) : useJitsi ? (
            <div className="space-y-6">
              {/* Jitsi Video Interface */}
              <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <JitsiInterviewRoom
                  roomName={jitsiRoomName}
                  interviewId={interviewId}
                  candidateName={candidateName}
                  onTranscriptUpdate={(text) => {
                    // Handle transcript updates from Jitsi
                    setTranscript(prev => [...prev, {
                      text,
                      timestamp: Date.now() / 1000
                    }]);
                  }}
                  onAudioStreamReady={(stream) => {
                    console.log('Audio stream ready from Jitsi');
                  }}
                  displayName="Interviewer"
                  isModerator={true}
                />
              </div>
              
              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Current Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                    {Math.round(currentScore)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Average Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                    {Math.round(averageScore)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Trend</div>
                  <div className="text-3xl font-bold">
                    {getTrendIcon(trend)} {trend}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="text-3xl font-bold">
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Sentiment and Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Sentiment</div>
                  <div className={`text-2xl font-semibold ${getSentimentColor(sentiment.label)}`}>
                    {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {sentiment.score?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Engagement</div>
                  <div className="text-2xl font-semibold">
                    {Math.round(engagement * 100)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${engagement * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Live Transcript */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Live Transcript</h3>
                <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                  {transcript.length > 0 ? (
                    <div className="space-y-2">
                      {transcript.map((entry, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-gray-500">
                            [{new Date(entry.timestamp * 1000).toLocaleTimeString()}]
                          </span>
                          <span className="ml-2">{entry.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Waiting for audio input...</p>
                  )}
                </div>
              </div>

              {/* Meeting Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Meeting Platform</div>
                <div className="font-semibold">{meetingPlatform}</div>
                {meetingLink && (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Open Meeting →
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Generic Monitoring Interface */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Monitoring Active</h3>
                <p className="text-gray-600 mb-4">
                  Audio is being captured and analyzed in real-time. Join the meeting using the link below.
                </p>
                {meetingLink && (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Open Meeting Link →
                  </a>
                )}
              </div>

              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Current Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                    {Math.round(currentScore)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Average Score</div>
                  <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                    {Math.round(averageScore)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Trend</div>
                  <div className="text-3xl font-bold">
                    {getTrendIcon(trend)} {trend}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="text-3xl font-bold">
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Sentiment and Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Sentiment</div>
                  <div className={`text-2xl font-semibold ${getSentimentColor(sentiment.label)}`}>
                    {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {sentiment.score?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Engagement</div>
                  <div className="text-2xl font-semibold">
                    {Math.round(engagement * 100)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${engagement * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Live Transcript */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Live Transcript</h3>
                <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                  {transcript.length > 0 ? (
                    <div className="space-y-2">
                      {transcript.map((entry, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-gray-500">
                            [{new Date(entry.timestamp * 1000).toLocaleTimeString()}]
                          </span>
                          <span className="ml-2">{entry.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Waiting for audio input...</p>
                  )}
                </div>
              </div>

              {/* Meeting Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Meeting Platform</div>
                <div className="font-semibold">{meetingPlatform}</div>
                {meetingLink && (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Open Meeting →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isMonitoring && (
          <div className="bg-gray-100 p-4 flex justify-end space-x-4">
            <button
              onClick={stopMonitoring}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold"
            >
              End Monitoring & Generate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveInterviewMonitor;

