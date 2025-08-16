<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResultsStore } from '../stores/results'
import { useRacesStore } from '../stores/races'
import { useRegistrationsStore } from '../stores/registrations'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const resultsStore = useResultsStore()
const racesStore = useRacesStore()
const registrationsStore = useRegistrationsStore()

const loading = ref(false)
const error = ref(null)
const resultId = route.params.id

const result = ref({
  raceId: '',
  registrationId: '',
  position: 1,
  time: '',
  points: 0,
  status: 'FINISHED'
})

const goBack = () => {
  router.push('/results')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    await resultsStore.updateResult(resultId, result.value)
    router.push('/results')
  } catch (err) {
    error.value = 'Error al actualizar el resultado'
    console.error('Error updating result:', err)
  } finally {
    loading.value = false
  }
}

const fetchResult = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/results/${resultId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    result.value = response.data.result
  } catch (err) {
    error.value = 'Error al cargar el resultado'
    console.error('Error fetching result:', err)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchResult(),
    racesStore.fetchRaces(),
    registrationsStore.fetchRegistrations()
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
        Volver a Resultados
      </button>
      
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Editar Resultado
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Modifica la información del resultado
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
            
            <div class="sm:col-span-3">
              <label for="raceId" class="block text-sm font-medium text-gray-700">
                Carrera *
              </label>
              <select
                id="raceId"
                v-model="result.raceId"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar carrera</option>
                <option 
                  v-for="race in racesStore.races" 
                  :key="race.id" 
                  :value="race.id"
                >
                  {{ race.name }} - {{ race.round }}
                </option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label for="registrationId" class="block text-sm font-medium text-gray-700">
                Inscripción *
              </label>
              <select
                id="registrationId"
                v-model="result.registrationId"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar inscripción</option>
                <option 
                  v-for="registration in registrationsStore.registrations" 
                  :key="registration.id" 
                  :value="registration.id"
                >
                  {{ registration.rider?.firstName }} {{ registration.rider?.lastName }} - {{ registration.category?.name }}
                </option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label for="position" class="block text-sm font-medium text-gray-700">
                Posición *
              </label>
              <input
                id="position"
                v-model="result.position"
                type="number"
                min="1"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="1"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="time" class="block text-sm font-medium text-gray-700">
                Tiempo
              </label>
              <input
                id="time"
                v-model="result.time"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="00:30.45"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="points" class="block text-sm font-medium text-gray-700">
                Puntos
              </label>
              <input
                id="points"
                v-model="result.points"
                type="number"
                min="0"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0"
              />
            </div>

            <div class="sm:col-span-3">
              <label for="status" class="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status"
                v-model="result.status"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="FINISHED">Terminó</option>
                <option value="DNF">No Terminó (DNF)</option>
                <option value="DNS">No Salió (DNS)</option>
                <option value="DSQ">Descalificado (DSQ)</option>
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
