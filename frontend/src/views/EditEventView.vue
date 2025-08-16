<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import {
  ArrowLeftIcon,
  PencilIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const eventsStore = useEventsStore()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const event = ref(null)

const editEvent = ref({
  name: '',
  description: '',
  date: '',
  venue: '',
  city: '',
  status: 'PLANNED'
})

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().slice(0, 10) // Format for date input (YYYY-MM-DD)
}

const goBack = () => {
  router.push('/events')
}

const handleSubmit = async () => {
  try {
    saving.value = true
    error.value = null
    
    await eventsStore.updateEvent(event.value.id, editEvent.value)
    router.push('/events')
  } catch (err) {
    error.value = 'Error al actualizar el evento'
    console.error('Error updating event:', err)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const eventId = parseInt(route.params.id)
    
    // Always fetch events first to ensure we have the latest data
    await eventsStore.fetchEvents()
    
    // Find event by ID
    const foundEvent = eventsStore.events.find(e => e.id === eventId || e.id === route.params.id)
    
    if (!foundEvent) {
      error.value = 'Evento no encontrado'
    } else {
      event.value = foundEvent
      // Populate form with event data
      editEvent.value = {
        name: foundEvent.name,
        description: foundEvent.description || '',
        date: formatDateForInput(foundEvent.date),
        venue: foundEvent.venue || foundEvent.location || '',
        city: foundEvent.city || '',
        status: foundEvent.status || 'PLANNED'
      }
    }
  } catch (err) {
    error.value = 'Error al cargar el evento'
    console.error('Error fetching event:', err)
  } finally {
    loading.value = false
  }
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
        Volver a Eventos
      </button>
      
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ loading ? 'Cargando...' : error ? 'Error' : `Editar: ${event?.name}` }}
          </h1>
          <p class="mt-2 text-sm text-gray-700">
            Modifica la información del evento
          </p>
        </div>
        
        <div v-if="event" class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center">
          <div class="flex-shrink-0 h-10 w-10 mr-3">
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarDaysIcon class="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              ID: {{ event.id }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-sm text-gray-500">Cargando información del evento...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !event" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-red-400">
        <CalendarDaysIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ error }}</h3>
      <p class="mt-1 text-sm text-gray-500">
        No se pudo cargar la información del evento.
      </p>
    </div>

    <!-- Form -->
    <div v-else-if="event" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nombre del Evento *
              </label>
              <input
                id="name"
                v-model="editEvent.name"
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
                v-model="editEvent.description"
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
                v-model="editEvent.date"
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
                v-model="editEvent.venue"
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
                v-model="editEvent.city"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: La Paz"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="status" class="block text-sm font-medium text-gray-700">
                Estado del Evento
              </label>
              <select
                id="status"
                v-model="editEvent.status"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="PLANNED">Planificado</option>
                <option value="ACTIVE">Activo</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            :disabled="saving"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bmx-gradient text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <span v-if="saving">Guardando...</span>
            <span v-else>Guardar Cambios</span>
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
