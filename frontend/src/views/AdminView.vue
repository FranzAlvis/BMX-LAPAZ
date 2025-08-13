<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const toast = useToast()

const stats = ref({
  totalUsers: 0,
  totalEvents: 0,
  totalRiders: 0,
  totalRaces: 0,
  systemHealth: 'good'
})

const users = ref([])
const auditLogs = ref([])
const loading = ref(false)
const showUserModal = ref(false)
const selectedUser = ref(null)

const canAccessAdmin = computed(() => 
  authStore.hasRole('Admin')
)

const fetchSystemStats = async () => {
  try {
    const response = await api.get('/api/admin/stats')
    stats.value = response.data.stats
  } catch (error) {
    toast.error('Error al cargar estadísticas del sistema')
  }
}

const fetchUsers = async () => {
  try {
    const response = await api.get('/api/admin/users')
    users.value = response.data.users
  } catch (error) {
    toast.error('Error al cargar usuarios')
  }
}

const fetchAuditLogs = async () => {
  try {
    const response = await api.get('/api/admin/audit-logs', {
      params: { limit: 10 }
    })
    auditLogs.value = response.data.logs
  } catch (error) {
    toast.error('Error al cargar logs de auditoría')
  }
}

const updateUserStatus = async (userId, isActive) => {
  try {
    await api.put(`/api/admin/users/${userId}`, { isActive })
    
    const index = users.value.findIndex(user => user.id === userId)
    if (index !== -1) {
      users.value[index].isActive = isActive
    }
    
    toast.success(`Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`)
  } catch (error) {
    toast.error('Error al actualizar usuario')
  }
}

const resetUserPassword = async (userId) => {
  try {
    const response = await api.post(`/api/admin/users/${userId}/reset-password`)
    toast.success(`Nueva contraseña: ${response.data.newPassword}`)
  } catch (error) {
    toast.error('Error al resetear contraseña')
  }
}

const cleanupSystem = async () => {
  try {
    loading.value = true
    await api.post('/api/admin/cleanup')
    toast.success('Limpieza del sistema completada')
    await fetchSystemStats()
  } catch (error) {
    toast.error('Error durante la limpieza del sistema')
  } finally {
    loading.value = false
  }
}

const backupDatabase = async () => {
  try {
    loading.value = true
    const response = await api.post('/api/admin/backup', {}, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `bmx_backup_${new Date().toISOString().split('T')[0]}.sql`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    toast.success('Backup generado correctamente')
  } catch (error) {
    toast.error('Error al generar backup')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (canAccessAdmin.value) {
    fetchSystemStats()
    fetchUsers()
    fetchAuditLogs()
  }
})
</script>

<template>
  <div v-if="!canAccessAdmin" class="text-center py-12">
    <ShieldCheckIcon class="mx-auto h-12 w-12 text-red-400" />
    <h3 class="mt-2 text-sm font-medium text-gray-900">Acceso Denegado</h3>
    <p class="mt-1 text-sm text-gray-500">
      No tienes permisos para acceder a esta sección.
    </p>
  </div>

  <div v-else>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Administración del Sistema</h1>
      <p class="mt-1 text-sm text-gray-600">
        Gestiona usuarios, configuraciones y estadísticas del sistema BMX
      </p>
    </div>

    <!-- System Stats -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <UserGroupIcon class="h-6 w-6 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Usuarios
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.totalUsers }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Cog6ToothIcon class="h-6 w-6 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Eventos
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.totalEvents }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ChartBarIcon class="h-6 w-6 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Corredores
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.totalRiders }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div
                :class="[
                  'h-3 w-3 rounded-full',
                  stats.systemHealth === 'good' ? 'bg-green-400' : 
                  stats.systemHealth === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                ]"
              ></div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Estado del Sistema
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.systemHealth === 'good' ? 'Bueno' : 
                     stats.systemHealth === 'warning' ? 'Advertencia' : 'Error' }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- System Actions -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones del Sistema
          </h3>
          
          <div class="space-y-4">
            <button
              @click="backupDatabase"
              :disabled="loading"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentTextIcon class="h-5 w-5 mr-2" />
              {{ loading ? 'Generando...' : 'Generar Backup' }}
            </button>

            <button
              @click="cleanupSystem"
              :disabled="loading"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 disabled:opacity-50"
            >
              <TrashIcon class="h-5 w-5 mr-2" />
              {{ loading ? 'Limpiando...' : 'Limpiar Sistema' }}
            </button>

            <button
              @click="fetchSystemStats"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
            >
              <ArrowPathIcon class="h-5 w-5 mr-2" />
              Actualizar Estadísticas
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Audit Logs -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Logs de Auditoría Recientes
          </h3>
          
          <div class="space-y-3">
            <div
              v-for="log in auditLogs"
              :key="log.id"
              class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-shrink-0">
                <ExclamationTriangleIcon
                  :class="[
                    'h-5 w-5',
                    log.level === 'ERROR' ? 'text-red-500' :
                    log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-500'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ log.action }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ log.user?.name }} - {{ new Date(log.createdAt).toLocaleString() }}
                </p>
                <p v-if="log.details" class="text-xs text-gray-400 mt-1">
                  {{ log.details }}
                </p>
              </div>
            </div>
            
            <div v-if="auditLogs.length === 0" class="text-center py-4">
              <p class="text-sm text-gray-500">No hay logs recientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Management -->
    <div class="mt-8 bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Gestión de Usuarios
        </h3>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-sm font-medium text-blue-800">
                          {{ user.name?.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'Secretaria' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'Cronometraje' ? 'bg-green-100 text-green-800' :
                      user.role === 'Juez' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="updateUserStatus(user.id, !user.isActive)"
                      :class="[
                        'inline-flex items-center px-2 py-1 border rounded text-xs font-medium',
                        user.isActive 
                          ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                          : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                      ]"
                    >
                      {{ user.isActive ? 'Desactivar' : 'Activar' }}
                    </button>
                    
                    <button
                      @click="resetUserPassword(user.id)"
                      class="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Reset Password
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
