import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { AuthProvider } from './contexts/AuthContext'
import { NavigationProvider } from './contexts/NavigationContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import PersonalizedDashboard from './pages/PersonalizedDashboard'
import AdminDashboard from './pages/AdminDashboard'
import HRDashboard from './pages/HRDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import AttendanceManagement from './pages/AttendanceManagement'
import LeaveManagement from './pages/LeaveManagement'
import PayrollManagement from './pages/PayrollManagement'
import PerformanceManagement from './pages/PerformanceManagement'
import RecruitmentManagement from './pages/RecruitmentManagement'
import DepartmentManagement from './pages/DepartmentManagement'
import ReportsAnalytics from './pages/ReportsAnalytics'
import Settings from './pages/Settings'
import TeamManagement from './pages/TeamManagement'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes with role-based access */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRoles={['EMPLOYEE']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<EmployeeDashboard />} />
                </Route>

                <Route path="/manager" element={
                  <ProtectedRoute requiredRoles={['MANAGER']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<ManagerDashboard />} />
                  <Route path="team" element={<TeamManagement />} />
                </Route>

                <Route path="/hr" element={
                  <ProtectedRoute requiredRoles={['HR']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<HRDashboard />} />
                </Route>
                
                <Route path="/admin" element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                </Route>
                
                {/* Feature-specific routes with role restrictions */}
                <Route path="/employees" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                </Route>

                <Route path="/team" element={
                  <ProtectedRoute requiredRoles={['MANAGER']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<TeamManagement />} />
                </Route>

                <Route path="/attendance" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AttendanceManagement />} />
                </Route>

                <Route path="/leave" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<LeaveManagement />} />
                </Route>

                <Route path="/payroll" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<PayrollManagement />} />
                </Route>

                <Route path="/performance" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<PerformanceManagement />} />
                </Route>

                <Route path="/recruitment" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<RecruitmentManagement />} />
                </Route>

                <Route path="/departments" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<DepartmentManagement />} />
                </Route>

                <Route path="/reports" element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<ReportsAnalytics />} />
                </Route>

                <Route path="/settings" element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Settings />} />
                </Route>

                {/* Catch-all route - redirect to appropriate dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </NavigationProvider>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App