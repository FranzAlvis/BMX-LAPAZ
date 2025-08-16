<script setup>
import { TrophyIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Left side - Login Form -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative">
      <!-- Floating geometric shapes for visual interest -->
      <div class="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
      <div class="absolute bottom-32 right-16 w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg opacity-10 animate-bounce" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/3 right-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-10 animate-pulse" style="animation-delay: 2s;"></div>
      
      <div class="mx-auto w-full max-w-md relative z-10">
        <!-- Modern card container -->
        <div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
          <div class="text-center mb-8">
            <!-- Modern logo design -->
            <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bmx-modern-gradient shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
              <TrophyIcon class="h-10 w-10 text-white" />
            </div>
            <h2 class="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              BMX Racing System
            </h2>
            <p class="mt-3 text-sm text-gray-500 font-medium">
              Bienvenido de vuelta • Inicia sesión para continuar
            </p>
          </div>

          <div class="space-y-6">
            <RouterView />
          </div>
        </div>
        
        <!-- Footer text -->
        <p class="mt-8 text-center text-xs text-gray-400">
          © 2024 BMX Racing System. Gestión profesional para carreras modernas.
        </p>
      </div>
    </div>

    <!-- Right side - Enhanced Hero Section -->
    <div class="hidden lg:block relative flex-1 overflow-hidden">
      <!-- Gradient overlays -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/80 to-orange-500/90"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-full h-full" style="background-image: radial-gradient(circle at 25% 25%, white 2px, transparent 2px); background-size: 50px 50px;"></div>
      </div>
      
      <img
        class="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
        alt="BMX Racing"
      />
      
      <!-- Content -->
      <div class="absolute inset-0 flex flex-col justify-center items-center text-center px-12">
        <div class="max-w-lg animate-fade-in">
          <h1 class="text-5xl font-display font-bold mb-6 text-white leading-tight">
            Gestión
            <span class="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Profesional
            </span>
          </h1>
          <p class="text-xl text-white/90 mb-8 leading-relaxed">
            Sistema completo para la gestión de carreras BMX modernas con tecnología de vanguardia
          </p>
          
          <!-- Feature highlights -->
          <div class="grid grid-cols-1 gap-4 text-left">
            <div class="flex items-center space-x-3 text-white/80">
              <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span class="text-sm font-medium">Cronometraje en tiempo real</span>
            </div>
            <div class="flex items-center space-x-3 text-white/80">
              <div class="w-2 h-2 bg-green-400 rounded-full"></div>
              <span class="text-sm font-medium">Gestión de competidores</span>
            </div>
            <div class="flex items-center space-x-3 text-white/80">
              <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span class="text-sm font-medium">Reportes automáticos</span>
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

@keyframes slideUp {
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out;
}

.animate-fade-in {
  animation: fadeIn 1s ease-in-out;
}
</style>
