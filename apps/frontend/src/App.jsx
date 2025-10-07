import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import PersonalizedDashboard from './pages/PersonalizedDashboard'
import AttendanceManagement from './pages/AttendanceManagement'
import LeaveManagement from './pages/LeaveManagement'
import PayrollManagement from './pages/PayrollManagement'
import RecruitmentManagement from './pages/RecruitmentManagement'
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
      
      {/* Protected routes with layout */}
      <Route path="/" element={
        <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
        } />
        
        <Route path="admin" element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="dashboard" element={
          <ProtectedRoute requiredRoles={['EMPLOYEE', 'HR', 'ADMIN', 'MANAGER']}>
            <PersonalizedDashboard />
          </ProtectedRoute>
        } />

        <Route path="employees" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="attendance" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
            <AttendanceManagement />
          </ProtectedRoute>
        } />

        <Route path="leave" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
            <LeaveManagement />
          </ProtectedRoute>
        } />

        <Route path="payroll" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
            <PayrollManagement />
          </ProtectedRoute>
        } />

        <Route path="performance" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Management</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </ProtectedRoute>
        } />

        <Route path="recruitment" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
            <RecruitmentManagement />
          </ProtectedRoute>
        } />

        <Route path="departments" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Department Management</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </ProtectedRoute>
        } />

        <Route path="reports" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </ProtectedRoute>
        } />

        <Route path="settings" element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </ProtectedRoute>
        } />
      </Route>

      {/* Test routes */}
      <Route path="/test" element={<TestDataDisplay />} />
      <Route path="/simple-test" element={<SimpleAPITest />} />
      
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
