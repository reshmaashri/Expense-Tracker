import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor: attach Bearer token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('expense_tracker_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 unauthorized / expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config
    const isAuthRoute = originalRequest?.url?.includes('/api/auth/login') ||
                        originalRequest?.url?.includes('/api/auth/register')

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      // Clear token and broadcast logout event
      localStorage.removeItem('expense_tracker_token')
      localStorage.removeItem('expense_tracker_user')
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
