import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

const JitsiInterviewRoom = ({ 
  roomName, 
  interviewId, 
  candidateName,
  onTranscriptUpdate,
  onAudioStreamReady,
  displayName = 'Interviewer',
  isModerator = true
}) => {
  const jitsiContainerRef = useRef(null);
  const [jitsiApi, setJitsiApi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);
  const mediaStreamDestinationRef = useRef(null);
  const audioProcessorRef = useRef(null);

  useEffect(() => {
    // Load Jitsi Meet API
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript();

        if (!window.JitsiMeetExternalAPI) {
          throw new Error('Jitsi Meet API failed to load');
        }

        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName || `interview-${interviewId}-${Date.now()}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableLayerSuspension: true,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            enableTalkWhileMuted: false,
            disableAP: false,
            disableAEC: false,
            disableNS: false,
            disableAGC: false,
            disableHPF: false,
            enableTCC: true,
            useStunTurn: true,
            channelLastN: -1,
            startAudioOnly: false,
            startAudioMuted: false,
            startVideoMuted: false,
            enableRemb: true,
            enableRtpStats: true,
            openBridgeChannel: 'websocket',
            enableAnalytics: false
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            DISPLAY_WELCOME_PAGE: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
            APP_NAME: 'Interview Room',
            NATIVE_APP_NAME: 'Interview Room',
            PROVIDER_NAME: 'HRMS',
            DEFAULT_BACKGROUND: '#474747',
            DEFAULT_WELCOME_PAGE_LOGO_URL: '',
            DEFAULT_LOGO_URL: '',
            HIDE_INVITE_MORE_HEADER: false,
            INITIAL_TOOLBAR_TIMEOUT: 20000,
            TOOLBAR_TIMEOUT: 4000,
            TOOLBAR_ALWAYS_VISIBLE: false,
            TOOLBAR_BUTTONS_WIDTH: 77,
            TOOLBAR_BUTTONS_HEIGHT: 25,
            MAIN_TOOLBAR_HEIGHT: 60,
            FILM_STRIP_MAX_HEIGHT: 90,
            TILE_VIEW_GRID_SIZE: 5,
            VERTICAL_FILMSTRIP: true,
            CLOSE_PAGE_GUEST_HINT: false,
            RANDOM_MEETING_ID: false,
            ENABLE_RECORDING: false,
            DISABLE_RINGING: false,
            AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
            AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',
            POLICY_LOGO: null,
            JITSI_WATERMARK_LINK: '',
            MOBILE_APP_PROMO: false,
            CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
            CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
            CONNECTION_INDICATOR_DISABLED: false
          },
          userInfo: {
            displayName: displayName,
            email: ''
          }
        };

        const jitsiApiInstance = new window.JitsiMeetExternalAPI(domain, options);
        setJitsiApi(jitsiApiInstance);

        // Event listeners
        jitsiApiInstance.addEventListener('videoConferenceJoined', (event) => {
          console.log('Joined conference:', event);
          setIsConnected(true);
          setError(null);
          
          // Start audio capture after joining
          setTimeout(() => {
            captureAudioStream(jitsiApiInstance);
          }, 2000);
        });

        jitsiApiInstance.addEventListener('audioMuteStatusChanged', (event) => {
          console.log('Audio mute status:', event);
        });

        jitsiApiInstance.addEventListener('videoMuteStatusChanged', (event) => {
          console.log('Video mute status:', event);
        });

        jitsiApiInstance.addEventListener('participantJoined', (event) => {
          console.log('Participant joined:', event);
        });

        jitsiApiInstance.addEventListener('participantLeft', (event) => {
          console.log('Participant left:', event);
        });

        jitsiApiInstance.addEventListener('readyToClose', () => {
          console.log('Ready to close');
          cleanup();
        });

        jitsiApiInstance.addEventListener('errorOccurred', (error) => {
          console.error('Jitsi error:', error);
          setError(error.errorMsg || 'An error occurred');
        });

        // Handle transcript events if available
        jitsiApiInstance.addEventListener('transcriptionStatusChanged', (event) => {
          console.log('Transcription status:', event);
        });

        // Cleanup on unmount
        return () => {
          cleanup();
        };

      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError(err.message || 'Failed to initialize video conference');
      }
    };

    const captureAudioStream = async (jitsiApiInstance) => {
      try {
        // Get local audio track from Jitsi
        const tracks = jitsiApiInstance.getLocalTracks();
        const audioTrack = tracks.find(track => track.getType() === 'audio');

        if (!audioTrack) {
          console.warn('No audio track found');
          return;
        }

        // Create audio context for processing
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
        audioContextRef.current = audioContext;

        // Create media stream source from Jitsi audio track
        const mediaStream = new MediaStream([audioTrack.track]);
        const source = audioContext.createMediaStreamSource(mediaStream);

        // Create script processor for audio chunks
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array for backend
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }

          // Send audio chunk to backend
          sendAudioChunk(int16Data.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        audioProcessorRef.current = processor;

        // Notify parent component
        if (onAudioStreamReady) {
          onAudioStreamReady(mediaStream);
        }

      } catch (err) {
        console.error('Error capturing audio stream:', err);
        setError('Failed to capture audio stream');
      }
    };

    const sendAudioChunk = async (audioBuffer) => {
      try {
        // Convert ArrayBuffer to base64
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(audioBuffer))
        );

        // Send to backend for transcription
        await api.post('/realtime-interview/process-audio', {
          interviewId,
          audioData: base64Audio,
          timestamp: Date.now() / 1000,
          format: 'pcm',
          sampleRate: 16000
        });

      } catch (err) {
        console.error('Error sending audio chunk:', err);
      }
    };

    const cleanup = () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (jitsiApi) {
        jitsiApi.dispose();
        setJitsiApi(null);
      }
    };

    if (roomName && interviewId) {
      initializeJitsi();
    }

    return cleanup;
  }, [roomName, interviewId]);

  return (
    <div className="w-full h-full relative">
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-10">
          {error}
        </div>
      )}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />
      {!isConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to interview room...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JitsiInterviewRoom;

