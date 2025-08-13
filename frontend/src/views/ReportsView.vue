<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const toast = useToast()

const events = ref([])
const selectedEvent = ref('')
const selectedReport = ref('')
const loading = ref(false)
const generating = ref(false)

const reportTypes = [
  {
    id: 'starting-list',
    name: 'Lista de Largada',
    description: 'Lista de corredores por carrera y heat',
    icon: UserGroupIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'results',
    name: 'Resultados',
    description: 'Resultados detallados por carrera',
    icon: TrophyIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'podium',
    name: 'Podios',
    description: 'Clasificación final por categoría',
    icon: TrophyIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    id: 'standings',
    name: 'Clasificación General',
    description: 'Puntuación acumulada por evento',
    icon: ChartBarIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'annual-ranking',
    name: 'Ranking Anual',
    description: 'Clasificación anual de corredores',
    icon: CalendarDaysIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    id: 'event-summary',
    name: 'Resumen de Evento',
    description: 'Resumen completo del evento',
    icon: DocumentTextIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
]

const canViewReports = computed(() => 
  authStore.canAccess(['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'])
)

const fetchEvents = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/events', {
      params: { limit: 100 }
    })
    events.value = response.data.events
  } catch (error) {
    toast.error('Error al cargar eventos')
  } finally {
    loading.value = false
  }
}

const generateReport = async (format = 'pdf') => {
  if (!selectedEvent.value || !selectedReport.value) {
    toast.warning('Selecciona un evento y tipo de reporte')
    return
  }

  try {
    generating.value = true
    
    const response = await api.get(`/api/reports/${selectedReport.value}`, {
      params: {
        eventId: selectedEvent.value,
        format: format
      },
      responseType: format === 'pdf' ? 'blob' : 'json'
    })

    if (format === 'pdf') {
      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      
      const eventName = events.value.find(e => e.id === selectedEvent.value)?.name || 'evento'
      const reportName = reportTypes.find(r => r.id === selectedReport.value)?.name || 'reporte'
      
      link.setAttribute('download', `${reportName}_${eventName}_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Reporte PDF generado correctamente')
    } else if (format === 'csv') {
      // Create download link for CSV
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      
      const eventName = events.value.find(e => e.id === selectedEvent.value)?.name || 'evento'
      const reportName = reportTypes.find(r => r.id === selectedReport.value)?.name || 'reporte'
      
      link.setAttribute('download', `${reportName}_${eventName}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Reporte CSV generado correctamente')
    }
    
  } catch (error) {
    toast.error('Error al generar reporte')
  } finally {
    generating.value = false
  }
}

const printReport = async () => {
  if (!selectedEvent.value || !selectedReport.value) {
    toast.warning('Selecciona un evento y tipo de reporte')
    return
  }

  try {
    generating.value = true
    
    const response = await api.get(`/api/reports/${selectedReport.value}`, {
      params: {
        eventId: selectedEvent.value,
        format: 'html'
      }
    })

    // Open print window
    const printWindow = window.open('', '_blank')
    printWindow.document.write(response.data.html)
    printWindow.document.close()
    printWindow.print()
    
    toast.success('Reporte enviado a impresión')
    
  } catch (error) {
    toast.error('Error al imprimir reporte')
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Reportes</h1>
      <p class="mt-1 text-sm text-gray-600">
        Genera reportes y estadísticas del sistema BMX
      </p>
    </div>

    <!-- Report Generator -->
    <div class="bg-white shadow rounded-lg mb-8">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Generar Reporte
        </h3>
        
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Event selection -->
          <div>
            <label for="event" class="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Evento
            </label>
            <select
              id="event"
              v-model="selectedEvent"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="">Selecciona un evento</option>
              <option v-for="event in events" :key="event.id" :value="event.id">
                {{ event.name }} - {{ new Date(event.date).toLocaleDateString() }}
              </option>
            </select>
          </div>

          <!-- Report type selection -->
          <div>
            <label for="report-type" class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              id="report-type"
              v-model="selectedReport"
              class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="">Selecciona un tipo de reporte</option>
              <option v-for="report in reportTypes" :key="report.id" :value="report.id">
                {{ report.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="mt-6 flex flex-wrap gap-3">
          <button
            @click="generateReport('pdf')"
            :disabled="!selectedEvent || !selectedReport || generating"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bmx-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon class="-ml-1 mr-2 h-5 w-5" />
            {{ generating ? 'Generando...' : 'Descargar PDF' }}
          </button>

          <button
            @click="generateReport('csv')"
            :disabled="!selectedEvent || !selectedReport || generating"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon class="-ml-1 mr-2 h-5 w-5" />
            Descargar CSV
          </button>

          <button
            @click="printReport"
            :disabled="!selectedEvent || !selectedReport || generating"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon class="-ml-1 mr-2 h-5 w-5" />
            Imprimir
          </button>
        </div>
      </div>
    </div>

    <!-- Report Types Grid -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="report in reportTypes"
        :key="report.id"
        :class="[
          'relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer',
          selectedReport === report.id ? 'border-blue-500 ring-2 ring-blue-500' : ''
        ]"
        @click="selectedReport = report.id"
      >
        <div>
          <span :class="[report.bgColor, 'rounded-lg inline-flex p-3 ring-4 ring-white']">
            <component :is="report.icon" :class="[report.color, 'h-6 w-6']" />
          </span>
        </div>
        <div class="mt-4">
          <h3 class="text-lg font-medium">
            {{ report.name }}
          </h3>
          <p class="mt-2 text-sm text-gray-500">
            {{ report.description }}
          </p>
        </div>
        
        <!-- Selection indicator -->
        <div
          v-if="selectedReport === report.id"
          class="absolute top-4 right-4 h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center"
        >
          <div class="h-2 w-2 bg-white rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Quick Reports Section -->
    <div class="mt-8 bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Reportes Rápidos
        </h3>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            @click="selectedReport = 'annual-ranking'; generateReport('pdf')"
            :disabled="generating"
            class="relative group bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 text-left"
          >
            <div class="flex items-center">
              <CalendarDaysIcon class="h-8 w-8 text-indigo-600" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900">Ranking Anual</h4>
                <p class="text-xs text-gray-500">Clasificación del año</p>
              </div>
            </div>
          </button>

          <button
            @click="selectedReport = 'event-summary'; generateReport('pdf')"
            :disabled="generating || !selectedEvent"
            class="relative group bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 text-left disabled:opacity-50"
          >
            <div class="flex items-center">
              <DocumentTextIcon class="h-8 w-8 text-gray-600" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900">Resumen Evento</h4>
                <p class="text-xs text-gray-500">Reporte completo</p>
              </div>
            </div>
          </button>

          <button
            @click="selectedReport = 'standings'; generateReport('pdf')"
            :disabled="generating || !selectedEvent"
            class="relative group bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 text-left disabled:opacity-50"
          >
            <div class="flex items-center">
              <ChartBarIcon class="h-8 w-8 text-purple-600" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900">Clasificación</h4>
                <p class="text-xs text-gray-500">Puntuación actual</p>
              </div>
            </div>
          </button>

          <button
            @click="selectedReport = 'podium'; generateReport('pdf')"
            :disabled="generating || !selectedEvent"
            class="relative group bg-white p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-300 text-left disabled:opacity-50"
          >
            <div class="flex items-center">
              <TrophyIcon class="h-8 w-8 text-yellow-600" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-gray-900">Podios</h4>
                <p class="text-xs text-gray-500">Ganadores</p>
              </div>
            </div>
          </button>
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
