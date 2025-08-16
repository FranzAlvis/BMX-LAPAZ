<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const eventsStore = useEventsStore()
const authStore = useAuthStore()

const loading = ref(false)
const eventsWithRegistrations = ref([])
const expandedEvents = ref(new Set())
const expandedCategories = ref(new Set())

const toggleEventExpansion = (eventId) => {
  if (expandedEvents.value.has(eventId)) {
    expandedEvents.value.delete(eventId)
  } else {
    expandedEvents.value.add(eventId)
  }
}

const toggleCategoryExpansion = (categoryId) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

const fetchEventsWithRegistrations = async () => {
  try {
    loading.value = true
    const events = await eventsStore.fetchEvents()
    
    const eventsWithData = []
    
    for (const event of eventsStore.events) {
      try {
        const response = await api.get(`/api/events/${event.id}/registrations-summary`)
        eventsWithData.push(response.data)
      } catch (err) {
        console.error(`Error fetching registrations for event ${event.id}:`, err)
      }
    }
    
    eventsWithRegistrations.value = eventsWithData
  } catch (error) {
    console.error('Error fetching events with registrations:', error)
  } finally {
    loading.value = false
  }
}

const deleteRegistration = async (registrationId, eventId) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta inscripción?')) return
  
  try {
    await api.delete(`/api/registrations/${registrationId}`)
    // Refresh the specific event data
    await fetchEventsWithRegistrations()
  } catch (error) {
    console.error('Error deleting registration:', error)
  }
}

const canEdit = computed(() => {
  return authStore.userRole === 'Admin' || authStore.userRole === 'Secretaria'
})

const goToCreate = () => {
  router.push('/registrations/new')
}

const editEventRegistrations = (eventId) => {
  router.push(`/registrations/edit/${eventId}`)
}

const canManageRegistrations = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES')
}

const getStatusColor = (status) => {
  switch (status) {
    case 'REGISTERED': return 'bg-blue-100 text-blue-800'
    case 'CONFIRMED': return 'bg-green-100 text-green-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'REGISTERED': return ClockIcon
    case 'CONFIRMED': return CheckCircleIcon
    case 'CANCELLED': return XCircleIcon
    default: return ClockIcon
  }
}

const handleDeleteRegistration = (registration) => {
  registrationToDelete.value = registration
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!registrationToDelete.value) return
  
  try {
    const result = await registrationsStore.deleteRegistration(registrationToDelete.value.id)
    if (result && result.success) {
      showDeleteModal.value = false
      registrationToDelete.value = null
    }
  } catch (error) {
    console.error('Error in confirmDelete:', error)
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  registrationToDelete.value = null
}

onMounted(async () => {
  await fetchEventsWithRegistrations()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon class="h-8 w-8 mr-3 text-orange-600" />
            Inscripciones por Evento
          </h1>
          <p class="mt-2 text-gray-600">
            Vista jerárquica: Eventos → Categorías → Corredores
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            v-if="canEdit"
            @click="goToCreate"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
            Nueva Inscripción
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span class="ml-3 text-gray-600">Cargando inscripciones...</span>
      </div>

      <!-- Events List -->
      <div v-else-if="eventsWithRegistrations.length > 0" class="space-y-6">
        <div v-for="eventData in eventsWithRegistrations" :key="eventData.event.id" 
             class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          <!-- Event Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <button
                @click="toggleEventExpansion(eventData.event.id)"
                class="flex items-center text-left hover:bg-gray-100 rounded-lg px-2 py-1 -mx-2 -my-1 flex-1"
              >
                <component 
                  :is="expandedEvents.has(eventData.event.id) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5 text-gray-400 mr-2"
                />
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ eventData.event.name }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ formatDate(eventData.event.date) }} • {{ eventData.event.venue }}, {{ eventData.event.city }}
                  </p>
                </div>
              </button>
              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900">
                    {{ eventData.event.totalRegistrations }} inscripciones
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ eventData.categories.length }} categorías
                  </div>
                </div>
                <div class="px-3 py-1 rounded-full text-xs font-medium"
                     :class="{
                       'bg-green-100 text-green-800': eventData.event.status === 'SCHEDULED',
                       'bg-blue-100 text-blue-800': eventData.event.status === 'ACTIVE',
                       'bg-gray-100 text-gray-800': eventData.event.status === 'COMPLETED',
                       'bg-red-100 text-red-800': eventData.event.status === 'CANCELLED'
                     }">
                  {{ eventData.event.status }}
                </div>
                <button
                  v-if="canEdit"
                  @click="editEventRegistrations(eventData.event.id)"
                  class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  title="Editar inscripciones del evento"
                >
                  <PencilIcon class="h-4 w-4 mr-1" />
                  Editar
                </button>
              </div>
            </div>
          </div>

          <!-- Categories (Expandable) -->
          <div v-if="expandedEvents.has(eventData.event.id)" class="divide-y divide-gray-100">
            <div v-for="category in eventData.categories" :key="category.id" class="px-6 py-3">
              
              <!-- Category Header -->
              <button
                @click="toggleCategoryExpansion(category.id)"
                class="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 -my-1"
              >
                <div class="flex items-center">
                  <component 
                    :is="expandedCategories.has(category.id) ? ChevronDownIcon : ChevronRightIcon"
                    class="h-4 w-4 text-gray-400 mr-2 ml-4"
                  />
                  <UserGroupIcon class="h-5 w-5 text-orange-500 mr-2" />
                  <div>
                    <span class="font-medium text-gray-900">{{ category.name }}</span>
                    <span class="ml-2 text-sm text-gray-500">
                      ({{ category.gender }}, {{ category.wheel }}, {{ category.minAge }}-{{ category.maxAge }} años)
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                    {{ category.totalRegistered }} corredores
                  </span>
                </div>
              </button>

              <!-- Riders List (Expandable) -->
              <div v-if="expandedCategories.has(category.id)" class="mt-3 ml-10">
                <div v-if="category.registrations.length === 0" class="text-sm text-gray-500 italic">
                  No hay corredores inscritos en esta categoría
                </div>
                <div v-else class="space-y-2">
                  <div v-for="registration in category.registrations" :key="registration.id"
                       class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium text-gray-700">
                          {{ registration.rider.firstName?.charAt(0) }}{{ registration.rider.lastName?.charAt(0) }}
                        </span>
                      </div>
                      <div class="ml-3">
                        <div class="text-sm font-medium text-gray-900">
                          {{ registration.rider.firstName }} {{ registration.rider.lastName }}
                        </div>
                        <div class="text-xs text-gray-500">
                          Placa: {{ registration.rider.plate }} • {{ registration.rider.club || 'Sin club' }}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="px-2 py-1 text-xs font-medium rounded-full"
                            :class="{
                              'bg-green-100 text-green-800': registration.status === 'CONFIRMED',
                              'bg-yellow-100 text-yellow-800': registration.status === 'REGISTERED',
                              'bg-red-100 text-red-800': registration.status === 'CANCELLED'
                            }">
                        {{ registration.status }}
                      </span>
                      <button
                        v-if="canEdit"
                        @click="editEventRegistrations(eventData.event.id)"
                        class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded mr-1"
                        title="Editar inscripciones del evento"
                      >
                        <PencilIcon class="h-4 w-4" />
                      </button>
                      <button
                        v-if="canEdit"
                        @click="deleteRegistration(registration.id, eventData.event.id)"
                        class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Eliminar inscripción"
                      >
                        <TrashIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <ClipboardDocumentListIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay eventos con inscripciones</h3>
        <p class="mt-1 text-sm text-gray-500">
          Comienza creando una nueva inscripción para un evento.
        </p>
        <div class="mt-6">
          <button
            v-if="canEdit"
            @click="goToCreate"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
            Nueva Inscripción
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bmx-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
