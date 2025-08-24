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

  const getScoreColor = (score, isDark = false) => {
    if (isDark) {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      if (score >= 40) return 'text-orange-400';
      return 'text-red-400';
    } else {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      if (score >= 40) return 'text-orange-600';
      return 'text-red-600';
    }
  };

  const getScoreBgColor = (score, isDark = false) => {
    if (isDark) {
      if (score >= 80) return 'bg-green-900/50 border border-green-600';
      if (score >= 60) return 'bg-yellow-900/50 border border-yellow-600';
      if (score >= 40) return 'bg-orange-900/50 border border-orange-600';
      return 'bg-red-900/50 border border-red-600';
    } else {
      if (score >= 80) return 'bg-green-100';
      if (score >= 60) return 'bg-yellow-100';
      if (score >= 40) return 'bg-orange-100';
      return 'bg-red-100';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 relative">
          {/* Dark Mode Toggle */}
          <div className="absolute top-0 right-0 md:right-8">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                darkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 shadow-yellow-500/25' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25'
              } shadow-lg`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className={`${darkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-indigo-600'} p-4 rounded-full mr-4 shadow-xl`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} tracking-tight`}>
              AI Resume Analyser
            </h1>
          </div>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
            Upload your resume and job description to get instant AI-powered analysis, 
            match scoring, and personalized improvement suggestions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className={`${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white'} backdrop-blur-sm border rounded-2xl shadow-2xl p-8 mb-8 transition-all duration-500`}>
            {/* File Upload Section */}
            <div className="mb-8">
              <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                <svg className={`w-6 h-6 mr-2 ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Your Resume
              </h2>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragOver
                    ? darkMode 
                      ? 'border-purple-400 bg-purple-900/20' 
                      : 'border-indigo-400 bg-indigo-50'
                    : darkMode
                      ? 'border-gray-600 hover:border-purple-400 hover:bg-gray-700/50'
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center">
                    <div className={`${darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100'} p-3 rounded-full mr-4`}>
                      <svg className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatFileName(selectedFile.name)}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className={`ml-4 ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} transition-colors`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Drop your resume here or click to upload</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Supports PDF, DOCX, TXT, and image files (JPG, PNG)</p>
                    <label className={`inline-block ${darkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-6 py-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 shadow-lg`}>
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
              <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                <svg className={`w-6 h-6 mr-2 ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Job Description
              </h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to analyze how well your resume matches the requirements..."
                className={`w-full h-40 p-4 border rounded-xl resize-none transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent' 
                    : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
            </div>

            {/* Analyze Button */}
            <div className="text-center mb-8">
              <button
                onClick={analyzeResume}
                disabled={isAnalyzing || !selectedFile || !jobDescription.trim()}
                className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-xl ${
                  darkMode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:from-gray-600 disabled:to-gray-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-400'
                }`}
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
              <div className={`${darkMode ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'} border rounded-xl p-4 mb-8`}>
                <div className="flex items-center">
                  <svg className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className={`${darkMode ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-8 animate-fadeIn">
                {/* Match Score */}
                <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-700' : 'bg-gradient-to-r from-indigo-50 to-blue-50'} rounded-xl p-6 border`}>
                  <h3 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 text-center`}>Job Match Score</h3>
                  <div className="flex items-center justify-center">
                    <div className={`${getScoreBgColor(analysis.job_match_score, darkMode)} rounded-full p-8 shadow-xl`}>
                      <div className={`text-4xl font-bold ${getScoreColor(analysis.job_match_score, darkMode)}`}>
                        {analysis.job_match_score}%
                      </div>
                    </div>
                  </div>
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>
                    Processing time: {analysis.processing_time}s
                  </p>
                </div>

                {/* Extracted Information */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Skills */}
                  <div className={`${darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50'} rounded-xl p-6 border`}>
                    <h4 className={`text-xl font-semibold ${darkMode ? 'text-green-400' : 'text-green-800'} mb-4 flex items-center`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Skills ({analysis.skills.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.skills.length > 0 ? (
                        analysis.skills.slice(0, 8).map((skill, index) => (
                          <span key={index} className={`inline-block ${darkMode ? 'bg-green-800/50 text-green-300' : 'bg-green-200 text-green-800'} px-3 py-1 rounded-full text-sm mr-2 mb-2`}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No skills detected</p>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className={`${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50'} rounded-xl p-6 border`}>
                    <h4 className={`text-xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-800'} mb-4 flex items-center`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                      Experience ({analysis.experience.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.experience.length > 0 ? (
                        analysis.experience.slice(0, 3).map((exp, index) => (
                          <div key={index} className={`${darkMode ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-200 text-blue-800'} px-3 py-2 rounded-lg text-sm`}>
                            {exp}
                          </div>
                        ))
                      ) : (
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No experience detected</p>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div className={`${darkMode ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50'} rounded-xl p-6 border`}>
                    <h4 className={`text-xl font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-800'} mb-4 flex items-center`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education ({analysis.education.length})
                    </h4>
                    <div className="space-y-2">
                      {analysis.education.length > 0 ? (
                        analysis.education.slice(0, 3).map((edu, index) => (
                          <div key={index} className={`${darkMode ? 'bg-purple-800/50 text-purple-300' : 'bg-purple-200 text-purple-800'} px-3 py-2 rounded-lg text-sm`}>
                            {edu}
                          </div>
                        ))
                      ) : (
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No education detected</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className={`${darkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50'} rounded-xl p-6 border`}>
                  <h3 className={`text-2xl font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-800'} mb-6 flex items-center`}>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI-Powered Improvement Suggestions
                  </h3>
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className={`flex items-start ${darkMode ? 'bg-yellow-800/30' : 'bg-yellow-100'} rounded-lg p-4`}>
                        <div className={`${darkMode ? 'bg-yellow-600 text-yellow-200' : 'bg-yellow-600 text-white'} rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 flex-shrink-0`}>
                          {index + 1}
                        </div>
                        <p className={`${darkMode ? 'text-yellow-200' : 'text-yellow-900'} leading-relaxed`}>{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                {Object.keys(analysis.contact_info).length > 0 && (
                  <div className={`${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50'} rounded-xl p-6 border`}>
                    <h4 className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'} mb-4 flex items-center`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.contact_info.email && (
                        <div className="flex items-center">
                          <svg className={`w-4 h-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{analysis.contact_info.email}</span>
                        </div>
                      )}
                      {analysis.contact_info.phone && (
                        <div className="flex items-center">
                          <svg className={`w-4 h-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{analysis.contact_info.phone}</span>
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
        <div className="text-center">
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors`}>
            Powered by AI • Secure & Private • No data stored
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;