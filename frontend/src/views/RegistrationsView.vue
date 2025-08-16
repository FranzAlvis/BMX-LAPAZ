<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRegistrationsStore } from '@/stores/registrations'
import { useEventsStore } from '@/stores/events'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import DeleteRegistrationModal from '@/components/DeleteRegistrationModal.vue'
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
const registrationsStore = useRegistrationsStore()
const eventsStore = useEventsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const selectedEvent = ref('')
const selectedCategory = ref('')
const statusFilter = ref('all')
const showFilters = ref(false)
const showDeleteModal = ref(false)
const registrationToDelete = ref(null)

const filteredRegistrations = computed(() => {
  let filtered = registrationsStore.registrations

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
  await Promise.all([
    registrationsStore.fetchRegistrations(),
    eventsStore.fetchEvents(),
    categoriesStore.fetchCategories()
  ])
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inscripciones</h1>
        <p class="mt-2 text-sm text-gray-700">
          Gestiona las inscripciones de corredores a eventos
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
        <button
          @click="showFilters = !showFilters"
          class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FunnelIcon class="-ml-1 mr-2 h-5 w-5 text-gray-400" />
          Filtros
        </button>

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
    <div v-if="showFilters" class="bg-white shadow rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Buscar</label>
            <div class="mt-1 relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Corredor, evento o categoría..."
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Evento</label>
            <select
              v-model="selectedEvent"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos los eventos</option>
              <option v-for="event in eventsStore.events" :key="event.id" :value="event.id">
                {{ event.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Categoría</label>
            <select
              v-model="selectedCategory"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todas las categorías</option>
              <option v-for="category in categoriesStore.categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Estado</label>
            <select
              v-model="statusFilter"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos</option>
              <option value="REGISTERED">Registradas</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Registrations Table -->
    <div v-if="filteredRegistrations.length > 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
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
                <div class="text-gray-500">{{ formatDate(registration.event?.date) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ registration.category?.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(registration.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <component
                    :is="getStatusIcon(registration.status)"
                    class="h-4 w-4 mr-2"
                    :class="registration.status === 'CONFIRMED' ? 'text-green-500' : 
                            registration.status === 'REGISTERED' ? 'text-blue-500' : 'text-red-500'"
                  />
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(registration.status)
                    ]"
                  >
                    {{ registration.status === 'REGISTERED' ? 'Registrada' : 
                       registration.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
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

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <ClipboardDocumentListIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay inscripciones</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || selectedEvent || selectedCategory || statusFilter !== 'all' 
           ? 'No se encontraron inscripciones con los filtros aplicados.' 
           : 'Comienza agregando una nueva inscripción.' }}
      </p>
    </div>

    <!-- Delete Modal -->
    <DeleteRegistrationModal 
      :show="showDeleteModal" 
      :registration="registrationToDelete"
      @close="cancelDelete" 
      @confirm="confirmDelete" 
    />
  </div>
</template>

<style scoped>
.bmx-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
