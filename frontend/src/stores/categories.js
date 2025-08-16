import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchCategories = async () => {
    try {
      loading.value = true
      error.value = null
      
      const token = localStorage.getItem('token')
      console.log('Categories: Using axios to fetch categories')
      console.log('Categories: Token exists:', !!token)
      
      const response = await api.get('/api/categories')
      
      console.log('Categories: Axios response status:', response.status)
      console.log('Categories: Axios response data:', response.data)
      
      categories.value = response.data.categories || []
      console.log('Categories: Final categories array:', categories.value)
      console.log('Categories: Categories count:', categories.value.length)
      
    } catch (err) {
      console.error('Categories: Axios error:', err)
      
      if (err.response) {
        console.error('Categories: Error response status:', err.response.status)
        console.error('Categories: Error response data:', err.response.data)
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else if (err.request) {
        console.error('Categories: No response received:', err.request)
        error.value = 'No response from server'
      } else {
        console.error('Categories: Request setup error:', err.message)
        error.value = err.message
      }
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (categoryData) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await api.post('/api/categories', categoryData)
      
      categories.value.push(response.data.category)
      return response.data.category
    } catch (err) {
      console.error('Categories store - createCategory error:', err)
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

  const updateCategory = async (id, categoryData) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await api.put(`/api/categories/${id}`, categoryData)
      
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data.category
      }
      return response.data.category
    } catch (err) {
      console.error('Categories store - updateCategory error:', err)
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

  const deleteCategory = async (id) => {
    try {
      loading.value = true
      error.value = null
      
      await api.delete(`/api/categories/${id}`)
      
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (err) {
      console.error('Categories store - deleteCategory error:', err)
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

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
})
