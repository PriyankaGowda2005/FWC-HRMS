import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useCandidateAuth } from '../contexts/CandidateAuthContext'
import LoadingSpinner from './LoadingSpinner'

const CandidateProtectedRoute = ({ children }) => {
  const { candidate, loading } = useCandidateAuth()
  const location = useLocation()

  console.log('🔍 CandidateProtectedRoute - loading:', loading, 'candidate:', !!candidate)

  if (loading) {
    console.log('⏳ CandidateProtectedRoute - showing loading spinner')
    return <LoadingSpinner />
  }

  if (!candidate) {
    console.log('❌ CandidateProtectedRoute - no candidate, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  console.log('✅ CandidateProtectedRoute - rendering children')
  return children
}

export default CandidateProtectedRoute
