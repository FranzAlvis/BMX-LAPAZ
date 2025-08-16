import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useRacesStore = defineStore('races', () => {
  const races = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchRaces = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get('http://localhost:3000/api/races', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      races.value = response.data.races || []
      
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

  const createRace = async (raceData) => {
    try {
      const response = await axios.post('http://localhost:3000/api/races', raceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      races.value.push(response.data.race)
      return response.data.race
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const updateRace = async (id, raceData) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/races/${id}`, raceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const index = races.value.findIndex(r => r.id === id)
      if (index !== -1) {
        races.value[index] = response.data.race
      }
      return response.data.race
    } catch (err) {
      if (err.response) {
        error.value = `API Error ${err.response.status}: ${err.response.data?.message || 'Unknown error'}`
      } else {
        error.value = err.message
      }
      throw err
    }
  }

  const deleteRace = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/races/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      races.value = races.value.filter(r => r.id !== id)
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
    races,
    loading,
    error,
    fetchRaces,
    createRace,
    updateRace,
    deleteRace
  }
})
