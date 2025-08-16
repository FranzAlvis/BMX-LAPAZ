<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegistrationsStore } from '../stores/registrations'
import { useRidersStore } from '../stores/riders'
import { useCategoriesStore } from '../stores/categories'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const registrationsStore = useRegistrationsStore()
const ridersStore = useRidersStore()
const categoriesStore = useCategoriesStore()

const loading = ref(false)
const error = ref(null)

const newRegistration = ref({
  riderId: '',
  categoryId: '',
  eventId: '',
  plateNumber: ''
})

const goBack = () => {
  router.push('/registrations')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    await registrationsStore.createRegistration(newRegistration.value)
    router.push('/registrations')
  } catch (err) {
    error.value = 'Error al crear la inscripción'
    console.error('Error creating registration:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    ridersStore.fetchRiders(),
    categoriesStore.fetchCategories()
  ])
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
        Volver a Inscripciones
      </button>
      
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Nueva Inscripción
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Completa la información para registrar una nueva inscripción
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{{ error }}</div>
    </div>

    <!-- Form -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div class="px-4 py-6 sm:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            
            <div class="sm:col-span-3">
              <label for="riderId" class="block text-sm font-medium text-gray-700">
                Corredor *
              </label>
              <select
                id="riderId"
                v-model="newRegistration.riderId"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar corredor</option>
                <option 
                  v-for="rider in ridersStore.riders" 
                  :key="rider.id" 
                  :value="rider.id"
                >
                  {{ rider.firstName }} {{ rider.lastName }} - Placa {{ rider.plate }}
                </option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label for="categoryId" class="block text-sm font-medium text-gray-700">
                Categoría *
              </label>
              <select
                id="categoryId"
                v-model="newRegistration.categoryId"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar categoría</option>
                <option 
                  v-for="category in categoriesStore.categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }} ({{ category.minAge }}-{{ category.maxAge }} años)
                </option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label for="eventId" class="block text-sm font-medium text-gray-700">
                ID del Evento *
              </label>
              <input
                id="eventId"
                v-model="newRegistration.eventId"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ID del evento"
              />
            </div>

            <div class="sm:col-span-3">
              <label for="plateNumber" class="block text-sm font-medium text-gray-700">
                Número de Placa
              </label>
              <input
                id="plateNumber"
                v-model="newRegistration.plateNumber"
                type="number"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Número de placa para la carrera"
              />
            </div>

          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              type="button"
              @click="goBack"
              class="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {{ loading ? 'Creando...' : 'Crear Inscripción' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
