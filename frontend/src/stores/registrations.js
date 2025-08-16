import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useRegistrationsStore = defineStore('registrations', () => {
  const registrations = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchRegistrations = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await api.get('/api/registrations', { params })
      
      registrations.value = response.data.registrations || []
      
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else if (err.request) {
        error.value = 'No response from server'
      } else {
        error.value = err.message
      }
    } finally {
      loading.value = false
    }
  }

  const createRegistration = async (registrationData) => {
    try {
      const response = await api.post('/api/registrations', registrationData)
      
      registrations.value.push(response.data.registration)
      return response.data.registration
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const updateRegistration = async (id, registrationData) => {
    try {
      const response = await api.put(`/api/registrations/${id}`, registrationData)
      
      const index = registrations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        registrations.value[index] = response.data.registration
      }
      return response.data.registration
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const deleteRegistration = async (id) => {
    try {
      await api.delete(`/api/registrations/${id}`)
      
      registrations.value = registrations.value.filter(r => r.id !== id)
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  return {
    registrations,
    loading,
    error,
    fetchRegistrations,
    createRegistration,
    updateRegistration,
    deleteRegistration
  }
})
