import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // DEMO MODE: Auto-login with demo user for requirement pages access
  const DEMO_USER = {
    id: 'demo-user-001',
    email: 'demo@atria.com',
    username: 'demo_user',
    role: 'HR', // HR role has access to recruitment/requirement pages
    firstName: 'Demo',
    lastName: 'User',
    position: 'HR Manager',
    department: 'Human Resources'
  }

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check if we have a token in localStorage first
      const token = localStorage.getItem('token')
      if (!token) {
        // DEMO MODE: Set demo user if no token exists (for requirement pages access)
        // This allows direct access to pages without login for demo purposes
        console.log('DEMO MODE: Auto-logging in with demo user for requirement pages access')
        setUser(DEMO_USER)
        setLoading(false)
        return
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      )
      
      const response = await Promise.race([
        authAPI.getCurrentUser(),
        timeoutPromise
      ])
      
      // Real user authenticated - use real user data
      setUser(response.data.user)
    } catch (error) {
      console.log('Auth check failed:', error.message)
      // If we have a token but auth check failed, clear it and use demo user
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      // DEMO MODE: Set demo user on auth failure (for requirement pages access)
      setUser(DEMO_USER)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials, retries = 2) => {
    try {
      // First, check if backend is reachable
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
      const healthURL = baseURL.replace('/api', '') + '/health'
      
      try {
        const healthCheck = await fetch(healthURL, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding properly')
        }
      } catch (healthError) {
        if (retries > 0) {
          // Retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          return login(credentials, retries - 1)
        }
        throw new Error('Unable to connect to server. Please ensure the backend is running on port 3001.')
      }

      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data) // Debug log
      
      // Store tokens in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken)
      }
      
      // IMPORTANT: Override demo user with real authenticated user
      setUser(response.data.user)
      return response.data
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', error)
      }
      
      // Retry logic for network errors
      if (retries > 0 && (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_REFUSED' || error.message === 'Network Error' || error.message?.includes('timeout'))) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return login(credentials, retries - 1)
      }
      
      // Handle network/connection errors with helpful message
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_REFUSED' || error.message === 'Network Error' || error.message?.includes('timeout')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running: cd apps/backend && npm run dev');
      }
      
      // Handle CORS errors
      if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
        throw new Error('Connection error. Please check server configuration.');
      }
      
      // Handle other errors - use backend message if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Generic error fallback
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  const logout = async () => {
    try {
      // Send refresh token to backend for revocation
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authAPI.logout({ refreshToken })
      } else {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user data and tokens
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('candidateToken')
      // DEMO MODE: Restore demo user after logout for requirement pages access
      setUser(DEMO_USER)
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isHR = user?.role === 'HR'
  const isEmployee = user?.role === 'EMPLOYEE'

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAdmin,
    isHR,
    isEmployee
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
