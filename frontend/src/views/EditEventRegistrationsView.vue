<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <PencilIcon class="h-8 w-8 mr-3 text-orange-600" />
              Editar Inscripciones
            </h1>
            <p class="mt-2 text-gray-600" v-if="selectedEvent">
              {{ selectedEvent.name }} - {{ formatDate(selectedEvent.date) }}
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="goBack"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon class="-ml-1 mr-2 h-5 w-5" />
              Volver
            </button>
            <button
              @click="saveChanges"
              :disabled="!hasChanges || saving"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon class="-ml-1 mr-2 h-5 w-5" />
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Event Selection -->
      <div v-if="!selectedEvent" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Seleccionar Evento</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="event in availableEvents"
            :key="event.id"
            @click="selectEvent(event)"
            class="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 text-left transition-colors"
          >
            <h3 class="font-medium text-gray-900">{{ event.name }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ formatDate(event.date) }}</p>
            <p class="text-sm text-gray-500">{{ event.venue }}, {{ event.city }}</p>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span class="ml-3 text-gray-600">Cargando datos del evento...</span>
      </div>

      <!-- Edit Interface -->
      <div v-else-if="selectedEvent && eventData" class="space-y-6">
        <!-- Categories -->
        <div v-for="category in eventData.categories" :key="category.id" 
             class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          <!-- Category Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <UserGroupIcon class="h-6 w-6 text-orange-500 mr-3" />
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ category.name }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ category.gender }}, {{ category.wheel }}, {{ category.minAge }}-{{ category.maxAge }} años
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <span class="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                  {{ getRegisteredCount(category.id) }} / {{ category.maxRiders }} corredores
                </span>
                <button
                  @click="toggleCategoryExpansion(category.id)"
                  class="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <component 
                    :is="expandedCategories.has(category.id) ? ChevronUpIcon : ChevronDownIcon"
                    class="h-5 w-5 text-gray-400"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Category Content -->
          <div v-if="expandedCategories.has(category.id)" class="p-6">
            
            <!-- Currently Registered Riders -->
            <div class="mb-6">
              <h4 class="text-md font-medium text-gray-900 mb-3">Corredores Inscritos</h4>
              <div v-if="getRegisteredRiders(category.id).length === 0" class="text-sm text-gray-500 italic">
                No hay corredores inscritos en esta categoría
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div v-for="registration in getRegisteredRiders(category.id)" :key="registration.id"
                     class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
                      <span class="text-xs font-medium text-green-800">
                        {{ registration.rider.firstName?.charAt(0) }}{{ registration.rider.lastName?.charAt(0) }}
                      </span>
                    </div>
                    <div class="ml-3">
                      <div class="text-sm font-medium text-gray-900">
                        {{ registration.rider.firstName }} {{ registration.rider.lastName }}
                      </div>
                      <div class="text-xs text-gray-500">
                        Placa: {{ registration.rider.plate }}
                      </div>
                    </div>
                  </div>
                  <button
                    @click="removeRiderFromCategory(category.id, registration.id)"
                    class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Quitar de la categoría"
                  >
                    <MinusCircleIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Available Riders to Add -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-3">Agregar Corredores</h4>
              
              <!-- Search -->
              <div class="mb-4">
                <div class="relative">
                  <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    v-model="searchQueries[category.id]"
                    type="text"
                    placeholder="Buscar corredor por nombre o placa..."
                    class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
              </div>

              <!-- Available Riders List -->
              <div class="max-h-64 overflow-y-auto">
                <div v-if="getAvailableRiders(category.id).length === 0" class="text-sm text-gray-500 italic">
                  No hay corredores disponibles para esta categoría
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div v-for="rider in getAvailableRiders(category.id)" :key="rider.id"
                       class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium text-gray-700">
                          {{ rider.firstName?.charAt(0) }}{{ rider.lastName?.charAt(0) }}
                        </span>
                      </div>
                      <div class="ml-3">
                        <div class="text-sm font-medium text-gray-900">
                          {{ rider.firstName }} {{ rider.lastName }}
                        </div>
                        <div class="text-xs text-gray-500">
                          Placa: {{ rider.plate }} • {{ rider.club || 'Sin club' }}
                        </div>
                      </div>
                    </div>
                    <button
                      @click="addRiderToCategory(category.id, rider.id)"
                      :disabled="getRegisteredCount(category.id) >= category.maxRiders"
                      class="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Agregar a la categoría"
                    >
                      <PlusCircleIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import { useRidersStore } from '@/stores/riders'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  PencilIcon,
  ArrowLeftIcon,
  CheckIcon,
  UserGroupIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const eventsStore = useEventsStore()
const ridersStore = useRidersStore()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const selectedEvent = ref(null)
const eventData = ref(null)
const availableEvents = ref([])
const expandedCategories = ref(new Set())
const searchQueries = ref({})

// Track changes for save functionality
const originalRegistrations = ref(new Map())
const currentRegistrations = ref(new Map())

const hasChanges = computed(() => {
  // Compare original vs current registrations
  for (const [categoryId, current] of currentRegistrations.value) {
    const original = originalRegistrations.value.get(categoryId) || []
    if (current.length !== original.length) return true
    
    const currentIds = new Set(current.map(r => r.riderId))
    const originalIds = new Set(original.map(r => r.riderId))
    
    for (const id of currentIds) {
      if (!originalIds.has(id)) return true
    }
    for (const id of originalIds) {
      if (!currentIds.has(id)) return true
    }
  }
  return false
})

const toggleCategoryExpansion = (categoryId) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

const selectEvent = async (event) => {
  selectedEvent.value = event
  await loadEventData(event.id)
}

const loadEventData = async (eventId) => {
  try {
    loading.value = true
    const response = await api.get(`/api/events/${eventId}/registrations-summary`)
    eventData.value = response.data
    
    // Initialize registrations tracking
    originalRegistrations.value.clear()
    currentRegistrations.value.clear()
    
    response.data.categories.forEach(category => {
      const registrations = category.registrations || []
      originalRegistrations.value.set(category.id, [...registrations])
      currentRegistrations.value.set(category.id, [...registrations])
      
      // Initialize search query for this category
      searchQueries.value[category.id] = ''
      
      // Expand all categories by default in edit mode
      expandedCategories.value.add(category.id)
    })
  } catch (error) {
    console.error('Error loading event data:', error)
  } finally {
    loading.value = false
  }
}

const getRegisteredRiders = (categoryId) => {
  return currentRegistrations.value.get(categoryId) || []
}

const getRegisteredCount = (categoryId) => {
  return getRegisteredRiders(categoryId).length
}

const getAvailableRiders = (categoryId) => {
  const registeredRiderIds = new Set(getRegisteredRiders(categoryId).map(r => r.riderId))
  const searchQuery = searchQueries.value[categoryId]?.toLowerCase() || ''
  
  return ridersStore.riders.filter(rider => {
    // Not already registered in this category
    if (registeredRiderIds.has(rider.id)) return false
    
    // Match search query
    if (searchQuery) {
      const fullName = `${rider.firstName} ${rider.lastName}`.toLowerCase()
      const plate = rider.plate?.toLowerCase() || ''
      if (!fullName.includes(searchQuery) && !plate.includes(searchQuery)) {
        return false
      }
    }
    
    // TODO: Add age/gender validation based on category rules
    return true
  })
}

const addRiderToCategory = (categoryId, riderId) => {
  const rider = ridersStore.riders.find(r => r.id === riderId)
  if (!rider) return
  
  const currentRegs = currentRegistrations.value.get(categoryId) || []
  const newRegistration = {
    id: `temp-${Date.now()}-${riderId}`, // Temporary ID
    riderId: rider.id,
    rider: rider,
    status: 'REGISTERED',
    isNew: true
  }
  
  currentRegistrations.value.set(categoryId, [...currentRegs, newRegistration])
}

const removeRiderFromCategory = (categoryId, registrationId) => {
  const currentRegs = currentRegistrations.value.get(categoryId) || []
  const updatedRegs = currentRegs.filter(r => r.id !== registrationId)
  currentRegistrations.value.set(categoryId, updatedRegs)
}

const saveChanges = async () => {
  try {
    saving.value = true
    
    const changes = {
      toAdd: [],
      toRemove: []
    }
    
    // Calculate changes for each category
    for (const [categoryId, current] of currentRegistrations.value) {
      const original = originalRegistrations.value.get(categoryId) || []
      
      const currentRiderIds = new Set(current.map(r => r.riderId))
      const originalRiderIds = new Set(original.map(r => r.riderId))
      
      // Find riders to add
      for (const registration of current) {
        if (registration.isNew || !originalRiderIds.has(registration.riderId)) {
          changes.toAdd.push({
            categoryId,
            riderId: registration.riderId
          })
        }
      }
      
      // Find registrations to remove
      for (const registration of original) {
        if (!currentRiderIds.has(registration.riderId)) {
          changes.toRemove.push(registration.id)
        }
      }
    }
    
    // Apply changes
    if (changes.toAdd.length > 0) {
      await api.post(`/api/events/${selectedEvent.value.id}/bulk-register`, {
        registrations: changes.toAdd
      })
    }
    
    if (changes.toRemove.length > 0) {
      await Promise.all(
        changes.toRemove.map(registrationId => 
          api.delete(`/api/registrations/${registrationId}`)
        )
      )
    }
    
    // Reload data to get fresh state
    await loadEventData(selectedEvent.value.id)
    
    // Show success message or redirect
    router.push('/registrations')
  } catch (error) {
    console.error('Error saving changes:', error)
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push('/registrations')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES')
}

onMounted(async () => {
  // Load events and riders
  await Promise.all([
    eventsStore.fetchEvents(),
    ridersStore.fetchRiders()
  ])
  
  availableEvents.value = eventsStore.events.filter(event => 
    event.status === 'SCHEDULED' || event.status === 'ACTIVE'
  )
  
  // If event ID is provided in route, select it automatically
  const eventId = route.params.eventId
  if (eventId) {
    const event = availableEvents.value.find(e => e.id === eventId)
    if (event) {
      await selectEvent(event)
    }
  }
})
</script>
