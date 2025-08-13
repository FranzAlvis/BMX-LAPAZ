<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events'
import { useRidersStore } from '@/stores/riders'
import {
  CalendarDaysIcon,
  UserGroupIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const eventsStore = useEventsStore()
const ridersStore = useRidersStore()

const stats = ref({
  totalEvents: 0,
  activeEvents: 0,
  totalRiders: 0,
  totalRaces: 0,
  pendingResults: 0,
  completedRaces: 0
})

const recentEvents = ref([])
const upcomingRaces = ref([])
const loading = ref(true)

const welcomeMessage = computed(() => {
  const hour = new Date().getHours()
  let greeting = 'Buenos días'
  
  if (hour >= 12 && hour < 18) {
    greeting = 'Buenas tardes'
  } else if (hour >= 18) {
    greeting = 'Buenas noches'
  }
  
  return `${greeting}, ${authStore.userName}`
})

const dashboardStats = computed(() => [
  {
    name: 'Eventos Totales',
    value: stats.value.totalEvents,
    icon: CalendarDaysIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'Eventos Activos',
    value: stats.value.activeEvents,
    icon: ClockIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'Corredores',
    value: stats.value.totalRiders,
    icon: UserGroupIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    name: 'Carreras Completadas',
    value: stats.value.completedRaces,
    icon: CheckCircleIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  }
])

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Load events
    await eventsStore.fetchEvents({ limit: 5 })
    
    // Load riders summary
    await ridersStore.fetchRiders({ limit: 1 })
    
    // Mock stats for now - in real app these would come from API
    stats.value = {
      totalEvents: eventsStore.events.length,
      activeEvents: eventsStore.activeEvents.length,
      totalRiders: ridersStore.pagination.total,
      totalRaces: 25,
      pendingResults: 3,
      completedRaces: 22
    }
    
    recentEvents.value = eventsStore.events.slice(0, 3)
    
    // Mock upcoming races
    upcomingRaces.value = [
      {
        id: 1,
        name: 'Clasificatoria Categoría Novatos',
        event: 'Campeonato Regional 2024',
        time: '10:00 AM',
        status: 'Próxima'
      },
      {
        id: 2,
        name: 'Final Categoría Expertos',
        event: 'Campeonato Regional 2024',
        time: '11:30 AM',
        status: 'En progreso'
      },
      {
        id: 3,
        name: 'Semifinal Categoría Juvenil',
        event: 'Copa Nacional BMX',
        time: '2:00 PM',
        status: 'Pendiente'
      }
    ]
    
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div>
    <!-- Welcome header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">{{ welcomeMessage }}</h1>
      <p class="mt-1 text-sm text-gray-600">
        Aquí tienes un resumen de la actividad del sistema BMX
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Dashboard content -->
    <div v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div
          v-for="stat in dashboardStats"
          :key="stat.name"
          class="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
        >
          <dt>
            <div :class="[stat.bgColor, 'absolute rounded-md p-3']">
              <component :is="stat.icon" :class="[stat.color, 'h-6 w-6']" />
            </div>
            <p class="ml-16 truncate text-sm font-medium text-gray-500">{{ stat.name }}</p>
          </dt>
          <dd class="ml-16 flex items-baseline">
            <p class="text-2xl font-semibold text-gray-900">{{ stat.value }}</p>
          </dd>
        </div>
      </div>

      <!-- Main content grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Recent Events -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Eventos Recientes
            </h3>
            <div class="space-y-4">
              <div
                v-for="event in recentEvents"
                :key="event.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h4 class="text-sm font-medium text-gray-900">{{ event.name }}</h4>
                  <p class="text-sm text-gray-500">{{ new Date(event.date).toLocaleDateString() }}</p>
                </div>
                <div class="flex items-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      event.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      event.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ event.status === 'ACTIVE' ? 'Activo' : 
                       event.status === 'PLANNED' ? 'Planificado' : 'Completado' }}
                  </span>
                </div>
              </div>
              
              <div v-if="recentEvents.length === 0" class="text-center py-6">
                <CalendarDaysIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
                <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo evento.</p>
                <div class="mt-6">
                  <router-link
                    to="/events/new"
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bmx-gradient hover:opacity-90"
                  >
                    Crear Evento
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Races -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Próximas Carreras
            </h3>
            <div class="space-y-4">
              <div
                v-for="race in upcomingRaces"
                :key="race.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h4 class="text-sm font-medium text-gray-900">{{ race.name }}</h4>
                  <p class="text-sm text-gray-500">{{ race.event }}</p>
                  <p class="text-xs text-gray-400">{{ race.time }}</p>
                </div>
                <div class="flex items-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      race.status === 'En progreso' ? 'bg-yellow-100 text-yellow-800' :
                      race.status === 'Próxima' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ race.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <router-link
              to="/events/new"
              class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300"
            >
              <div>
                <span class="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <CalendarDaysIcon class="h-6 w-6" />
                </span>
              </div>
              <div class="mt-4">
                <h3 class="text-lg font-medium">
                  <span class="absolute inset-0" />
                  Nuevo Evento
                </h3>
                <p class="mt-2 text-sm text-gray-500">
                  Crear un nuevo evento de carreras BMX
                </p>
              </div>
            </router-link>

            <router-link
              to="/riders/new"
              class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300"
            >
              <div>
                <span class="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <UserGroupIcon class="h-6 w-6" />
                </span>
              </div>
              <div class="mt-4">
                <h3 class="text-lg font-medium">
                  <span class="absolute inset-0" />
                  Nuevo Corredor
                </h3>
                <p class="mt-2 text-sm text-gray-500">
                  Registrar un nuevo corredor
                </p>
              </div>
            </router-link>

            <router-link
              to="/results"
              class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300"
            >
              <div>
                <span class="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <TrophyIcon class="h-6 w-6" />
                </span>
              </div>
              <div class="mt-4">
                <h3 class="text-lg font-medium">
                  <span class="absolute inset-0" />
                  Ingresar Resultados
                </h3>
                <p class="mt-2 text-sm text-gray-500">
                  Capturar resultados de carreras
                </p>
              </div>
            </router-link>

            <router-link
              to="/reports"
              class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300"
            >
              <div>
                <span class="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                  <ChartBarIcon class="h-6 w-6" />
                </span>
              </div>
              <div class="mt-4">
                <h3 class="text-lg font-medium">
                  <span class="absolute inset-0" />
                  Ver Reportes
                </h3>
                <p class="mt-2 text-sm text-gray-500">
                  Generar reportes y estadísticas
                </p>
              </div>
            </router-link>
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
