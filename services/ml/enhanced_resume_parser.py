"""
Enhanced Resume Parser with Comprehensive Data Extraction
Extracts: Full Name, Contact Info, Education, Work Experience, Skills, Certifications
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import PyPDF2
import docx
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ContactInfo:
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None

@dataclass
class EducationEntry:
    institution: str
    degree: str
    field: Optional[str] = None
    graduationYear: Optional[int] = None
    gpa: Optional[float] = None
    honors: Optional[str] = None

@dataclass
class WorkExperience:
    company: str
    position: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    achievements: List[str] = None

@dataclass
class Certification:
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    expiryDate: Optional[str] = None
    credentialId: Optional[str] = None

class EnhancedResumeParser:
    def __init__(self):
        # Common skill keywords
        self.technical_skills = [
            'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
            'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
            'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
            'git', 'linux', 'rest', 'graphql', 'microservices',
            'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
            'html', 'css', 'typescript', 'sass', 'webpack'
        ]
        
        self.soft_skills = [
            'leadership', 'communication', 'teamwork', 'problem solving',
            'project management', 'agile', 'scrum', 'collaboration',
            'analytical', 'creative', 'detail-oriented', 'time management'
        ]

    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from PDF or DOCX files"""
        try:
            if file_path.endswith('.pdf'):
                return self._extract_pdf_text(file_path)
            elif file_path.endswith('.docx') or file_path.endswith('.doc'):
                return self._extract_docx_text(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""

    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
        return text

    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            return ""

    def extract_contact_info(self, text: str) -> ContactInfo:
        """Extract contact information from resume text"""
        contact = ContactInfo()
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact.email = emails[0]
        
        # Extract phone
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}'
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                contact.phone = phones[0]
                break
        
        # Extract LinkedIn
        linkedin_pattern = r'(?:linkedin\.com/in/|linkedin\.com/pub/)([a-zA-Z0-9-]+)'
        linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        if linkedin_match:
            contact.linkedin = f"linkedin.com/in/{linkedin_match.group(1)}"
        
        # Extract GitHub
        github_pattern = r'(?:github\.com/)([a-zA-Z0-9-]+)'
        github_match = re.search(github_pattern, text, re.IGNORECASE)
        if github_match:
            contact.github = f"github.com/{github_match.group(1)}"
        
        # Extract website
        website_pattern = r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})'
        website_match = re.search(website_pattern, text)
        if website_match and 'linkedin' not in website_match.group(1).lower() and 'github' not in website_match.group(1).lower():
            contact.website = website_match.group(1)
        
        # Extract full name (usually at the top of resume)
        lines = text.split('\n')[:10]  # Check first 10 lines
        for line in lines:
            line = line.strip()
            # Look for lines that look like names (2-4 words, capitalized)
            if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$', line):
                if not any(keyword in line.lower() for keyword in ['email', 'phone', 'address', 'resume', 'cv']):
                    contact.fullName = line
                    break
        
        return contact

    def extract_education(self, text: str) -> List[EducationEntry]:
        """Extract education information"""
        education = []
        text_lower = text.lower()
        
        # Education section patterns
        education_keywords = ['education', 'academic', 'qualification', 'university', 'college', 'degree']
        education_section = ""
        
        # Find education section
        for keyword in education_keywords:
            pattern = rf'{keyword}.*?(?=\n\n|\n[A-Z][^a-z]|$)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                education_section = match.group(0)
                break
        
        if not education_section:
            education_section = text  # Search entire text if no section found
        
        # Degree patterns
        degree_patterns = [
            r'(Bachelor|Master|PhD|Doctorate|Associate|Diploma|Certificate)\s+(?:of|in)?\s*([A-Za-z\s]+)',
            r'([A-Za-z\s]+)\s+(?:Bachelor|Master|PhD|Doctorate|Associate|Diploma|Certificate)'
        ]
        
        # Institution patterns
        institution_patterns = [
            r'([A-Z][a-zA-Z\s&]+(?:University|College|Institute|School|Academy))',
            r'([A-Z][a-zA-Z\s&]+(?:State|National|International))'
        ]
        
        # Extract degrees and institutions
        for degree_pattern in degree_patterns:
            matches = re.finditer(degree_pattern, education_section, re.IGNORECASE)
            for match in matches:
                degree_type = match.group(1) if match.groups() else ""
                field = match.group(2) if len(match.groups()) > 1 else None
                
                # Find nearby institution
                institution = None
                for inst_pattern in institution_patterns:
                    inst_match = re.search(inst_pattern, education_section, re.IGNORECASE)
                    if inst_match:
                        institution = inst_match.group(1)
                        break
                
                # Extract graduation year
                year_match = re.search(r'(19|20)\d{2}', education_section)
                graduation_year = int(year_match.group(0)) if year_match else None
                
                # Extract GPA
                gpa_match = re.search(r'GPA[:\s]+(\d+\.?\d*)', education_section, re.IGNORECASE)
                gpa = float(gpa_match.group(1)) if gpa_match else None
                
                if degree_type or institution:
                    education.append(EducationEntry(
                        institution=institution or "Unknown",
                        degree=degree_type or "Unknown",
                        field=field,
                        graduationYear=graduation_year,
                        gpa=gpa
                    ))
        
        return education[:5]  # Return top 5 education entries

    def extract_work_experience(self, text: str) -> List[WorkExperience]:
        """Extract work experience"""
        experiences = []
        text_lower = text.lower()
        
        # Find experience section
        experience_keywords = ['experience', 'employment', 'work history', 'career', 'professional']
        experience_section = ""
        
        for keyword in experience_keywords:
            pattern = rf'{keyword}.*?(?=\n\n[A-Z]|$)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                experience_section = match.group(0)
                break
        
        if not experience_section:
            experience_section = text
        
        # Company and position patterns
        # Look for lines with company names (often in caps or bold)
        lines = experience_section.split('\n')
        
        current_company = None
        current_position = None
        current_start = None
        current_end = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check for company name (often followed by location or dates)
            company_pattern = r'^([A-Z][a-zA-Z0-9\s&.,-]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Systems)?)'
            company_match = re.match(company_pattern, line)
            if company_match:
                current_company = company_match.group(1).strip()
                continue
            
            # Check for position/title
            position_keywords = ['developer', 'engineer', 'manager', 'analyst', 'specialist', 'director', 'lead', 'architect']
            if any(keyword in line.lower() for keyword in position_keywords):
                if len(line.split()) <= 5:  # Likely a title
                    current_position = line
                    continue
            
            # Check for date ranges
            date_pattern = r'(\w+\s+\d{4}|\d{1,2}/\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{1,2}/\d{4}|\d{4}|Present|Current)'
            date_match = re.search(date_pattern, line, re.IGNORECASE)
            if date_match:
                current_start = date_match.group(1)
                current_end = date_match.group(2)
                
                # If we have company and position, create experience entry
                if current_company and current_position:
                    experiences.append(WorkExperience(
                        company=current_company,
                        position=current_position,
                        startDate=current_start,
                        endDate=current_end,
                        duration=self._calculate_duration(current_start, current_end)
                    ))
                    
                    # Reset for next entry
                    current_company = None
                    current_position = None
                    current_start = None
                    current_end = None
        
        return experiences[:10]  # Return top 10 experiences

    def _calculate_duration(self, start: str, end: str) -> str:
        """Calculate duration between dates"""
        try:
            # Simple duration calculation
            if 'present' in end.lower() or 'current' in end.lower():
                return "Present"
            # For more accurate calculation, would need to parse dates properly
            return f"{start} - {end}"
        except:
            return ""

    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extract technical and soft skills"""
        text_lower = text.lower()
        technical = []
        soft = []
        
        # Extract technical skills
        for skill in self.technical_skills:
            if skill in text_lower:
                technical.append(skill.title())
        
        # Extract soft skills
        for skill in self.soft_skills:
            if skill in text_lower:
                soft.append(skill.title())
        
        # Also look for skills section
        skills_section_pattern = r'skills?.*?(?=\n\n|\n[A-Z][^a-z]|$)'
        skills_match = re.search(skills_section_pattern, text, re.IGNORECASE | re.DOTALL)
        if skills_match:
            skills_text = skills_match.group(0).lower()
            # Extract comma or bullet-separated skills
            skill_items = re.split(r'[,•\-\n]', skills_text)
            for item in skill_items:
                item = item.strip()
                if len(item) > 2 and len(item) < 30:
                    if item not in technical and item not in soft:
                        # Try to classify
                        if any(tech in item for tech in self.technical_skills):
                            technical.append(item.title())
                        elif any(soft_skill in item for soft_skill in self.soft_skills):
                            soft.append(item.title())
        
        return {
            'technical': list(set(technical)),
            'soft': list(set(soft)),
            'all': list(set(technical + soft))
        }

    def extract_certifications(self, text: str) -> List[Certification]:
        """Extract certifications"""
        certifications = []
        text_lower = text.lower()
        
        # Find certifications section
        cert_keywords = ['certification', 'certificate', 'certified', 'license', 'credential']
        cert_section = ""
        
        for keyword in cert_keywords:
            pattern = rf'{keyword}.*?(?=\n\n|\n[A-Z][^a-z]|$)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                cert_section = match.group(0)
                break
        
        if not cert_section:
            cert_section = text
        
        # Common certification patterns
        cert_patterns = [
            r'([A-Z][a-zA-Z\s]+(?:Certified|Certification|License))',
            r'(AWS|Azure|GCP|Google Cloud|Microsoft|Oracle|Cisco|PMP|Scrum|Agile)',
        ]
        
        for pattern in cert_patterns:
            matches = re.finditer(pattern, cert_section, re.IGNORECASE)
            for match in matches:
                cert_name = match.group(1).strip()
                
                # Try to find issuer and date nearby
                issuer = None
                date = None
                
                # Look for common issuers
                issuer_patterns = ['AWS', 'Microsoft', 'Google', 'Oracle', 'Cisco', 'PMI']
                for issuer_name in issuer_patterns:
                    if issuer_name.lower() in cert_section.lower():
                        issuer = issuer_name
                        break
                
                # Look for date
                date_match = re.search(r'(\w+\s+\d{4}|\d{1,2}/\d{4})', cert_section)
                if date_match:
                    date = date_match.group(1)
                
                certifications.append(Certification(
                    name=cert_name,
                    issuer=issuer,
                    date=date
                ))
        
        return list(set(certifications))[:10]  # Return top 10 unique certifications

    def parse_resume(self, file_path: str) -> Dict:
        """Main method to parse resume comprehensively"""
        try:
            # Extract text
            text = self.extract_text_from_file(file_path)
            if not text:
                return {
                    "success": False,
                    "error": "Could not extract text from resume"
                }
            
            # Extract all information
            contact = self.extract_contact_info(text)
            education = self.extract_education(text)
            experience = self.extract_work_experience(text)
            skills = self.extract_skills(text)
            certifications = self.extract_certifications(text)
            
            # Calculate total experience
            total_years = 0
            if experience:
                # Simple calculation based on number of experiences
                total_years = len(experience) * 2  # Rough estimate
                # Could be improved with actual date parsing
            
            return {
                "success": True,
                "data": {
                    "fullName": contact.fullName,
                    "contactInfo": {
                        "email": contact.email,
                        "phone": contact.phone,
                        "address": contact.address,
                        "linkedin": contact.linkedin,
                        "github": contact.github,
                        "website": contact.website
                    },
                    "education": [asdict(edu) for edu in education],
                    "experience": {
                        "entries": [asdict(exp) for exp in experience],
                        "totalYears": total_years,
                        "totalPositions": len(experience)
                    },
                    "skills": skills,
                    "certifications": [asdict(cert) for cert in certifications],
                    "rawText": text[:1000]  # First 1000 chars for reference
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            return {
                "success": False,
                "error": str(e)
            }

