<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  TrophyIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const eventsStore = useEventsStore()
const authStore = useAuthStore()

const event = ref(null)
const loading = ref(true)
const error = ref(null)

const canManageEvents = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const getStatusColor = (status) => {
  switch (status) {
    case 'upcoming': return 'bg-blue-100 text-blue-800'
    case 'active': return 'bg-green-100 text-green-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'upcoming': return 'Próximo'
    case 'active': return 'Activo'
    case 'completed': return 'Completado'
    case 'cancelled': return 'Cancelado'
    default: return 'Desconocido'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'No registrado'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.push('/events')
}

const editEvent = () => {
  router.push(`/events/${event.value.id}/edit`)
}

const deleteEvent = async () => {
  if (confirm(`¿Estás seguro de que quieres eliminar el evento "${event.value.name}"?`)) {
    try {
      await eventsStore.deleteEvent(event.value.id)
      router.push('/events')
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }
}

onMounted(async () => {
  try {
    const eventId = parseInt(route.params.id)
    console.log('Looking for event with ID:', eventId)
    
    // Always fetch events first to ensure we have the latest data
    await eventsStore.fetchEvents()
    console.log('Available events:', eventsStore.events)
    
    // Find event by ID
    let foundEvent = eventsStore.events.find(e => e.id === eventId || e.id === route.params.id)
    console.log('Found event:', foundEvent)
    
    if (!foundEvent) {
      error.value = 'Evento no encontrado'
      console.error('Event not found. Available IDs:', eventsStore.events.map(e => e.id))
    } else {
      event.value = foundEvent
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
            {{ loading ? 'Cargando...' : error ? 'Error' : event?.name }}
          </h1>
          <p class="mt-2 text-sm text-gray-700">
            Información detallada del evento
          </p>
        </div>
        
        <div v-if="event && canManageEvents" class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
          <button
            @click="editEvent"
            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon class="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Editar
          </button>
          
          <button
            @click="deleteEvent"
            class="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <TrashIcon class="-ml-1 mr-2 h-5 w-5 text-red-400" />
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-sm text-gray-500">Cargando información del evento...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-red-400">
        <CalendarDaysIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ error }}</h3>
      <p class="mt-1 text-sm text-gray-500">
        No se pudo cargar la información del evento.
      </p>
    </div>

    <!-- Event Details -->
    <div v-else-if="event" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-20 w-20">
            <div class="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarDaysIcon class="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div class="ml-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {{ event.name }}
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              ID: {{ event.id }} • {{ formatDate(event.date) }}
            </p>
            <div class="mt-2">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(event.status)
                ]"
              >
                {{ getStatusText(event.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="border-t border-gray-200">
        <dl>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <CalendarDaysIcon class="mr-2 h-4 w-4" />
              Nombre del evento
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ event.name }}
            </dd>
          </div>
          
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Descripción
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ event.description || 'Sin descripción' }}
            </dd>
          </div>
          
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <CalendarDaysIcon class="mr-2 h-4 w-4" />
              Fecha del evento
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ formatDate(event.date) }}
            </dd>
          </div>
          
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <ClockIcon class="mr-2 h-4 w-4" />
              Fecha límite de inscripción
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ formatDate(event.registrationDeadline) }}
            </dd>
          </div>
          
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <MapPinIcon class="mr-2 h-4 w-4" />
              Ubicación
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ event.location || 'Sin ubicación especificada' }}
            </dd>
          </div>
          
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <UserGroupIcon class="mr-2 h-4 w-4" />
              Máximo de participantes
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ event.maxParticipants ? `${event.maxParticipants} participantes` : 'Sin límite' }}
            </dd>
          </div>
          
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Estado
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(event.status)
                ]"
              >
                {{ getStatusText(event.status) }}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
