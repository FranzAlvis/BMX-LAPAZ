import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

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
      
      const response = await axios.get('http://localhost:3000/api/categories')
      
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
      const response = await axios.post('http://localhost:3000/api/categories', categoryData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      categories.value.push(response.data.category)
      return response.data.category
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/categories/${id}`, categoryData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data.category
      }
      return response.data.category
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/categories/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      categories.value = categories.value.filter(c => c.id !== id)
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
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
})
