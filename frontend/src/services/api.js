import axios from 'axios'
import { useToast } from 'vue-toastification'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('bmx_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const toast = useToast()
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('bmx_token')
      localStorage.removeItem('bmx_user')
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    
    if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción')
    }
    
    if (error.response?.status === 404) {
      toast.error('Recurso no encontrado')
    }
    
    if (error.response?.status >= 500) {
      toast.error('Error interno del servidor. Por favor, intenta más tarde.')
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      toast.error('Error de conexión. Verifica tu conexión a internet.')
    }
    
    return Promise.reject(error)
  }
)

export default api
