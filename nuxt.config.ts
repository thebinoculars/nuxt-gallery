// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  spaLoadingTemplate: false,
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Nuxt Gallery',
    },
  },
  nitro: {
    preset: 'netlify',
  },
})
