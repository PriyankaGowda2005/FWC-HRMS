"""
SmartHire AI-Powered Recruitment System
Enhanced FastAPI Backend with Complete ML Integration
"""
import os
import json
import logging
import uuid
import base64
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

# ML / utils imports (may be optional)
try:
    import PyPDF2
    import docx
    import numpy as np
    import cv2
    from PIL import Image
    import tensorflow as tf
    from transformers import pipeline
    import spacy
    import redis
    from celery import Celery
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
except Exception:
    # If heavy libs are missing, continue — they are optional for running API skeleton.
    pass

# Import existing AI modules (optional)
try:
    from resume_parser import ResumeParser
    from chatbot_interviewer import AIInterviewChatbot
    from interview_bot import InterviewBot
    from emotion_analysis import EmotionAnalyzer
    from report_generator import ReportGenerator
    AI_SERVICES_AVAILABLE = True
except Exception as e:
    print(f"Warning: AI modules not available: {e}")
    AI_SERVICES_AVAILABLE = False

# Import Zoom interview analysis router if present (optional)
try:
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), 'interview_realtime'))
    from zoom_interview_router import router as zoom_router  # type: ignore
    ZOOM_SERVICES_AVAILABLE = True
except Exception as e:
    print(f"Warning: Zoom services not available: {e}")
    ZOOM_SERVICES_AVAILABLE = False

# Import real-time interview service router
try:
    from realtime_interview_service import router as realtime_interview_router
    REALTIME_INTERVIEW_AVAILABLE = True
except Exception as e:
    print(f"Warning: Real-time interview services not available: {e}")
    REALTIME_INTERVIEW_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SmartHire AI Recruitment System",
    description="Complete AI-powered recruitment platform with resume analysis, interview scoring, and emotion detection",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware (open for dev; restrict origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
if ZOOM_SERVICES_AVAILABLE:
    try:
        app.include_router(zoom_router)
        logger.info("Zoom Interview Analysis router included")
    except Exception as e:
        logger.warning(f"Failed to include zoom router: {e}")
else:
    logger.info("Zoom Interview Analysis router not available")

if REALTIME_INTERVIEW_AVAILABLE:
    try:
        app.include_router(realtime_interview_router)
        logger.info("Real-time Interview Monitoring router included")
    except Exception as e:
        logger.warning(f"Failed to include real-time interview router: {e}")
else:
    logger.info("Real-time Interview Monitoring router not available")

# Security
security = HTTPBearer()

# Redis connection for caching and real-time features (optional)
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
except Exception:
    # fallback to a simple in-memory dict if redis isn't available (dev only)
    redis_client = None
    _in_memory_store: Dict[str, str] = {}

# Celery for background tasks (optional)
try:
    celery_app = Celery('smarthire', broker='redis://localhost:6379/0')
except Exception:
    celery_app = None

# Global variables for ML models
emotion_model = None
sentiment_analyzer = None
nlp_model = None
interview_sessions: Dict[str, Any] = {}
websocket_connections: Dict[str, List[WebSocket]] = {}

# Initialize AI service instances (if available)
resume_analyzer = None
interview_chatbot = None
emotion_analyzer = None
report_generator = None

if AI_SERVICES_AVAILABLE:
    try:
        resume_analyzer = ResumeParser()
    except Exception as e:
        logger.warning(f"ResumeParser init failed: {e}")
        resume_analyzer = None

    try:
        interview_chatbot = AIInterviewChatbot()
    except Exception as e:
        logger.warning(f"AIInterviewChatbot init failed: {e}")
        interview_chatbot = None

    try:
        emotion_analyzer = EmotionAnalyzer()
    except Exception as e:
        logger.warning(f"EmotionAnalyzer init failed: {e}")
        emotion_analyzer = None

    try:
        report_generator = ReportGenerator()
    except Exception as e:
        logger.warning(f"ReportGenerator init failed: {e}")
        report_generator = None


# ----------------------
# Pydantic Models
# ----------------------
class UserLogin(BaseModel):
    email: str
    password: str
    role: str = "candidate"


class UserRegistration(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "candidate"
    company_id: Optional[str] = None


class ResumeAnalysisRequest(BaseModel):
    job_requirements: Optional[List[str]] = None
    analysis_type: str = "comprehensive"


class InterviewSessionRequest(BaseModel):
    candidate_id: str
    job_role: str
    interview_type: str = "technical"
    duration_minutes: int = 30


class EmotionAnalysisRequest(BaseModel):
    image_data: Optional[str] = None
    text_data: Optional[str] = None
    analysis_type: str = "emotion"


class AssessmentRequest(BaseModel):
    candidate_id: str
    test_type: str
    questions: List[Dict[str, Any]]
    time_limit: int = 30


class ReportRequest(BaseModel):
    candidate_id: str
    report_type: str = "comprehensive"
    format: str = "pdf"


# Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ResumeAnalysisResponse(BaseModel):
    candidate_info: Dict[str, Any]
    skills_analysis: Dict[str, Any]
    experience_analysis: Dict[str, Any]
    job_fit_score: float
    recommendations: List[str]
    insights: Dict[str, Any]


class InterviewResponse(BaseModel):
    session_id: str
    question: str
    category: str
    progress: str
    time_remaining: int


class EmotionAnalysisResponse(BaseModel):
    emotion: str
    confidence: float
    sentiment: str
    stress_level: float
    engagement_score: float
    recommendations: List[str]


# ----------------------
# ML model initialization
# ----------------------
async def initialize_ml_models():
    """Initialize all ML models (optional)."""
    global emotion_model, sentiment_analyzer, nlp_model

    # Emotion model
    try:
        if os.path.exists('emotion_model.h5'):
            emotion_model = tf.keras.models.load_model('emotion_model.h5')
            logger.info("✅ Emotion model loaded successfully")
        else:
            logger.warning("Emotion model file not found")
            emotion_model = None
    except Exception as e:
        logger.warning(f"⚠️ Emotion model not available: {e}")
        emotion_model = None

    # Sentiment analyzer
    try:
        sentiment_analyzer = pipeline("sentiment-analysis")
        logger.info("✅ Sentiment analyzer loaded successfully")
    except Exception as e:
        logger.warning(f"⚠️ Sentiment analyzer not available: {e}")
        sentiment_analyzer = None

    # spaCy NLP
    try:
        nlp_model = spacy.load("en_core_web_sm")
        logger.info("✅ NLP model loaded successfully")
    except Exception as e:
        logger.warning(f"⚠️ NLP model not available: {e}")
        nlp_model = None


# ----------------------
# Authentication helper
# ----------------------
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token (stub)."""
    token = credentials.credentials
    # In production, verify token properly
    return token


# ----------------------
# WebSocket Manager
# ----------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                # remove dead connections
                try:
                    self.active_connections.remove(connection)
                except Exception:
                    pass


manager = ConnectionManager()


# ----------------------
# Background / Celery tasks (optional)
# ----------------------
def _set_in_memory(key: str, value: str, expire_seconds: Optional[int] = None):
    """Fallback storage if Redis isn't available (dev only)."""
    if redis_client:
        try:
            if expire_seconds:
                redis_client.setex(key, expire_seconds, value)
            else:
                redis_client.set(key, value)
        except Exception as e:
            logger.warning(f"Redis set failed: {e}")
    else:
        # simple local store
        _in_memory_store[key] = value


def _get_in_memory(key: str) -> Optional[str]:
    if redis_client:
        try:
            return redis_client.get(key)
        except Exception:
            return None
    return _in_memory_store.get(key)


if celery_app:
    @celery_app.task
    def process_resume_background(file_path: str, job_requirements: List[str]):
        """Background task for resume processing (Celery)."""
        try:
            if resume_analyzer:
                result = resume_analyzer.parse_resume(file_path, job_requirements or [])
                return result
            return {"error": "AI services not available"}
        except Exception as e:
            return {"error": str(e)}

    @celery_app.task
    def generate_report_background(candidate_id: str, report_type: str):
        try:
            report_data = {
                "candidate_id": candidate_id,
                "report_type": report_type,
                "generated_at": datetime.now().isoformat(),
                "sections": ["resume_analysis", "interview_scores", "emotion_analysis", "recommendations"]
            }
            return report_data
        except Exception as e:
            return {"error": str(e)}
else:
    # If celery not present, provide sync helpers (dev)
    def process_resume_background(file_path: str, job_requirements: List[str]):
        try:
            if resume_analyzer:
                return resume_analyzer.parse_resume(file_path, job_requirements or [])
            return {"error": "AI services not available"}
        except Exception as e:
            return {"error": str(e)}

    def generate_report_background(candidate_id: str, report_type: str):
        try:
            return {
                "candidate_id": candidate_id,
                "report_type": report_type,
                "generated_at": datetime.now().isoformat(),
                "sections": ["resume_analysis", "interview_scores", "emotion_analysis", "recommendations"]
            }
        except Exception as e:
            return {"error": str(e)}


# ----------------------
# Startup event
# ----------------------
@app.on_event("startup")
async def startup_event():
    await initialize_ml_models()
    logger.info("🚀 SmartHire AI Recruitment System started")


# ----------------------
# Root & Health
# ----------------------
@app.get("/", response_model=APIResponse)
async def root():
    return APIResponse(
        success=True,
        message="SmartHire AI Recruitment System API",
        data={
            "version": "2.0.0",
            "ai_services_available": AI_SERVICES_AVAILABLE,
            "features": [
                "resume_analysis",
                "interview_scoring",
                "emotion_detection",
                "assessment_management",
                "report_generation"
            ]
        }
    )


@app.get("/health", response_model=APIResponse)
async def health_check():
    return APIResponse(
        success=True,
        message="System healthy",
        data={
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "ai_services": AI_SERVICES_AVAILABLE,
            "models_loaded": {
                "emotion_model": emotion_model is not None,
                "sentiment_analyzer": sentiment_analyzer is not None,
                "nlp_model": nlp_model is not None
            }
        }
    )


# ----------------------
# Authentication Endpoints
# ----------------------
@app.post("/auth/login", response_model=APIResponse)
async def login(user_data: UserLogin):
    """User login endpoint (stub)."""
    return APIResponse(
        success=True,
        message="Login successful",
        data={
            "token": f"jwt_token_{user_data.email}",
            "user": {
                "email": user_data.email,
                "role": user_data.role,
                "permissions": get_role_permissions(user_data.role)
            }
        }
    )


@app.post("/auth/register", response_model=APIResponse)
async def register(user_data: UserRegistration):
    """User registration endpoint (stub)."""
    return APIResponse(
        success=True,
        message="Registration successful",
        data={
            "user_id": str(uuid.uuid4()),
            "email": user_data.email,
            "role": user_data.role,
            "status": "pending_approval" if user_data.role != "candidate" else "active"
        }
    )


# ----------------------
# Resume Analysis Endpoints
# ----------------------
class ResumeAnalyzeRequest(BaseModel):
    file_path: str
    job_requirements: List[str] = []
    job_title: str = ""
    job_description: str = ""

@app.post("/api/resume/analyze")
async def analyze_resume(request: ResumeAnalyzeRequest):
    """Analyze resume from file path (called by backend)"""
    try:
        file_path = request.file_path
        job_requirements = request.job_requirements
        job_title = request.job_title
        job_description = request.job_description

        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")

        # Use advanced resume parser if available
        try:
            from advanced_resume_parser import AdvancedResumeAnalyzer
            analyzer = AdvancedResumeAnalyzer()
            
            # Prepare job requirements dict
            job_req_dict = {
                "skills": job_requirements if isinstance(job_requirements, list) else [],
                "nice_to_have": [],
                "experience_level": "mid",
                "industry": "technology",
                "culture": []
            }
            
            result = analyzer.analyze_resume(file_path, job_req_dict)
            
            if result.get("success"):
                # Extract data for response
                profile = result.get("candidate_profile", {})
                fit_analysis = result.get("job_fit_analysis", {})
                
                # Calculate match score
                match_score = 0
                if fit_analysis:
                    if isinstance(fit_analysis, dict):
                        match_score = fit_analysis.get("overall_score", 0)
                    elif isinstance(fit_analysis, (int, float)):
                        match_score = fit_analysis
                
                # Extract skills
                skills_detected = profile.get("skills_detected", {})
                skills_list = list(skills_detected.keys()) if isinstance(skills_detected, dict) else []
                
                # Generate strengths and weaknesses
                strengths = []
                weaknesses = []
                recommendations = []
                
                if match_score >= 80:
                    strengths.append("Strong alignment with job requirements")
                    strengths.append("Relevant skills and experience demonstrated")
                    recommendations.append("Proceed to interview stage")
                elif match_score >= 60:
                    strengths.append("Moderate alignment with role requirements")
                    weaknesses.append("Some skill gaps identified")
                    recommendations.append("Consider for interview with focus on skill gaps")
                else:
                    weaknesses.append("Limited alignment with job requirements")
                    weaknesses.append("Significant skill gaps present")
                    recommendations.append("Review candidate for alternative positions or skill development")
                
                # Skills match analysis
                skills_match = []
                if job_requirements and isinstance(job_requirements, list):
                    for req in job_requirements:
                        req_lower = req.lower()
                        for skill in skills_list:
                            if req_lower in skill.lower() or skill.lower() in req_lower:
                                skills_match.append(skill)
                                break
                
                return {
                    "success": True,
                    "data": {
                        "match_score": int(match_score),
                        "skills": skills_list,
                        "experience": profile.get("experiences", 0),
                        "strengths": strengths,
                        "weaknesses": weaknesses,
                        "recommendations": recommendations,
                        "skills_match": list(set(skills_match)),
                        "experience_match": f"{profile.get('experiences', 0)} years of experience detected" if profile.get("experiences", 0) > 0 else "Experience level needs verification",
                        "education_match": "Education details extracted from resume",
                        "confidence": result.get("analysis_confidence", 0.7)
                    }
                }
            else:
                raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))
                
        except ImportError:
            # Fallback to basic resume parser
            if resume_analyzer:
                result = resume_analyzer.parse_resume(file_path, job_requirements)
                return {
                    "success": True,
                    "data": {
                        "match_score": result.get("match_score", 50),
                        "skills": result.get("skills", []),
                        "experience": result.get("experience", 0),
                        "strengths": result.get("strengths", []),
                        "weaknesses": result.get("weaknesses", []),
                        "recommendations": result.get("recommendations", [])
                    }
                }
            else:
                # Generate fallback analysis
                return {
                    "success": True,
                    "data": {
                        "match_score": 65,
                        "skills": [],
                        "experience": 0,
                        "strengths": ["Resume received and processed"],
                        "weaknesses": ["Detailed AI analysis unavailable"],
                        "recommendations": ["Manual review recommended"]
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume analysis error: {e}")
        # Return fallback response
        return {
            "success": True,
            "data": {
                "match_score": 50,
                "skills": [],
                "experience": 0,
                "strengths": [],
                "weaknesses": ["AI analysis service encountered an error"],
                "recommendations": ["Manual review required"]
            }
        }


@app.post("/api/resume/upload", response_model=APIResponse)
async def upload_resume(
    file: UploadFile = File(...),
    job_requirements: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """Upload and analyze resume"""
    try:
        # Save uploaded file
        upload_dir = Path("uploads/resumes")
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = str(upload_dir / f"{uuid.uuid4()}_{file.filename}")

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Parse job requirements (if provided as JSON string)
        requirements = json.loads(job_requirements) if job_requirements else []

        # Process resume (async or sync depending on celery availability)
        if AI_SERVICES_AVAILABLE and resume_analyzer:
            if celery_app:
                # enqueue
                task = process_resume_background.delay(file_path, requirements)
                analysis_id = str(uuid.uuid4())
                _set_in_memory(f"resume_analysis:{analysis_id}", json.dumps({"task_id": task.id}), expire_seconds=3600)
                return APIResponse(
                    success=True,
                    message="Resume processing queued",
                    data={"analysis_id": analysis_id, "task_id": task.id}
                )
            else:
                result = process_resume_background(file_path, requirements)
                analysis_id = str(uuid.uuid4())
                _set_in_memory(f"resume_analysis:{analysis_id}", json.dumps(result), expire_seconds=3600)
                # Clean up file
                try:
                    os.remove(file_path)
                except Exception:
                    pass
                return APIResponse(
                    success=True,
                    message="Resume analyzed successfully",
                    data={"analysis_id": analysis_id, "result": result}
                )
        else:
            # Clean up file
            try:
                os.remove(file_path)
            except Exception:
                pass
            return APIResponse(success=False, message="AI services not available")

    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resume/analysis/{analysis_id}", response_model=APIResponse)
async def get_resume_analysis(analysis_id: str):
    """Get resume analysis results"""
    try:
        value = _get_in_memory(f"resume_analysis:{analysis_id}")
        if not value:
            raise HTTPException(status_code=404, detail="Analysis not found")
        analysis_data = json.loads(value)
        return APIResponse(success=True, message="Analysis retrieved successfully", data=analysis_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get resume analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Enhanced Resume Processing Endpoints
class ResumeParseRequest(BaseModel):
    file_path: str
    candidate_id: Optional[str] = None
    resume_id: Optional[str] = None

class ATSScoreRequest(BaseModel):
    file_path: str
    job_requirements: List[str] = []
    job_title: str = ""
    job_description: str = ""
    extracted_data: Optional[Dict] = None

class TemplateRequest(BaseModel):
    file_path: str
    extracted_data: Dict
    ats_score: Optional[Dict] = None
    template_style: str = "professional"

@app.post("/api/resume/parse", response_model=APIResponse)
async def parse_resume(request: ResumeParseRequest):
    """Parse resume and extract comprehensive information"""
    try:
        from enhanced_resume_parser import EnhancedResumeParser
        
        parser = EnhancedResumeParser()
        result = parser.parse_resume(request.file_path)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                message="Resume parsed successfully",
                data=result.get("data")
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Parsing failed"))
            
    except ImportError:
        # Fallback to basic parser if enhanced parser not available
        try:
            from advanced_resume_parser import AdvancedResumeAnalyzer
            analyzer = AdvancedResumeAnalyzer()
            result = analyzer.analyze_resume(request.file_path)
            
            # Convert to expected format
            profile = result.get("candidate_profile", {})
            skills_detected = profile.get("skills_detected", {})
            
            return APIResponse(
                success=True,
                message="Resume parsed successfully (basic mode)",
                data={
                    "fullName": None,
                    "contactInfo": {},
                    "education": [],
                    "experience": {
                        "entries": [],
                        "totalYears": profile.get("experiences", 0),
                        "totalPositions": profile.get("experiences", 0)
                    },
                    "skills": {
                        "technical": list(skills_detected.keys()) if isinstance(skills_detected, dict) else [],
                        "soft": [],
                        "all": list(skills_detected.keys()) if isinstance(skills_detected, dict) else []
                    },
                    "certifications": []
                }
            )
        except Exception as e:
            logger.error(f"Resume parsing error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/ats-score", response_model=APIResponse)
async def calculate_ats_score(request: ATSScoreRequest):
    """Calculate ATS (Applicant Tracking System) score"""
    try:
        # Use extracted data if available, otherwise parse resume
        extracted_data = request.extracted_data
        
        if not extracted_data:
            # Parse resume first
            try:
                from enhanced_resume_parser import EnhancedResumeParser
                parser = EnhancedResumeParser()
                parse_result = parser.parse_resume(request.file_path)
                if parse_result.get("success"):
                    extracted_data = parse_result.get("data")
            except Exception as e:
                logger.warning(f"Could not parse resume for ATS score: {e}")
        
        # Extract skills from resume
        candidate_skills = []
        if extracted_data:
            skills_data = extracted_data.get("skills", {})
            if isinstance(skills_data, dict):
                candidate_skills = skills_data.get("all", []) or skills_data.get("technical", [])
            elif isinstance(skills_data, list):
                candidate_skills = skills_data
        
        # Normalize skills to lowercase for matching
        candidate_skills_lower = [s.lower() for s in candidate_skills]
        job_requirements_lower = [r.lower() for r in request.job_requirements]
        
        # Calculate skill match
        matched_skills = []
        for req in job_requirements_lower:
            for skill in candidate_skills_lower:
                if req in skill or skill in req:
                    matched_skills.append(skill)
                    break
        
        # Calculate scores
        skill_match_score = (len(matched_skills) / len(job_requirements_lower) * 100) if job_requirements_lower else 0
        
        # Experience match (if available)
        experience_years = 0
        if extracted_data and extracted_data.get("experience"):
            exp_data = extracted_data.get("experience")
            if isinstance(exp_data, dict):
                experience_years = exp_data.get("totalYears", 0)
            elif isinstance(exp_data, (int, float)):
                experience_years = exp_data
        
        # Overall ATS score (weighted)
        # 70% skill match, 20% experience relevance, 10% keyword density
        overall_score = skill_match_score * 0.7
        
        # Add experience bonus
        if experience_years >= 5:
            overall_score += 20
        elif experience_years >= 3:
            overall_score += 15
        elif experience_years >= 1:
            overall_score += 10
        
        # Cap at 100
        overall_score = min(100, overall_score)
        
        return APIResponse(
            success=True,
            message="ATS score calculated",
            data={
                "overallScore": round(overall_score, 1),
                "skillMatch": round(skill_match_score, 1),
                "matchedSkills": list(set(matched_skills)),
                "totalRequiredSkills": len(job_requirements_lower),
                "matchedSkillsCount": len(matched_skills),
                "missingSkills": [r for r in job_requirements_lower if r not in [s.lower() for s in matched_skills]],
                "candidateSkills": candidate_skills,
                "experienceYears": experience_years
            }
        )
        
    except Exception as e:
        logger.error(f"ATS score calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/generate-template", response_model=APIResponse)
async def generate_template(request: TemplateRequest):
    """Generate professional uniform template from resume"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        
        # Create output directory
        output_dir = Path("uploads/templates")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        template_filename = f"template_{uuid.uuid4()}.pdf"
        template_path = str(output_dir / template_filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(template_path, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=12,
            alignment=1  # Center
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#283593'),
            spaceAfter=6,
            spaceBefore=12
        )
        
        # Extract data
        data = request.extracted_data
        full_name = data.get("fullName", "Candidate Name")
        contact = data.get("contactInfo", {})
        education = data.get("education", [])
        experience = data.get("experience", {}).get("entries", [])
        skills = data.get("skills", {})
        certifications = data.get("certifications", [])
        
        # Header
        story.append(Paragraph(full_name, title_style))
        
        # Contact Information
        contact_info = []
        if contact.get("email"):
            contact_info.append(contact["email"])
        if contact.get("phone"):
            contact_info.append(contact["phone"])
        if contact.get("linkedin"):
            contact_info.append(f"LinkedIn: {contact['linkedin']}")
        
        if contact_info:
            story.append(Paragraph(" | ".join(contact_info), styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # ATS Score (if provided)
        if request.ats_score:
            ats_score = request.ats_score.get("overallScore", 0)
            score_color_hex = "#4caf50" if ats_score >= 70 else "#ff9800" if ats_score >= 50 else "#f44336"
            story.append(Paragraph(f"<b>ATS Match Score: <font color='{score_color_hex}'>{ats_score}%</font></b>", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        
        # Professional Summary
        story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
        summary_text = f"Experienced professional with {data.get('experience', {}).get('totalYears', 0)} years of experience. "
        if skills.get("technical"):
            summary_text += f"Proficient in {', '.join(skills['technical'][:5])}. "
        story.append(Paragraph(summary_text, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Skills Section
        if skills:
            story.append(Paragraph("SKILLS", heading_style))
            tech_skills = skills.get("technical", [])
            soft_skills = skills.get("soft", [])
            
            if tech_skills:
                story.append(Paragraph(f"<b>Technical:</b> {', '.join(tech_skills[:15])}", styles['Normal']))
            if soft_skills:
                story.append(Paragraph(f"<b>Soft Skills:</b> {', '.join(soft_skills[:10])}", styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # Work Experience
        if experience:
            story.append(Paragraph("WORK EXPERIENCE", heading_style))
            for exp in experience[:5]:  # Top 5 experiences
                company = exp.get("company", "Company")
                position = exp.get("position", "Position")
                duration = exp.get("duration", exp.get("startDate", ""))
                
                story.append(Paragraph(f"<b>{position}</b> - {company}", styles['Normal']))
                if duration:
                    story.append(Paragraph(f"<i>{duration}</i>", styles['Normal']))
                if exp.get("description"):
                    story.append(Paragraph(exp["description"][:200], styles['Normal']))
                story.append(Spacer(1, 0.1*inch))
            story.append(Spacer(1, 0.2*inch))
        
        # Education
        if education:
            story.append(Paragraph("EDUCATION", heading_style))
            for edu in education[:3]:  # Top 3 education entries
                degree = edu.get("degree", "")
                institution = edu.get("institution", "")
                year = edu.get("graduationYear", "")
                
                edu_text = f"<b>{degree}</b>"
                if institution:
                    edu_text += f" - {institution}"
                if year:
                    edu_text += f" ({year})"
                story.append(Paragraph(edu_text, styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # Certifications
        if certifications:
            story.append(Paragraph("CERTIFICATIONS", heading_style))
            for cert in certifications[:5]:  # Top 5 certifications
                cert_name = cert.get("name", "")
                issuer = cert.get("issuer", "")
                cert_text = f"<b>{cert_name}</b>"
                if issuer:
                    cert_text += f" - {issuer}"
                story.append(Paragraph(cert_text, styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        return APIResponse(
            success=True,
            message="Professional template generated",
            data={
                "template_path": template_path,
                "template_filename": template_filename
            }
        )
        
    except ImportError:
        # Fallback if reportlab not available
        logger.warning("ReportLab not available, cannot generate PDF template")
        raise HTTPException(status_code=503, detail="PDF generation library not available")
    except Exception as e:
        logger.error(f"Template generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# Interview Management Endpoints
# ----------------------
@app.post("/api/interview/start", response_model=APIResponse)
async def start_interview_session(request: InterviewSessionRequest):
    """Start new interview session"""
    try:
        if not AI_SERVICES_AVAILABLE or not interview_chatbot:
            raise HTTPException(status_code=503, detail="AI services not available")

        chatbot = interview_chatbot
        session = chatbot.initiate_interview(request.candidate_id, request.job_role)

        # Store session
        interview_sessions[session.session_id] = session

        # Get first question
        first_question = chatbot.get_next_question(session)

        return APIResponse(
            success=True,
            message="Interview session started",
            data={
                "session_id": session.session_id,
                "first_question": first_question,
                "estimated_duration": request.duration_minutes,
                "interview_type": request.interview_type
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/interview/question/{session_id}", response_model=APIResponse)
async def get_interview_question(session_id: str):
    """Get next interview question"""
    try:
        if session_id not in interview_sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        session = interview_sessions[session_id]
        chatbot = interview_chatbot
        if not chatbot:
            raise HTTPException(status_code=503, detail="Interview chatbot not available")

        question = chatbot.get_next_question(session)

        return APIResponse(success=True, message="Question retrieved", data=question)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get interview question error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/answer/{session_id}", response_model=APIResponse)
async def submit_interview_answer(session_id: str, answer_text: str, question_id: str):
    """Submit interview answer"""
    try:
        if session_id not in interview_sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        session = interview_sessions[session_id]
        chatbot = interview_chatbot
        if not chatbot:
            raise HTTPException(status_code=503, detail="Interview chatbot not available")

        response = chatbot.process_answer(session, answer_text, question_id)

        # Update session
        interview_sessions[session_id] = session

        return APIResponse(success=True, message="Answer processed", data=response)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Submit interview answer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# Emotion Analysis Endpoints
# ----------------------
@app.post("/api/emotion/analyze", response_model=APIResponse)
async def analyze_emotion(request: EmotionAnalysisRequest):
    """Analyze emotion from image or text"""
    try:
        result: Dict[str, Any] = {}

        if request.image_data and emotion_analyzer:
            # Analyze image emotion
            image_result = emotion_analyzer.analyze_image_emotion(request.image_data)
            result.update(image_result)

        if request.text_data and emotion_analyzer:
            # Analyze text sentiment
            text_result = emotion_analyzer.analyze_text_sentiment(request.text_data)
            result.update(text_result)

        if not result:
            return APIResponse(success=False, message="No analysis performed or AI services unavailable")

        return APIResponse(success=True, message="Emotion analysis completed", data=result)
    except Exception as e:
        logger.error(f"Emotion analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# Assessment Management
# ----------------------
@app.post("/api/assessment/create", response_model=APIResponse)
async def create_assessment(request: AssessmentRequest):
    """Create new assessment"""
    try:
        assessment_id = str(uuid.uuid4())
        assessment_data = {
            "assessment_id": assessment_id,
            "candidate_id": request.candidate_id,
            "test_type": request.test_type,
            "questions": request.questions,
            "time_limit": request.time_limit,
            "created_at": datetime.now().isoformat(),
            "status": "created"
        }

        _set_in_memory(f"assessment:{assessment_id}", json.dumps(assessment_data), expire_seconds=7200)

        return APIResponse(success=True, message="Assessment created successfully", data=assessment_data)
    except Exception as e:
        logger.error(f"Create assessment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/assessment/{assessment_id}", response_model=APIResponse)
async def get_assessment(assessment_id: str):
    """Get assessment details"""
    try:
        assessment_data = _get_in_memory(f"assessment:{assessment_id}")
        if not assessment_data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        return APIResponse(success=True, message="Assessment retrieved", data=json.loads(assessment_data))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get assessment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# Reporting Endpoints
# ----------------------
# Helper placeholders: in production, replace with DB fetches or actual implementations
async def get_resume_analysis_data(candidate_id: str) -> Dict[str, Any]:
    return {"status": "placeholder", "score": 85}


async def get_interview_scores_data(candidate_id: str) -> Dict[str, Any]:
    return {"status": "placeholder", "average_score": 78}


async def get_emotion_analysis_data(candidate_id: str) -> Dict[str, Any]:
    return {"status": "placeholder", "confidence_level": 0.82}


async def generate_recommendations(candidate_id: str) -> List[str]:
    return [
        "Strong technical skills demonstrated",
        "Consider additional leadership experience",
        "Excellent communication abilities"
    ]


@app.post("/api/reports/generate", response_model=APIResponse)
async def generate_report(request: ReportRequest):
    """Generate candidate report"""
    try:
        report_id = str(uuid.uuid4())

        # Compose report data (async gather)
        resume_data = await get_resume_analysis_data(request.candidate_id)
        interview_data = await get_interview_scores_data(request.candidate_id)
        emotion_data = await get_emotion_analysis_data(request.candidate_id)
        recommendations = await generate_recommendations(request.candidate_id)

        report_data = {
            "report_id": report_id,
            "candidate_id": request.candidate_id,
            "report_type": request.report_type,
            "format": request.format,
            "generated_at": datetime.now().isoformat(),
            "sections": {
                "resume_analysis": resume_data,
                "interview_scores": interview_data,
                "emotion_analysis": emotion_data,
                "recommendations": recommendations
            }
        }

        if report_generator:
            try:
                comprehensive_report = report_generator.generate_comprehensive_report(report_data)
                report_data.update({"generated_report": comprehensive_report})
            except Exception as e:
                logger.warning(f"Report generation via generator failed: {e}")

        _set_in_memory(f"report:{report_id}", json.dumps(report_data), expire_seconds=86400)

        return APIResponse(
            success=True,
            message="Report generated successfully",
            data={"report_id": report_id, "download_url": f"/api/reports/download/{report_id}"}
        )
    except Exception as e:
        logger.error(f"Generate report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/download/{report_id}")
async def download_report(report_id: str, format: str = "pdf"):
    """Download generated report"""
    try:
        report_data_str = _get_in_memory(f"report:{report_id}")
        if not report_data_str:
            raise HTTPException(status_code=404, detail="Report not found")

        report = json.loads(report_data_str)

        if format == "pdf":
            pdf_dir = Path("reports")
            pdf_dir.mkdir(parents=True, exist_ok=True)
            pdf_path = pdf_dir / f"{report_id}.pdf"

            doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
            styles = getSampleStyleSheet()
            story = []

            title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=30, alignment=1)
            story.append(Paragraph("SmartHire Candidate Report", title_style))
            story.append(Spacer(1, 20))

            for section, data in report.get("sections", {}).items():
                story.append(Paragraph(f"<b>{section.replace('_', ' ').title()}</b>", styles['Heading2']))
                story.append(Paragraph(str(data), styles['Normal']))
                story.append(Spacer(1, 12))

            doc.build(story)

            return FileResponse(str(pdf_path), filename=f"candidate_report_{report_id}.pdf")

        # fallback: return JSON
        return JSONResponse(content=report)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# WebSocket Endpoint (real-time interview)
# ----------------------
@app.websocket("/ws/interview/{session_id}")
async def websocket_interview_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time interview updates"""
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                manager.disconnect(websocket)
                break
            except Exception:
                # ignore malformed frames
                continue

            try:
                message = json.loads(data)
            except Exception:
                # invalid JSON - send error and continue
                await manager.send_personal_message(json.dumps({"error": "invalid message format"}), websocket)
                continue

            # handle different message types
            mtype = message.get("type")
            if mtype == "emotion_analysis":
                if emotion_analyzer:
                    try:
                        img_b64 = message.get("image_data")
                        image_result = emotion_analyzer.analyze_image_emotion(img_b64)
                        await manager.send_personal_message(json.dumps({"type": "emotion_update", "data": image_result}), websocket)
                    except Exception as e:
                        await manager.send_personal_message(json.dumps({"error": str(e)}), websocket)
                else:
                    await manager.send_personal_message(json.dumps({"error": "emotion analyzer not available"}), websocket)

            elif mtype == "interview_progress":
                await manager.send_personal_message(json.dumps({"type": "progress_update", "data": {"progress": message.get("progress")}}), websocket)

            elif mtype == "transcript_line":
                # Example: process a line of transcript and return sentiment/emotion
                line = message.get("text", "")
                analysis = {}
                try:
                    if sentiment_analyzer:
                        sentiment = sentiment_analyzer(line)
                        analysis["sentiment"] = sentiment
                except Exception:
                    pass
                try:
                    if nlp_model:
                        doc = nlp_model(line)
                        keywords = [ent.text for ent in doc.ents]
                        analysis["keywords"] = keywords
                except Exception:
                    pass

                await manager.send_personal_message(json.dumps({"type": "transcript_analysis", "data": {"text": line, "analysis": analysis}}), websocket)

            else:
                # default echo
                await manager.send_personal_message(json.dumps({"type": "echo", "data": message}), websocket)

    finally:
        try:
            manager.disconnect(websocket)
        except Exception:
            pass


# ----------------------
# Utility functions
# ----------------------
def get_role_permissions(role: str) -> List[str]:
    """Get permissions for user role"""
    permissions = {
        "admin": ["all"],
        "hr": ["view_candidates", "manage_interviews", "generate_reports"],
        "manager": ["view_candidates", "conduct_interviews"],
        "employee": ["view_own_data"],
        "candidate": ["take_assessments", "view_own_results"]
    }
    return permissions.get(role, [])


# ----------------------
# Run application
# ----------------------
if __name__ == "__main__":
    import uvicorn

    logger.info("🚀 Starting SmartHire AI Recruitment System...")
    logger.info(f"📊 AI Services Available: {AI_SERVICES_AVAILABLE}")
    logger.info("🌐 API Documentation: http://localhost:8000/docs")
    logger.info("💡 Health Check: http://localhost:8000/health")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
