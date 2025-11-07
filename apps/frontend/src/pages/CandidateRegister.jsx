import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCandidateAuth } from '../contexts/CandidateAuthContext'
import Button from '../components/UI/Button'
import Icon from '../components/UI/Icon'
import Card from '../components/UI/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

const CandidateRegister = () => {
  const { register, loading, error, clearError, isAuthenticated } = useCandidateAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [invitationData, setInvitationData] = useState(null)
  const [validatingToken, setValidatingToken] = useState(false)
  const [tokenError, setTokenError] = useState('')

  // Check for invitation token and email in URL
  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (token && email) {
      // Validate the invitation token
      validateInvitationToken(token, decodeURIComponent(email))
    } else {
      // No token provided - show error
      setTokenError('Invitation token is required. Please use the invitation link sent to your email.')
    }
  }, [searchParams])

  // Validate invitation token with backend
  const validateInvitationToken = async (token, email) => {
    setValidatingToken(true)
    setTokenError('')
    
    try {
      const response = await api.get('/candidates/validate-invitation', {
        params: {
          token: token,
          email: email
        }
      })
      
      if (response.data.success && response.data.valid) {
        setInvitationData({ token, email })
        setFormData(prev => ({
          ...prev,
          email: email
        }))
      } else {
        setTokenError(response.data.message || 'Invalid or expired invitation token. Please request a new invitation from HR.')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to validate invitation. Please check your connection and try again.'
      setTokenError(errorMessage)
      console.error('Token validation error:', error)
    } finally {
      setValidatingToken(false)
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/candidate-portal/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Clear error when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

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

  const validateForm = () => {
    const errors = {}

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setTokenError('')

    // Check if invitation token is present
    if (!invitationData || !invitationData.token) {
      setTokenError('Invitation token is required. Please use the invitation link sent to your email.')
      return
    }

    if (!validateForm()) {
      return
    }

    const { confirmPassword, ...registrationData } = formData
    
    // Add invitation token (required)
    registrationData.invitationToken = invitationData.token
    
    const result = await register(registrationData)
    
    if (result.success) {
      navigate('/candidate-portal/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {invitationData ? 'Complete Your Registration' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {validatingToken 
              ? 'Validating your invitation...'
              : invitationData
              ? 'You\'ve been invited to join our talent pool'
              : 'Please use the invitation link sent to your email'
            }
          </p>
          {validatingToken && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <LoadingSpinner />
              <span className="ml-2">Validating invitation...</span>
            </div>
          )}
          {invitationData && !validatingToken && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Icon name="check-circle" size="sm" className="mr-1" />
              Invitation Verified
            </div>
          )}
        </div>

        {/* Registration Form */}
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Token Error Message */}
            {tokenError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-md p-4"
              >
                <div className="flex">
                  <Icon name="shield" size="sm" className="text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800 font-medium">Invitation Required</p>
                    <p className="text-sm text-red-700 mt-1">{tokenError}</p>
                    <p className="text-xs text-red-600 mt-2">
                      If you received an invitation email, please click the link in that email to register.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-md p-4"
              >
                <div className="flex">
                  <Icon name="shield" size="sm" className="text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field ${validationErrors.firstName ? 'input-error' : ''}`}
                  placeholder="John"
                />
                {validationErrors.firstName && (
                  <p className="error-text">{validationErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${validationErrors.lastName ? 'input-error' : ''}`}
                  placeholder="Doe"
                />
                {validationErrors.lastName && (
                  <p className="error-text">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="users" size="sm" className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!!invitationData}
                  className={`input-field pl-10 ${validationErrors.email ? 'input-error' : ''} ${invitationData ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="john.doe@example.com"
                />
              </div>
              {invitationData && (
                <p className="text-xs text-gray-500 mt-1">
                  Email is set from your invitation link
                </p>
              )}
              {validationErrors.email && (
                <p className="error-text">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="clock" size="sm" className="text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`input-field pl-10 ${validationErrors.phone ? 'input-error' : ''}`}
                  placeholder="+1234567890"
                />
              </div>
              {validationErrors.phone && (
                <p className="error-text">{validationErrors.phone}</p>
              )}
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="shield" size="sm" className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pl-10 ${validationErrors.password ? 'input-error' : ''}`}
                  placeholder="Create a strong password"
                />
              </div>
              {validationErrors.password && (
                <p className="error-text">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="shield" size="sm" className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field pl-10 ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="error-text">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || validatingToken || !invitationData}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">Creating account...</span>
                </div>
              ) : validatingToken ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">Validating invitation...</span>
                </div>
              ) : !invitationData ? (
                'Invitation Required'
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Back to Main Site */}
        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to main site
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default CandidateRegister
