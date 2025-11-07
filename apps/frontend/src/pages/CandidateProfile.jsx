import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCandidateAuth } from '../contexts/CandidateAuthContext'
import Button from '../components/UI/Button'
import Icon from '../components/UI/Icon'
import Card from '../components/UI/Card'
import LoadingSpinner from '../components/LoadingSpinner'

const CandidateProfile = () => {
  const { candidate, loading, error } = useCandidateAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    skills: [],
    experience: '',
    education: '',
    bio: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (candidate) {
      setFormData({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        address: candidate.address || '',
        city: candidate.city || '',
        state: candidate.state || '',
        zipCode: candidate.zipCode || '',
        country: candidate.country || '',
        skills: candidate.skills || [],
        experience: candidate.experience || '',
        education: candidate.education || '',
        bio: candidate.bio || ''
      })
    }
  }, [candidate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }))
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      // TODO: Implement profile update API call
      console.log('Saving profile:', formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleCancel = () => {
    if (candidate) {
      setFormData({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        address: candidate.address || '',
        city: candidate.city || '',
        state: candidate.state || '',
        zipCode: candidate.zipCode || '',
        country: candidate.country || '',
        skills: candidate.skills || [],
        experience: candidate.experience || '',
        education: candidate.education || '',
        bio: candidate.bio || ''
      })
    }
    setIsEditing(false)
    setValidationErrors({})
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Profile Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your personal information and professional details
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
              >
                <Icon name="check-circle" size="sm" className="mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              <Icon name="edit" size="sm" className="mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex">
            <Icon name="shield" size="sm" className="text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Profile Completion Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
            <p className="text-sm text-gray-500 mt-1">
              Complete your profile to increase your chances of being hired
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">75%</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${validationErrors.firstName ? 'input-error' : ''} ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="John"
            />
            {validationErrors.firstName && (
              <p className="error-text">{validationErrors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${validationErrors.lastName ? 'input-error' : ''} ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="Doe"
            />
            {validationErrors.lastName && (
              <p className="error-text">{validationErrors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${validationErrors.email ? 'input-error' : ''} ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="john.doe@example.com"
            />
            {validationErrors.email && (
              <p className="error-text">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="+1234567890"
            />
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Address Information</h3>
        
        <div className="space-y-6">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                placeholder="New York"
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                placeholder="NY"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                placeholder="10001"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              id="country"
              name="country"
              type="text"
              value={formData.country}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="United States"
            />
          </div>
        </div>
      </Card>

      {/* Professional Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Professional Information</h3>
        
        <div className="space-y-6">
          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <input
              id="skills"
              name="skills"
              type="text"
              value={formData.skills.join(', ')}
              onChange={handleSkillsChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="JavaScript, React, Node.js, Python"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple skills with commas
            </p>
          </div>

          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
              Work Experience
            </label>
            <textarea
              id="experience"
              name="experience"
              rows={4}
              value={formData.experience}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="Describe your work experience..."
            />
          </div>

          {/* Education */}
          <div>
            <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
              Education
            </label>
            <textarea
              id="education"
              name="education"
              rows={3}
              value={formData.education}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="Describe your educational background..."
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              disabled={!isEditing}
              className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CandidateProfile
