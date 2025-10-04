import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'
import TestDataDisplay from './components/TestDataDisplay'
import SimpleAPITest from './components/SimpleAPITest'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? (
          <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
        ) : (
          <Login />
        )
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requiredRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
          {user?.role === 'ADMIN' ? <AdminDashboard /> : <EmployeeDashboard />}
        </ProtectedRoute>
      } />

      <Route path="/test" element={<TestDataDisplay />} />
      <Route path="/simple-test" element={<SimpleAPITest />} />
      
      <Route path="/" element={
        <Navigate to="/simple-test" replace />
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10B981',
                  },
                },
                error: {
                  style: {
                    background: '#EF4444',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
