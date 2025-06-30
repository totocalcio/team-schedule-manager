<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    
    <!-- Bolt.new Link - Fixed Bottom Right -->
    <a
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed bottom-6 right-6 z-50 group transition-all duration-300 hover:scale-110"
      title="Made with Bolt.new"
    >
      <img
        src="/black_circle_360x360.png"
        alt="Made with Bolt.new"
        class="w-24 h-24 rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-300"
      />
    </a>
  </div>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
  titleTemplate: '%s - Team Schedule Manager',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'format-detection', content: 'telephone=no' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})

// Global error handling
onErrorCaptured((error) => {
  console.error('Global error caught:', error)
  return false
})
</script>