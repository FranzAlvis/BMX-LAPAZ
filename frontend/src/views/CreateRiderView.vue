<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRidersStore } from '../stores/riders'
import { useCategoriesStore } from '../stores/categories'
import {
  ArrowLeftIcon,
  UserPlusIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const ridersStore = useRidersStore()
const categoriesStore = useCategoriesStore()

const loading = ref(false)
const error = ref(null)

const newRider = ref({
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

const goBack = () => {
  router.push('/riders')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    
    await ridersStore.createRider(newRider.value)
    router.push('/riders')
  } catch (err) {
    error.value = 'Error al crear el corredor'
    console.error('Error creating rider:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('CreateRiderView: Component mounted, fetching categories...')
  await categoriesStore.fetchCategories()
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
          <h1 class="text-2xl font-bold text-gray-900">Nuevo Corredor</h1>
          <p class="mt-2 text-sm text-gray-700">
            Completa la información para registrar un nuevo corredor
          </p>
        </div>
        
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <UserPlusIcon class="h-8 w-8 text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <form @submit.prevent="handleSubmit">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                id="firstName"
                v-model="newRider.firstName"
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
                v-model="newRider.lastName"
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
                v-model="newRider.email"
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
                v-model="newRider.phone"
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
                v-model="newRider.dateOfBirth"
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
                v-model="newRider.gender"
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
                v-model="newRider.plate"
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
                v-model="newRider.categoryId"
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
                  <!-- Debug: Show raw categories data -->
                  <option disabled v-if="!categoriesStore.loading">
                    Debug: {{ JSON.stringify(categoriesStore.categories) }}
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
                v-model="newRider.club"
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
            :disabled="loading"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bmx-gradient text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <span v-if="loading">Creando...</span>
            <span v-else>Crear Corredor</span>
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
