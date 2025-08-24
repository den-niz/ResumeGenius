#!/usr/bin/env python3
"""
Comprehensive Backend Testing for AI-Powered Smart Resume Analyser
Tests all core backend functionality including file upload, text extraction, 
NLP processing, AI analysis, and job matching.
"""

import requests
import json
import os
import time
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw, ImageFont
import io

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    base_url = line.split('=', 1)[1].strip()
                    return f"{base_url}/api"
    return "http://localhost:8001/api"

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

class ResumeAnalyserTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = {
            "file_upload_text_extraction": {"status": "pending", "details": []},
            "ocr_processing": {"status": "pending", "details": []},
            "nlp_entity_extraction": {"status": "pending", "details": []},
            "ai_powered_analysis": {"status": "pending", "details": []},
            "job_match_scoring": {"status": "pending", "details": []},
            "api_endpoint": {"status": "pending", "details": []}
        }
        
    def create_test_files(self):
        """Create test files for different formats"""
        test_files = {}
        
        # Create a test TXT resume
        txt_content = """
John Smith
Software Engineer
Email: john.smith@email.com
Phone: (555) 123-4567

EXPERIENCE
Senior Software Engineer at TechCorp (2020-2023)
- Developed web applications using Python, JavaScript, and React
- Led a team of 5 developers on multiple projects
- Implemented machine learning algorithms for data analysis
- Increased system performance by 40%

Software Developer at StartupXYZ (2018-2020)
- Built REST APIs using FastAPI and Node.js
- Worked with SQL databases and MongoDB
- Collaborated with cross-functional teams using Agile methodology

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2014-2018)

SKILLS
Programming Languages: Python, JavaScript, Java, C++
Frameworks: React, Angular, FastAPI, Express.js
Databases: MySQL, PostgreSQL, MongoDB
Cloud: AWS, Azure, Docker, Kubernetes
Soft Skills: Leadership, Communication, Problem Solving, Team Management
"""
        
        # Save TXT file
        txt_path = "/tmp/test_resume.txt"
        with open(txt_path, 'w') as f:
            f.write(txt_content)
        test_files['txt'] = txt_path
        
        # Create a test image with resume text (for OCR testing)
        img = Image.new('RGB', (800, 1000), color='white')
        draw = ImageDraw.Draw(img)
        
        # Use default font
        try:
            font = ImageFont.load_default()
        except:
            font = None
            
        resume_text_for_image = """
SARAH JOHNSON
Data Scientist
sarah.johnson@email.com
(555) 987-6543

EXPERIENCE
Senior Data Scientist - DataTech Inc (2021-2023)
• Developed machine learning models using Python and TensorFlow
• Analyzed large datasets with pandas and numpy
• Created data visualizations with matplotlib and seaborn
• Improved model accuracy by 25%

Data Analyst - Analytics Pro (2019-2021)
• Performed statistical analysis using R and SQL
• Built dashboards with Tableau and Power BI
• Collaborated with business stakeholders

EDUCATION
Master of Science in Data Science
Data University (2017-2019)

SKILLS
Python, R, SQL, TensorFlow, PyTorch, Pandas, NumPy
Machine Learning, Deep Learning, Statistical Analysis
Tableau, Power BI, Excel, Git, AWS
"""
        
        # Draw text on image
        y_position = 50
        for line in resume_text_for_image.strip().split('\n'):
            if line.strip():
                draw.text((50, y_position), line.strip(), fill='black', font=font)
                y_position += 25
        
        # Save image
        img_path = "/tmp/test_resume.png"
        img.save(img_path)
        test_files['png'] = img_path
        
        return test_files
    
    def test_api_health(self):
        """Test if API is accessible"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                print("✅ API Health Check: PASSED")
                return True
            else:
                print(f"❌ API Health Check: FAILED - Status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Health Check: FAILED - {str(e)}")
            return False
    
    def test_file_upload_and_text_extraction(self, test_files):
        """Test file upload and text extraction for different formats"""
        print("\n🔍 Testing File Upload and Text Extraction...")
        
        job_description = """
We are looking for a Senior Software Engineer with experience in:
- Python programming and web development
- React and JavaScript frameworks
- Database management (SQL, MongoDB)
- Cloud platforms (AWS, Azure)
- Team leadership and project management
- Machine learning and data analysis experience preferred
"""
        
        results = []
        
        # Test TXT file
        try:
            with open(test_files['txt'], 'rb') as f:
                files = {'file': ('test_resume.txt', f, 'text/plain')}
                data = {'job_description': job_description}
                
                response = requests.post(
                    f"{self.base_url}/analyze-resume",
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    extracted_text = result.get('extracted_text', '')
                    
                    if len(extracted_text) > 100 and 'John Smith' in extracted_text:
                        results.append("✅ TXT file upload and extraction: PASSED")
                        self.test_results["file_upload_text_extraction"]["txt_result"] = result
                    else:
                        results.append(f"❌ TXT file extraction: FAILED - Insufficient text extracted")
                else:
                    results.append(f"❌ TXT file upload: FAILED - Status {response.status_code}")
                    
        except Exception as e:
            results.append(f"❌ TXT file test: FAILED - {str(e)}")
        
        # Update test results
        if any("PASSED" in r for r in results):
            self.test_results["file_upload_text_extraction"]["status"] = "passed"
        else:
            self.test_results["file_upload_text_extraction"]["status"] = "failed"
            
        self.test_results["file_upload_text_extraction"]["details"] = results
        
        for result in results:
            print(f"  {result}")
    
    def test_ocr_processing(self, test_files):
        """Test OCR processing with image files"""
        print("\n🖼️ Testing OCR Processing...")
        
        job_description = """
We are seeking a Data Scientist with expertise in:
- Python programming and data analysis
- Machine learning frameworks (TensorFlow, PyTorch)
- Statistical analysis and data visualization
- SQL and database management
- Business intelligence tools (Tableau, Power BI)
"""
        
        results = []
        
        try:
            with open(test_files['png'], 'rb') as f:
                files = {'file': ('test_resume.png', f, 'image/png')}
                data = {'job_description': job_description}
                
                response = requests.post(
                    f"{self.base_url}/analyze-resume",
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    extracted_text = result.get('extracted_text', '')
                    
                    # Check if OCR extracted meaningful text
                    if len(extracted_text) > 50 and any(word in extracted_text.upper() for word in ['SARAH', 'JOHNSON', 'DATA', 'SCIENTIST']):
                        results.append("✅ OCR text extraction: PASSED")
                        self.test_results["ocr_processing"]["image_result"] = result
                    else:
                        results.append(f"❌ OCR extraction: FAILED - Text: '{extracted_text[:100]}...'")
                else:
                    results.append(f"❌ OCR processing: FAILED - Status {response.status_code}: {response.text}")
                    
        except Exception as e:
            results.append(f"❌ OCR test: FAILED - {str(e)}")
        
        # Update test results
        if any("PASSED" in r for r in results):
            self.test_results["ocr_processing"]["status"] = "passed"
        else:
            self.test_results["ocr_processing"]["status"] = "failed"
            
        self.test_results["ocr_processing"]["details"] = results
        
        for result in results:
            print(f"  {result}")
    
    def test_nlp_entity_extraction(self):
        """Test NLP entity extraction functionality"""
        print("\n🧠 Testing NLP Entity Extraction...")
        
        # Use the stored result from previous test
        txt_result = self.test_results["file_upload_text_extraction"].get("txt_result")
        
        results = []
        
        if txt_result:
            skills = txt_result.get('skills', [])
            experience = txt_result.get('experience', [])
            education = txt_result.get('education', [])
            contact_info = txt_result.get('contact_info', {})
            
            # Test skills extraction
            expected_skills = ['python', 'javascript', 'react', 'machine learning']
            found_skills = [skill.lower() for skill in skills]
            skills_found = sum(1 for skill in expected_skills if any(skill in found_skill for found_skill in found_skills))
            
            if skills_found >= 2:
                results.append(f"✅ Skills extraction: PASSED - Found {len(skills)} skills including {skills_found} expected ones")
            else:
                results.append(f"❌ Skills extraction: FAILED - Only found {skills_found} expected skills from {expected_skills}")
            
            # Test experience extraction
            if len(experience) > 0:
                results.append(f"✅ Experience extraction: PASSED - Found {len(experience)} experience entries")
            else:
                results.append("❌ Experience extraction: FAILED - No experience found")
            
            # Test education extraction
            if len(education) > 0:
                results.append(f"✅ Education extraction: PASSED - Found {len(education)} education entries")
            else:
                results.append("❌ Education extraction: FAILED - No education found")
            
            # Test contact info extraction
            if contact_info.get('email') and contact_info.get('phone'):
                results.append("✅ Contact info extraction: PASSED - Found email and phone")
            elif contact_info.get('email') or contact_info.get('phone'):
                results.append("⚠️ Contact info extraction: PARTIAL - Found some contact info")
            else:
                results.append("❌ Contact info extraction: FAILED - No contact info found")
        else:
            results.append("❌ NLP test: FAILED - No previous result to analyze")
        
        # Update test results
        if any("PASSED" in r for r in results):
            self.test_results["nlp_entity_extraction"]["status"] = "passed"
        else:
            self.test_results["nlp_entity_extraction"]["status"] = "failed"
            
        self.test_results["nlp_entity_extraction"]["details"] = results
        
        for result in results:
            print(f"  {result}")
    
    def test_ai_powered_analysis(self):
        """Test AI-powered analysis with LLM"""
        print("\n🤖 Testing AI-Powered Analysis...")
        
        txt_result = self.test_results["file_upload_text_extraction"].get("txt_result")
        
        results = []
        
        if txt_result:
            suggestions = txt_result.get('suggestions', [])
            
            if len(suggestions) >= 3:
                # Check if suggestions are meaningful (not just fallback)
                suggestion_text = ' '.join(suggestions).lower()
                
                # Look for AI-generated content indicators
                ai_indicators = ['specific', 'consider', 'improve', 'add', 'include', 'enhance', 'quantify']
                ai_score = sum(1 for indicator in ai_indicators if indicator in suggestion_text)
                
                if ai_score >= 3:
                    results.append(f"✅ AI suggestions generation: PASSED - Generated {len(suggestions)} meaningful suggestions")
                else:
                    results.append(f"⚠️ AI suggestions: PARTIAL - Generated {len(suggestions)} suggestions (may be fallback)")
            else:
                results.append(f"❌ AI suggestions: FAILED - Only {len(suggestions)} suggestions generated")
            
            # Test processing time (should be reasonable)
            processing_time = txt_result.get('processing_time', 0)
            if processing_time > 0 and processing_time < 30:
                results.append(f"✅ Processing time: PASSED - {processing_time}s")
            else:
                results.append(f"⚠️ Processing time: {processing_time}s")
                
        else:
            results.append("❌ AI analysis test: FAILED - No previous result to analyze")
        
        # Update test results
        if any("PASSED" in r for r in results):
            self.test_results["ai_powered_analysis"]["status"] = "passed"
        else:
            self.test_results["ai_powered_analysis"]["status"] = "failed"
            
        self.test_results["ai_powered_analysis"]["details"] = results
        
        for result in results:
            print(f"  {result}")
    
    def test_job_match_scoring(self):
        """Test job match scoring algorithm"""
        print("\n📊 Testing Job Match Scoring...")
        
        txt_result = self.test_results["file_upload_text_extraction"].get("txt_result")
        
        results = []
        
        if txt_result:
            match_score = txt_result.get('job_match_score', 0)
            
            # Test if score is within valid range
            if 0 <= match_score <= 100:
                results.append(f"✅ Score range validation: PASSED - Score: {match_score}%")
            else:
                results.append(f"❌ Score range validation: FAILED - Invalid score: {match_score}")
            
            # Test if score is reasonable (should be > 0 for a relevant resume)
            if match_score > 10:
                results.append(f"✅ Score relevance: PASSED - Reasonable match score of {match_score}%")
            else:
                results.append(f"❌ Score relevance: FAILED - Very low score: {match_score}%")
                
        else:
            results.append("❌ Job matching test: FAILED - No previous result to analyze")
        
        # Update test results
        if any("PASSED" in r for r in results):
            self.test_results["job_match_scoring"]["status"] = "passed"
        else:
            self.test_results["job_match_scoring"]["status"] = "failed"
            
        self.test_results["job_match_scoring"]["details"] = results
        
        for result in results:
            print(f"  {result}")
    
    def test_api_endpoint_comprehensive(self):
        """Test API endpoint with various scenarios"""
        print("\n🔗 Testing API Endpoint Comprehensively...")
        
        results = []
        
        # Test 1: Invalid file format
        try:
            files = {'file': ('test.xyz', b'invalid content', 'application/octet-stream')}
            data = {'job_description': 'Test job description'}
            
            response = requests.post(
                f"{self.base_url}/analyze-resume",
                files=files,
                data=data,
                timeout=10
            )
            
            if response.status_code == 400:
                results.append("✅ Invalid file format handling: PASSED")
            else:
                results.append(f"❌ Invalid file format handling: FAILED - Expected 400, got {response.status_code}")
                
        except Exception as e:
            results.append(f"❌ Invalid file test: FAILED - {str(e)}")
        
        # Test 2: Missing job description
        try:
            files = {'file': ('test.txt', b'Some resume content', 'text/plain')}
            # No job_description provided
            
            response = requests.post(
                f"{self.base_url}/analyze-resume",
                files=files,
                timeout=10
            )
            
            if response.status_code == 422:  # FastAPI validation error
                results.append("✅ Missing job description handling: PASSED")
            else:
                results.append(f"❌ Missing job description handling: FAILED - Expected 422, got {response.status_code}")
                
        except Exception as e:
            results.append(f"❌ Missing job description test: FAILED - {str(e)}")
        
        # Test 3: Empty file
        try:
            files = {'file': ('empty.txt', b'', 'text/plain')}
            data = {'job_description': 'Test job description'}
            
            response = requests.post(
                f"{self.base_url}/analyze-resume",
                files=files,
                data=data,
                timeout=10
            )
            
            if response.status_code == 400:
                results.append("✅ Empty file handling: PASSED")
            else:
                results.append(f"❌ Empty file handling: FAILED - Expected 400, got {response.status_code}")
                
        except Exception as e:
            results.append(f"❌ Empty file test: FAILED - {str(e)}")
        
        # Update test results
        if any("PASSED" in r for r in results):
            self.test_results["api_endpoint"]["status"] = "passed"
        else:
            self.test_results["api_endpoint"]["status"] = "failed"
            
        self.test_results["api_endpoint"]["details"] = results
        
        for result in results:
            print(f"  {result}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing for AI Resume Analyser")
        print("=" * 70)
        
        # Check API health first
        if not self.test_api_health():
            print("❌ Cannot proceed with testing - API is not accessible")
            return self.test_results
        
        # Create test files
        print("\n📁 Creating test files...")
        test_files = self.create_test_files()
        print(f"✅ Created test files: {list(test_files.keys())}")
        
        # Run all tests
        self.test_file_upload_and_text_extraction(test_files)
        self.test_ocr_processing(test_files)
        self.test_nlp_entity_extraction()
        self.test_ai_powered_analysis()
        self.test_job_match_scoring()
        self.test_api_endpoint_comprehensive()
        
        # Cleanup test files
        for file_path in test_files.values():
            try:
                os.remove(file_path)
            except:
                pass
        
        return self.test_results
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📋 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["status"] == "passed")
        failed_tests = sum(1 for result in self.test_results.values() if result["status"] == "failed")
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\nDetailed Results:")
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result["status"] == "passed" else "❌" if result["status"] == "failed" else "⏳"
            print(f"{status_icon} {test_name.replace('_', ' ').title()}: {result['status'].upper()}")

def main():
    """Main testing function"""
    tester = ResumeAnalyserTester()
    results = tester.run_all_tests()
    tester.print_summary()
    
    return results

if __name__ == "__main__":
    main()