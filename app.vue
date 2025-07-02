<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Notifications -->
    <notifications position="top right" :max="3" classes="vue-notification-custom" />
  </div>
</template>

<script setup>
// Global error handling
onErrorCaptured((error) => {
  console.error('Global error:', error)
  $toast.error('An error occurred!')
  return false
})
</script>
