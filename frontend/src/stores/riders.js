import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useRidersStore = defineStore('riders', () => {
  const toast = useToast()
  
  // State
  const riders = ref([])
  const currentRider = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Getters
  const activeRiders = computed(() => 
    riders.value.filter(rider => rider.isActive)
  )
  
  const ridersByGender = computed(() => {
    const grouped = { M: [], F: [] }
    riders.value.forEach(rider => {
      if (grouped[rider.gender]) {
        grouped[rider.gender].push(rider)
      }
    })
    return grouped
  })
  
  const ridersByClub = computed(() => {
    const grouped = {}
    riders.value.forEach(rider => {
      const club = rider.club || 'Sin Club'
      if (!grouped[club]) {
        grouped[club] = []
      }
      grouped[club].push(rider)
    })
    return grouped
  })

  // Actions
  const fetchRiders = async (params = {}) => {
    try {
      loading.value = true
      const response = await api.get('/api/riders', { params })
      
      riders.value = response.data.riders
      pagination.value = response.data.pagination
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cargar corredores'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const fetchRider = async (id) => {
    try {
      loading.value = true
      const response = await api.get(`/api/riders/${id}`)
      
      currentRider.value = response.data.rider
      
      return { success: true, rider: response.data.rider }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cargar corredor'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const createRider = async (riderData) => {
    try {
      loading.value = true
      const response = await api.post('/api/riders', riderData)
      
      riders.value.unshift(response.data.rider)
      toast.success('Corredor creado correctamente')
      
      return { success: true, rider: response.data.rider }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear corredor'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const updateRider = async (id, riderData) => {
    try {
      loading.value = true
      const response = await api.put(`/api/riders/${id}`, riderData)
      
      const index = riders.value.findIndex(rider => rider.id === id)
      if (index !== -1) {
        riders.value[index] = response.data.rider
      }
      
      if (currentRider.value?.id === id) {
        currentRider.value = response.data.rider
      }
      
      toast.success('Corredor actualizado correctamente')
      
      return { success: true, rider: response.data.rider }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar corredor'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const deleteRider = async (id) => {
    try {
      loading.value = true
      await api.delete(`/api/riders/${id}`)
      
      riders.value = riders.value.filter(rider => rider.id !== id)
      
      if (currentRider.value?.id === id) {
        currentRider.value = null
      }
      
      toast.success('Corredor eliminado correctamente')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar corredor'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const importRiders = async (file) => {
    try {
      loading.value = true
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post('/api/riders/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Refresh riders list
      await fetchRiders()
      
      toast.success(`Importación completada: ${response.data.imported} corredores importados`)
      
      return { success: true, result: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al importar corredores'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const exportRiders = async (format = 'csv') => {
    try {
      loading.value = true
      const response = await api.get(`/api/riders/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      })
      
      if (format === 'csv') {
        // Create download link for CSV
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `corredores_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        toast.success('Archivo CSV descargado correctamente')
      }
      
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al exportar corredores'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const searchRiders = async (query) => {
    try {
      const response = await api.get('/api/riders', {
        params: { search: query, limit: 50 }
      })
      
      return { success: true, riders: response.data.riders }
    } catch (error) {
      return { success: false, riders: [] }
    }
  }

  const clearCurrentRider = () => {
    currentRider.value = null
  }

  return {
    // State
    riders,
    currentRider,
    loading,
    pagination,
    
    // Getters
    activeRiders,
    ridersByGender,
    ridersByClub,
    
    // Actions
    fetchRiders,
    fetchRider,
    createRider,
    updateRider,
    deleteRider,
    importRiders,
    exportRiders,
    searchRiders,
    clearCurrentRider
  }
})
