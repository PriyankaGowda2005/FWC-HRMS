from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
import PyPDF2
import docx
import json
import re
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
from pathlib import Path
import asyncio
import uuid

app = FastAPI(
    title="FWC HRMS ML Service",
    description="Machine Learning microservice for HR Management System",
    version="1.0.0"
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

class PredictionRequest(BaseModel):
    employee_data: dict
    prediction_type: str

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float
    explanation: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token with backend service
    """
    # In a real implementation, you would verify the token with your backend
    # For now, we'll just accept any token for demo purposes
    token = credentials.credentials
    return token

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp="2024-01-01T00:00:00Z",
        service="ml-service"
    )

@app.post("/predict/performance", response_model=PredictionResponse)
async def predict_performance(
    request: PredictionRequest,
    token: str = Depends(verify_token)
):
    """
    Predict employee performance based on various factors
    """
    # Placeholder implementation
    return PredictionResponse(
        prediction=0.85,
        confidence=0.78,
        explanation="High performance predicted based on historical data and engagement metrics"
    )

@app.post("/predict/retention", response_model=PredictionResponse)
async def predict_retention(
    request: PredictionRequest,
    token: str = Depends(verify_token)
):
    """
    Predict employee retention probability
    """
    # Placeholder implementation
    return PredictionResponse(
        prediction=0.92,
        confidence=0.85,
        explanation="High retention probability based on satisfaction scores and tenure"
    )

@app.post("/predict/salary", response_model=PredictionResponse)
async def predict_salary(
    request: PredictionRequest,
    token: str = Depends(verify_token)
):
    """
    Predict optimal salary range for position
    """
    # Placeholder implementation
    return PredictionResponse(
        prediction=75000.0,
        confidence=0.82,
        explanation="Recommended salary based on industry standards and employee qualifications"
    )

@app.get("/analytics/sentiment")
async def analyze_sentiment(
    text_data: str,
    token: str = Depends(verify_token)
):
    """
    Analyze sentiment from employee feedback
    """
    # Placeholder implementation
    return {
        "sentiment": "positive",
        "confidence": 0.89,
        "keywords": ["satisfied", "happy", "productive"],
        "score": 0.75
    }

@app.get("/analytics/workload")
async def analyze_workload_optimization(
    employee_data: dict,
    token: str = Depends(verify_token)
):
    """
    Analyze and suggest workload optimization
    """
    # Placeholder implementation
    return {
        "current_load": 0.85,
        "optimal_load": 0.75,
        "recommendations": [
            "Consider delegating administrative tasks",
            "Schedule regular breaks",
            "Prioritize high-impact projects"
        ],
        "efficiency_score": 0.82
    }

# Import AI modules
try:
    from advanced_resume_parser import AdvancedResumeAnalyzer
    from chatbot_interviewer import AIInterviewChatbot
    AI_SERVICES_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ AI modules not available: {e}")
    AI_SERVICES_AVAILABLE = False

# Initialize AI services if available
if AI_SERVICES_AVAILABLE:
    resume_analyzer = AdvancedResumeAnalyzer()
    interview_chatbot = AIInterviewChatbot()
    
    # Store active interview sessions
    interview_sessions: Dict[str, object] = {}

@app.get("/api/services/status")
async def get_ai_services_status():
    """Get status of AI services"""
    return {
        "ai_services_available": AI_SERVICES_AVAILABLE,
        "resume_analyzer": "operational" if AI_SERVICES_AVAILABLE else "not_available",
        "interview_chatbot": "operational" if AI_SERVICES_AVAILABLE else "not_available",
        "supported_features": [
            "advanced_resume_parsing" if AI_SERVICES_AVAILABLE else "basic_prediction",
            "ai_interview_conversation" if AI_SERVICES_AVAILABLE else "basic_analytics",
            "skills_extraction" if AI_SERVICES_AVAILABLE else False,
            "job_fit_scoring" if AI_SERVICES_AVAILABLE else False
        ],
        "active_interview_sessions": len(interview_sessions) if AI_SERVICES_AVAILABLE else 0,
        "timestamp": datetime.now().isoformat()
    }

if AI_SERVICES_AVAILABLE:
    @app.post("/api/resume/analyze")
    async def analyze_resume_advanced(
        file_path: str,
        job_requirements: Optional[Dict] = None
    ):
        """Analyze resume with advanced AI features"""
        try:
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="Resume file not found")
            
            result = resume_analyzer.analyze_resume(file_path, job_requirements)
            
            if result.get("success"):
                return JSONResponse(content=result)
            else:
                raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

    @app.post("/api/interview/start")
    async def start_interview_session(
        candidate_id: str,
        job_role: str
    ):
        """Start a new AI interview session"""
        try:
            session = interview_chatbot.initiate_interview(candidate_id, job_role)
            interview_sessions[session.session_id] = session
            
            return JSONResponse(content={
                "success": True,
                "session_id": session.session_id,
                "message": "AI Interview session started",
                "first_question": interview_chatbot.get_next_question(session),
                "candidate_id": candidate_id,
                "job_role": job_role,
                "started_at": session.started_at.isoformat()
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

    @app.post("/api/interview/question")
    async def get_interview_question(session_id: str):
        """Get the next interview question"""
        try:
            if session_id not in interview_sessions:
                raise HTTPException(status_code=404, detail="Interview session not found")
            
            session = interview_sessions[session_id]
            question = interview_chatbot.get_next_question(session)
            
            if question and question.get("status") == "interview_completed":
                del interview_sessions[session_id]
                return JSONResponse(content=question)
            
            return JSONResponse(content=question)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get question: {str(e)}")

    @app.post("/api/interview/answer")
    async def submit_interview_answer(
        session_id: str,
        answer_text: str,
        question_id: str
    ):
        """Submit an answer for interview scoring"""
        try:
            if session_id not in interview_sessions:
                raise HTTPException(status_code=404, detail="Interview session not found")
            
            session = interview_sessions[session_id]
            response = interview_chatbot.process_answer(session, answer_text, question_id)
            
            if response.get("status") == "interview_completed":
                del interview_sessions[session_id]
            
            return JSONResponse(content=response)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process answer: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FWC HRMS AI Service...")
    print(f"📊 AI Services Available: {AI_SERVICES_AVAILABLE}")
    if AI_SERVICES_AVAILABLE:
        print("🤖 Features: Advanced Resume Analysis + AI Interview Chatbot")
    else:
        print("📈 Features: Basic Analytics + Prediction Models")
    print("🌐 API Documentation: http://localhost:8000/docs")
    print("💡 Health Check: http://localhost:8000/health")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
