import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
  const toast = useToast()
  
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('bmx_token'))
  const loading = ref(false)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userName = computed(() => user.value?.name)

  // API instance is configured in services/api.js

  // Actions
  const login = async (credentials) => {
    try {
      loading.value = true
      const response = await api.post('/api/auth/login', credentials)
      
      const { token: authToken, user: userData } = response.data
      
      // Store token and user data
      token.value = authToken
      user.value = userData
      
      // Save to localStorage
      localStorage.setItem('bmx_token', authToken)
      localStorage.setItem('bmx_user', JSON.stringify(userData))
      
      // Token will be automatically added by API interceptor
      
      toast.success(`¡Bienvenido, ${userData.name}!`)
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await api.post('/api/auth/logout')
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Clear local state
      token.value = null
      user.value = null
      
      // Clear localStorage
      localStorage.removeItem('bmx_token')
      localStorage.removeItem('bmx_user')
      
      // API interceptor will handle token removal
      
      toast.info('Sesión cerrada correctamente')
    }
  }

  const initializeAuth = async () => {
    const savedToken = localStorage.getItem('bmx_token')
    const savedUser = localStorage.getItem('bmx_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        
        // Verify token is still valid
        await api.get('/api/auth/me')
        
      } catch (error) {
        // Token is invalid, clear everything
        await logout()
      }
    }
    
    initialized.value = true
  }

  const updateProfile = async (profileData) => {
    try {
      loading.value = true
      const response = await api.put('/api/auth/profile', profileData)
      
      user.value = { ...user.value, ...response.data.user }
      localStorage.setItem('bmx_user', JSON.stringify(user.value))
      
      toast.success('Perfil actualizado correctamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (passwordData) => {
    try {
      loading.value = true
      await api.put('/api/auth/change-password', passwordData)
      
      toast.success('Contraseña cambiada correctamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar contraseña'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const hasRole = (roles) => {
    if (!user.value) return false
    if (typeof roles === 'string') {
      return user.value.role === roles
    }
    return roles.includes(user.value.role)
  }

  const canAccess = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true
    return hasRole(requiredRoles)
  }

  return {
    // State
    user,
    token,
    loading,
    initialized,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    
    // Actions
    login,
    logout,
    initializeAuth,
    updateProfile,
    changePassword,
    hasRole,
    canAccess
  }
})
