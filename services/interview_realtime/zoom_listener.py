"""
Zoom Webhook Listener for Real-time Interview Analysis
Handles Zoom API webhook events and manages interview sessions
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import aiohttp
from fastapi import HTTPException
import redis
import uuid

logger = logging.getLogger(__name__)

class ZoomListener:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.active_sessions: Dict[str, Dict] = {}
        self.webhook_secret = "your_zoom_webhook_secret"  # Configure in production
        
    async def handle_webhook(self, event_data: dict) -> dict:
        """Handle incoming Zoom webhook events"""
        try:
            event_type = event_data.get("event")
            
            if event_type == "meeting.participant_joined":
                return await self._handle_participant_joined(event_data)
            elif event_type == "meeting.participant_left":
                return await self._handle_participant_left(event_data)
            elif event_type == "meeting.started":
                return await self._handle_meeting_started(event_data)
            elif event_type == "meeting.ended":
                return await self._handle_meeting_ended(event_data)
            elif event_type == "meeting.transcript.completed":
                return await self._handle_transcript_completed(event_data)
            else:
                logger.warning(f"Unhandled event type: {event_type}")
                return {"status": "ignored", "event_type": event_type}
                
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _handle_meeting_started(self, event_data: dict) -> dict:
        """Initialize interview session when meeting starts"""
        meeting_id = event_data["payload"]["object"]["id"]
        session_id = str(uuid.uuid4())
        
        session_data = {
            "session_id": session_id,
            "meeting_id": meeting_id,
            "start_time": datetime.now().isoformat(),
            "participants": [],
            "transcript": [],
            "emotion_data": [],
            "sentiment_scores": [],
            "confidence_scores": [],
            "status": "active"
        }
        
        # Store in Redis
        self.redis_client.setex(
            f"zoom_session:{session_id}", 
            3600,  # 1 hour TTL
            json.dumps(session_data)
        )
        
        self.active_sessions[meeting_id] = session_data
        
        logger.info(f"Meeting {meeting_id} started, session {session_id} created")
        
        return {
            "status": "success",
            "session_id": session_id,
            "meeting_id": meeting_id
        }
    
    async def _handle_participant_joined(self, event_data: dict) -> dict:
        """Track participant joining the meeting"""
        meeting_id = event_data["payload"]["object"]["id"]
        participant = event_data["payload"]["object"]["participant"]
        
        if meeting_id in self.active_sessions:
            session = self.active_sessions[meeting_id]
            session["participants"].append({
                "user_id": participant["user_id"],
                "user_name": participant["user_name"],
                "join_time": datetime.now().isoformat(),
                "role": participant.get("role", "participant")
            })
            
            # Update Redis
            self.redis_client.setex(
                f"zoom_session:{session['session_id']}", 
                3600,
                json.dumps(session)
            )
            
            logger.info(f"Participant {participant['user_name']} joined meeting {meeting_id}")
        
        return {"status": "success", "participant": participant["user_name"]}
    
    async def _handle_participant_left(self, event_data: dict) -> dict:
        """Track participant leaving the meeting"""
        meeting_id = event_data["payload"]["object"]["id"]
        participant = event_data["payload"]["object"]["participant"]
        
        if meeting_id in self.active_sessions:
            session = self.active_sessions[meeting_id]
            # Update participant status
            for p in session["participants"]:
                if p["user_id"] == participant["user_id"]:
                    p["leave_time"] = datetime.now().isoformat()
                    break
            
            # Update Redis
            self.redis_client.setex(
                f"zoom_session:{session['session_id']}", 
                3600,
                json.dumps(session)
            )
            
            logger.info(f"Participant {participant['user_name']} left meeting {meeting_id}")
        
        return {"status": "success", "participant": participant["user_name"]}
    
    async def _handle_meeting_ended(self, event_data: dict) -> dict:
        """Finalize interview session when meeting ends"""
        meeting_id = event_data["payload"]["object"]["id"]
        
        if meeting_id in self.active_sessions:
            session = self.active_sessions[meeting_id]
            session["end_time"] = datetime.now().isoformat()
            session["status"] = "completed"
            
            # Store final session data
            self.redis_client.setex(
                f"zoom_session:{session['session_id']}", 
                86400,  # 24 hours TTL for completed sessions
                json.dumps(session)
            )
            
            # Remove from active sessions
            del self.active_sessions[meeting_id]
            
            logger.info(f"Meeting {meeting_id} ended, session {session['session_id']} completed")
            
            return {
                "status": "success",
                "session_id": session["session_id"],
                "duration": self._calculate_duration(session["start_time"], session["end_time"])
            }
        
        return {"status": "error", "message": "Session not found"}
    
    async def _handle_transcript_completed(self, event_data: dict) -> dict:
        """Handle completed transcript from Zoom"""
        meeting_id = event_data["payload"]["object"]["id"]
        transcript_data = event_data["payload"]["object"]["transcript"]
        
        if meeting_id in self.active_sessions:
            session = self.active_sessions[meeting_id]
            session["transcript"].extend(transcript_data)
            
            # Update Redis
            self.redis_client.setex(
                f"zoom_session:{session['session_id']}", 
                3600,
                json.dumps(session)
            )
            
            logger.info(f"Transcript updated for meeting {meeting_id}")
        
        return {"status": "success", "transcript_length": len(transcript_data)}
    
    def _calculate_duration(self, start_time: str, end_time: str) -> int:
        """Calculate meeting duration in minutes"""
        start = datetime.fromisoformat(start_time)
        end = datetime.fromisoformat(end_time)
        return int((end - start).total_seconds() / 60)
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve session data from Redis"""
        try:
            session_data = self.redis_client.get(f"zoom_session:{session_id}")
            if session_data:
                return json.loads(session_data)
            return None
        except Exception as e:
            logger.error(f"Error retrieving session {session_id}: {e}")
            return None
    
    async def get_active_sessions(self) -> List[dict]:
        """Get all active interview sessions"""
        return list(self.active_sessions.values())
    
    async def update_session_data(self, session_id: str, data: dict) -> bool:
        """Update session data in Redis"""
        try:
            session_data = await self.get_session(session_id)
            if session_data:
                session_data.update(data)
                self.redis_client.setex(
                    f"zoom_session:{session_id}", 
                    3600,
                    json.dumps(session_data)
                )
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return False
