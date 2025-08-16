<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRacesStore } from '../stores/races'
import { useCategoriesStore } from '../stores/categories'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const racesStore = useRacesStore()
const categoriesStore = useCategoriesStore()

const loading = ref(false)
const error = ref(null)
const raceId = route.params.id

const race = ref({
  name: '',
  categoryId: '',
  eventId: '',
  round: 'QUALIFYING',
  status: 'SCHEDULED',
  scheduledTime: ''
})

const goBack = () => {
  router.push('/races')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    await racesStore.updateRace(raceId, race.value)
    router.push('/races')
  } catch (err) {
    error.value = 'Error al actualizar la carrera'
    console.error('Error updating race:', err)
  } finally {
    loading.value = false
  }
}

const fetchRace = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/races/${raceId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    race.value = response.data.race
  } catch (err) {
    error.value = 'Error al cargar la carrera'
    console.error('Error fetching race:', err)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchRace(),
    categoriesStore.fetchCategories()
  ])
})
</script>

<template>
  <div>
    <!-- Header with back button -->
    <div class="mb-6">
      <button
        @click="goBack"
        class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Volver a Carreras
      </button>
      
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Editar Carrera
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Modifica la información de la carrera
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{{ error }}</div>
    </div>

    <!-- Form -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div class="px-4 py-6 sm:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            
            <div class="sm:col-span-4">
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nombre de la Carrera *
              </label>
              <input
                id="name"
                v-model="race.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: Final STRIDERS"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="round" class="block text-sm font-medium text-gray-700">
                Ronda *
              </label>
              <select
                id="round"
                v-model="race.round"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="QUALIFYING">Clasificatoria</option>
                <option value="QUARTER_FINAL">Cuartos de Final</option>
                <option value="SEMI_FINAL">Semifinal</option>
                <option value="FINAL">Final</option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label for="categoryId" class="block text-sm font-medium text-gray-700">
                Categoría *
              </label>
              <select
                id="categoryId"
                v-model="race.categoryId"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar categoría</option>
                <option 
                  v-for="category in categoriesStore.categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label for="eventId" class="block text-sm font-medium text-gray-700">
                ID del Evento *
              </label>
              <input
                id="eventId"
                v-model="race.eventId"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ID del evento"
              />
            </div>

            <div class="sm:col-span-3">
              <label for="scheduledTime" class="block text-sm font-medium text-gray-700">
                Hora Programada
              </label>
              <input
                id="scheduledTime"
                v-model="race.scheduledTime"
                type="datetime-local"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div class="sm:col-span-3">
              <label for="status" class="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status"
                v-model="race.status"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="SCHEDULED">Programada</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              type="button"
              @click="goBack"
              class="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
