export default defineNuxtPlugin(async () => {
  const { init } = useAuth()

  // Initialize auth on app start
  await init()
})
