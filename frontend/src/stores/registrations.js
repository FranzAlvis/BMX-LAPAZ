import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useRegistrationsStore = defineStore('registrations', () => {
  const registrations = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchRegistrations = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get('http://localhost:3000/api/registrations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      })
      
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
      const response = await axios.post('http://localhost:3000/api/registrations', registrationData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
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
      const response = await axios.put(`http://localhost:3000/api/registrations/${id}`, registrationData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
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
      await axios.delete(`http://localhost:3000/api/registrations/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
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
