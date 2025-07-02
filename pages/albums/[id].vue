<template>
  <div class="space-y-6">
    <div v-if="album" class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button class="btn-secondary flex items-center space-x-2" @click="$router.back()">
          <span>←</span>
          <span>Back</span>
        </button>

        <div>
          <h1 class="text-3xl font-bold text-white">{{ album.name }}</h1>
          <p v-if="album.description" class="text-gray-300 mt-1">{{ album.description }}</p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <button class="btn-secondary" @click="showEditModal = true">✏️ Edit</button>
        <button
          class="btn-secondary text-red-400 hover:bg-red-900 hover:bg-opacity-20"
          @click="deleteAlbum"
        >
          🗑️ Delete Album
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>

    <div v-else-if="album">
      <ImageGallery :album-id="album._id" />
    </div>

    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">❌</div>
      <h3 class="text-xl font-medium text-white mb-2">Album not found</h3>
      <p class="text-gray-400 mb-4">This album might have been deleted or you don't have access.</p>
      <NuxtLink to="/" class="btn-primary"> Back to Album List </NuxtLink>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      @click="closeEditModal"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-6" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Edit Album</h3>
          <button class="text-gray-400 hover:text-white" @click="closeEditModal">✕</button>
        </div>

        <form class="space-y-4" @submit.prevent="updateAlbum">
          <div>
            <label for="editName" class="block text-sm font-medium text-gray-300 mb-1">
              Album Name
            </label>
            <input id="editName" v-model="editForm.name" type="text" required class="input-field" />
          </div>

          <div>
            <label for="editDescription" class="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="editDescription"
              v-model="editForm.description"
              rows="3"
              class="input-field resize-none"
            ></textarea>
          </div>

          <div class="flex space-x-2 pt-4">
            <button type="submit" :disabled="isUpdating" class="btn-primary flex-1">
              {{ isUpdating ? 'Updating...' : 'Update' }}
            </button>

            <button type="button" class="btn-secondary flex-1" @click="closeEditModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

import ImageGallery from '~/components/ImageGallery.vue'

const route = useRoute()
const router = useRouter()
const { $toast } = useNuxtApp()

const album = ref(null)
const isLoading = ref(true)
const showEditModal = ref(false)
const isUpdating = ref(false)

const editForm = reactive({
  name: '',
  description: '',
})

const loadAlbum = async () => {
  try {
    const response = await $fetch(`/api/albums/${route.params.id}`)
    album.value = response.data
    editForm.name = album.value.name
    editForm.description = album.value.description || ''
  } catch (error) {
    console.error('Error loading album:', error)
    if (error.statusCode === 404) {
      $toast.error('Album not found!')
    } else {
      $toast.error('Failed to load album!')
    }
  } finally {
    isLoading.value = false
  }
}

const closeEditModal = () => {
  showEditModal.value = false
}

const updateAlbum = async () => {
  isUpdating.value = true
  try {
    const response = await $fetch(`/api/albums/${route.params.id}`, {
      method: 'PUT',
      body: editForm,
    })
    album.value = response.data
    closeEditModal()
    $toast.success('Album updated!')
  } catch (error) {
    console.error('Error updating album:', error)
    $toast.error('Failed to update album!')
  } finally {
    isUpdating.value = false
  }
}

const deleteAlbum = async () => {
  if (!confirm('Are you sure you want to delete this album? All photos inside will be deleted!')) {
    return
  }

  try {
    await $fetch(`/api/albums/${route.params.id}`, {
      method: 'DELETE',
    })

    $toast.success('Album deleted!')
    await router.push('/')
  } catch (error) {
    console.error('Error deleting album:', error)
    $toast.error('Failed to delete album!')
  }
}

onMounted(() => {
  loadAlbum()
})

useHead(() => ({
  title: album.value ? `${album.value.name} - Nuxt Gallery` : 'Album - Nuxt Gallery',
}))
</script>
