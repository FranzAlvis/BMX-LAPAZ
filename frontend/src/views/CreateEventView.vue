<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import {
  ArrowLeftIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const eventsStore = useEventsStore()

const loading = ref(false)
const error = ref(null)

const newEvent = ref({
  name: '',
  description: '',
  date: '',
  venue: '',
  city: ''
})

const goBack = () => {
  router.push('/events')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    
    await eventsStore.createEvent(newEvent.value)
    router.push('/events')
  } catch (err) {
    error.value = 'Error al crear el evento'
    console.error('Error creating event:', err)
  } finally {
    loading.value = false
  }
}
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
        Volver a Eventos
      </button>
      
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Nuevo Evento</h1>
          <p class="mt-2 text-sm text-gray-700">
            Completa la información para crear un nuevo evento BMX
          </p>
        </div>
        
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <CalendarDaysIcon class="h-8 w-8 text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <form @submit.prevent="handleSubmit">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nombre del Evento *
              </label>
              <input
                id="name"
                v-model="newEvent.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: Campeonato Nacional BMX 2024"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                v-model="newEvent.description"
                rows="3"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Descripción del evento..."
              />
            </div>

            <div>
              <label for="date" class="block text-sm font-medium text-gray-700">
                Fecha del Evento *
              </label>
              <input
                id="date"
                v-model="newEvent.date"
                type="date"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>


            <div>
              <label for="venue" class="block text-sm font-medium text-gray-700">
                Sede *
              </label>
              <input
                id="venue"
                v-model="newEvent.venue"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: Pista BMX La Paz"
              />
            </div>

            <div>
              <label for="city" class="block text-sm font-medium text-gray-700">
                Ciudad *
              </label>
              <input
                id="city"
                v-model="newEvent.city"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: La Paz"
              />
            </div>


          </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            :disabled="loading"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bmx-gradient text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <span v-if="loading">Creando...</span>
            <span v-else>Crear Evento</span>
          </button>
          
          <button
            type="button"
            @click="goBack"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.bmx-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
