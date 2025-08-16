<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRidersStore } from '@/stores/riders'
import { useCategoriesStore } from '@/stores/categories'
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const ridersStore = useRidersStore()
const categoriesStore = useCategoriesStore()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const rider = ref(null)

const editRider = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  club: '',
  plate: '',
  categoryId: ''
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

const goBack = () => {
  router.push('/riders')
}

const handleSubmit = async () => {
  try {
    saving.value = true
    error.value = null
    
    await ridersStore.updateRider(rider.value.id, editRider.value)
    router.push('/riders')
  } catch (err) {
    error.value = 'Error al actualizar el corredor'
    console.error('Error updating rider:', err)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const riderId = parseInt(route.params.id)
    
    // Fetch rider and categories
    await Promise.all([
      ridersStore.fetchRiders(),
      categoriesStore.fetchCategories()
    ])
    
    // Find rider by ID
    const foundRider = ridersStore.riders.find(r => r.id === riderId || r.id === route.params.id)
    
    if (!foundRider) {
      error.value = 'Corredor no encontrado'
    } else {
      rider.value = foundRider
      // Populate form with rider data
      editRider.value = {
        firstName: foundRider.firstName,
        lastName: foundRider.lastName,
        email: foundRider.email || '',
        phone: foundRider.phone || '',
        dateOfBirth: foundRider.dateOfBirth || foundRider.birthDate,
        gender: foundRider.gender,
        club: foundRider.club || '',
        plate: foundRider.plate || '',
        categoryId: foundRider.categoryId || ''
      }
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
            {{ loading ? 'Cargando...' : error ? 'Error' : `Editar: ${rider?.firstName} ${rider?.lastName}` }}
          </h1>
          <p class="mt-2 text-sm text-gray-700">
            Modifica la información del corredor
          </p>
        </div>
        
        <div v-if="rider" class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center">
          <div class="flex-shrink-0 h-10 w-10 mr-3">
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-sm font-medium text-blue-800">
                {{ rider.firstName.charAt(0) }}{{ rider.lastName.charAt(0) }}
              </span>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              ID: {{ rider.id }} • {{ calculateAge(rider.dateOfBirth || rider.birthDate) }} años
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-sm text-gray-500">Cargando información del corredor...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !rider" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-red-400">
        <UserIcon class="h-12 w-12" />
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ error }}</h3>
      <p class="mt-1 text-sm text-gray-500">
        No se pudo cargar la información del corredor.
      </p>
    </div>

    <!-- Form -->
    <div v-else-if="rider" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                id="firstName"
                v-model="editRider.firstName"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ingresa el nombre"
              />
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700">
                Apellido *
              </label>
              <input
                id="lastName"
                v-model="editRider.lastName"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ingresa el apellido"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                v-model="editRider.email"
                type="email"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                v-model="editRider.phone"
                type="tel"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="123-456-7890"
              />
            </div>

            <div>
              <label for="dateOfBirth" class="block text-sm font-medium text-gray-700">
                Fecha de Nacimiento *
              </label>
              <input
                id="dateOfBirth"
                v-model="editRider.dateOfBirth"
                type="date"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="gender" class="block text-sm font-medium text-gray-700">
                Género *
              </label>
              <select
                id="gender"
                v-model="editRider.gender"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar género</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div>
              <label for="plate" class="block text-sm font-medium text-gray-700">
                Placa *
              </label>
              <input
                id="plate"
                v-model="editRider.plate"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Número de placa"
              />
            </div>

            <div>
              <label for="categoryId" class="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <select
                id="categoryId"
                v-model="editRider.categoryId"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar categoría (opcional)</option>
                <template v-if="categoriesStore.categories && categoriesStore.categories.length > 0">
                  <option 
                    v-for="category in categoriesStore.categories" 
                    :key="category.id" 
                    :value="category.id"
                  >
                    {{ category.name }} ({{ category.minAge }}-{{ category.maxAge }} años, {{ category.gender === 'M' ? 'Masculino' : category.gender === 'F' ? 'Femenino' : 'Mixto' }})
                  </option>
                </template>
                <template v-else>
                  <option disabled>
                    {{ categoriesStore.loading ? 'Cargando categorías...' : categoriesStore.error ? `Error: ${categoriesStore.error}` : 'No hay categorías disponibles' }}
                  </option>
                </template>
              </select>
            </div>

            <div>
              <label for="club" class="block text-sm font-medium text-gray-700">
                Club
              </label>
              <input
                id="club"
                v-model="editRider.club"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nombre del club (opcional)"
              />
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            :disabled="saving"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bmx-gradient text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <span v-if="saving">Guardando...</span>
            <span v-else>Guardar Cambios</span>
          </button>
          
          <button
            type="button"
            @click="goBack"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.bmx-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
