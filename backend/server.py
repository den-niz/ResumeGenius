from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import asyncio
import io
import PyPDF2
import docx
import pytesseract
from PIL import Image
import spacy
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Load spaCy model for NLP
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

# Models
class ResumeAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    extracted_text: str
    skills: List[str]
    experience: List[str]
    education: List[str]
    contact_info: Dict[str, Any]
    job_match_score: float
    suggestions: List[str]
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AnalysisRequest(BaseModel):
    job_description: str

# File processing functions
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing DOCX: {str(e)}")

def extract_text_from_image_ocr(file_content: bytes) -> str:
    """Extract text from image using OCR."""
    try:
        image = Image.open(io.BytesIO(file_content))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image with OCR: {str(e)}")

def extract_entities_with_spacy(text: str) -> Dict[str, List[str]]:
    """Extract entities using spaCy NLP."""
    if not nlp:
        return extract_entities_with_regex(text)
    
    doc = nlp(text)
    
    skills = []
    experience = []
    education = []
    contact_info = {}
    
    # Extract skills using common skill patterns
    skill_patterns = [
        r'(?i)\b(?:python|javascript|react|node\.js|sql|html|css|java|c\+\+|machine learning|data analysis|aws|azure|docker|kubernetes|git|agile|scrum|project management|leadership|communication|problem solving|analytical|teamwork|critical thinking)\b'
    ]
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        skills.extend([match.lower() for match in matches])
    
    # Extract experience sections
    exp_sections = re.findall(r'(?i)(?:experience|work history|employment).*?(?=\n\n|\n[A-Z]|$)', text, re.DOTALL)
    for section in exp_sections:
        # Look for company names and dates
        companies = re.findall(r'(\d{4}[-\s]*\d{0,4})\s*[-–]\s*(?:\d{4}|present|current)\s*[:\-]?\s*([A-Z][A-Za-z\s&,\.]+)', section)
        experience.extend([f"{comp[1].strip()} ({comp[0]})" for comp in companies if len(comp[1].strip()) > 3])
    
    # Extract education
    edu_patterns = [
        r'(?i)\b(?:bachelor|master|phd|doctorate|degree|diploma|certification)\s+(?:of\s+)?(?:science|arts|engineering|business|computer|information)\b.*?(?=\n|$)',
        r'(?i)\b(?:university|college|institute|school)\s+of\s+[A-Za-z\s]+',
        r'(?i)\b[A-Z][a-z]+\s+(?:university|college|institute)\b'
    ]
    
    for pattern in edu_patterns:
        matches = re.findall(pattern, text)
        education.extend([match.strip() for match in matches])
    
    # Extract contact information
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        contact_info['email'] = email_match.group()
    
    phone_match = re.search(r'(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}', text)
    if phone_match:
        contact_info['phone'] = phone_match.group()
    
    return {
        'skills': list(set(skills)),
        'experience': list(set(experience)),
        'education': list(set(education)),
        'contact_info': contact_info
    }

def extract_entities_with_regex(text: str) -> Dict[str, List[str]]:
    """Fallback entity extraction using regex patterns."""
    skills = []
    experience = []
    education = []
    contact_info = {}
    
    # Common technical skills
    tech_skills = [
        'python', 'javascript', 'react', 'angular', 'vue', 'node.js', 'express',
        'sql', 'mysql', 'postgresql', 'mongodb', 'html', 'css', 'java', 'c++',
        'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart', 'flutter',
        'machine learning', 'data science', 'artificial intelligence', 'deep learning',
        'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
        'gitlab', 'ci/cd', 'devops', 'agile', 'scrum', 'project management'
    ]
    
    # Soft skills
    soft_skills = [
        'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
        'critical thinking', 'time management', 'adaptability', 'creativity',
        'attention to detail', 'multitasking', 'interpersonal', 'negotiation'
    ]
    
    all_skills = tech_skills + soft_skills
    text_lower = text.lower()
    
    for skill in all_skills:
        if skill in text_lower:
            skills.append(skill)
    
    # Extract years of experience
    exp_matches = re.findall(r'(\d+)[\s\-]*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp)', text, re.IGNORECASE)
    if exp_matches:
        experience.append(f"{max(exp_matches)} years of experience")
    
    # Extract education degrees
    degree_patterns = [
        r'(?i)\b(?:bachelor|master|phd|doctorate|bs|ms|mba|ba|ma)\b.*?(?:degree|of|in)\s*([A-Za-z\s]+)',
        r'(?i)\b[A-Z][a-z]+\s+(?:university|college|institute)\b'
    ]
    
    for pattern in degree_patterns:
        matches = re.findall(pattern, text)
        education.extend([match.strip() if isinstance(match, str) else match[0].strip() for match in matches])
    
    # Extract contact info
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        contact_info['email'] = email_match.group()
    
    phone_match = re.search(r'(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}', text)
    if phone_match:
        contact_info['phone'] = phone_match.group()
    
    return {
        'skills': list(set(skills)),
        'experience': list(set(experience)),
        'education': list(set(education)),
        'contact_info': contact_info
    }

def calculate_similarity_score(resume_text: str, job_description: str) -> float:
    """Calculate similarity between resume and job description using TF-IDF."""
    try:
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([resume_text.lower(), job_description.lower()])
        similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return float(similarity_matrix[0][0] * 100)
    except Exception:
        # Fallback to keyword matching
        resume_words = set(resume_text.lower().split())
        job_words = set(job_description.lower().split())
        common_words = resume_words.intersection(job_words)
        return (len(common_words) / len(job_words)) * 100 if job_words else 0

async def generate_ai_feedback(resume_text: str, job_description: str, extracted_data: Dict, match_score: float) -> List[str]:
    """Generate AI-powered feedback using LLM."""
    try:
        # Initialize LLM chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return get_fallback_suggestions(match_score, extracted_data)
        
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert resume analyst and career advisor. Provide specific, actionable feedback to improve resumes for better job matching."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Analyze this resume against the job description and provide specific improvement suggestions.
        
        RESUME CONTENT:
        {resume_text[:2000]}  # Limit to avoid token limits
        
        JOB DESCRIPTION:
        {job_description[:1000]}
        
        EXTRACTED DATA:
        - Skills: {', '.join(extracted_data.get('skills', [])[:10])}
        - Experience: {', '.join(extracted_data.get('experience', [])[:5])}
        - Education: {', '.join(extracted_data.get('education', [])[:3])}
        
        MATCH SCORE: {match_score:.1f}%
        
        Please provide 3-5 specific, actionable suggestions to improve this resume for the target job. Focus on:
        1. Missing skills or keywords from the job description
        2. Experience gaps or improvements
        3. Format and presentation enhancements
        4. Quantifiable achievements to add
        
        Return ONLY the suggestions as a numbered list, one suggestion per line.
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse suggestions from response
        suggestions = []
        lines = response.split('\n')
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering/bullets and clean up
                clean_suggestion = re.sub(r'^[\d\-•.\s]+', '', line).strip()
                if clean_suggestion:
                    suggestions.append(clean_suggestion)
        
        return suggestions[:5] if suggestions else get_fallback_suggestions(match_score, extracted_data)
        
    except Exception as e:
        logging.error(f"Error generating AI feedback: {str(e)}")
        return get_fallback_suggestions(match_score, extracted_data)

def get_fallback_suggestions(match_score: float, extracted_data: Dict) -> List[str]:
    """Fallback suggestions when AI is not available."""
    suggestions = []
    
    if match_score < 30:
        suggestions.append("Your resume has low similarity to the job requirements. Consider tailoring it more specifically to the role.")
    elif match_score < 60:
        suggestions.append("Good foundation, but there's room for improvement in aligning your experience with job requirements.")
    
    if len(extracted_data.get('skills', [])) < 5:
        suggestions.append("Add more relevant technical and soft skills that match the job description.")
    
    if len(extracted_data.get('experience', [])) < 2:
        suggestions.append("Include more detailed work experience with specific achievements and responsibilities.")
    
    suggestions.extend([
        "Use action verbs to describe your accomplishments (achieved, implemented, led, etc.)",
        "Include quantifiable results and metrics where possible (increased sales by 20%, managed team of 10, etc.)",
        "Ensure your resume is ATS-friendly with clear section headers and standard formatting"
    ])
    
    return suggestions[:5]

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AI-Powered Smart Resume Analyser API"}

@api_router.post("/analyze-resume", response_model=ResumeAnalysis)
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Analyze uploaded resume against job description."""
    start_time = datetime.now()
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png']:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Read file content
        file_content = await file.read()
        
        # Extract text based on file type
        if file_extension == 'pdf':
            extracted_text = extract_text_from_pdf(file_content)
        elif file_extension == 'docx':
            extracted_text = extract_text_from_docx(file_content)
        elif file_extension == 'txt':
            extracted_text = file_content.decode('utf-8')
        elif file_extension in ['jpg', 'jpeg', 'png']:
            extracted_text = extract_text_from_image_ocr(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Extract entities and information
        entities = extract_entities_with_spacy(extracted_text)
        
        # Calculate job match score
        match_score = calculate_similarity_score(extracted_text, job_description)
        
        # Generate AI-powered suggestions
        suggestions = await generate_ai_feedback(
            extracted_text, job_description, entities, match_score
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Create analysis result
        analysis = ResumeAnalysis(
            extracted_text=extracted_text,
            skills=entities['skills'],
            experience=entities['experience'],
            education=entities['education'],
            contact_info=entities['contact_info'],
            job_match_score=round(match_score, 1),
            suggestions=suggestions,
            processing_time=round(processing_time, 2)
        )
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()