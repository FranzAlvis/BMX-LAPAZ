<script setup>
import { TrophyIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left side - Branding -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div class="text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bmx-gradient">
            <TrophyIcon class="h-8 w-8 text-white" />
          </div>
          <h2 class="mt-6 text-3xl font-display font-bold tracking-tight text-gray-900">
            BMX Racing System
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Sistema de gestión de carreras BMX
          </p>
        </div>

        <div class="mt-8">
          <RouterView />
        </div>
      </div>
    </div>

    <!-- Right side - Hero image -->
    <div class="hidden lg:block relative flex-1">
      <div class="absolute inset-0 bmx-gradient opacity-90"></div>
      <div class="absolute inset-0 bg-black opacity-20"></div>
      <img
        class="absolute inset-0 h-full w-full object-cover"
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
        alt="BMX Racing"
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-4xl font-display font-bold mb-4">
            Gestión Profesional
          </h1>
          <p class="text-xl opacity-90">
            Para carreras BMX modernas
          </p>
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
