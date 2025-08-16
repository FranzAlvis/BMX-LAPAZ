import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useResultsStore = defineStore('results', () => {
  const results = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchResults = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get('http://localhost:3000/api/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      })
      
      results.value = response.data.results || []
      
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

  const createResult = async (resultData) => {
    try {
      const response = await axios.post('http://localhost:3000/api/results', resultData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      results.value.push(response.data.result)
      return response.data.result
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const updateResult = async (id, resultData) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/results/${id}`, resultData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const index = results.value.findIndex(r => r.id === id)
      if (index !== -1) {
        results.value[index] = response.data.result
      }
      return response.data.result
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const deleteResult = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/results/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      results.value = results.value.filter(r => r.id !== id)
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
    results,
    loading,
    error,
    fetchResults,
    createResult,
    updateResult,
    deleteResult
  }
})
