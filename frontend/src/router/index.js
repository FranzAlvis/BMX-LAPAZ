import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layout Components
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// Page Components
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import EventsView from '@/views/EventsView.vue'
import RidersView from '@/views/RidersView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import RegistrationsView from '@/views/RegistrationsView.vue'
import RacesView from '@/views/RacesView.vue'
import ResultsView from '@/views/ResultsView.vue'
import ReportsView from '@/views/ReportsView.vue'
import AdminView from '@/views/AdminView.vue'

const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: LoginView,
        meta: { requiresGuest: true }
      }
    ]
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'events/new',
        name: 'CreateEvent',
        component: () => import('@/views/CreateEventView.vue'),
        meta: { roles: ['Admin', 'Secretaria'], title: 'Nuevo Evento' }
      },
      {
        path: 'events/:id/edit',
        name: 'EditEvent',
        component: () => import('@/views/EditEventView.vue'),
        meta: { roles: ['Admin', 'Secretaria'], title: 'Editar Evento' }
      },
      {
        path: 'events/:id',
        name: 'EventDetail',
        component: () => import('@/views/EventDetailView.vue'),
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Detalle del Evento' }
      },
      {
        path: 'events',
        name: 'Events',
        component: EventsView,
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Eventos' }
      },
      {
        path: 'riders/new',
        name: 'CreateRider',
        component: () => import('@/views/CreateRiderView.vue'),
        meta: { roles: ['Admin', 'Secretaria'], title: 'Nuevo Corredor' }
      },
      {
        path: 'riders/:id/edit',
        name: 'EditRider',
        component: () => import('@/views/EditRiderView.vue'),
        meta: { roles: ['Admin', 'Secretaria'], title: 'Editar Corredor' }
      },
      {
        path: 'riders/:id',
        name: 'RiderDetail',
        component: () => import('@/views/RiderDetailView.vue'),
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Detalle del Corredor' }
      },
      {
        path: 'riders',
        name: 'Riders',
        component: RidersView,
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Corredores' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: CategoriesView,
        meta: { roles: ['Admin', 'Secretaria'], title: 'Categorías' }
      },
      {
        path: 'registrations',
        name: 'Registrations',
        component: RegistrationsView,
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Inscripciones' }
      },
      {
        path: 'races',
        name: 'Races',
        component: RacesView,
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Carreras' }
      },
      {
        path: 'results',
        name: 'Results',
        component: ResultsView,
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Resultados' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
        meta: { roles: ['Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'], title: 'Reportes' }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: AdminView,
        meta: { roles: ['Admin'], title: 'Administración' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth state if not already done
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiredRoles = to.meta.roles

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else if (requiredRoles && authStore.isAuthenticated) {
    // Allow navigation but let individual components handle role-based UI
    next()
  } else {
    next()
  }
})

export default router
