import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved theme preference or default to light mode
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Update document class and save preference when dark mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleFileSelect = (file) => {
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please upload a PDF, DOCX, TXT, or image file (JPG, PNG)');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const analyzeResume = async () => {
    if (!selectedFile) {
      setError('Please select a resume file');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('job_description', jobDescription);

      const response = await axios.post(`${API}/analyze-resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      setAnalysis(response.data);
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError(err.response?.data?.detail || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileName = (fileName) => {
    if (fileName.length > 30) {
      return fileName.substring(0, 27) + '...';
    }
    return fileName;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">AI Resume Analyser</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your resume and job description to get instant AI-powered analysis, match scoring, and personalized improvement suggestions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* File Upload Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Your Resume
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-800">{formatFileName(selectedFile.name)}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg text-gray-600 mb-2">Drop your resume here or click to upload</p>
                    <p className="text-sm text-gray-500 mb-4">Supports PDF, DOCX, TXT, and image files (JPG, PNG)</p>
                    <label className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                      Choose File
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Job Description
              </h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to analyze how well your resume matches the requirements..."
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Analyze Button */}
            <div className="text-center mb-8">
              <button
                onClick={analyzeResume}
                disabled={isAnalyzing || !selectedFile || !jobDescription.trim()}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
              >
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Analyzing Resume...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze Resume
                  </div>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-8">
                {/* Match Score */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Job Match Score</h3>
                  <div className="flex items-center justify-center">
                    <div className={`${getScoreBgColor(analysis.job_match_score)} rounded-full p-8`}>
                      <div className={`text-4xl font-bold ${getScoreColor(analysis.job_match_score)}`}>
                        {analysis.job_match_score}%
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-gray-600 mt-4">
                    Processing time: {analysis.processing_time}s
                  </p>
                </div>

                {/* Extracted Information */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Skills */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Skills ({analysis.skills.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.skills.length > 0 ? (
                        analysis.skills.slice(0, 8).map((skill, index) => (
                          <span key={index} className="inline-block bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No skills detected</p>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                      Experience ({analysis.experience.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.experience.length > 0 ? (
                        analysis.experience.slice(0, 3).map((exp, index) => (
                          <div key={index} className="bg-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm">
                            {exp}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No experience detected</p>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education ({analysis.education.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.education.length > 0 ? (
                        analysis.education.slice(0, 3).map((edu, index) => (
                          <div key={index} className="bg-purple-200 text-purple-800 px-3 py-2 rounded-lg text-sm">
                            {edu}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No education detected</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h3 className="text-2xl font-semibold text-yellow-800 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI-Powered Improvement Suggestions
                  </h3>
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start bg-yellow-100 rounded-lg p-4">
                        <div className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-yellow-900 leading-relaxed">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                {Object.keys(analysis.contact_info).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.contact_info.email && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-gray-700">{analysis.contact_info.email}</span>
                        </div>
                      )}
                      {analysis.contact_info.phone && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-700">{analysis.contact_info.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p>Powered by AI • Secure & Private • No data stored</p>
        </div>
      </div>
    </div>
  );
}

export default App;