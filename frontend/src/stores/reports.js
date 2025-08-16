import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchReports = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get('http://localhost:3000/api/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      })
      
      reports.value = response.data.reports || []
      
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

  const generateReport = async (reportType, params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.post(`http://localhost:3000/api/reports/${reportType}`, params, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      return response.data
      
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadReport = async (reportId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${reportId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
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
    reports,
    loading,
    error,
    fetchReports,
    generateReport,
    downloadReport
  }
})
