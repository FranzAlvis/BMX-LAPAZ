<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initializeAuth()
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <RouterView />
  </div>
</template>

<style>
/* Global styles are in main.css */
</style>
