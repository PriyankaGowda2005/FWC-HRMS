import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  EyeIcon,
  HeartIcon,
  CpuChipIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AIInterview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [interviewSession, setInterviewSession] = useState(null);
  const [emotionData, setEmotionData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const websocketRef = useRef(null);
  const intervalRef = useRef(null);

  // Mock interview questions
  const mockQuestions = [
    {
      id: '1',
      question: "Tell me about yourself and your experience with software development.",
      category: "General",
      timeLimit: 300,
      keywords: ["experience", "software", "development", "background"]
    },
    {
      id: '2',
      question: "How do you approach debugging a complex issue in production?",
      category: "Technical",
      timeLimit: 240,
      keywords: ["debugging", "production", "troubleshooting", "analysis"]
    },
    {
      id: '3',
      question: "Describe a time when you had to work with a difficult team member.",
      category: "Behavioral",
      timeLimit: 180,
      keywords: ["teamwork", "conflict", "communication", "collaboration"]
    },
    {
      id: '4',
      question: "How would you design a scalable microservices architecture?",
      category: "System Design",
      timeLimit: 300,
      keywords: ["microservices", "scalability", "architecture", "design"]
    }
  ];

  useEffect(() => {
    // Initialize interview session
    setCurrentQuestion(mockQuestions[0]);
    setTimeRemaining(mockQuestions[0].timeLimit);
    
    // Start timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraOn(true);
      
      // Start emotion analysis
      startEmotionAnalysis();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
    setIsRecording(false);
  };

  const startEmotionAnalysis = () => {
    // Connect to WebSocket for real-time emotion analysis
    websocketRef.current = new WebSocket('ws://localhost:8000/ws/interview/session_123');
    
    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'emotion_update') {
        setEmotionData(data.data);
      }
    };

    // Capture frames for emotion analysis
    const captureFrame = () => {
      if (videoRef.current && canvasRef.current && isCameraOn) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            type: 'emotion_analysis',
            image_data: imageData
          }));
        }
      }
      
      if (isCameraOn) {
        setTimeout(captureFrame, 1000); // Capture every second
      }
    };
    
    captureFrame();
  };

  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, you would start audio recording here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // In a real implementation, you would stop audio recording and process the transcript
  };

  const handleNextQuestion = () => {
    if (questionIndex < mockQuestions.length - 1) {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setCurrentQuestion(mockQuestions[nextIndex]);
      setTimeRemaining(mockQuestions[nextIndex].timeLimit);
    } else {
      // Interview completed
      setCurrentQuestion(null);
      setTimeRemaining(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const submitAnswer = async (answer) => {
    setIsLoading(true);
    try {
      // Simulate API call to submit answer
      const response = await fetch('/api/interview/answer/session_123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_text: answer,
          question_id: currentQuestion.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAnswers(prev => [...prev, {
          question: currentQuestion.question,
          answer: answer,
          score: data.data.answer_feedback?.score_breakdown?.overall_score || 0,
          feedback: data.data.answer_feedback?.message || ''
        }]);
        
        handleNextQuestion();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'text-green-600 bg-green-100',
      sad: 'text-blue-600 bg-blue-100',
      angry: 'text-red-600 bg-red-100',
      fear: 'text-purple-600 bg-purple-100',
      surprise: 'text-yellow-600 bg-yellow-100',
      disgust: 'text-orange-600 bg-orange-100',
      neutral: 'text-gray-600 bg-gray-100'
    };
    return colors[emotion] || colors.neutral;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <VideoCameraIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Interview</h1>
          </motion.div>
          <p className="text-lg text-gray-600">
            Real-time emotion analysis and intelligent scoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Feed */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Video Feed</h3>
                <div className="flex space-x-2">
                  {!isCameraOn ? (
                    <button
                      onClick={startCamera}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Enable Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Disable Camera
                    </button>
                  )}
                </div>
              </div>
              
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: isCameraOn ? 'block' : 'none' }}
                />
                
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Camera disabled</p>
                    </div>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Current Question</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span className="font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-lg text-blue-900 font-medium mb-2">
                    Question {questionIndex + 1} of {mockQuestions.length}
                  </p>
                  <p className="text-blue-800">{currentQuestion.question}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentQuestion.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <MicrophoneIcon className="h-5 w-5 mr-2" />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <StopIcon className="h-5 w-5 mr-2" />
                      Stop Recording
                    </button>
                  )}
                  
                  <button
                    onClick={() => submitAnswer("Sample answer for demonstration")}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center"
              >
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Completed!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for completing the AI interview. Your responses have been analyzed.
                </p>
                <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  View Results
                </button>
              </motion.div>
            )}
          </div>

          {/* Real-time Analysis Sidebar */}
          <div className="space-y-6">
            {/* Emotion Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <HeartIcon className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Emotion Analysis</h3>
              </div>
              
              {emotionData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getEmotionColor(emotionData.emotion)}`}>
                      <HeartIcon className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {emotionData.emotion}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round(emotionData.confidence * 100)}% confidence
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Emotion Distribution</h4>
                    {emotionData.all_emotions && Object.entries(emotionData.all_emotions).map(([emotion, score]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{emotion}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Enable camera to start emotion analysis</p>
                </div>
              )}
            </div>

            {/* Sentiment Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CpuChipIcon className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h3>
              </div>
              
              {sentimentData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${
                      sentimentData.sentiment === 'positive' ? 'text-green-600 bg-green-100' :
                      sentimentData.sentiment === 'negative' ? 'text-red-600 bg-red-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      <CpuChipIcon className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {sentimentData.sentiment}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round(sentimentData.sentiment_score * 100)}% confidence
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CpuChipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Start speaking to analyze sentiment</p>
                </div>
              )}
            </div>

            {/* Interview Progress */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ChartBarIcon className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {questionIndex} / {mockQuestions.length}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(questionIndex / mockQuestions.length) * 100}%` }}
                  />
                </div>
                
                <div className="space-y-2">
                  {answers.map((answer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Q{index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          answer.score >= 80 ? 'bg-green-500' :
                          answer.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(answer.score)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterview;
