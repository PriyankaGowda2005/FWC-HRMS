import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useCandidateAuth } from '../contexts/CandidateAuthContext'
import Button from '../components/UI/Button'
import Icon from '../components/UI/Icon'
import Card from '../components/UI/Card'
import LoadingSpinner from '../components/LoadingSpinner'

const CandidateResumeUpload = () => {
  const { candidate, uploadResume, loading, error } = useCandidateAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error')
      return
    }

    setUploadedFile(file)
    setUploadStatus('uploading')
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      const result = await uploadResume(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (result.success) {
        setUploadStatus('success')
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadedFile(null)
          setUploadProgress(0)
        }, 3000)
      } else {
        setUploadStatus('error')
      }
    } catch (error) {
      clearInterval(progressInterval)
      setUploadStatus('error')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return 'shield'
      case 'doc':
      case 'docx':
        return 'star'
      default:
        return 'star'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Resume Upload
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload your resume to apply for positions
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
          >
            <Icon name="arrow-left" size="sm" className="mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Current Resume Status */}
      {candidate?.resumeUploaded && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Icon name="check-circle" size="md" className="text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Resume Currently Uploaded
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You have a resume on file. Upload a new resume below to replace it.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Area */}
      <Card className="p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <Icon name="star" size="md" className="text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {candidate?.resumeUploaded ? 'Replace Your Resume' : 'Upload Your Resume'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {candidate?.resumeUploaded 
              ? 'Upload a new resume to replace your current one'
              : 'Drag and drop your resume here, or click to browse'
            }
          </p>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`mt-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : uploadStatus === 'success'
              ? 'border-green-400 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadStatus === 'uploading' ? (
            <div className="space-y-4">
              <LoadingSpinner />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Uploading {uploadedFile?.name}...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="space-y-4">
              <Icon name="check-circle" size="lg" className="mx-auto text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Resume uploaded successfully!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Your resume has been processed and is ready for job applications.
                </p>
              </div>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-4">
              <Icon name="shield" size="lg" className="mx-auto text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Upload failed
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {error || 'Please try again with a valid PDF, DOC, or DOCX file (max 5MB).'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setUploadStatus('idle')
                  setUploadedFile(null)
                  setUploadProgress(0)
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Icon name="star" size="lg" className="mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">
                  Supported formats: PDF, DOC, DOCX
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 5MB
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Icon name="star" size="sm" className="mr-2" />
                {candidate?.resumeUploaded ? 'Choose New Resume' : 'Choose File'}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* File Preview */}
        {uploadedFile && uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
          <div className="mt-6 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Icon name={getFileIcon(uploadedFile.name)} size="md" className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setUploadedFile(null)
                    setUploadStatus('idle')
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Guidelines */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resume Upload Guidelines
        </h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <Icon name="check-circle" size="sm" className="text-green-600 mt-0.5 mr-3" />
            <p className="text-sm text-gray-700">
              Use a clear, professional format with standard fonts
            </p>
          </div>
          <div className="flex items-start">
            <Icon name="check-circle" size="sm" className="text-green-600 mt-0.5 mr-3" />
            <p className="text-sm text-gray-700">
              Include your contact information, work experience, and education
            </p>
          </div>
          <div className="flex items-start">
            <Icon name="check-circle" size="sm" className="text-green-600 mt-0.5 mr-3" />
            <p className="text-sm text-gray-700">
              Keep your resume up-to-date with your latest skills and achievements
            </p>
          </div>
          <div className="flex items-start">
            <Icon name="check-circle" size="sm" className="text-green-600 mt-0.5 mr-3" />
            <p className="text-sm text-gray-700">
              Save your resume as a PDF for best compatibility
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CandidateResumeUpload
