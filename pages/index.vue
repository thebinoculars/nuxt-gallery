<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-white">Albums List</h1>
      <button class="btn-primary" @click="showCreateModal = true">➕ Create New Album</button>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search albums..."
          class="input-field"
          @input="handleSearch"
        />
      </div>

      <select v-model="sortBy" class="input-field w-auto" @change="handleSortChange">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="name">Name A-Z</option>
        <option value="images">Most Images</option>
      </select>
    </div>

    <!-- Albums Grid -->
    <div v-if="isLoading" class="grid md:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="card animate-pulse">
        <div class="h-48 bg-gray-700 rounded mb-4"></div>
        <div class="h-4 bg-gray-700 rounded mb-2"></div>
        <div class="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="albums.length > 0" class="grid md:grid-cols-3 gap-6">
      <div
        v-for="album in albums"
        :key="album._id"
        class="card hover:shadow-xl transition-shadow duration-300 group relative hover:bg-gray-750"
      >
        <NuxtLink :to="`/albums/${album._id}`" class="block">
          <div class="h-48 bg-gray-700 rounded-lg mb-4 overflow-hidden">
            <img
              v-if="album.coverImage"
              :src="album.coverImage"
              :alt="album.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
              <div class="text-4xl">📷</div>
            </div>
          </div>

          <h3 class="font-semibold text-white group-hover:text-blue-400 transition-colors">
            {{ album.name }}
          </h3>
          <p class="text-sm text-gray-400 mt-1">
            {{ album.imageCount || 0 }} images • {{ formatDate(album.createdAt) }}
          </p>
        </NuxtLink>

        <!-- Album Actions -->
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="flex space-x-1">
            <button
              class="p-2 bg-gray-800 rounded-full shadow hover:bg-gray-700 transition-colors"
              title="Edit"
              @click="editAlbum(album)"
            >
              ✏️
            </button>
            <button
              class="p-2 bg-gray-800 rounded-full shadow hover:bg-red-900 transition-colors"
              title="Delete"
              @click="deleteAlbum(album._id)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">📸</div>
      <h3 class="text-xl font-medium text-white mb-2">
        {{ searchQuery ? 'No albums found' : 'No albums yet' }}
      </h3>
      <p class="text-gray-400 mb-4">
        {{
          searchQuery
            ? 'Try searching with a different keyword'
            : 'Create your first album to get started!'
        }}
      </p>
      <button v-if="!searchQuery" class="btn-primary" @click="showCreateModal = true">
        Create Your First Album
      </button>
    </div>

    <!-- Create Album Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      @click="closeCreateModal"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-6" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Create New Album</h3>
          <button class="text-gray-400 hover:text-white" @click="closeCreateModal">✕</button>
        </div>

        <form class="space-y-4" @submit.prevent="createAlbum">
          <div>
            <label for="createName" class="block text-sm font-medium text-gray-300 mb-1">
              Album Name *
            </label>
            <input
              id="createName"
              v-model="createForm.name"
              type="text"
              required
              class="input-field"
              placeholder="Enter album name..."
            />
          </div>

          <div>
            <label for="createDescription" class="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="createDescription"
              v-model="createForm.description"
              rows="3"
              class="input-field resize-none"
              placeholder="Short description about the album..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1"> Privacy </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input v-model="createForm.isPrivate" type="radio" :value="false" class="mr-2" />
                <span class="text-gray-300">Public - Visible to everyone</span>
              </label>
              <label class="flex items-center">
                <input v-model="createForm.isPrivate" type="radio" :value="true" class="mr-2" />
                <span class="text-gray-300">Private - Only you can see</span>
              </label>
            </div>
          </div>

          <div class="flex space-x-2 pt-4">
            <button type="submit" :disabled="isCreating" class="btn-primary flex-1">
              {{ isCreating ? 'Creating...' : 'Create Album' }}
            </button>

            <button type="button" class="btn-secondary flex-1" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Album Modal -->
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

const { $toast } = useNuxtApp()

const albums = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const sortBy = ref('newest')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const currentAlbum = ref(null)

// Debounce search
let searchTimeout = null

const createForm = reactive({
  name: '',
  description: '',
  isPrivate: false,
})

const editForm = reactive({
  name: '',
  description: '',
})

const loadAlbums = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/albums', {
      query: {
        search: searchQuery.value,
        sort: sortBy.value,
      },
    })
    albums.value = response.data || []
  } catch (error) {
    console.error('Error loading albums:', error)
    $toast.error('Failed to load albums!')
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadAlbums()
  }, 500)
}

const handleSortChange = () => {
  loadAlbums()
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.name = ''
  createForm.description = ''
  createForm.isPrivate = false
}

const createAlbum = async () => {
  isCreating.value = true

  try {
    const response = await $fetch('/api/albums', {
      method: 'POST',
      body: createForm,
    })

    closeCreateModal()
    $toast.success('Album created successfully!')

    // Navigate to the new album
    await navigateTo(`/albums/${response.data._id}`)
  } catch (error) {
    console.error('Error creating album:', error)
    $toast.error(error.data?.message || error.message || 'Failed to create album!')
  } finally {
    isCreating.value = false
  }
}

const editAlbum = (album) => {
  currentAlbum.value = album
  editForm.name = album.name
  editForm.description = album.description || ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  currentAlbum.value = null
}

const updateAlbum = async () => {
  if (!currentAlbum.value) return

  isUpdating.value = true

  try {
    const response = await $fetch(`/api/albums/${currentAlbum.value._id}`, {
      method: 'PUT',
      body: editForm,
    })

    // Update the album in the list
    const index = albums.value.findIndex((a) => a._id === currentAlbum.value._id)
    if (index !== -1) {
      albums.value[index] = { ...albums.value[index], ...response.data }
    }

    closeEditModal()
    $toast.success('Album updated!')
  } catch (error) {
    console.error('Error updating album:', error)
    $toast.error('Failed to update album!')
  } finally {
    isUpdating.value = false
  }
}

const deleteAlbum = async (albumId) => {
  if (!confirm('Are you sure? All images will be deleted.')) {
    return
  }

  try {
    await $fetch(`/api/albums/${albumId}`, {
      method: 'DELETE',
    })

    albums.value = albums.value.filter((album) => album._id !== albumId)
    $toast.success('Album deleted!')
  } catch (error) {
    console.error('Error deleting album:', error)
    $toast.error('Failed to delete album!')
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadAlbums()
})

useHead({
  title: 'Albums - Nuxt Gallery',
})
</script>
