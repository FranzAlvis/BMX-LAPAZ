<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  TrophyIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const results = ref([])
const events = ref([])
const searchQuery = ref('')
const selectedEvent = ref('')
const selectedRace = ref('')
const statusFilter = ref('all')
const loading = ref(false)
const showFilters = ref(false)

const filteredResults = computed(() => {
  let filtered = results.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(result => 
      result.rider?.firstName.toLowerCase().includes(query) ||
      result.rider?.lastName.toLowerCase().includes(query) ||
      result.heat?.race?.name.toLowerCase().includes(query)
    )
  }

  if (selectedEvent.value) {
    filtered = filtered.filter(result => 
      result.heat?.race?.eventId === selectedEvent.value
    )
  }

  if (selectedRace.value) {
    filtered = filtered.filter(result => 
      result.heat?.raceId === selectedRace.value
    )
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(result => result.status === statusFilter.value)
  }

  return filtered
})

const canManageResults = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria', 'Cronometraje'])
)

const canEnterResults = computed(() => 
  authStore.canAccess(['Admin', 'Cronometraje'])
)

const getPositionColor = (position) => {
  switch (position) {
    case 1:
      return 'bg-yellow-100 text-yellow-800'
    case 2:
      return 'bg-gray-100 text-gray-800'
    case 3:
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'FINISHED':
      return 'bg-green-100 text-green-800'
    case 'DQ':
      return 'bg-red-100 text-red-800'
    case 'DNS':
      return 'bg-yellow-100 text-yellow-800'
    case 'DNF':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'FINISHED':
      return 'Terminó'
    case 'DQ':
      return 'Descalificado'
    case 'DNS':
      return 'No Salió'
    case 'DNF':
      return 'No Terminó'
    default:
      return status
  }
}

const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${time.toFixed(3)}s`
}

const fetchResults = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/results', {
      params: {
        include: 'rider,heat,race,event'
      }
    })
    results.value = response.data.results
  } catch (error) {
    toast.error('Error al cargar resultados')
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

onMounted(() => {
  fetchResults()
  fetchEvents()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Resultados</h1>
        <p class="mt-1 text-sm text-gray-600">
          Visualiza y gestiona los resultados de las carreras
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <router-link
          v-if="canEnterResults"
          to="/results/entry"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Ingresar Resultados
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
                placeholder="Buscar por corredor o carrera..."
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

          <!-- Status filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              v-model="statusFilter"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="FINISHED">Terminó</option>
              <option value="DQ">Descalificado</option>
              <option value="DNS">No Salió</option>
              <option value="DNF">No Terminó</option>
            </select>
          </div>

          <!-- Results count -->
          <div class="flex items-end col-span-2">
            <div class="text-sm text-gray-500">
              {{ filteredResults.length }} resultado{{ filteredResults.length !== 1 ? 's' : '' }} encontrado{{ filteredResults.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Results table -->
    <div v-else-if="filteredResults.length > 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posición
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Corredor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrera/Heat
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntos
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="result in filteredResults" :key="result.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="result.position"
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium',
                    getPositionColor(result.position)
                  ]"
                >
                  {{ result.position }}°
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-800">
                        {{ result.rider?.firstName?.charAt(0) }}{{ result.rider?.lastName?.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ result.rider?.firstName }} {{ result.rider?.lastName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      Carril {{ result.lane }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ result.heat?.race?.name }}</div>
                <div class="text-gray-500">Heat {{ result.heat?.heatNumber }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex items-center">
                  <ClockIcon class="h-4 w-4 text-gray-400 mr-1" />
                  {{ formatTime(result.time) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(result.status)
                  ]"
                >
                  {{ getStatusText(result.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ result.points || 0 }} pts
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <router-link
                    :to="`/results/${result.id}`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Ver detalles"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </router-link>

                  <router-link
                    v-if="canManageResults"
                    :to="`/results/${result.id}/edit`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Editar"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <TrophyIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay resultados</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || selectedEvent || statusFilter !== 'all' 
           ? 'No se encontraron resultados con los filtros aplicados.' 
           : 'Los resultados aparecerán aquí una vez que se ingresen.' }}
      </p>
      <div v-if="canEnterResults && !searchQuery && !selectedEvent && statusFilter === 'all'" class="mt-6">
        <router-link
          to="/results/entry"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Ingresar Resultados
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bmx-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
