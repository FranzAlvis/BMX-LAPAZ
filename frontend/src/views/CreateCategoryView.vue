<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoriesStore } from '../stores/categories'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const categoriesStore = useCategoriesStore()

const loading = ref(false)
const error = ref(null)

const newCategory = ref({
  name: '',
  minAge: '',
  maxAge: '',
  gender: '',
  wheel: 'TWENTY_INCH',
  maxRiders: 32
})

const goBack = () => {
  router.push('/categories')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    await categoriesStore.createCategory(newCategory.value)
    router.push('/categories')
  } catch (err) {
    error.value = 'Error al crear la categoría'
    console.error('Error creating category:', err)
  } finally {
    loading.value = false
  }
}
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
        Volver a Categorías
      </button>
      
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Nueva Categoría
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Completa la información para registrar una nueva categoría
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
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                id="name"
                v-model="newCategory.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nombre de la categoría"
              />
            </div>

            <div class="sm:col-span-3">
              <label for="gender" class="block text-sm font-medium text-gray-700">
                Género *
              </label>
              <select
                id="gender"
                v-model="newCategory.gender"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccionar género</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Mixed">Mixto</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label for="minAge" class="block text-sm font-medium text-gray-700">
                Edad Mínima *
              </label>
              <input
                id="minAge"
                v-model="newCategory.minAge"
                type="number"
                min="0"
                max="99"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Edad mínima"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="maxAge" class="block text-sm font-medium text-gray-700">
                Edad Máxima *
              </label>
              <input
                id="maxAge"
                v-model="newCategory.maxAge"
                type="number"
                min="0"
                max="99"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Edad máxima"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="wheel" class="block text-sm font-medium text-gray-700">
                Tipo de Rueda
              </label>
              <select
                id="wheel"
                v-model="newCategory.wheel"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="TWENTY_INCH">20 pulgadas</option>
                <option value="TWENTY_FOUR_INCH">24 pulgadas</option>
                <option value="Cruiser">Cruiser</option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label for="maxRiders" class="block text-sm font-medium text-gray-700">
                Máximo de Corredores
              </label>
              <input
                id="maxRiders"
                v-model="newCategory.maxRiders"
                type="number"
                min="1"
                max="64"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="32"
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
              {{ loading ? 'Creando...' : 'Crear Categoría' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
