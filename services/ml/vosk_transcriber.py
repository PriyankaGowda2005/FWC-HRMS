"""
Vosk-based Real-time Speech-to-Text Transcriber
Provides real-time transcription using Vosk offline STT engine
"""

import json
import logging
import asyncio
import base64
from typing import Optional, AsyncGenerator
from vosk import Model, KaldiRecognizer, SetLogLevel
import io
import wave
import struct

logger = logging.getLogger(__name__)

# Suppress Vosk logging
SetLogLevel(-1)

class VoskTranscriber:
    """Real-time transcription using Vosk"""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize Vosk transcriber
        
        Args:
            model_path: Path to Vosk model directory. If None, uses default model.
        """
        self.model_path = model_path or "vosk-model-en-us-0.22"
        self.model = None
        self.recognizer = None
        self.sample_rate = 16000
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Vosk model"""
        try:
            import os
            if os.path.exists(self.model_path):
                self.model = Model(self.model_path)
                self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
                logger.info(f"Vosk model loaded from {self.model_path}")
            else:
                logger.warning(f"Vosk model not found at {self.model_path}, using fallback")
                self.model = None
        except Exception as e:
            logger.error(f"Error loading Vosk model: {e}")
            self.model = None
    
    def transcribe_audio_chunk(self, audio_data: bytes, sample_rate: int = 16000) -> dict:
        """
        Transcribe a single audio chunk
        
        Args:
            audio_data: Raw audio bytes (PCM format)
            sample_rate: Sample rate of audio (default 16000)
            
        Returns:
            dict with 'text', 'confidence', and 'partial' keys
        """
        if not self.model or not self.recognizer:
            return {
                'text': '',
                'confidence': 0.0,
                'partial': False
            }
        
        try:
            # Ensure recognizer matches sample rate
            if sample_rate != self.sample_rate:
                self.recognizer = KaldiRecognizer(self.model, sample_rate)
                self.sample_rate = sample_rate
            
            # Process audio chunk
            if self.recognizer.AcceptWaveform(audio_data):
                result = json.loads(self.recognizer.Result())
                return {
                    'text': result.get('text', ''),
                    'confidence': 1.0,  # Vosk doesn't provide confidence, assume high
                    'partial': False
                }
            else:
                # Partial result
                partial_result = json.loads(self.recognizer.PartialResult())
                return {
                    'text': partial_result.get('partial', ''),
                    'confidence': 0.5,
                    'partial': True
                }
                
        except Exception as e:
            logger.error(f"Error transcribing audio chunk: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'partial': False
            }
    
    def transcribe_base64_audio(self, base64_audio: str, sample_rate: int = 16000) -> dict:
        """
        Transcribe base64-encoded audio
        
        Args:
            base64_audio: Base64-encoded audio data
            sample_rate: Sample rate of audio
            
        Returns:
            dict with transcription results
        """
        try:
            # Decode base64
            audio_bytes = base64.b64decode(base64_audio)
            return self.transcribe_audio_chunk(audio_bytes, sample_rate)
        except Exception as e:
            logger.error(f"Error decoding base64 audio: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'partial': False
            }
    
    def reset(self):
        """Reset recognizer state"""
        if self.recognizer:
            self.recognizer = KaldiRecognizer(self.model, self.sample_rate)
    
    def finalize(self) -> str:
        """
        Get final transcription result
        
        Returns:
            Final transcribed text
        """
        if not self.recognizer:
            return ''
        
        try:
            result = json.loads(self.recognizer.FinalResult())
            return result.get('text', '')
        except Exception as e:
            logger.error(f"Error finalizing transcription: {e}")
            return ''


class WhisperTranscriber:
    """
    Whisper-based transcriber (alternative to Vosk)
    Uses faster-whisper or openai-whisper for transcription
    """
    
    def __init__(self, model_size: str = "base", device: str = "cpu"):
        """
        Initialize Whisper transcriber
        
        Args:
            model_size: Model size (tiny, base, small, medium, large)
            device: Device to use (cpu, cuda)
        """
        self.model_size = model_size
        self.device = device
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Whisper model"""
        try:
            # Try faster-whisper first (faster, more efficient)
            try:
                from faster_whisper import WhisperModel
                self.model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type="int8" if self.device == "cpu" else "float16"
                )
                self.use_faster_whisper = True
                logger.info(f"Loaded faster-whisper model: {self.model_size}")
            except ImportError:
                # Fallback to openai-whisper
                import whisper
                self.model = whisper.load_model(self.model_size)
                self.use_faster_whisper = False
                logger.info(f"Loaded openai-whisper model: {self.model_size}")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")
            self.model = None
    
    def transcribe_audio_chunk(self, audio_data: bytes, sample_rate: int = 16000) -> dict:
        """
        Transcribe audio chunk using Whisper
        
        Args:
            audio_data: Raw audio bytes
            sample_rate: Sample rate
            
        Returns:
            dict with transcription results
        """
        if not self.model:
            return {
                'text': '',
                'confidence': 0.0,
                'partial': False
            }
        
        try:
            import numpy as np
            import io
            
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            if self.use_faster_whisper:
                # Use faster-whisper
                segments, info = self.model.transcribe(
                    audio_array,
                    beam_size=5,
                    language="en",
                    vad_filter=True
                )
                
                text = " ".join([segment.text for segment in segments])
                return {
                    'text': text,
                    'confidence': 0.9,  # Whisper doesn't provide per-segment confidence
                    'partial': False
                }
            else:
                # Use openai-whisper
                result = self.model.transcribe(
                    audio_array,
                    language="en",
                    fp16=False
                )
                return {
                    'text': result.get('text', ''),
                    'confidence': 0.9,
                    'partial': False
                }
                
        except Exception as e:
            logger.error(f"Error transcribing with Whisper: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'partial': False
            }
    
    def transcribe_base64_audio(self, base64_audio: str, sample_rate: int = 16000) -> dict:
        """Transcribe base64-encoded audio"""
        try:
            audio_bytes = base64.b64decode(base64_audio)
            return self.transcribe_audio_chunk(audio_bytes, sample_rate)
        except Exception as e:
            logger.error(f"Error decoding base64 audio: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'partial': False
            }


# Factory function to get transcriber
def get_transcriber(engine: str = "vosk", **kwargs):
    """
    Get transcriber instance
    
    Args:
        engine: 'vosk' or 'whisper'
        **kwargs: Additional arguments for transcriber
        
    Returns:
        Transcriber instance
    """
    if engine.lower() == "vosk":
        return VoskTranscriber(**kwargs)
    elif engine.lower() == "whisper":
        return WhisperTranscriber(**kwargs)
    else:
        raise ValueError(f"Unknown transcriber engine: {engine}")

