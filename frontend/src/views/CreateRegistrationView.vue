<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '../stores/events'
import { ArrowLeftIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import api from '@/services/api'

const router = useRouter()
const eventsStore = useEventsStore()

const loading = ref(false)
const error = ref(null)
const step = ref(1) // 1: Select Event, 2: Select Riders by Category

const selectedEvent = ref(null)
const categoriesWithRiders = ref([])
const selectedRegistrations = ref([])

const availableEvents = computed(() => 
  eventsStore.events.filter(event => event.status === 'PLANNED' || event.status === 'ACTIVE')
)

const goBack = () => {
  if (step.value === 2) {
    step.value = 1
    selectedEvent.value = null
    categoriesWithRiders.value = []
  } else {
    router.push('/registrations')
  }
}

const selectEvent = async (event) => {
  try {
    loading.value = true
    error.value = null
    selectedEvent.value = event
    
    // Fetch categories with riders for this event
    const response = await api.get(`/api/events/${event.id}/categories-with-riders`)
    categoriesWithRiders.value = response.data.categories
    
    step.value = 2
  } catch (err) {
    error.value = 'Error al cargar categorías y corredores'
    console.error('Error fetching categories with riders:', err)
  } finally {
    loading.value = false
  }
}

const toggleRiderRegistration = (categoryId, rider) => {
  const registrationKey = `${categoryId}-${rider.id}`
  const existingIndex = selectedRegistrations.value.findIndex(
    reg => reg.categoryId === categoryId && reg.riderId === rider.id
  )
  
  if (existingIndex >= 0) {
    // Remove registration
    selectedRegistrations.value.splice(existingIndex, 1)
  } else {
    // Add registration
    selectedRegistrations.value.push({
      categoryId,
      riderId: rider.id,
      seed: null
    })
  }
}

const isRiderSelected = (categoryId, riderId) => {
  return selectedRegistrations.value.some(
    reg => reg.categoryId === categoryId && reg.riderId === riderId
  )
}

const handleBulkRegister = async () => {
  if (selectedRegistrations.value.length === 0) {
    error.value = 'Selecciona al menos un corredor para inscribir'
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    console.log('Sending bulk registration:', {
      eventId: selectedEvent.value.id,
      registrations: selectedRegistrations.value
    })
    
    const response = await api.post(`/api/events/${selectedEvent.value.id}/bulk-register`, {
      registrations: selectedRegistrations.value
    })
    
    // Show success message and redirect
    console.log('Bulk registration successful:', response.data)
    router.push('/registrations')
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al crear las inscripciones'
    console.error('Error creating bulk registrations:', err)
    console.error('Error response data:', err.response?.data)
    console.error('Error status:', err.response?.status)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await eventsStore.fetchEvents({ status: 'PLANNED,ACTIVE' })
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <button
          @click="goBack"
          class="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-2" />
          {{ step === 2 ? 'Cambiar Evento' : 'Volver' }}
        </button>
        <h1 class="text-3xl font-bold text-gray-900">
          {{ step === 1 ? 'Seleccionar Evento' : 'Inscribir Corredores' }}
        </h1>
        <p class="mt-2 text-gray-600">
          {{ step === 1 ? 'Elige el evento para realizar inscripciones' : `Inscribiendo corredores para: ${selectedEvent?.name}` }}
        </p>
      </div>

      <!-- Step 1: Event Selection -->
      <div v-if="step === 1" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Eventos Disponibles</h2>
        
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p class="mt-2 text-gray-600">Cargando eventos...</p>
        </div>
        
        <div v-else-if="availableEvents.length === 0" class="text-center py-8">
          <p class="text-gray-600">No hay eventos disponibles para inscripciones</p>
        </div>
        
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="event in availableEvents"
            :key="event.id"
            @click="selectEvent(event)"
            class="cursor-pointer border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all duration-200"
          >
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-gray-900">{{ event.name }}</h3>
              <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': event.status === 'PLANNED',
                      'bg-green-100 text-green-800': event.status === 'ACTIVE'
                    }">
                {{ event.status === 'PLANNED' ? 'Planificado' : 'Activo' }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ new Date(event.date).toLocaleDateString() }}</p>
            <p class="text-sm text-gray-600">{{ event.venue }}, {{ event.city }}</p>
            <div class="mt-3 text-sm text-gray-500">
              {{ event._count?.registrations || 0 }} inscripciones
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Categories and Riders Selection -->
      <div v-if="step === 2" class="space-y-6">
        <!-- Selected Registrations Summary -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900">
              Corredores Seleccionados: {{ selectedRegistrations.length }}
            </h2>
            <button
              @click="handleBulkRegister"
              :disabled="loading || selectedRegistrations.length === 0"
              class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Inscribiendo...</span>
              <span v-else>Inscribir Seleccionados</span>
            </button>
          </div>
        </div>

        <!-- Categories with Riders -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p class="mt-2 text-gray-600">Cargando categorías y corredores...</p>
        </div>
        
        <div v-else class="space-y-6">
          <div
            v-for="category in categoriesWithRiders"
            :key="category.id"
            class="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">{{ category.name }}</h3>
              <p class="text-sm text-gray-600">
                {{ category.minAge }}-{{ category.maxAge }} años, {{ category.gender === 'M' ? 'Masculino' : category.gender === 'F' ? 'Femenino' : 'Mixto' }}
              </p>
              <p class="text-sm text-gray-500 mt-1">
                {{ category.registeredCount }} ya inscritos • {{ category.riders.length }} corredores disponibles
              </p>
            </div>
            
            <div class="p-4">
              <div v-if="category.riders.length === 0" class="text-center py-4 text-gray-500">
                No hay corredores en esta categoría
              </div>
              
              <div v-else class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="rider in category.riders"
                  :key="rider.id"
                  class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  :class="{
                    'bg-green-50 border-green-300': isRiderSelected(category.id, rider.id),
                    'bg-gray-50': rider.isRegisteredForEvent,
                    'hover:border-orange-300': !rider.isRegisteredForEvent
                  }"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900">#{{ rider.plate }}</span>
                      <span class="text-sm text-gray-600">{{ rider.firstName }} {{ rider.lastName }}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ rider.club || 'Sin club' }}
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    <span v-if="rider.isRegisteredForEvent" class="text-xs text-green-600 font-medium">
                      Ya inscrito
                    </span>
                    <button
                      v-else
                      @click="toggleRiderRegistration(category.id, rider)"
                      class="p-1 rounded-full"
                      :class="{
                        'bg-green-600 text-white': isRiderSelected(category.id, rider.id),
                        'bg-gray-200 text-gray-600 hover:bg-orange-200': !isRiderSelected(category.id, rider.id)
                      }"
                    >
                      <CheckIcon v-if="isRiderSelected(category.id, rider.id)" class="h-4 w-4" />
                      <XMarkIcon v-else class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <div class="mt-2 text-sm text-red-700">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
