import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

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
  const [isAutoLoggingOut, setIsAutoLoggingOut] = useState(false)
  
  // Auto logout configuration
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes of inactivity
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours total session
  const WARNING_TIME = 5 * 60 * 1000 // 5 minutes warning before logout
  
  const inactivityTimer = useRef(null)
  const sessionTimer = useRef(null)
  const warningTimer = useRef(null)
  const lastActivity = useRef(Date.now())

  // Activity tracking function
  const updateActivity = useCallback(() => {
    lastActivity.current = Date.now()
    
    // Clear existing timers
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current)
    }
    
    // Set warning timer (5 minutes before logout)
    warningTimer.current = setTimeout(() => {
      toast.error('You will be automatically logged out in 5 minutes due to inactivity', {
        duration: 10000,
        position: 'top-center'
      })
    }, INACTIVITY_TIMEOUT - WARNING_TIME)
    
    // Set inactivity timer
    inactivityTimer.current = setTimeout(() => {
      handleAutoLogout('inactivity')
    }, INACTIVITY_TIMEOUT)
  }, [])

  // Auto logout handler
  const handleAutoLogout = useCallback(async (reason = 'session') => {
    if (isAutoLoggingOut) return
    
    setIsAutoLoggingOut(true)
    
    try {
      const message = reason === 'inactivity' 
        ? 'You have been automatically logged out due to inactivity'
        : 'Your session has expired. Please login again'
      
      toast.error(message, {
        duration: 5000,
        position: 'top-center'
      })
      
      await logout()
    } catch (error) {
      console.error('Auto logout error:', error)
    } finally {
      setIsAutoLoggingOut(false)
    }
  }, [isAutoLoggingOut])

  // Setup activity listeners
  useEffect(() => {
    if (!user) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      updateActivity()
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initial activity setup
    updateActivity()

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current)
      }
      if (sessionTimer.current) {
        clearTimeout(sessionTimer.current)
      }
    }
  }, [user, updateActivity])

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth()
  }, [])

  // Set up periodic token refresh and session timeout
  useEffect(() => {
    if (user) {
      // Set session timeout timer (24 hours)
      sessionTimer.current = setTimeout(() => {
        handleAutoLogout('session')
      }, SESSION_TIMEOUT)

      const refreshInterval = setInterval(async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            const response = await authAPI.refreshToken()
            if (response.data.token) {
              localStorage.setItem('token', response.data.token)
              if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken)
              }
              console.log('🔄 Token refreshed automatically')
            }
          }
        } catch (error) {
          console.log('🔄 Automatic token refresh failed:', error.message)
          // If refresh fails, logout the user
          handleAutoLogout('session')
        }
      }, 20 * 60 * 1000) // Refresh every 20 minutes

      return () => {
        clearInterval(refreshInterval)
        if (sessionTimer.current) {
          clearTimeout(sessionTimer.current)
        }
      }
    }
  }, [user, handleAutoLogout])

  const checkAuth = async () => {
    try {
      // Check if we have a token in localStorage first
      const token = localStorage.getItem('token')
      if (!token) {
        setUser(null)
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
      
      setUser(response.data.user)
    } catch (error) {
      console.log('Auth check failed, attempting token refresh:', error.message)
      
      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const refreshResponse = await authAPI.refreshToken()
          if (refreshResponse.data.token) {
            localStorage.setItem('token', refreshResponse.data.token)
            if (refreshResponse.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken)
            }
            
            // Try to get user data again
            const userResponse = await authAPI.getCurrentUser()
            setUser(userResponse.data.user)
            return
          }
        } catch (refreshError) {
          console.log('Token refresh failed:', refreshError.message)
        }
      }
      
      // Clear user data and token on auth failure
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data) // Debug log
      
      // Store tokens in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken)
      }
      
      setUser(response.data.user)
      return response.data
    } catch (error) {
      console.error('Login error:', error) // Debug log
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all timers
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
        inactivityTimer.current = null
      }
      if (warningTimer.current) {
        clearTimeout(warningTimer.current)
        warningTimer.current = null
      }
      if (sessionTimer.current) {
        clearTimeout(sessionTimer.current)
        sessionTimer.current = null
      }
      
      // Clear user data and tokens
      setUser(null)
      setIsAutoLoggingOut(false)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isHR = user?.role === 'HR'
  const isEmployee = user?.role === 'EMPLOYEE'

  // Function to manually extend session (useful for "Stay logged in" functionality)
  const extendSession = useCallback(() => {
    if (user) {
      updateActivity()
      toast.success('Session extended', { duration: 2000 })
    }
  }, [user, updateActivity])

  // Function to get time until logout
  const getTimeUntilLogout = useCallback(() => {
    if (!user) return 0
    
    const timeSinceActivity = Date.now() - lastActivity.current
    const timeUntilInactivityLogout = INACTIVITY_TIMEOUT - timeSinceActivity
    
    return Math.max(0, timeUntilInactivityLogout)
  }, [user])

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAdmin,
    isHR,
    isEmployee,
    isAutoLoggingOut,
    extendSession,
    getTimeUntilLogout,
    INACTIVITY_TIMEOUT,
    SESSION_TIMEOUT
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
