<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

const navigation = computed(() => {
  const baseItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, current: route.path === '/' },
    { name: 'Eventos', href: '/events', icon: CalendarDaysIcon, current: route.path.startsWith('/events') },
    { name: 'Corredores', href: '/riders', icon: UserGroupIcon, current: route.path.startsWith('/riders') },
    { name: 'Categorías', href: '/categories', icon: TagIcon, current: route.path.startsWith('/categories'), roles: ['Admin', 'Secretaria'] },
    { name: 'Inscripciones', href: '/registrations', icon: ClipboardDocumentListIcon, current: route.path.startsWith('/registrations') },
    { name: 'Carreras', href: '/races', icon: TrophyIcon, current: route.path.startsWith('/races') },
    { name: 'Resultados', href: '/results', icon: ChartBarIcon, current: route.path.startsWith('/results') },
    { name: 'Reportes', href: '/reports', icon: DocumentTextIcon, current: route.path.startsWith('/reports') },
  ]

  // Add admin menu if user is admin
  if (authStore.hasRole('Admin')) {
    baseItems.push({
      name: 'Administración',
      href: '/admin',
      icon: Cog6ToothIcon,
      current: route.path.startsWith('/admin')
    })
  }

  return baseItems.filter(item => !item.roles || authStore.canAccess(item.roles))
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile sidebar -->
    <div v-if="sidebarOpen" class="relative z-50 lg:hidden">
      <div class="fixed inset-0 bg-gray-900/80" @click="sidebarOpen = false"></div>
      <div class="fixed inset-y-0 left-0 z-50 w-72 bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bmx-gradient">
              <TrophyIcon class="h-5 w-5 text-white" />
            </div>
            <span class="ml-3 text-xl font-display font-bold text-gray-900">BMX Racing</span>
          </div>
          <button @click="sidebarOpen = false" class="text-gray-700">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        
        <nav class="mt-8">
          <ul class="space-y-1">
            <li v-for="item in navigation" :key="item.name">
              <router-link
                :to="item.href"
                :class="[
                  item.current
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                ]"
                @click="sidebarOpen = false"
              >
                <component :is="item.icon" class="h-6 w-6 shrink-0" />
                {{ item.name }}
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- User menu -->
        <div class="mt-8 pt-8 border-t border-gray-200">
          <div class="flex items-center">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <span class="text-sm font-medium text-white">
                {{ authStore.userName?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">{{ authStore.userName }}</p>
              <p class="text-xs text-gray-500">{{ authStore.userRole }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="mt-4 flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowRightOnRectangleIcon class="h-6 w-6" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 py-6 shadow-lg">
        <div class="flex items-center">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bmx-gradient">
            <TrophyIcon class="h-5 w-5 text-white" />
          </div>
          <span class="ml-3 text-xl font-display font-bold text-gray-900">BMX Racing</span>
        </div>
        
        <nav class="flex flex-1 flex-col">
          <ul class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul class="space-y-1">
                <li v-for="item in navigation" :key="item.name">
                  <router-link
                    :to="item.href"
                    :class="[
                      item.current
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    ]"
                  >
                    <component :is="item.icon" class="h-6 w-6 shrink-0" />
                    {{ item.name }}
                  </router-link>
                </li>
              </ul>
            </li>
            
            <!-- User menu -->
            <li class="mt-auto">
              <div class="border-t border-gray-200 pt-6">
                <div class="flex items-center">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                    <span class="text-sm font-medium text-white">
                      {{ authStore.userName?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">{{ authStore.userName }}</p>
                    <p class="text-xs text-gray-500">{{ authStore.userRole }}</p>
                  </div>
                </div>
                <button
                  @click="handleLogout"
                  class="mt-4 flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <ArrowRightOnRectangleIcon class="h-6 w-6" />
                  Cerrar Sesión
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <div class="lg:pl-72">
      <!-- Top bar -->
      <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button @click="sidebarOpen = true" class="-m-2.5 p-2.5 text-gray-700 lg:hidden">
          <Bars3Icon class="h-6 w-6" />
        </button>

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <!-- Page title -->
            <h1 class="text-lg font-semibold leading-6 text-gray-900">
              {{ $route.meta.title || $route.name }}
            </h1>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="py-6">
        <div class="px-4 sm:px-6 lg:px-8">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
