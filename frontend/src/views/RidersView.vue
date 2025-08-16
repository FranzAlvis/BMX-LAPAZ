<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRidersStore } from '@/stores/riders'
import { useAuthStore } from '@/stores/auth'
import DeleteRiderModal from '@/components/DeleteRiderModal.vue'
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
    filtered = filtered.filter(rider => rider.isActive === (statusFilter.value === 'active'))
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

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A'
  
  const birth = new Date(dateOfBirth)
  const today = new Date()
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
  if (!riderToDelete.value) return
  
  try {
    const result = await ridersStore.deleteRider(riderToDelete.value.id)
    if (result && result.success) {
      showDeleteModal.value = false
      riderToDelete.value = null
    } else {
      console.error('Delete operation failed:', result)
    }
  } catch (error) {
    console.error('Error in confirmDelete:', error)
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  riderToDelete.value = null
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
        <p class="mt-2 text-sm text-gray-700">
          Gestiona los corredores registrados en el sistema
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
    <div v-if="showFilters" class="bg-white shadow rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Buscar</label>
            <div class="mt-1 relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Nombre, email o club..."
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Género</label>
            <select
              v-model="genderFilter"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Club</label>
            <select
              v-model="clubFilter"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos</option>
              <option v-for="club in uniqueClubs" :key="club" :value="club">{{ club }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Estado</label>
            <select
              v-model="statusFilter"
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Riders Table -->
    <div v-if="filteredRiders.length > 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
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
                Contacto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Club
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
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
                <div>{{ calculateAge(rider.dateOfBirth || rider.birthDate) }} años</div>
                <div class="text-sm text-gray-500">{{ rider.gender === 'M' ? 'Masculino' : 'Femenino' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>{{ rider.email || 'No registrado' }}</div>
                <div class="text-sm text-gray-500">{{ rider.phone || 'No registrado' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ rider.club || 'Sin club' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ rider.category?.name || 'Sin categoría' }}
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

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay corredores</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || genderFilter !== 'all' || clubFilter !== 'all' || statusFilter !== 'all' 
           ? 'No se encontraron corredores con los filtros aplicados.' 
           : 'Comienza agregando un nuevo corredor.' }}
      </p>
    </div>

    <!-- Delete Modal (only modal remaining) -->
    <DeleteRiderModal 
      :show="showDeleteModal" 
      :rider="riderToDelete"
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
