import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true, // Important for cookies
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
}

// Employee API
export const employeeAPI = {
  getAll: ({ page = 1, limit = 10 } = {}) => 
    api.get(`/employees?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
}

// Attendance API
export const attendanceAPI = {
  getAttendance: ({ date, employeeId } = {}) => 
    api.get(`/attendance?date=${date}&employeeId=${employeeId}`),
  clockInOut: (data) => api.post('/attendance/clock-in-out', data),
  addRecord: (data) => api.post('/attendance', data),
  updateRecord: (id, data) => api.put(`/attendance/${id}`, data),
  deleteRecord: (id) => api.delete(`/attendance/${id}`),
}

// Leave API
export const leaveAPI = {
  getLeaveRequests: ({ employeeId, status } = {}) => 
    api.get(`/leave-requests?employeeId=${employeeId}&status=${status}`),
  createLeaveRequest: (data) => api.post('/leave-requests', data),
  approveRejectLeave: (id, data) => api.put(`/leave-requests/${id}/approve-reject`, data),
  updateLeaveRequest: (id, data) => api.put(`/leave-requests/${id}`, data),
  deleteLeaveRequest: (id) => api.delete(`/leave-requests/${id}`),
}

// Payroll API
export const payrollAPI = {
  getPayroll: ({ month, employeeId } = {}) => 
    api.get(`/payroll?month=${month}&employeeId=${employeeId}`),
  generatePayroll: (data) => api.post('/payroll/generate', data),
  updatePayroll: (id, data) => api.put(`/payroll/${id}`, data),
  markAsPaid: (id) => api.put(`/payroll/${id}/mark-paid`),
}

// Performance API
export const performanceAPI = {
  getReviews: ({ employeeId, status } = {}) => 
    api.get(`/performance-reviews?employeeId=${employeeId}&status=${status}`),
  createReview: (data) => api.post('/performance-reviews', data),
  updateReview: (id, data) => api.put(`/performance-reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/performance-reviews/${id}`),
}

// Job Posting API
export const jobPostingAPI = {
  getAll: ({ status, department } = {}) => 
    api.get(`/job-postings?status=${status}&department=${department}`),
  getById: (id) => api.get(`/job-postings/${id}`),
  create: (data) => api.post('/job-postings', data),
  update: (id, data) => api.put(`/job-postings/${id}`, data),
  delete: (id) => api.delete(`/job-postings/${id}`),
  publish: (id) => api.put(`/job-postings/${id}/publish`),
  close: (id) => api.put(`/job-postings/${id}/close`),
}

// Candidate API
export const candidateAPI = {
  getAll: ({ jobPostingId, status } = {}) => 
    api.get(`/candidates?jobPostingId=${jobPostingId}&status=${status}`),
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
}

// AI/ML API
export const aiAPI = {
  analyzeResume: (filePath, jobRequirements) => 
    api.post('/ai/resume/analyze', { filePath, jobRequirements }),
  startInterview: (candidateId, jobRole) => 
    api.post('/ai/interview/start', { candidateId, jobRole }),
  submitAnswer: (sessionId, answer, questionId) => 
    api.post('/ai/interview/answer', { sessionId, answer, questionId }),
  getNextQuestion: (sessionId) => 
    api.get(`/ai/interview/question/${sessionId}`),
  getServicesStatus: () => 
    api.get('/ai/services/status'),
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
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
}

// Reports API
export const reportsAPI = {
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getPayrollReport: (params) => api.get('/reports/payroll', { params }),
  getLeaveReport: (params) => api.get('/reports/leave', { params }),
  getPerformanceReport: (params) => api.get('/reports/performance', { params }),
}

// Test API endpoints
export const testAPI = {
  getUsers: () => api.get('/users'),
  getEmployees: () => api.get('/employees'),
  getDepartments: () => api.get('/departments'),
  healthCheck: () => axios.get('http://localhost:3001/health')
}

export default api
