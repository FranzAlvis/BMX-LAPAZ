<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const validateForm = () => {
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = 'El email es requerido'
    return false
  }

  if (!form.email.includes('@')) {
    errors.email = 'El email no es válido'
    return false
  }

  if (!form.password) {
    errors.password = 'La contraseña es requerida'
    return false
  }

  if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }

  return true
}

const demoUsers = [
  {
    role: 'Administrador',
    email: 'admin@bmx.com',
    password: 'admin123',
    color: 'bg-red-400'
  },
  {
    role: 'Secretaría',
    email: 'secretaria@bmx.com',
    password: 'secretaria123',
    color: 'bg-green-400'
  },
  {
    role: 'Cronometraje',
    email: 'cronometraje@bmx.com',
    password: 'cronometraje123',
    color: 'bg-blue-400'
  }
]

const fillDemoUser = (user) => {
  form.email = user.email
  form.password = user.password
  errors.email = ''
  errors.password = ''
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const result = await authStore.login({
    email: form.email,
    password: form.password
  })

  if (result.success) {
    router.push('/')
  }
}
</script>

<template>
  <div>
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Email Field -->
      <div class="space-y-2">
        <label for="email" class="block text-sm font-semibold text-gray-700">
          Correo electrónico
        </label>
        <div class="relative group">
          <input
            id="email"
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
            :class="[
              'block w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-0 text-sm font-medium',
              errors.email 
                ? 'border-red-300 focus:border-red-500 bg-red-50/30' 
                : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
            ]"
            placeholder="tu@email.com"
          />
          <!-- Floating icon -->
          <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <div v-if="errors.email" class="absolute -bottom-6 left-0 flex items-center text-red-600 text-xs font-medium">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </div>
        </div>
      </div>

      <!-- Password Field -->
      <div class="space-y-2">
        <label for="password" class="block text-sm font-semibold text-gray-700">
          Contraseña
        </label>
        <div class="relative group">
          <input
            id="password"
            v-model="form.password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            :class="[
              'block w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-0 text-sm font-medium',
              errors.password 
                ? 'border-red-300 focus:border-red-500 bg-red-50/30' 
                : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
            ]"
            placeholder="••••••••"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:text-blue-500 transition-colors duration-300 p-1 rounded-lg hover:bg-gray-100"
            @click="showPassword = !showPassword"
          >
            <EyeIcon v-if="!showPassword" class="h-5 w-5" />
            <EyeSlashIcon v-else class="h-5 w-5" />
          </button>
          <div v-if="errors.password" class="absolute -bottom-6 left-0 flex items-center text-red-600 text-xs font-medium">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.password }}
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="pt-4">
        <button
          type="submit"
          :disabled="authStore.loading"
          class="group relative w-full flex justify-center items-center px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bmx-modern-gradient shadow-lg hover:shadow-xl"
        >
          <span v-if="authStore.loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Iniciando sesión...
          </span>
          <span v-else class="flex items-center">
            <svg class="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar Sesión
          </span>
        </button>
      </div>
    </form>

    <!-- Demo Users Section -->
    <div class="mt-8">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-white/80 backdrop-blur-sm px-4 py-1 text-gray-500 font-medium rounded-full">
            Usuarios de prueba
          </span>
        </div>
      </div>

      <div class="mt-6 grid gap-3">
        <div 
          v-for="user in demoUsers" 
          :key="user.role"
          class="group p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/50 hover:from-blue-50 hover:to-purple-50 hover:border-blue-200/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
          @click="fillDemoUser(user)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div :class="user.color" class="w-2 h-2 rounded-full"></div>
              <div>
                <p class="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{{ user.role }}</p>
                <p class="text-xs text-gray-500 font-medium">{{ user.email }}</p>
              </div>
            </div>
            <div class="text-gray-400 group-hover:text-blue-500 transition-colors duration-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bmx-modern-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* Custom focus styles */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Smooth transitions for all interactive elements */
* {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
