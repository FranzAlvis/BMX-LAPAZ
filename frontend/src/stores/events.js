import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useEventsStore = defineStore('events', () => {
  const toast = useToast()
  
  // State
  const events = ref([])
  const currentEvent = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Getters
  const activeEvents = computed(() => 
    events.value.filter(event => event.status === 'ACTIVE')
  )
  
  const upcomingEvents = computed(() => 
    events.value.filter(event => event.status === 'PLANNED')
  )
  
  const completedEvents = computed(() => 
    events.value.filter(event => event.status === 'COMPLETED')
  )

  // Actions
  const fetchEvents = async (params = {}) => {
    try {
      loading.value = true
      const response = await api.get('/api/events', { params })
      
      events.value = response.data.events
      pagination.value = response.data.pagination
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cargar eventos'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const fetchEvent = async (id) => {
    try {
      loading.value = true
      const response = await api.get(`/api/events/${id}`)
      
      currentEvent.value = response.data.event
      
      return { success: true, event: response.data.event }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cargar evento'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const createEvent = async (eventData) => {
    try {
      loading.value = true
      const response = await api.post('/api/events', eventData)
      
      events.value.unshift(response.data.event)
      toast.success('Evento creado correctamente')
      
      return { success: true, event: response.data.event }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear evento'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id, eventData) => {
    try {
      loading.value = true
      const response = await api.put(`/api/events/${id}`, eventData)
      
      const index = events.value.findIndex(event => event.id === id)
      if (index !== -1) {
        events.value[index] = response.data.event
      }
      
      if (currentEvent.value?.id === id) {
        currentEvent.value = response.data.event
      }
      
      toast.success('Evento actualizado correctamente')
      
      return { success: true, event: response.data.event }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar evento'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id) => {
    try {
      loading.value = true
      await api.delete(`/api/events/${id}`)
      
      events.value = events.value.filter(event => event.id !== id)
      
      if (currentEvent.value?.id === id) {
        currentEvent.value = null
      }
      
      toast.success('Evento eliminado correctamente')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar evento'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const getEventDashboard = async (id) => {
    try {
      loading.value = true
      const response = await api.get(`/api/events/${id}/dashboard`)
      
      return { success: true, dashboard: response.data.dashboard }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cargar dashboard del evento'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  const clearCurrentEvent = () => {
    currentEvent.value = null
  }

  return {
    // State
    events,
    currentEvent,
    loading,
    pagination,
    
    // Getters
    activeEvents,
    upcomingEvents,
    completedEvents,
    
    // Actions
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventDashboard,
    clearCurrentEvent
  }
})
