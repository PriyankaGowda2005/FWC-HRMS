"""
Real-time Interview Monitoring Service
Handles live audio transcription, sentiment analysis, and scoring
"""

import asyncio
import logging
import base64
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from interview_realtime.transcriber import AudioTranscriber, RealTimeTranscriber
    from interview_realtime.analyzer import RealTimeAnalyzer
    from interview_realtime.score_calculator import InterviewScore
    SERVICES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Real-time interview services not available: {e}")
    SERVICES_AVAILABLE = False

# Try to import Vosk/Whisper transcriber
try:
    from vosk_transcriber import get_transcriber, VoskTranscriber, WhisperTranscriber
    STT_AVAILABLE = True
    STT_ENGINE = os.getenv('STT_ENGINE', 'vosk')  # 'vosk' or 'whisper'
except ImportError as e:
    logging.warning(f"Vosk/Whisper transcriber not available: {e}")
    STT_AVAILABLE = False
    STT_ENGINE = None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/realtime-interview", tags=["Real-time Interview"])

# In-memory session storage (in production, use Redis)
active_sessions: Dict[str, Dict] = {}
transcribers: Dict[str, RealTimeTranscriber] = {}
stt_transcribers: Dict[str, Any] = {}  # Vosk/Whisper transcriber instances
analyzers: Dict[str, RealTimeAnalyzer] = {}
score_calculators: Dict[str, InterviewScore] = {}

class StartSessionRequest(BaseModel):
    session_id: str
    interview_id: str
    job_requirements: List[str] = []
    candidate_name: Optional[str] = None

class AnalyzeRequest(BaseModel):
    session_id: str
    audio_data: Optional[str] = None  # Base64 encoded
    transcript: Optional[str] = None
    timestamp: float

class GenerateReportRequest(BaseModel):
    session_id: str
    transcript: List[Dict]
    analysis: List[Dict]
    job_requirements: List[str] = []
    candidate_name: Optional[str] = None

@router.post("/start-session")
async def start_session(request: StartSessionRequest):
    """Start a new real-time interview monitoring session"""
    try:
        if not SERVICES_AVAILABLE:
            return JSONResponse(content={
                "success": True,
                "message": "Session started (limited functionality - ML services not available)",
                "session_id": request.session_id
            })
        
        # Initialize transcriber (use Vosk/Whisper if available, else fallback)
        if STT_AVAILABLE and STT_ENGINE:
            try:
                stt_transcriber = get_transcriber(
                    engine=STT_ENGINE,
                    model_path=os.getenv('VOSK_MODEL_PATH'),
                    model_size=os.getenv('WHISPER_MODEL_SIZE', 'base')
                )
                stt_transcribers[request.session_id] = stt_transcriber
                logger.info(f"Initialized {STT_ENGINE} transcriber for session {request.session_id}")
            except Exception as e:
                logger.warning(f"Failed to initialize {STT_ENGINE} transcriber: {e}, using fallback")
                if SERVICES_AVAILABLE:
                    async with AudioTranscriber() as transcriber:
                        realtime_transcriber = RealTimeTranscriber(transcriber)
                        transcribers[request.session_id] = realtime_transcriber
        elif SERVICES_AVAILABLE:
            async with AudioTranscriber() as transcriber:
                realtime_transcriber = RealTimeTranscriber(transcriber)
                transcribers[request.session_id] = realtime_transcriber
        
        # Initialize analyzer
        analyzer = RealTimeAnalyzer()
        await analyzer.initialize()
        analyzers[request.session_id] = analyzer
        
        # Initialize score calculator
        score_calc = InterviewScore()
        score_calc.set_job_requirements(request.job_requirements)
        score_calculators[request.session_id] = score_calc
        
        # Store session
        active_sessions[request.session_id] = {
            "session_id": request.session_id,
            "interview_id": request.interview_id,
            "started_at": datetime.now().isoformat(),
            "status": "active",
            "job_requirements": request.job_requirements,
            "candidate_name": request.candidate_name,
            "transcript_chunks": [],
            "analysis_results": []
        }
        
        logger.info(f"Started monitoring session: {request.session_id}")
        
        return JSONResponse(content={
            "success": True,
            "message": "Session started successfully",
            "session_id": request.session_id
        })
        
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_audio_or_transcript(request: AnalyzeRequest):
    """Analyze audio data or transcript in real-time"""
    try:
        if request.session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[request.session_id]
        result = {
            "timestamp": request.timestamp,
            "sentiment": {"score": 0.0, "label": "neutral"},
            "confidence": 0.5,
            "engagement": 0.5,
            "keywords": [],
            "technical_skills": [],
            "overall_score": 0.0
        }
        
        # Process audio if provided
        if request.audio_data:
            try:
                audio_bytes = base64.b64decode(request.audio_data)
                sample_rate = getattr(request, 'sample_rate', 16000)
                
                # Try Vosk/Whisper first
                stt_transcriber = stt_transcribers.get(request.session_id)
                if stt_transcriber:
                    if isinstance(stt_transcriber, (VoskTranscriber, WhisperTranscriber)):
                        transcription_result = stt_transcriber.transcribe_audio_chunk(audio_bytes, sample_rate)
                    else:
                        # Fallback to base64 method
                        transcription_result = stt_transcriber.transcribe_base64_audio(request.audio_data, sample_rate)
                    
                    if transcription_result.get('text', '').strip():
                        transcribed_text = transcription_result['text']
                        
                        # Analyze transcribed text
                        analyzer = analyzers.get(request.session_id)
                        if analyzer:
                            analysis = await analyzer.analyze_text(
                                transcribed_text,
                                request.timestamp
                            )
                            
                            # Calculate score
                            score_calc = score_calculators.get(request.session_id)
                            if score_calc:
                                score_metrics = score_calc.calculate_real_time_score(analysis)
                                result["overall_score"] = score_metrics.overall_score
                            
                            result.update({
                                "sentiment": {
                                    "score": analysis.sentiment_score,
                                    "label": "positive" if analysis.sentiment_score > 0.1 
                                            else "negative" if analysis.sentiment_score < -0.1 
                                            else "neutral"
                                },
                                "confidence": analysis.confidence_score,
                                "engagement": analysis.engagement_score if hasattr(analysis, 'engagement_score') else 0.5,
                                "keywords": analysis.keywords,
                                "technical_skills": analysis.technical_skills,
                                "text": transcribed_text
                            })
                            
                            # Store in session
                            session["transcript_chunks"].append({
                                "text": transcribed_text,
                                "timestamp": request.timestamp
                            })
                            session["analysis_results"].append(analysis.dict() if hasattr(analysis, 'dict') else {
                                "sentiment_score": analysis.sentiment_score,
                                "confidence_score": analysis.confidence_score,
                                "keywords": analysis.keywords,
                                "technical_skills": analysis.technical_skills
                            })
                
                # Fallback to original transcriber if Vosk/Whisper not available
                elif SERVICES_AVAILABLE:
                    transcriber = transcribers.get(request.session_id)
                    
                    if transcriber:
                        # Transcribe audio
                        transcription_result = await transcriber.transcriber.transcribe_audio_chunk(audio_bytes)
                        
                        if transcription_result.text.strip():
                            # Analyze transcribed text
                            analyzer = analyzers.get(request.session_id)
                            if analyzer:
                                analysis = await analyzer.analyze_text(
                                    transcription_result.text,
                                    request.timestamp
                                )
                                
                                # Calculate score
                                score_calc = score_calculators.get(request.session_id)
                                if score_calc:
                                    score_metrics = score_calc.calculate_real_time_score(analysis)
                                    result["overall_score"] = score_metrics.overall_score
                                
                                result.update({
                                    "sentiment": {
                                        "score": analysis.sentiment_score,
                                        "label": "positive" if analysis.sentiment_score > 0.1 
                                                else "negative" if analysis.sentiment_score < -0.1 
                                                else "neutral"
                                    },
                                    "confidence": analysis.confidence_score,
                                    "engagement": analysis.engagement_score if hasattr(analysis, 'engagement_score') else 0.5,
                                    "keywords": analysis.keywords,
                                    "technical_skills": analysis.technical_skills,
                                    "text": transcription_result.text
                                })
                                
                                # Store in session
                                session["transcript_chunks"].append({
                                    "text": transcription_result.text,
                                    "timestamp": request.timestamp
                                })
                                session["analysis_results"].append(analysis.dict() if hasattr(analysis, 'dict') else {
                                    "sentiment_score": analysis.sentiment_score,
                                    "confidence_score": analysis.confidence_score,
                                    "keywords": analysis.keywords,
                                    "technical_skills": analysis.technical_skills
                                })
            except Exception as e:
                logger.warning(f"Audio processing error: {e}")
        
        # Process transcript if provided
        elif request.transcript and SERVICES_AVAILABLE:
            try:
                analyzer = analyzers.get(request.session_id)
                if analyzer:
                    analysis = await analyzer.analyze_text(
                        request.transcript,
                        request.timestamp
                    )
                    
                    # Calculate score
                    score_calc = score_calculators.get(request.session_id)
                    if score_calc:
                        score_metrics = score_calc.calculate_real_time_score(analysis)
                        result["overall_score"] = score_metrics.overall_score
                    
                    result.update({
                        "sentiment": {
                            "score": analysis.sentiment_score,
                            "label": "positive" if analysis.sentiment_score > 0.1 
                                    else "negative" if analysis.sentiment_score < -0.1 
                                    else "neutral"
                        },
                        "confidence": analysis.confidence_score,
                        "engagement": analysis.engagement_score if hasattr(analysis, 'engagement_score') else 0.5,
                        "keywords": analysis.keywords,
                        "technical_skills": analysis.technical_skills,
                        "text": request.transcript
                    })
                    
                    # Store in session
                    session["transcript_chunks"].append({
                        "text": request.transcript,
                        "timestamp": request.timestamp
                    })
                    session["analysis_results"].append(analysis.dict() if hasattr(analysis, 'dict') else {
                        "sentiment_score": analysis.sentiment_score,
                        "confidence_score": analysis.confidence_score,
                        "keywords": analysis.keywords,
                        "technical_skills": analysis.technical_skills
                    })
            except Exception as e:
                logger.warning(f"Transcript processing error: {e}")
        
        # Fallback: simple sentiment analysis
        if not SERVICES_AVAILABLE and request.transcript:
            text_lower = request.transcript.lower()
            positive_words = ["good", "great", "excellent", "yes", "sure", "confident", "experienced"]
            negative_words = ["no", "not", "difficult", "problem", "issue", "unsure"]
            
            pos_count = sum(1 for word in positive_words if word in text_lower)
            neg_count = sum(1 for word in negative_words if word in text_lower)
            
            if pos_count > neg_count:
                result["sentiment"] = {"score": 0.3, "label": "positive"}
            elif neg_count > pos_count:
                result["sentiment"] = {"score": -0.3, "label": "negative"}
            
            result["overall_score"] = 50 + (pos_count - neg_count) * 5
            result["text"] = request.transcript
        
        return JSONResponse(content={
            "success": True,
            "result": result
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing audio/transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-report")
async def generate_report(request: GenerateReportRequest):
    """Generate comprehensive interview report"""
    try:
        if not SERVICES_AVAILABLE:
            return JSONResponse(content=generate_fallback_report(request))
        
        # Aggregate all analysis results
        all_sentiments = []
        all_confidences = []
        all_engagements = []
        all_keywords = []
        all_technical_skills = []
        full_transcript = []
        
        for analysis_item in request.analysis:
            if isinstance(analysis_item, dict):
                all_sentiments.append(analysis_item.get("sentiment_score", 0))
                all_confidences.append(analysis_item.get("confidence_score", 0.5))
                all_engagements.append(analysis_item.get("engagement", 0.5))
                all_keywords.extend(analysis_item.get("keywords", []))
                all_technical_skills.extend(analysis_item.get("technical_skills", []))
        
        for transcript_item in request.transcript:
            if isinstance(transcript_item, dict):
                full_transcript.append(transcript_item.get("text", ""))
        
        # Calculate averages
        sentiment_avg = sum(all_sentiments) / len(all_sentiments) if all_sentiments else 0
        confidence_avg = sum(all_confidences) / len(all_confidences) if all_confidences else 0.5
        engagement_avg = sum(all_engagements) / len(all_engagements) if all_engagements else 0.5
        
        # Get final score from score calculator
        final_score = 0
        if request.session_id in score_calculators:
            score_calc = score_calculators[request.session_id]
            performance_summary = score_calc.get_performance_summary()
            final_score = performance_summary.get("overall_score", 0)
        
        # Count sentiment distribution
        positive_count = sum(1 for s in all_sentiments if s > 0.1)
        neutral_count = sum(1 for s in all_sentiments if -0.1 <= s <= 0.1)
        negative_count = sum(1 for s in all_sentiments if s < -0.1)
        
        # Identify strengths and weaknesses
        strengths = []
        weaknesses = []
        
        if confidence_avg > 0.7:
            strengths.append("High confidence level demonstrated")
        if engagement_avg > 0.7:
            strengths.append("Strong engagement throughout interview")
        if len(set(all_technical_skills)) >= 3:
            strengths.append("Good technical knowledge demonstrated")
        if sentiment_avg > 0.2:
            strengths.append("Positive attitude and communication")
        
        if confidence_avg < 0.5:
            weaknesses.append("Confidence could be improved")
        if engagement_avg < 0.5:
            weaknesses.append("Engagement level needs improvement")
        if len(set(all_technical_skills)) < 2:
            weaknesses.append("Limited technical skills mentioned")
        if sentiment_avg < -0.1:
            weaknesses.append("Negative sentiment detected in responses")
        
        # Generate recommendations
        recommendations = []
        if confidence_avg < 0.6:
            recommendations.append("Candidate should work on building confidence through preparation")
        if engagement_avg < 0.6:
            recommendations.append("Candidate should demonstrate more enthusiasm and engagement")
        if len(set(all_technical_skills)) < 3:
            recommendations.append("Candidate should highlight more technical skills relevant to the role")
        if sentiment_avg < 0:
            recommendations.append("Candidate should maintain a more positive communication style")
        
        # Compile report
        report = {
            "overall_score": round(final_score) if final_score > 0 else round(50 + sentiment_avg * 20 + confidence_avg * 20 + engagement_avg * 10),
            "sentiment_summary": {
                "average": sentiment_avg,
                "positive": positive_count,
                "neutral": neutral_count,
                "negative": negative_count
            },
            "confidence_average": confidence_avg,
            "engagement_average": engagement_avg,
            "transcript": " ".join(full_transcript),
            "key_phrases": list(set(all_keywords))[:20],
            "technical_skills_mentioned": list(set(all_technical_skills)),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "total_responses": len(request.transcript),
            "analysis_points": len(request.analysis),
            "generated_at": datetime.now().isoformat()
        }
        
        return JSONResponse(content=report)
        
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return JSONResponse(content=generate_fallback_report(request))

def generate_fallback_report(request: GenerateReportRequest):
    """Generate a basic report when ML services are unavailable"""
    full_transcript = []
    for item in request.transcript:
        if isinstance(item, dict):
            full_transcript.append(item.get("text", ""))
    
    return {
        "overall_score": 65,
        "sentiment_summary": {
            "average": 0.1,
            "positive": len(request.transcript) // 2,
            "neutral": len(request.transcript) // 3,
            "negative": len(request.transcript) // 6
        },
        "confidence_average": 0.6,
        "engagement_average": 0.6,
        "transcript": " ".join(full_transcript),
        "key_phrases": [],
        "technical_skills_mentioned": [],
        "strengths": ["Interview completed successfully"],
        "weaknesses": ["Detailed analysis unavailable"],
        "recommendations": ["Review transcript manually for detailed assessment"],
        "total_responses": len(request.transcript),
        "analysis_points": len(request.analysis),
        "generated_at": datetime.now().isoformat()
    }

@router.get("/session/{session_id}/status")
async def get_session_status(session_id: str):
    """Get current session status"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    return JSONResponse(content={
        "success": True,
        "session": {
            "session_id": session_id,
            "status": session["status"],
            "started_at": session["started_at"],
            "transcript_chunks": len(session["transcript_chunks"]),
            "analysis_results": len(session["analysis_results"])
        }
    })

@router.post("/end-session/{session_id}")
async def end_session(session_id: str):
    """End a monitoring session and cleanup"""
    try:
        if session_id in active_sessions:
            active_sessions[session_id]["status"] = "completed"
        
        # Cleanup
        if session_id in transcribers:
            del transcribers[session_id]
        if session_id in stt_transcribers:
            del stt_transcribers[session_id]
        if session_id in analyzers:
            del analyzers[session_id]
        if session_id in score_calculators:
            del score_calculators[session_id]
        
        return JSONResponse(content={
            "success": True,
            "message": "Session ended successfully"
        })
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

