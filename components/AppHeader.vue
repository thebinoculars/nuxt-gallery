<template>
  <header class="bg-gray-800 shadow-sm border-b border-gray-700">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-4">
          <NuxtLink to="/" class="text-2xl font-bold text-blue-400"> Nuxt Album </NuxtLink>
        </div>

        <div class="flex items-center space-x-4">
          <div v-if="user" class="flex items-center space-x-3">
            <span class="text-sm text-gray-300">{{ user.email }}</span>
            <button class="text-red-400 hover:text-red-300 transition-colors" @click="logout">
              Logout
            </button>
          </div>
          <div v-else class="flex items-center space-x-3">
            <NuxtLink to="/login" class="btn-secondary"> Login </NuxtLink>
            <NuxtLink to="/register" class="btn-primary"> Register </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
const { user, logout } = useAuth()
</script>
