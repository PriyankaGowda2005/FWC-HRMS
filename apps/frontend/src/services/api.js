import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  withCredentials: true, // Important for cookies
  timeout: 30000, // 30 second timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor for debugging and auth
api.interceptors.request.use(
  (config) => {
    // Add token to requests if available
    let token = localStorage.getItem('token')
    if (!token) {
      token = localStorage.getItem('candidateToken')
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add cache-busting headers for job postings
    if (config.url?.includes('job-postings')) {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
      config.headers['Pragma'] = 'no-cache'
      config.headers['Expires'] = '0'
    }
    
    console.log('🔍 API Request:', config.method?.toUpperCase(), config.url, {
      hasToken: !!token,
      tokenType: token ? (localStorage.getItem('token') ? 'regular' : 'candidate') : 'none',
      data: config.data
    })
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('🔍 API Response:', response.status, response.config.url, {
      success: response.data?.success,
      dataKeys: response.data ? Object.keys(response.data) : [],
      dataType: typeof response.data,
      hasCandidates: !!response.data?.data?.candidates,
      candidatesCount: response.data?.data?.candidates?.length || 0
    })
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Only log errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('API Response Error:', error.response?.status, error.config?.url, error.response?.data)
    }
    
    // Handle 401 Unauthorized and 403 Forbidden - token expired or invalid
    if ((error.response?.status === 401 || error.response?.status === 403) && originalRequest) {
      // Skip refresh for auth endpoints (login, refresh, register) to avoid infinite loops
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/refresh') || 
          originalRequest.url?.includes('/auth/register')) {
        console.log('🔐 Auth endpoint failed, clearing tokens')
        localStorage.removeItem('token')
        localStorage.removeItem('candidateToken')
        localStorage.removeItem('refreshToken')
        return Promise.reject(error)
      }
      
      // Check if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken && !originalRequest._retry) {
        // If we're already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          }).catch(err => {
            return Promise.reject(err)
          })
        }
        
        originalRequest._retry = true
        isRefreshing = true
        
        try {
          console.log('🔄 Attempting to refresh token...')
          
          // Call refresh endpoint with refresh token in request body
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/refresh`,
            { refreshToken }, // Send refresh token in request body
            {
              withCredentials: true, // Important for cookies
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
          
          const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data
          
          if (newToken) {
            // Update tokens in localStorage
            localStorage.setItem('token', newToken)
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken)
            }
            
            console.log('✅ Token refreshed successfully')
            
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            
            // Process queued requests
            processQueue(null, newToken)
            isRefreshing = false
            
            // Retry the original request
            return api(originalRequest)
          } else {
            throw new Error('No token in refresh response')
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError)
          
          // Refresh failed - clear all tokens and process queue with error
          localStorage.removeItem('token')
          localStorage.removeItem('candidateToken')
          localStorage.removeItem('refreshToken')
          
          processQueue(refreshError, null)
          isRefreshing = false
          
          // Redirect to login if we're not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            // Only redirect if we have a router available
            if (window.location) {
              window.location.href = '/login'
            }
          }
          
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token available - clear everything
        console.log('🔐 No refresh token available, clearing auth data')
        localStorage.removeItem('token')
        localStorage.removeItem('candidateToken')
        localStorage.removeItem('refreshToken')
        
        // Redirect to login if we're not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          if (window.location) {
            window.location.href = '/login'
          }
        }
      }
    }
    
    // Handle network errors - minimal logging
    if (error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      // Don't log - let the component handle it with better UI
    }
    
    // Handle connection refused
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_REFUSED') {
      // Don't log - let the component handle it
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Don't log - let the component handle it
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Request timed out. Please try again.')
      }
    }
    
    // Handle CORS errors
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      console.error('🚫 CORS Error: Frontend origin not allowed')
      console.error('💡 Check CORS configuration in backend server.js')
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (data) => api.post('/auth/logout', data || {}),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
}

// Employee API
export const employeeAPI = {
  getAll: ({ page = 1, limit = 10 } = {}) => 
    api.get(`/employees?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats/overview'),
  getHRAnalytics: () => api.get('/employees/analytics/hr'),
  getRecruitmentStats: () => api.get('/employees/analytics/recruitment'),
  getTeamMembers: (managerId) => api.get(`/employees/team/${managerId}`),
  getPerformanceData: (employeeId) => api.get(`/employees/${employeeId}/performance`),
}

// Attendance API
export const attendanceAPI = {
  getAttendance: ({ date, employeeId } = {}) => 
    api.get(`/attendance?date=${date}&employeeId=${employeeId}`),
  getMyAttendance: ({ startDate, endDate, page, limit, status } = {}) =>
    api.get(`/attendance/my-attendance?${new URLSearchParams({ startDate, endDate, page, limit, status }).toString()}`),
  clockIn: (data) => api.post('/attendance/clock-in', data),
  clockOut: (data) => api.post('/attendance/clock-out', data),
  addRecord: (data) => api.post('/attendance', data),
  updateRecord: (id, data) => api.put(`/attendance/${id}`, data),
  deleteRecord: (id) => api.delete(`/attendance/${id}`),
  getTeamAttendance: ({ managerId, timeRange } = {}) =>
    api.get(`/attendance/team?managerId=${managerId}&timeRange=${timeRange}`),
  getEmployeeAttendance: ({ employeeId, period } = {}) =>
    api.get(`/attendance/employee?employeeId=${employeeId}&period=${period}`),
}

// Leave API
export const leaveAPI = {
  getLeaveRequests: ({ employeeId, status } = {}) => 
    api.get(`/leave-requests?employeeId=${employeeId}&status=${status}`),
  getMyLeaves: ({ year, status, page, limit } = {}) =>
    api.get(`/leave-requests/my-leaves?${new URLSearchParams({ year, status, page, limit }).toString()}`),
  getPendingLeaves: ({ departmentId, page, limit } = {}) =>
    api.get(`/leave-requests/pending?${new URLSearchParams({ departmentId, page, limit }).toString()}`),
  createLeaveRequest: (data) => api.post('/leave-requests', data),
  approveRejectLeave: (id, data) => api.put(`/leave-requests/${id}/approve`, data),
  cancelLeave: (id) => api.put(`/leave-requests/${id}/cancel`),
  updateLeaveRequest: (id, data) => api.put(`/leave-requests/${id}`, data),
  deleteLeaveRequest: (id) => api.delete(`/leave-requests/${id}`),
  getLeaveBalance: (employeeId) => api.get(`/leave-requests/balance/${employeeId}`),
  getLeaveBalances: () => api.get('/leave-requests/balances'),
  getTeamLeaveRequests: (managerId) => api.get(`/leave-requests/team/${managerId}`),
  getTeamLeaves: ({ timeRange, managerId } = {}) => 
    api.get(`/leave-requests/team-leaves?${new URLSearchParams({ timeRange, managerId }).toString()}`),
}

// Payroll API
export const payrollAPI = {
  getPayroll: ({ month, employeeId } = {}) => 
    api.get(`/payroll?month=${month}&employeeId=${employeeId}`),
  getMyPayroll: ({ year, month, page, limit } = {}) =>
    api.get(`/payroll/my-payroll?${new URLSearchParams({ year, month, page, limit }).toString()}`),
  generatePayroll: (data) => api.post('/payroll/generate', data),
  processPayroll: (data) => api.post('/payroll/process', data),
  updatePayroll: (id, data) => api.put(`/payroll/${id}`, data),
  markAsPaid: (id) => api.put(`/payroll/${id}/mark-paid`),
}

// Performance API
export const performanceAPI = {
  getReviews: ({ employeeId, status, reviewType, year, page, limit, sortBy, sortOrder } = {}) => 
    api.get(`/performance-reviews?${new URLSearchParams({ employeeId, status, reviewType, year, page, limit, sortBy, sortOrder }).toString()}`),
  getMyReviews: ({ year, status, page, limit } = {}) =>
    api.get(`/performance-reviews/my-reviews?${new URLSearchParams({ year, status, page, limit }).toString()}`),
  getMetrics: ({ period } = {}) => 
    api.get(`/performance-reviews/metrics?period=${period}`),
  createReview: (data) => api.post('/performance-reviews', data),
  updateReview: (id, data) => api.put(`/performance-reviews/${id}`, data),
  submitSelfRating: (id, data) => api.post(`/performance-reviews/${id}/self-rating`, data),
  deleteReview: (id) => api.delete(`/performance-reviews/${id}`),
}

// Job Posting API
export const jobPostingAPI = {
  getAll: ({ status, departmentId, department, urgency, page, limit } = {}) => {
    // Build query params without undefined values and align keys with backend
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    // Prefer explicit department param; fall back to departmentId if provided
    const dept = department || departmentId
    if (dept) params.set('department', dept)
    if (page) params.set('page', page)
    if (limit) params.set('limit', limit)
    // 'urgency' is not supported by backend route; avoid sending it to prevent mismatches
    const qs = params.toString()
    const url = qs ? `/job-postings?${qs}` : '/job-postings'
    return api.get(url)
  },
  getPublic: ({ employmentType, location, department, remote, page, limit, search } = {}) =>
    api.get(`/job-postings/public?${new URLSearchParams({ employmentType, location, department, remote, page, limit, search }).toString()}`),
  getForScreening: ({ status = 'PUBLISHED', department, page = 1, limit = 500 } = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (department) params.set('department', department)
    if (page) params.set('page', page)
    if (limit) params.set('limit', limit)
    const qs = params.toString()
    const url = qs ? `/job-postings?${qs}` : '/job-postings'
    return api.get(url)
  },
  getById: (id) => api.get(`/job-postings/${id}`),
  getPublicById: (id) => api.get(`/job-postings/public/${id}`),
  create: (data) => api.post('/job-postings', data),
  update: (id, data) => api.put(`/job-postings/${id}`, data),
  delete: (id) => api.delete(`/job-postings/${id}`),
  publish: (id) => api.patch(`/job-postings/${id}/publish`),
  close: (id) => api.post(`/job-postings/${id}/close`),
}

// Candidate API
export const candidateAPI = {
  getAll: ({ jobPostingId, status } = {}) => {
    const params = new URLSearchParams()
    if (jobPostingId) params.append('jobPostingId', jobPostingId)
    if (status) params.append('status', status)
    
    const queryString = params.toString()
    const url = queryString ? `/candidates?${queryString}` : '/candidates'
    
    // Add timestamp to prevent caching without custom headers
    const timestamp = Date.now()
    const separator = queryString ? '&' : '?'
    const finalUrl = `${url}${separator}_t=${timestamp}`
    
    return api.get(finalUrl)
  },
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  uploadResume: (id, file) => {
    const formData = new FormData()
    formData.append('resume', file)
    return api.post(`/candidates/${id}/resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateStatus: (id, status) => api.put(`/candidates/${id}/status`, { status }),
  
  // Candidate-specific endpoints
  getJobs: ({ page = 1, limit = 10, department, location } = {}) => 
    api.get(`/candidates/jobs?page=${page}&limit=${limit}&department=${department}&location=${location}`),
  getApplications: () => api.get('/candidates/applications'),
  getProfile: () => api.get('/candidates/profile'),
  
  // New hybrid approach endpoints
  getRecent: ({ limit = 10, days = 7 } = {}) => 
    api.get(`/candidates/recent?limit=${limit}&days=${days}`),
  screenCandidate: (data) => api.post('/candidates/screen-candidate', data),
  inviteToApply: (data) => api.post('/candidates/invite-to-apply', data),
  getInvitations: () => api.get('/candidates/invitations'),
}

// AI/ML API
export const aiAPI = {
  // Resume Analysis
  analyzeResume: (filePath, jobRequirements) => 
    api.post('/ai/resume/analyze', { filePath, jobRequirements }),
  
  // Interview Management
  startInterview: (candidateId, jobRole) => 
    api.post('/ai/interview/start', { candidateId, jobRole }),
  submitAnswer: (sessionId, answer, questionId) => 
    api.post('/ai/interview/answer', { sessionId, answer, questionId }),
  getNextQuestion: (sessionId) => 
    api.get(`/ai/interview/question/${sessionId}`),
  generateInterviewReport: (sessionId) => 
    api.get(`/ai/interview/report/${sessionId}`),
  
  // Performance Analysis
  analyzePerformance: (employeeId, period) => 
    api.post('/ai/performance/analyze', { employeeId, period }),
  generatePerformanceRecommendations: (employeeId) => 
    api.post('/ai/performance/recommendations', { employeeId }),
  predictPerformanceTrends: (departmentId) => 
    api.post('/ai/performance/predict', { departmentId }),
  
  // Attendance Insights
  analyzeAttendancePatterns: (employeeId, period) => 
    api.post('/ai/attendance/analyze', { employeeId, period }),
  predictAbsenteeism: (employeeId) => 
    api.post('/ai/attendance/predict', { employeeId }),
  generateAttendanceInsights: (departmentId) => 
    api.post('/ai/attendance/insights', { departmentId }),
  
  // Payroll Analysis
  analyzePayrollTrends: (period) => 
    api.post('/ai/payroll/analyze', { period }),
  predictSalaryTrends: (departmentId) => 
    api.post('/ai/payroll/predict', { departmentId }),
  generateCompensationInsights: () => 
    api.post('/ai/payroll/insights'),
  
  // Recruitment Insights
  getRecruitmentInsights: (period = '30d') => 
    api.get(`/ai/recruitment/insights?period=${period}`),
  analyzeHiringTrends: (departmentId) => 
    api.post('/ai/recruitment/trends', { departmentId }),
  predictHiringNeeds: (departmentId) => 
    api.post('/ai/recruitment/predict', { departmentId }),
  
  // Reports Analytics
  getReportInsights: ({ reportType, dateRange }) => 
    api.post('/ai/reports/insights', { reportType, dateRange }),
  generateReportRecommendations: (reportType) => 
    api.post('/ai/reports/recommendations', { reportType }),
  analyzeReportTrends: (reportType, period) => 
    api.post('/ai/reports/trends', { reportType, period }),
  
  // Department Analytics
  analyzeDepartmentPerformance: (departmentId) => 
    api.post('/ai/departments/analyze', { departmentId }),
  predictDepartmentGrowth: (departmentId) => 
    api.post('/ai/departments/predict', { departmentId }),
  generateDepartmentInsights: (departmentId) => 
    api.post('/ai/departments/insights', { departmentId }),
  
  // General AI Services
  getServicesStatus: () => 
    api.get('/ai/services/status'),
  getTeamInsights: (managerId) => 
    api.get(`/ai/insights/team/${managerId}`),
  getHRInsights: () => 
    api.get('/ai/insights/hr'),
  getEmployeeInsights: (employeeId) => 
    api.get(`/ai/insights/employee/${employeeId}`),
  getInsights: () => 
    api.get('/recruitment/ai-insights'),
  
  // AI Chat and Assistance
  askAIQuestion: (question, context) => 
    api.post('/ai/chat/ask', { question, context }),
  getAISuggestions: (module, context) => 
    api.post('/ai/suggestions', { module, context }),
  
  // Predictive Analytics
  predictEmployeeTurnover: (employeeId) => 
    api.post('/ai/predict/turnover', { employeeId }),
  predictSkillGaps: (departmentId) => 
    api.post('/ai/predict/skills', { departmentId }),
  predictWorkloadDistribution: (departmentId) => 
    api.post('/ai/predict/workload', { departmentId }),
}

// Career Page API (public endpoints)
const API_BASE_URL = 'http://localhost:3001/api'

export const careerAPI = {
  getJobs: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return fetch(`${API_BASE_URL}/job-postings/career-page${queryParams ? `?${queryParams}` : ''}`)
      .then(res => res.json());
  },
  
  getJob: (id) => 
    fetch(`${API_BASE_URL}/job-postings/career-page/${id}`)
      .then(res => res.json()),
  
  apply: (formData) => {
    return fetch(`${API_BASE_URL}/career/apply`, {
      method: 'POST',
      body: formData
    }).then(res => res.json());
  },
  
  getCultureBenefits: () => 
    fetch(`${API_BASE_URL}/career/culture-benefits`)
      .then(res => res.json()),
  
  generateDescription: (data) => 
    fetch(`${API_BASE_URL}/career/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  
  sendInterviewInvitation: (data) => 
    fetch(`${API_BASE_URL}/career/send-interview-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  
  sendDecisionEmail: (data) => 
    fetch(`${API_BASE_URL}/career/send-decision-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(res => res.json())
}

// Recruitment API (legacy - keeping for backward compatibility)
export const recruitmentAPI = {
  getJobPostings: ({ status, department } = {}) => 
    api.get(`/job-postings?status=${status}&department=${department}`),
  createJobPosting: (data) => api.post('/job-postings', data),
  updateJobPosting: (id, data) => api.put(`/job-postings/${id}`, data),
  deleteJobPosting: (id) => api.delete(`/job-postings/${id}`),
  getCandidates: ({ jobPostingId, status } = {}) => 
    api.get(`/candidates?jobPostingId=${jobPostingId}&status=${status}`),
  updateCandidate: (id, data) => api.put(`/candidates/${id}`, data),
}

// Department API
export const departmentAPI = {
  getDepartments: () => api.get('/departments'),
  getDepartment: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentEmployees: (id) => api.get(`/departments/${id}/employees`),
}

// Reports API
export const reportsAPI = {
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getPayrollReport: (params) => api.get('/reports/payroll', { params }),
  getLeaveReport: (params) => api.get('/reports/leave', { params }),
  getPerformanceReport: (params) => api.get('/reports/performance', { params }),
  generateReport: (type, dateRange) => api.get(`/reports/${type}`, { params: dateRange }),
}

// Report API (for ReportsAnalytics page)
export const reportAPI = {
  getReport: ({ type, dateRange, filters } = {}) => 
    api.get(`/reports/${type}?dateRange=${dateRange}&${new URLSearchParams(filters || {}).toString()}`),
  exportReport: ({ type, format, dateRange } = {}) => 
    api.get(`/reports/${type}/export?format=${format}&dateRange=${dateRange}`, { responseType: 'blob' }),
  getAnalytics: ({ period } = {}) => 
    api.get(`/reports/analytics?period=${period}`),
}

// Settings API
export const settingsAPI = {
  getSettings: () => 
    api.get('/settings'),
  updateSettings: (data) => 
    api.put('/settings', data),
  changePassword: (data) => 
    api.post('/settings/change-password', data),
  getIntegrations: () => 
    api.get('/settings/integrations'),
  connectIntegration: (provider, data) => 
    api.post(`/settings/integrations/${provider}`, data),
}

// Candidate Interview Management API
export const candidateInterviewsAPI = {
  // Get candidate's interviews
  getMyInterviews: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/candidate-interviews/my-interviews?${queryParams}`);
    return response.data;
  },

  // Get interview details
  getInterview: async (interviewId) => {
    const response = await api.get(`/candidate-interviews/interview/${interviewId}`);
    return response.data;
  },

  // Request interview reschedule
  requestReschedule: async (interviewId, data) => {
    const response = await api.post(`/candidate-interviews/interview/${interviewId}/request-reschedule`, data);
    return response.data;
  },

  // Confirm interview attendance
  confirmInterview: async (interviewId) => {
    const response = await api.post(`/candidate-interviews/interview/${interviewId}/confirm`);
    return response.data;
  },

  // Get application status
  getApplicationStatus: async () => {
    const response = await api.get('/candidate-interviews/application-status');
    return response.data;
  },

  // Send interview reminder
  sendReminder: async (interviewId) => {
    const response = await api.post(`/candidate-interviews/interview/${interviewId}/reminder`);
    return response.data;
  }
};

// Interview Transcript Processing API
export const interviewTranscriptsAPI = {
  // Start interview recording
  startRecording: async (data) => {
    const response = await api.post('/interview-transcripts/start-recording', data);
    return response.data;
  },

  // Update transcript (real-time)
  updateTranscript: async (transcriptId, data) => {
    const response = await api.post(`/interview-transcripts/update-transcript`, {
      transcriptId,
      ...data
    });
    return response.data;
  },

  // End interview recording
  endRecording: async (transcriptId, data) => {
    const response = await api.post(`/interview-transcripts/end-recording`, {
      transcriptId,
      ...data
    });
    return response.data;
  },

  // Get transcript analysis results
  getTranscript: async (transcriptId) => {
    const response = await api.get(`/interview-transcripts/transcript/${transcriptId}`);
    return response.data;
  },

  // Get all transcripts for a user
  getMyTranscripts: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/interview-transcripts/my-transcripts?${queryParams}`);
    return response.data;
  },

  // Submit manual scores
  submitScores: async (transcriptId, data) => {
    const response = await api.post('/interview-transcripts/submit-scores', {
      transcriptId,
      ...data
    });
    return response.data;
  },

  // Get interview analytics
  getAnalytics: async (timeframe = '30d') => {
    const response = await api.get(`/interview-transcripts/analytics?timeframe=${timeframe}`);
    return response.data;
  }
};

// Real-time Interview Monitoring API
export const realtimeInterviewAPI = {
  // Start monitoring session
  startMonitoring: async (data) => {
    const response = await api.post('/realtime-interview/start-monitoring', data);
    return response.data;
  },

  // Process audio/transcript
  processAudio: async (data) => {
    const response = await api.post('/realtime-interview/process-audio', data);
    return response.data;
  },

  // Get session data
  getSession: async (sessionId) => {
    const response = await api.get(`/realtime-interview/session/${sessionId}`);
    return response.data;
  },

  // Get live monitoring data
  getLiveData: async (sessionId) => {
    const response = await api.get(`/realtime-interview/session/${sessionId}/live`);
    return response.data;
  },

  // End monitoring and generate report
  endMonitoring: async (data) => {
    const response = await api.post('/realtime-interview/end-monitoring', data);
    return response.data;
  }
};

// Candidate to Employee Conversion API
export const candidateConversionAPI = {
  // Convert candidate to employee
  convertCandidate: async (data) => {
    const response = await api.post('/candidate-conversion/convert', data);
    return response.data;
  },

  // Get candidates ready for conversion
  getCandidatesReady: async () => {
    const response = await api.get('/candidate-conversion/candidates-ready');
    return response.data;
  },

  // Get conversion history
  getConversionHistory: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/candidate-conversion/conversion-history?${queryParams}`);
    return response.data;
  },

  // Get onboarding status
  getOnboardingStatus: async (employeeId) => {
    const response = await api.get(`/candidate-conversion/onboarding/${employeeId}`);
    return response.data;
  },

  // Update onboarding task status
  updateOnboardingTask: async (employeeId, taskId, data) => {
    const response = await api.put(`/candidate-conversion/onboarding/${employeeId}/task/${taskId}`, data);
    return response.data;
  }
};

// Resume Processing API
export const resumeProcessingAPI = {
  // Upload resume(s) with automatic processing
  uploadResumes: (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('resumes', file)
    })
    return api.post('/resume-processing/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Calculate ATS score for a resume against a job posting
  calculateAtsScore: (data) => api.post('/resume-processing/ats-score', data),

  // Generate professional template
  generateTemplate: (resumeId, options = {}) => 
    api.post(`/resume-processing/generate-template/${resumeId}`, options),

  // Download template
  downloadTemplate: (resumeId) => 
    api.get(`/resume-processing/download-template/${resumeId}`, { responseType: 'blob' }),

  // Get job recommendations for a candidate
  getJobRecommendations: (candidateId) => 
    api.get(`/resume-processing/job-recommendations/${candidateId}`),

  // Get dashboard data with filters
  getDashboard: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`/resume-processing/dashboard?${queryParams}`)
  }
}

// Resume Screening API
export const resumeScreeningAPI = {
  // Screen a candidate's resume for a job posting
  screenResume: (data) => api.post('/resume-screening/screen', data),
  
  // Get all screenings for a job posting
  getScreenings: (jobPostingId) => api.get(`/resume-screening/screenings/${jobPostingId}`),
  
  // Get screening details
  getScreening: (screeningId) => api.get(`/resume-screening/screening/${screeningId}`),
  
  // Update screening status (approve/reject)
  updateScreeningStatus: (screeningId, data) => api.put(`/resume-screening/screening/${screeningId}/status`, data)
}

// Job Attachments API
export const jobAttachmentsAPI = {
  // Attach screened candidate to job posting
  attachCandidate: (data) => api.post('/job-attachments/attach', data),
  
  // Get all attachments for a job posting
  getJobAttachments: (jobPostingId, params = {}) => api.get(`/job-attachments/job/${jobPostingId}`, { params }),
  
  // Get all attachments for a candidate
  getCandidateAttachments: (candidateId) => api.get(`/job-attachments/candidate/${candidateId}`),
  
  // Get attachment details
  getAttachment: (attachmentId) => api.get(`/job-attachments/${attachmentId}`),
  
  // Update attachment status
  updateAttachmentStatus: (attachmentId, data) => api.put(`/job-attachments/${attachmentId}/status`, data),
  
  // Remove attachment
  removeAttachment: (attachmentId) => api.delete(`/job-attachments/${attachmentId}`)
}

// Interviews API
export const interviewsAPI = {
  // Schedule interview
  scheduleInterview: (data) => api.post('/interviews/schedule', data),
  // Schedule AI interview (no attachment required)
  scheduleAIInterview: (data) => api.post('/interviews/schedule-ai', data),
  
  // Get interviews for a manager
  getManagerInterviews: (managerId, params = {}) => api.get(`/interviews/manager/${managerId}`, { params }),
  
  // Get interviews for a job posting
  getJobInterviews: (jobPostingId) => api.get(`/interviews/job/${jobPostingId}`),
  
  // Get interview details
  getInterview: (interviewId) => api.get(`/interviews/${interviewId}`),
  
  // Update interview status
  updateInterviewStatus: (interviewId, data) => api.put(`/interviews/${interviewId}/status`, data),
  
  // Reschedule interview
  rescheduleInterview: (interviewId, data) => api.put(`/interviews/${interviewId}/reschedule`, data),
  
  // Cancel interview
  cancelInterview: (interviewId, data) => api.put(`/interviews/${interviewId}/cancel`, data)
}

// Services API
export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  generateDescriptions: (data) => api.post('/services/generate-descriptions', data)
}

// Test API endpoints
export const testAPI = {
  getUsers: () => api.get('/users'),
  getEmployees: () => api.get('/employees'),
  getDepartments: () => api.get('/departments'),
  healthCheck: () => axios.get('http://localhost:3001/health')
}

export default api
