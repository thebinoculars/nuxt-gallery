<template>
  <NuxtLayout name="auth">
    <div class="card bg-gray-800 border border-gray-700">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-white">Sign Up</h1>
        <p class="text-gray-300 mt-2">Create a new account to get started</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
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
            minlength="6"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            class="input-field bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="btn-primary w-full">
          {{ isLoading ? 'Signing up...' : 'Sign Up' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-300">
          Already have an account?
          <NuxtLink to="/login" class="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
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

const { register } = useAuth()
const { $toast } = useNuxtApp()

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
})

const isLoading = ref(false)

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    $toast.error('Password confirmation does not match!')
    return
  }

  if (form.password.length < 6) {
    $toast.error('Password must be at least 6 characters!')
    return
  }

  isLoading.value = true

  try {
    await register(form.email, form.password)
    $toast.success('Registration successful! Please wait for admin approval.')
    await navigateTo('/login')
  } catch (error) {
    console.error('Register error:', error)
    $toast.error(error.message || 'Failed to register!')
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: 'Sign Up - Nuxt Gallery',
})
</script>
