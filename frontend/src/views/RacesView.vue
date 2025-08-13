<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  TrophyIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const races = ref([])
const events = ref([])
const categories = ref([])
const searchQuery = ref('')
const selectedEvent = ref('')
const selectedCategory = ref('')
const statusFilter = ref('all')
const loading = ref(false)
const showFilters = ref(false)
const showDeleteModal = ref(false)
const raceToDelete = ref(null)

const filteredRaces = computed(() => {
  let filtered = races.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(race => 
      race.name.toLowerCase().includes(query) ||
      race.event?.name.toLowerCase().includes(query) ||
      race.category?.name.toLowerCase().includes(query)
    )
  }

  if (selectedEvent.value) {
    filtered = filtered.filter(race => race.eventId === selectedEvent.value)
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(race => race.categoryId === selectedCategory.value)
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(race => race.status === statusFilter.value)
  }

  return filtered
})

const canManageRaces = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const canControlRaces = computed(() => 
  authStore.canAccess(['Admin', 'Cronometraje'])
)

const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'SCHEDULED':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'Completada'
    case 'IN_PROGRESS':
      return 'En Progreso'
    case 'SCHEDULED':
      return 'Programada'
    case 'CANCELLED':
      return 'Cancelada'
    default:
      return status
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'COMPLETED':
      return CheckCircleIcon
    case 'IN_PROGRESS':
      return PlayIcon
    case 'SCHEDULED':
      return ClockIcon
    case 'CANCELLED':
      return PauseIcon
    default:
      return ClockIcon
  }
}

const fetchRaces = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/races', {
      params: {
        include: 'event,category,motos,heats'
      }
    })
    races.value = response.data.races
  } catch (error) {
    toast.error('Error al cargar carreras')
  } finally {
    loading.value = false
  }
}

const fetchEvents = async () => {
  try {
    const response = await api.get('/api/events', {
      params: { limit: 100 }
    })
    events.value = response.data.events
  } catch (error) {
    console.error('Error loading events:', error)
  }
}

const fetchCategories = async () => {
  try {
    const response = await api.get('/api/categories')
    categories.value = response.data.categories
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const handleDeleteRace = (race) => {
  raceToDelete.value = race
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (raceToDelete.value) {
    try {
      await api.delete(`/api/races/${raceToDelete.value.id}`)
      races.value = races.value.filter(race => race.id !== raceToDelete.value.id)
      toast.success('Carrera eliminada correctamente')
      showDeleteModal.value = false
      raceToDelete.value = null
    } catch (error) {
      toast.error('Error al eliminar carrera')
    }
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  raceToDelete.value = null
}

const updateRaceStatus = async (raceId, newStatus) => {
  try {
    const response = await api.put(`/api/races/${raceId}`, {
      status: newStatus
    })
    
    const index = races.value.findIndex(race => race.id === raceId)
    if (index !== -1) {
      races.value[index] = response.data.race
    }
    
    toast.success(`Carrera ${getStatusText(newStatus).toLowerCase()}`)
  } catch (error) {
    toast.error('Error al actualizar estado de carrera')
  }
}

const buildMotos = async (raceId) => {
  try {
    await api.post(`/api/races/${raceId}/build-motos`)
    toast.success('Motos generados correctamente')
    // Refresh races to get updated data
    await fetchRaces()
  } catch (error) {
    toast.error('Error al generar motos')
  }
}

onMounted(() => {
  fetchRaces()
  fetchEvents()
  fetchCategories()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Carreras</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gestiona las carreras y competencias del sistema BMX
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <router-link
          v-if="canManageRaces"
          to="/races/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nueva Carrera
        </router-link>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1 max-w-lg">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar carreras..."
              />
            </div>
          </div>
          
          <button
            @click="showFilters = !showFilters"
            class="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon class="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>

        <!-- Advanced filters -->
        <div v-if="showFilters" class="grid grid-cols-1 gap-4 sm:grid-cols-4 pt-4 border-t border-gray-200">
          <!-- Event filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Evento</label>
            <select
              v-model="selectedEvent"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="">Todos los eventos</option>
              <option v-for="event in events" :key="event.id" :value="event.id">
                {{ event.name }}
              </option>
            </select>
          </div>

          <!-- Category filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              v-model="selectedCategory"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Status filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              v-model="statusFilter"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <!-- Results count -->
          <div class="flex items-end">
            <div class="text-sm text-gray-500">
              {{ filteredRaces.length }} carrera{{ filteredRaces.length !== 1 ? 's' : '' }} encontrada{{ filteredRaces.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Races grid -->
    <div v-else-if="filteredRaces.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="race in filteredRaces"
        :key="race.id"
        class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <TrophyIcon class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ race.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ race.category?.name }}
                </p>
              </div>
            </div>
            
            <!-- Status -->
            <div class="flex items-center">
              <component
                :is="getStatusIcon(race.status)"
                class="h-4 w-4 mr-2"
                :class="race.status === 'COMPLETED' ? 'text-green-500' : 
                        race.status === 'IN_PROGRESS' ? 'text-blue-500' : 
                        race.status === 'SCHEDULED' ? 'text-yellow-500' : 'text-red-500'"
              />
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(race.status)
                ]"
              >
                {{ getStatusText(race.status) }}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-sm text-gray-600">
              {{ race.event?.name }}
            </p>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-500">Tipo:</span>
                <span class="ml-1 text-gray-900">{{ race.type }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Motos:</span>
                <span class="ml-1 text-gray-900">{{ race._count?.motos || 0 }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Heats:</span>
                <span class="ml-1 text-gray-900">{{ race._count?.heats || 0 }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Participantes:</span>
                <span class="ml-1 text-gray-900">{{ race._count?.registrations || 0 }}</span>
              </div>
            </div>

            <!-- Quick actions -->
            <div class="pt-3 border-t border-gray-200">
              <div class="flex flex-wrap gap-2">
                <!-- Status control buttons -->
                <div v-if="canControlRaces" class="flex space-x-1">
                  <button
                    v-if="race.status === 'SCHEDULED'"
                    @click="updateRaceStatus(race.id, 'IN_PROGRESS')"
                    class="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-white hover:bg-green-50"
                    title="Iniciar carrera"
                  >
                    <PlayIcon class="h-3 w-3 mr-1" />
                    Iniciar
                  </button>
                  
                  <button
                    v-if="race.status === 'IN_PROGRESS'"
                    @click="updateRaceStatus(race.id, 'COMPLETED')"
                    class="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-white hover:bg-blue-50"
                    title="Completar carrera"
                  >
                    <CheckCircleIcon class="h-3 w-3 mr-1" />
                    Completar
                  </button>
                </div>

                <!-- Build motos button -->
                <button
                  v-if="canManageRaces && race.status === 'SCHEDULED' && (!race._count?.motos || race._count.motos === 0)"
                  @click="buildMotos(race.id)"
                  class="inline-flex items-center px-2 py-1 border border-purple-300 rounded text-xs font-medium text-purple-700 bg-white hover:bg-purple-50"
                  title="Generar motos"
                >
                  <UserGroupIcon class="h-3 w-3 mr-1" />
                  Generar Motos
                </button>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="pt-3 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <router-link
                  :to="`/races/${race.id}`"
                  class="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Ver detalles →
                </router-link>
                
                <div class="flex items-center space-x-2">
                  <router-link
                    :to="`/races/${race.id}`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Ver detalles"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </router-link>

                  <router-link
                    v-if="canManageRaces"
                    :to="`/races/${race.id}/edit`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Editar"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </router-link>

                  <button
                    v-if="canManageRaces"
                    @click="handleDeleteRace(race)"
                    class="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    title="Eliminar"
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

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <TrophyIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay carreras</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || selectedEvent || selectedCategory || statusFilter !== 'all' 
           ? 'No se encontraron carreras con los filtros aplicados.' 
           : 'Comienza creando una nueva carrera.' }}
      </p>
      <div v-if="canManageRaces && !searchQuery && !selectedEvent && !selectedCategory && statusFilter === 'all'" class="mt-6">
        <router-link
          to="/races/new"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nueva Carrera
        </router-link>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="cancelDelete"></div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon class="h-6 w-6 text-red-600" />
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Eliminar carrera
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que quieres eliminar la carrera "{{ raceToDelete?.name }}"? 
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="confirmDelete"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Eliminar
            </button>
            <button
              @click="cancelDelete"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
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
