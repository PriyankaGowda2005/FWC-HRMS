"""
Zoom Interview Router for FastAPI
Handles webhook events and WebSocket connections for real-time analysis
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Form, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import redis
import uuid
from datetime import datetime

from zoom_listener import ZoomListener
from transcriber import AudioTranscriber, RealTimeTranscriber
from analyzer import RealTimeAnalyzer
from score_calculator import InterviewScore

logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Initialize services
zoom_listener = ZoomListener(redis_client)
realtime_analyzer = RealTimeAnalyzer()
interview_scores: Dict[str, InterviewScore] = {}
active_connections: Dict[str, List[WebSocket]] = {}

router = APIRouter(prefix="/api/zoom", tags=["Zoom Interview Analysis"])

class WebhookEvent(BaseModel):
    event: str
    payload: dict
    event_ts: int

class InterviewSessionRequest(BaseModel):
    meeting_id: str
    job_role: str
    job_requirements: List[str] = []
    candidate_id: Optional[str] = None

class TranscriptionRequest(BaseModel):
    session_id: str
    audio_data: str  # Base64 encoded audio
    timestamp: float

@router.post("/webhook")
async def handle_zoom_webhook(event: WebhookEvent):
    """Handle Zoom webhook events"""
    try:
        logger.info(f"Received Zoom webhook: {event.event}")
        
        # Process webhook event
        result = await zoom_listener.handle_webhook(event.dict())
        
        # If it's a meeting start event, initialize scoring
        if event.event == "meeting.started" and "session_id" in result:
            session_id = result["session_id"]
            interview_scores[session_id] = InterviewScore()
            
            # Set job requirements if available
            if "job_requirements" in result:
                interview_scores[session_id].set_job_requirements(result["job_requirements"])
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-session")
async def start_interview_session(request: InterviewSessionRequest):
    """Start a new interview session"""
    try:
        session_id = str(uuid.uuid4())
        
        # Initialize session data
        session_data = {
            "session_id": session_id,
            "meeting_id": request.meeting_id,
            "job_role": request.job_role,
            "job_requirements": request.job_requirements,
            "candidate_id": request.candidate_id,
            "start_time": datetime.now().isoformat(),
            "status": "active"
        }
        
        # Store in Redis
        redis_client.setex(
            f"zoom_session:{session_id}", 
            3600,
            json.dumps(session_data)
        )
        
        # Initialize scoring
        interview_scores[session_id] = InterviewScore()
        interview_scores[session_id].set_job_requirements(request.job_requirements)
        
        # Initialize active connections
        active_connections[session_id] = []
        
        logger.info(f"Started interview session {session_id} for meeting {request.meeting_id}")
        
        return JSONResponse(content={
            "success": True,
            "session_id": session_id,
            "message": "Interview session started"
        })
        
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/live-feed/{session_id}")
async def websocket_live_feed(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time interview data"""
    await websocket.accept()
    
    try:
        # Add connection to active connections
        if session_id not in active_connections:
            active_connections[session_id] = []
        active_connections[session_id].append(websocket)
        
        logger.info(f"WebSocket connected for session {session_id}")
        
        # Send initial session data
        session_data = await zoom_listener.get_session(session_id)
        if session_data:
            await websocket.send_json({
                "type": "session_data",
                "data": session_data
            })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for incoming data
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "transcription":
                    await handle_transcription_message(session_id, message)
                elif message.get("type") == "audio_chunk":
                    await handle_audio_chunk(session_id, message)
                elif message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
    finally:
        # Remove connection from active connections
        if session_id in active_connections:
            if websocket in active_connections[session_id]:
                active_connections[session_id].remove(websocket)
            if not active_connections[session_id]:
                del active_connections[session_id]

async def handle_transcription_message(session_id: str, message: dict):
    """Handle transcription message from client"""
    try:
        text = message.get("text", "")
        timestamp = message.get("timestamp", 0.0)
        
        if not text.strip():
            return
        
        # Analyze the text
        analysis_result = await realtime_analyzer.analyze_text(text, timestamp)
        
        # Calculate score
        if session_id in interview_scores:
            score_metrics = interview_scores[session_id].calculate_real_time_score(analysis_result)
            
            # Broadcast to all connected clients
            await broadcast_to_session(session_id, {
                "type": "analysis_result",
                "data": {
                    "timestamp": timestamp,
                    "text": text,
                    "sentiment_score": analysis_result.sentiment_score,
                    "emotion_scores": analysis_result.emotion_scores,
                    "confidence_score": analysis_result.confidence_score,
                    "keywords": analysis_result.keywords,
                    "technical_skills": analysis_result.technical_skills,
                    "overall_score": score_metrics.overall_score,
                    "stress_level": score_metrics.stress_level,
                    "engagement_score": score_metrics.engagement_score
                }
            })
        
    except Exception as e:
        logger.error(f"Error handling transcription message: {e}")

async def handle_audio_chunk(session_id: str, message: dict):
    """Handle audio chunk for real-time transcription"""
    try:
        audio_data = message.get("audio_data", "")
        timestamp = message.get("timestamp", 0.0)
        
        if not audio_data:
            return
        
        # Decode base64 audio data
        import base64
        audio_bytes = base64.b64decode(audio_data)
        
        # Transcribe audio chunk
        async with AudioTranscriber() as transcriber:
            result = await transcriber.transcribe_audio_chunk(audio_bytes)
            
            if result.text.strip():
                # Analyze transcribed text
                analysis_result = await realtime_analyzer.analyze_text(result.text, timestamp)
                
                # Calculate score
                if session_id in interview_scores:
                    score_metrics = interview_scores[session_id].calculate_real_time_score(analysis_result)
                    
                    # Broadcast results
                    await broadcast_to_session(session_id, {
                        "type": "transcription_result",
                        "data": {
                            "timestamp": timestamp,
                            "text": result.text,
                            "confidence": result.confidence,
                            "sentiment_score": analysis_result.sentiment_score,
                            "emotion_scores": analysis_result.emotion_scores,
                            "overall_score": score_metrics.overall_score,
                            "stress_level": score_metrics.stress_level
                        }
                    })
        
    except Exception as e:
        logger.error(f"Error handling audio chunk: {e}")

async def broadcast_to_session(session_id: str, message: dict):
    """Broadcast message to all connected clients in a session"""
    if session_id in active_connections:
        disconnected = []
        for websocket in active_connections[session_id]:
            try:
                await websocket.send_json(message)
            except:
                disconnected.append(websocket)
        
        # Remove disconnected websockets
        for websocket in disconnected:
            active_connections[session_id].remove(websocket)

@router.get("/session/{session_id}")
async def get_session_data(session_id: str):
    """Get session data and current scores"""
    try:
        session_data = await zoom_listener.get_session(session_id)
        
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get current scores
        scores = None
        if session_id in interview_scores:
            scores = interview_scores[session_id].get_performance_summary()
        
        return JSONResponse(content={
            "success": True,
            "session": session_data,
            "scores": scores
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/scores")
async def get_session_scores(session_id: str):
    """Get detailed scoring data for a session"""
    try:
        if session_id not in interview_scores:
            raise HTTPException(status_code=404, detail="Session not found")
        
        score_data = interview_scores[session_id]
        
        return JSONResponse(content={
            "success": True,
            "current_score": score_data.get_average_score(),
            "trend": score_data.get_score_trend(),
            "performance_summary": score_data.get_performance_summary(),
            "score_history": [score.dict() for score in score_data.score_history[-50:]]  # Last 50 scores
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session scores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/end")
async def end_interview_session(session_id: str):
    """End an interview session and generate final report"""
    try:
        # Update session status
        session_data = await zoom_listener.get_session(session_id)
        if session_data:
            session_data["status"] = "completed"
            session_data["end_time"] = datetime.now().isoformat()
            
            await zoom_listener.update_session_data(session_id, session_data)
        
        # Get final performance summary
        final_summary = None
        if session_id in interview_scores:
            final_summary = interview_scores[session_id].get_performance_summary()
        
        # Broadcast session end to all connected clients
        await broadcast_to_session(session_id, {
            "type": "session_ended",
            "data": {
                "session_id": session_id,
                "final_summary": final_summary
            }
        })
        
        logger.info(f"Interview session {session_id} ended")
        
        return JSONResponse(content={
            "success": True,
            "message": "Session ended successfully",
            "final_summary": final_summary
        })
        
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-audio")
async def upload_audio_file(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload audio file for analysis"""
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Transcribe the audio file
        async with AudioTranscriber() as transcriber:
            results = await transcriber.transcribe_file(temp_file_path)
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        # Process each transcription result
        analysis_results = []
        for result in results:
            analysis_result = await realtime_analyzer.analyze_text(result.text, result.timestamp)
            
            if session_id in interview_scores:
                score_metrics = interview_scores[session_id].calculate_real_time_score(analysis_result)
                analysis_results.append({
                    "text": result.text,
                    "timestamp": result.timestamp,
                    "confidence": result.confidence,
                    "analysis": analysis_result.dict(),
                    "score": score_metrics.dict()
                })
        
        return JSONResponse(content={
            "success": True,
            "results": analysis_results,
            "total_segments": len(results)
        })
        
    except Exception as e:
        logger.error(f"Error processing audio file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(content={
        "status": "healthy",
        "active_sessions": len(active_connections),
        "total_scores_tracked": len(interview_scores),
        "timestamp": datetime.now().isoformat()
    })
