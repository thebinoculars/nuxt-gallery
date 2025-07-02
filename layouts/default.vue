<template>
  <div class="min-h-screen bg-gray-900">
    <Header />
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import Header from '~/components/AppHeader.vue'
</script>
