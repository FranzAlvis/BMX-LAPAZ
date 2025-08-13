<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events'
import { useAuthStore } from '@/stores/auth'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  TrophyIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const eventsStore = useEventsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const statusFilter = ref('all')
const showDeleteModal = ref(false)
const eventToDelete = ref(null)

const filteredEvents = computed(() => {
  let filtered = eventsStore.events

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(event => 
      event.name.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(event => event.status === statusFilter.value)
  }

  return filtered
})

const canManageEvents = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const getStatusColor = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'PLANNED':
      return 'bg-blue-100 text-blue-800'
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'Activo'
    case 'PLANNED':
      return 'Planificado'
    case 'COMPLETED':
      return 'Completado'
    case 'CANCELLED':
      return 'Cancelado'
    default:
      return status
  }
}

const handleDeleteEvent = (event) => {
  eventToDelete.value = event
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (eventToDelete.value) {
    const result = await eventsStore.deleteEvent(eventToDelete.value.id)
    if (result.success) {
      showDeleteModal.value = false
      eventToDelete.value = null
    }
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  eventToDelete.value = null
}

onMounted(() => {
  eventsStore.fetchEvents()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Eventos</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gestiona los eventos de carreras BMX
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <router-link
          v-if="canManageEvents"
          to="/events/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nuevo Evento
        </router-link>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Search -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar eventos..."
            />
          </div>

          <!-- Status filter -->
          <div>
            <select
              v-model="statusFilter"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">Todos los estados</option>
              <option value="PLANNED">Planificados</option>
              <option value="ACTIVE">Activos</option>
              <option value="COMPLETED">Completados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>

          <!-- Results count -->
          <div class="flex items-center text-sm text-gray-500">
            {{ filteredEvents.length }} evento{{ filteredEvents.length !== 1 ? 's' : '' }} encontrado{{ filteredEvents.length !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="eventsStore.loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Events list -->
    <div v-else-if="filteredEvents.length > 0" class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="event in filteredEvents" :key="event.id">
          <div class="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center">
                  <h3 class="text-lg font-medium text-gray-900 truncate">
                    {{ event.name }}
                  </h3>
                  <span
                    :class="[
                      'ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(event.status)
                    ]"
                  >
                    {{ getStatusText(event.status) }}
                  </span>
                </div>
                
                <div class="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                  <div class="flex items-center">
                    <CalendarDaysIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {{ new Date(event.date).toLocaleDateString() }}
                  </div>
                  <div class="flex items-center">
                    <MapPinIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {{ event.location }}
                  </div>
                  <div v-if="event._count" class="flex items-center">
                    <UserGroupIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {{ event._count.registrations || 0 }} inscritos
                  </div>
                  <div v-if="event._count" class="flex items-center">
                    <TrophyIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {{ event._count.races || 0 }} carreras
                  </div>
                </div>

                <p v-if="event.description" class="mt-2 text-sm text-gray-600 line-clamp-2">
                  {{ event.description }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2 ml-4">
                <router-link
                  :to="`/events/${event.id}`"
                  class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  title="Ver detalles"
                >
                  <EyeIcon class="h-4 w-4" />
                </router-link>

                <router-link
                  v-if="canManageEvents"
                  :to="`/events/${event.id}/edit`"
                  class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  title="Editar"
                >
                  <PencilIcon class="h-4 w-4" />
                </router-link>

                <button
                  v-if="canManageEvents"
                  @click="handleDeleteEvent(event)"
                  class="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  title="Eliminar"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <CalendarDaysIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || statusFilter !== 'all' ? 'No se encontraron eventos con los filtros aplicados.' : 'Comienza creando un nuevo evento.' }}
      </p>
      <div v-if="canManageEvents && !searchQuery && statusFilter === 'all'" class="mt-6">
        <router-link
          to="/events/new"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Crear Evento
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
                  Eliminar evento
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que quieres eliminar el evento "{{ eventToDelete?.name }}"? 
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

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
