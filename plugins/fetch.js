export default defineNuxtPlugin(() => {
  const { token } = useAuth()

  // Override the global $fetch to include auth headers
  const originalFetch = globalThis.$fetch

  globalThis.$fetch = $fetch.create({
    onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401 && !response.data?.unauthenticated) {
        // Token expired or invalid, logout user
        const { logout } = useAuth()
        logout()
      }
    },
  })
})
