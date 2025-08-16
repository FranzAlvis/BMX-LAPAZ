<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRidersStore } from '@/stores/riders'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const ridersStore = useRidersStore()
const authStore = useAuthStore()

const rider = ref(null)
const loading = ref(true)
const error = ref(null)

const canManageRiders = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const calculateAge = (birthDate) => {
  if (!birthDate) return 'N/A'
  
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

const formatDate = (dateString) => {
  if (!dateString) return 'No registrado'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => {
  router.push('/riders')
}

const editRider = () => {
  // This would trigger the edit modal in the parent component
  // For now, we'll navigate back to riders list
  router.push('/riders')
}

const deleteRider = async () => {
  if (confirm(`¿Estás seguro de que quieres eliminar a ${rider.value.firstName} ${rider.value.lastName}?`)) {
    try {
      await ridersStore.deleteRider(rider.value.id)
      router.push('/riders')
    } catch (error) {
      console.error('Error deleting rider:', error)
    }
  }
}

onMounted(async () => {
  try {
    const riderId = parseInt(route.params.id)
    console.log('Looking for rider with ID:', riderId)
    
    // Always fetch riders first to ensure we have the latest data
    await ridersStore.fetchRiders()
    console.log('Available riders:', ridersStore.riders)
    
    // Find rider by ID (try both number and string comparison)
    let foundRider = ridersStore.riders.find(r => r.id === riderId || r.id === route.params.id)
    console.log('Found rider:', foundRider)
    
    if (!foundRider) {
      error.value = 'Corredor no encontrado'
      console.error('Rider not found. Available IDs:', ridersStore.riders.map(r => r.id))
    } else {
      rider.value = foundRider
    }
  } catch (err) {
    error.value = 'Error al cargar el corredor'
    console.error('Error fetching rider:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header with back button -->
    <div class="mb-6">
      <button
        @click="goBack"
        class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Volver a Corredores
      </button>
      
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ loading ? 'Cargando...' : error ? 'Error' : `${rider?.firstName} ${rider?.lastName}` }}
          </h1>
          <p class="mt-2 text-sm text-gray-700">
            Información detallada del corredor
          </p>
        </div>
        
        <div v-if="rider && canManageRiders" class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
          <button
            @click="editRider"
            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon class="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Editar
          </button>
          
          <button
            @click="deleteRider"
            class="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <TrashIcon class="-ml-1 mr-2 h-5 w-5 text-red-400" />
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-sm text-gray-500">Cargando información del corredor...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-red-400">
        <UserIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ error }}</h3>
      <p class="mt-1 text-sm text-gray-500">
        No se pudo cargar la información del corredor.
      </p>
    </div>

    <!-- Rider Details -->
    <div v-else-if="rider" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-20 w-20">
            <div class="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-xl font-medium text-blue-800">
                {{ rider.firstName.charAt(0) }}{{ rider.lastName.charAt(0) }}
              </span>
            </div>
          </div>
          <div class="ml-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {{ rider.firstName }} {{ rider.lastName }}
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              ID: {{ rider.id }} • 
              {{ calculateAge(rider.birthDate) }} años • 
              {{ rider.gender === 'M' ? 'Masculino' : 'Femenino' }}
            </p>
            <div class="mt-2">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]"
              >
                {{ rider.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="border-t border-gray-200">
        <dl>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon class="mr-2 h-4 w-4" />
              Nombre completo
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ rider.firstName }} {{ rider.lastName }}
            </dd>
          </div>
          
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <EnvelopeIcon class="mr-2 h-4 w-4" />
              Email
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ rider.email || 'No registrado' }}
            </dd>
          </div>
          
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <PhoneIcon class="mr-2 h-4 w-4" />
              Teléfono
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ rider.phone || 'No registrado' }}
            </dd>
          </div>
          
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon class="mr-2 h-4 w-4" />
              Fecha de nacimiento
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ formatDate(rider.birthDate) }}
              <span class="text-gray-500 ml-2">({{ calculateAge(rider.birthDate) }} años)</span>
            </dd>
          </div>
          
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Género
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ rider.gender === 'M' ? 'Masculino' : 'Femenino' }}
            </dd>
          </div>
          
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500 flex items-center">
              <BuildingOfficeIcon class="mr-2 h-4 w-4" />
              Club
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ rider.club || 'Sin club asignado' }}
            </dd>
          </div>
          
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Estado
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]"
              >
                {{ rider.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
