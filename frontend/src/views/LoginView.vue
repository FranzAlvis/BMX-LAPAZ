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
      <div>
        <label for="email" class="block text-sm font-medium leading-6 text-gray-900">
          Email
        </label>
        <div class="mt-2">
          <input
            id="email"
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            required
            :class="[
              'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6',
              errors.email ? 'ring-red-300' : 'ring-gray-300'
            ]"
            placeholder="tu@email.com"
          />
          <p v-if="errors.email" class="mt-2 text-sm text-red-600">
            {{ errors.email }}
          </p>
        </div>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium leading-6 text-gray-900">
          Contraseña
        </label>
        <div class="mt-2 relative">
          <input
            id="password"
            v-model="form.password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            :class="[
              'block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6',
              errors.password ? 'ring-red-300' : 'ring-gray-300'
            ]"
            placeholder="••••••••"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-3"
            @click="showPassword = !showPassword"
          >
            <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400" />
            <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
          </button>
          <p v-if="errors.password" class="mt-2 text-sm text-red-600">
            {{ errors.password }}
          </p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          :disabled="authStore.loading"
          class="flex w-full justify-center rounded-md bmx-gradient px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="authStore.loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Iniciando sesión...
          </span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </div>
    </form>

    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-white px-2 text-gray-500">Usuarios de prueba</span>
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <div class="text-xs text-gray-600">
          <p><strong>Admin:</strong> admin@bmx.com / admin123</p>
          <p><strong>Secretaría:</strong> secretaria@bmx.com / secretaria123</p>
          <p><strong>Cronometraje:</strong> cronometraje@bmx.com / cronometraje123</p>
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
