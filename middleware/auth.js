export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkMe, isLoading, user } = useAuth()

  if (import.meta.server) {
    return
  }

  // Skip auth check for login/register pages
  if (to.path === '/login' || to.path === '/register') {
    return
  }

  // If no user, try to check with server
  if (!user.value) {
    isLoading.value = true
    const isValid = await checkMe()
    isLoading.value = false

    if (!isValid) {
      return navigateTo('/login')
    }
  }
})
