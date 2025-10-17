import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from './contexts/AuthContext'
import { NavigationProvider } from './contexts/NavigationContext'
import { CandidateAuthProvider } from './contexts/CandidateAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CandidateProtectedRoute from './components/CandidateProtectedRoute'
import Layout from './components/Layout'
import CandidateLayout from './components/CandidateLayout'
import LoadingSpinner from './components/LoadingSpinner'
import ScrollToTop from './components/ScrollToTop'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import WhoWeServe from './pages/WhoWeServe'
import WhoWeServeSimple from './pages/WhoWeServeSimple'
import WhatWeDo from './pages/WhatWeDo'
import WhoWeAre from './pages/WhoWeAre'
import WhyChooseUs from './pages/WhyChooseUs'
import Careers from './pages/Careers'
import Contact from './pages/Contact'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Integrations from './pages/Integrations'
import API from './pages/API'
import Security from './pages/Security'
import Roadmap from './pages/Roadmap'
import About from './pages/About'
import Press from './pages/Press'
import Blog from './pages/Blog'
import Partners from './pages/Partners'
import HelpCenter from './pages/HelpCenter'
import Documentation from './pages/Documentation'
import Support from './pages/Support'
import StyleGuide from './pages/StyleGuide'
import Privacy from './pages/Privacy'
import NavigationTest from './pages/NavigationTest'
import DebugPage from './pages/DebugPage'
import CandidateRegister from './pages/CandidateRegister'
import CandidateDashboard from './pages/CandidateDashboard'
import CandidateResumeUpload from './pages/CandidateResumeUpload'
import CandidateInterviews from './pages/CandidateInterviews'
import CandidateProfile from './pages/CandidateProfile'
import CandidateJobs from './pages/CandidateJobs'
import CandidateApplications from './pages/CandidateApplications'
import PersonalizedDashboard from './pages/PersonalizedDashboard'
import InterviewManagement from './pages/InterviewManagement'
import CandidateConversion from './pages/CandidateConversion'
import AdminDashboard from './pages/AdminDashboard'
import HRDashboard from './pages/HRDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import AttendanceManagement from './pages/AttendanceManagement'
import LeaveManagement from './pages/LeaveManagement'
import PayrollManagement from './pages/PayrollManagement'
import PerformanceManagement from './pages/PerformanceManagement'
import RecruitmentManagement from './pages/RecruitmentManagement'
import Recruitment from './pages/Recruitment'
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
            <ScrollToTop />
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/who-we-serve" element={<WhoWeServeSimple />} />
                <Route path="/what-we-do" element={<WhatWeDo />} />
                <Route path="/who-we-are" element={<WhoWeAre />} />
                <Route path="/why-choose-us" element={<WhyChooseUs />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Footer link routes - Product */}
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/api" element={<API />} />
                <Route path="/security" element={<Security />} />
                <Route path="/roadmap" element={<Roadmap />} />
                
                {/* Footer link routes - Company */}
                <Route path="/about" element={<About />} />
                <Route path="/press" element={<Press />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/partners" element={<Partners />} />
                
                {/* Footer link routes - Resources */}
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/support" element={<Support />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                
                {/* Footer link routes - Legal */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/navigation-test" element={<NavigationTest />} />
                <Route path="/debug" element={<DebugPage />} />
                
                <Route path="/login" element={
                  <CandidateAuthProvider>
                    <Login />
                  </CandidateAuthProvider>
                } />
                
                {/* Candidate Portal Routes */}
                <Route path="/candidate-portal/register" element={
                  <CandidateAuthProvider>
                    <CandidateRegister />
                  </CandidateAuthProvider>
                } />
                
                {/* Protected Candidate Routes */}
                <Route path="/candidate-portal" element={
                  <CandidateAuthProvider>
                    <CandidateProtectedRoute>
                      <CandidateLayout />
                    </CandidateProtectedRoute>
                  </CandidateAuthProvider>
                }>
                  <Route path="dashboard" element={<CandidateDashboard />} />
                  <Route path="resume" element={<CandidateResumeUpload />} />
                  <Route path="interviews" element={<CandidateInterviews />} />
                  <Route path="profile" element={<CandidateProfile />} />
                  <Route path="jobs" element={<CandidateJobs />} />
                  <Route path="applications" element={<CandidateApplications />} />
                  {/* Add more candidate routes here */}
                </Route>
                
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
                  <Route path="interview-management" element={<InterviewManagement />} />
                </Route>

                <Route path="/hr" element={
                  <ProtectedRoute requiredRoles={['HR']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<HRDashboard />} />
                  <Route path="candidate-conversion" element={<CandidateConversion />} />
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
                  <Route index element={<Recruitment />} />
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
    </QueryClientProvider>
  )
}

export default App