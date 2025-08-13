<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TagIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const categories = ref([])
const searchQuery = ref('')
const loading = ref(false)
const showDeleteModal = ref(false)
const categoryToDelete = ref(null)

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  
  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(query) ||
    category.description?.toLowerCase().includes(query)
  )
})

const canManageCategories = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria'])
)

const fetchCategories = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/categories')
    categories.value = response.data.categories
  } catch (error) {
    toast.error('Error al cargar categorías')
  } finally {
    loading.value = false
  }
}

const handleDeleteCategory = (category) => {
  categoryToDelete.value = category
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (categoryToDelete.value) {
    try {
      await api.delete(`/api/categories/${categoryToDelete.value.id}`)
      categories.value = categories.value.filter(cat => cat.id !== categoryToDelete.value.id)
      toast.success('Categoría eliminada correctamente')
      showDeleteModal.value = false
      categoryToDelete.value = null
    } catch (error) {
      toast.error('Error al eliminar categoría')
    }
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  categoryToDelete.value = null
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorías</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gestiona las categorías de competencia BMX
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <router-link
          v-if="canManageCategories"
          to="/categories/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Nueva Categoría
        </router-link>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="max-w-lg">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar categorías..."
            />
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-500">
          {{ filteredCategories.length }} categoría{{ filteredCategories.length !== 1 ? 's' : '' }} encontrada{{ filteredCategories.length !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Categories grid -->
    <div v-else-if="filteredCategories.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <TagIcon class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ category.name }}
                </h3>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <router-link
                :to="`/categories/${category.id}`"
                class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                title="Ver detalles"
              >
                <EyeIcon class="h-4 w-4" />
              </router-link>

              <router-link
                v-if="canManageCategories"
                :to="`/categories/${category.id}/edit`"
                class="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                title="Editar"
              >
                <PencilIcon class="h-4 w-4" />
              </router-link>

              <button
                v-if="canManageCategories"
                @click="handleDeleteCategory(category)"
                class="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                title="Eliminar"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <p v-if="category.description" class="text-sm text-gray-600">
              {{ category.description }}
            </p>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-500">Edad mínima:</span>
                <span class="ml-1 text-gray-900">{{ category.minAge || 'N/A' }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Edad máxima:</span>
                <span class="ml-1 text-gray-900">{{ category.maxAge || 'N/A' }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Género:</span>
                <span class="ml-1 text-gray-900">
                  {{ category.gender === 'M' ? 'Masculino' : 
                     category.gender === 'F' ? 'Femenino' : 'Mixto' }}
                </span>
              </div>
              <div>
                <span class="font-medium text-gray-500">Estado:</span>
                <span
                  :class="[
                    'ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ category.isActive ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </div>

            <div v-if="category._count" class="pt-3 border-t border-gray-200">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ category._count.registrations || 0 }}</span>
                corredor{{ (category._count.registrations || 0) !== 1 ? 'es' : '' }} registrado{{ (category._count.registrations || 0) !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <TagIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery ? 'No se encontraron categorías con los filtros aplicados.' : 'Comienza creando una nueva categoría.' }}
      </p>
      <div v-if="canManageCategories && !searchQuery" class="mt-6">
        <router-link
          to="/categories/new"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
          Crear Categoría
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
                  Eliminar categoría
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que quieres eliminar la categoría "{{ categoryToDelete?.name }}"? 
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
