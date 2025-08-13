<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const registrations = ref([])
const events = ref([])
const categories = ref([])
const searchQuery = ref('')
const selectedEvent = ref('')
const selectedCategory = ref('')
const statusFilter = ref('all')
const loading = ref(false)
const showFilters = ref(false)
const showDeleteModal = ref(false)
const registrationToDelete = ref(null)

const filteredRegistrations = computed(() => {
  let filtered = registrations.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(reg => 
      reg.rider?.firstName.toLowerCase().includes(query) ||
      reg.rider?.lastName.toLowerCase().includes(query) ||
      reg.event?.name.toLowerCase().includes(query) ||
      reg.category?.name.toLowerCase().includes(query)
    )
  }

  if (selectedEvent.value) {
    filtered = filtered.filter(reg => reg.eventId === selectedEvent.value)
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(reg => reg.categoryId === selectedCategory.value)
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(reg => reg.status === statusFilter.value)
  }

  return filtered
})

const canManageRegistrations = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const getStatusColor = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmada'
    case 'PENDING':
      return 'Pendiente'
    case 'CANCELLED':
      return 'Cancelada'
    default:
      return status
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return CheckCircleIcon
    case 'PENDING':
      return ClockIcon
    case 'CANCELLED':
      return XCircleIcon
    default:
      return ClockIcon
  }
}

const fetchRegistrations = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/registrations', {
      params: {
        include: 'rider,event,category'
      }
    })
    registrations.value = response.data.registrations
  } catch (error) {
    toast.error('Error al cargar inscripciones')
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

const handleDeleteRegistration = (registration) => {
  registrationToDelete.value = registration
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (registrationToDelete.value) {
    try {
      await api.delete(`/api/registrations/${registrationToDelete.value.id}`)
      registrations.value = registrations.value.filter(reg => reg.id !== registrationToDelete.value.id)
      toast.success('Inscripción eliminada correctamente')
      showDeleteModal.value = false
      registrationToDelete.value = null
    } catch (error) {
      toast.error('Error al eliminar inscripción')
    }
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  registrationToDelete.value = null
}

const updateRegistrationStatus = async (registrationId, newStatus) => {
  try {
    const response = await api.put(`/api/registrations/${registrationId}`, {
      status: newStatus
    })
    
    const index = registrations.value.findIndex(reg => reg.id === registrationId)
    if (index !== -1) {
      registrations.value[index] = response.data.registration
    }
    
    toast.success(`Inscripción ${getStatusText(newStatus).toLowerCase()}`)
  } catch (error) {
    toast.error('Error al actualizar estado de inscripción')
  }
}

onMounted(() => {
  fetchRegistrations()
  fetchEvents()
  fetchCategories()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inscripciones</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gestiona las inscripciones de corredores a eventos
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <router-link
          v-if="canManageRegistrations"
          to="/registrations/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nueva Inscripción
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
                placeholder="Buscar por corredor, evento o categoría..."
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
              <option value="CONFIRMED">Confirmadas</option>
              <option value="PENDING">Pendientes</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <!-- Results count -->
          <div class="flex items-end">
            <div class="text-sm text-gray-500">
              {{ filteredRegistrations.length }} inscripción{{ filteredRegistrations.length !== 1 ? 'es' : '' }} encontrada{{ filteredRegistrations.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Registrations table -->
    <div v-else-if="filteredRegistrations.length > 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Corredor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Inscripción
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="registration in filteredRegistrations" :key="registration.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-800">
                        {{ registration.rider?.firstName?.charAt(0) }}{{ registration.rider?.lastName?.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ registration.rider?.firstName }} {{ registration.rider?.lastName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ registration.rider?.club || 'Sin club' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ registration.event?.name }}</div>
                <div class="text-gray-500">{{ new Date(registration.event?.date).toLocaleDateString() }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ registration.category?.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ new Date(registration.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <component
                    :is="getStatusIcon(registration.status)"
                    class="h-4 w-4 mr-2"
                    :class="registration.status === 'CONFIRMED' ? 'text-green-500' : 
                            registration.status === 'PENDING' ? 'text-yellow-500' : 'text-red-500'"
                  />
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(registration.status)
                    ]"
                  >
                    {{ getStatusText(registration.status) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <!-- Quick status actions -->
                  <div v-if="canManageRegistrations && registration.status === 'PENDING'" class="flex space-x-1">
                    <button
                      @click="updateRegistrationStatus(registration.id, 'CONFIRMED')"
                      class="inline-flex items-center p-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-white hover:bg-green-50"
                      title="Confirmar"
                    >
                      <CheckCircleIcon class="h-4 w-4" />
                    </button>
                    <button
                      @click="updateRegistrationStatus(registration.id, 'CANCELLED')"
                      class="inline-flex items-center p-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-white hover:bg-red-50"
                      title="Cancelar"
                    >
                      <XCircleIcon class="h-4 w-4" />
                    </button>
                  </div>

                  <router-link
                    :to="`/registrations/${registration.id}`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Ver detalles"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </router-link>

                  <router-link
                    v-if="canManageRegistrations"
                    :to="`/registrations/${registration.id}/edit`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Editar"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </router-link>

                  <button
                    v-if="canManageRegistrations"
                    @click="handleDeleteRegistration(registration)"
                    class="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    title="Eliminar"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <ClipboardDocumentListIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay inscripciones</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || selectedEvent || selectedCategory || statusFilter !== 'all' 
           ? 'No se encontraron inscripciones con los filtros aplicados.' 
           : 'Comienza registrando una nueva inscripción.' }}
      </p>
      <div v-if="canManageRegistrations && !searchQuery && !selectedEvent && !selectedCategory && statusFilter === 'all'" class="mt-6">
        <router-link
          to="/registrations/new"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nueva Inscripción
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
                  Eliminar inscripción
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que quieres eliminar la inscripción de "{{ registrationToDelete?.rider?.firstName }} {{ registrationToDelete?.rider?.lastName }}"? 
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
