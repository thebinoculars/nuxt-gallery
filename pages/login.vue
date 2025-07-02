<template>
  <NuxtLayout name="auth">
    <div class="card bg-gray-800 border border-gray-700">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-white">📸 Nuxt Gallery</h1>
        <p class="text-gray-300 mt-2">Sign in to continue</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-1"> Email </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="input-field bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="input-field bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="btn-primary w-full">
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-300">
          Don't have an account?
          <NuxtLink to="/register" class="text-blue-400 hover:text-blue-300 font-medium">
            Register now
          </NuxtLink>
        </p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({
  layout: false,
})

const { login } = useAuth()
const { $toast } = useNuxtApp()

const form = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true

  try {
    await login(form.email, form.password)
    $toast.success('Signed in successfully!')
    await navigateTo('/')
  } catch (error) {
    console.error('Login error:', error)
    $toast.error(error.message || 'Failed to sign in!')
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: 'Sign in - Nuxt Gallery',
})
</script>
