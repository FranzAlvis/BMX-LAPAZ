<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRidersStore } from '@/stores/riders'
import { useAuthStore } from '@/stores/auth'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const ridersStore = useRidersStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const genderFilter = ref('all')
const clubFilter = ref('all')
const statusFilter = ref('all')
const showDeleteModal = ref(false)
const riderToDelete = ref(null)
const showFilters = ref(false)

const filteredRiders = computed(() => {
  let filtered = ridersStore.riders

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(rider => 
      rider.firstName.toLowerCase().includes(query) ||
      rider.lastName.toLowerCase().includes(query) ||
      rider.email?.toLowerCase().includes(query) ||
      rider.club?.toLowerCase().includes(query)
    )
  }

  if (genderFilter.value !== 'all') {
    filtered = filtered.filter(rider => rider.gender === genderFilter.value)
  }

  if (clubFilter.value !== 'all') {
    filtered = filtered.filter(rider => rider.club === clubFilter.value)
  }

  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active'
    filtered = filtered.filter(rider => rider.isActive === isActive)
  }

  return filtered
})

const canManageRiders = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const uniqueClubs = computed(() => {
  const clubs = [...new Set(ridersStore.riders.map(rider => rider.club).filter(Boolean))]
  return clubs.sort()
})

const calculateAge = (birthDate) => {
  if (!birthDate) return 'N/A'
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

const handleDeleteRider = (rider) => {
  riderToDelete.value = rider
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (riderToDelete.value) {
    const result = await ridersStore.deleteRider(riderToDelete.value.id)
    if (result.success) {
      showDeleteModal.value = false
      riderToDelete.value = null
    }
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  riderToDelete.value = null
}

const handleImport = async (event) => {
  const file = event.target.files[0]
  if (file) {
    await ridersStore.importRiders(file)
    event.target.value = '' // Reset input
  }
}

const handleExport = async () => {
  await ridersStore.exportRiders('csv')
}

onMounted(() => {
  ridersStore.fetchRiders()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Corredores</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gestiona los corredores registrados en el sistema
        </p>
      </div>
      <div class="mt-4 sm:mt-0 flex space-x-3">
        <div v-if="canManageRiders" class="flex space-x-3">
          <!-- Import button -->
          <label class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <ArrowUpTrayIcon class="-ml-1 mr-2 h-5 w-5" />
            Importar CSV
            <input
              type="file"
              accept=".csv"
              class="hidden"
              @change="handleImport"
            />
          </label>

          <!-- Export button -->
          <button
            @click="handleExport"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon class="-ml-1 mr-2 h-5 w-5" />
            Exportar CSV
          </button>
        </div>

        <router-link
          v-if="canManageRiders"
          to="/riders/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nuevo Corredor
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
                placeholder="Buscar por nombre, email o club..."
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
          <!-- Gender filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Género</label>
            <select
              v-model="genderFilter"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <!-- Club filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Club</label>
            <select
              v-model="clubFilter"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">Todos los clubs</option>
              <option v-for="club in uniqueClubs" :key="club" :value="club">
                {{ club }}
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
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <!-- Results count -->
          <div class="flex items-end">
            <div class="text-sm text-gray-500">
              {{ filteredRiders.length }} corredor{{ filteredRiders.length !== 1 ? 'es' : '' }} encontrado{{ filteredRiders.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="ridersStore.loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Riders table -->
    <div v-else-if="filteredRiders.length > 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Corredor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Edad/Género
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Club
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
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
            <tr v-for="rider in filteredRiders" :key="rider.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-800">
                        {{ rider.firstName.charAt(0) }}{{ rider.lastName.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ rider.firstName }} {{ rider.lastName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ rider.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ calculateAge(rider.birthDate) }} años</div>
                <div class="text-gray-500">{{ rider.gender === 'M' ? 'Masculino' : 'Femenino' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ rider.club || 'Sin club' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ rider.email || 'Sin email' }}</div>
                <div class="text-gray-500">{{ rider.phone || 'Sin teléfono' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ rider.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <router-link
                    :to="`/riders/${rider.id}`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Ver detalles"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </router-link>

                  <router-link
                    v-if="canManageRiders"
                    :to="`/riders/${rider.id}/edit`"
                    class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Editar"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </router-link>

                  <button
                    v-if="canManageRiders"
                    @click="handleDeleteRider(rider)"
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
      <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay corredores</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || genderFilter !== 'all' || clubFilter !== 'all' || statusFilter !== 'all' 
           ? 'No se encontraron corredores con los filtros aplicados.' 
           : 'Comienza registrando un nuevo corredor.' }}
      </p>
      <div v-if="canManageRiders && !searchQuery && genderFilter === 'all' && clubFilter === 'all' && statusFilter === 'all'" class="mt-6">
        <router-link
          to="/riders/new"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Registrar Corredor
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
                  Eliminar corredor
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que quieres eliminar al corredor "{{ riderToDelete?.firstName }} {{ riderToDelete?.lastName }}"? 
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
