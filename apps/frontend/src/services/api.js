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
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
}

// Test API endpoints
export const testAPI = {
  getUsers: () => api.get('/users'),
  getEmployees: () => api.get('/employees'),
  getDepartments: () => api.get('/departments'),
  healthCheck: () => axios.get('http://localhost:3001/health')
}

export default api
