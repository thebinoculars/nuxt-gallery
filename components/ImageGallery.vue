<template>
  <div class="space-y-6">
    <!-- Controls -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">{{ totalImages }} images</h2>

      <div class="flex items-center space-x-4">
        <button :disabled="isUploading" class="btn-primary" @click="triggerFileInput">
          📷 Upload
        </button>

        <select v-model="sortBy" class="input-field w-auto" @change="handleSortChange">
          <option value="random">Random</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="largest">Largest</option>
          <option value="smallest">Smallest</option>
        </select>

        <button class="btn-secondary" @click="refreshGallery">Refresh</button>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Upload Loading Overlay -->
    <div
      v-if="isUploading"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"
        ></div>
        <p class="text-white text-lg">Uploading {{ uploadingCount }} images...</p>
        <p class="text-gray-400 text-sm mt-2">Please do not close this page</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && images.length === 0" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>

    <!-- Masonry Gallery -->
    <div
      v-if="images.length > 0"
      class="masonry-container"
      :class="{ 'drag-over': isDragOver }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragenter.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
    >
      <div
        v-for="(image, index) in images"
        :key="image._id"
        class="masonry-item group relative cursor-pointer"
        @click="openSlider(index)"
      >
        <div
          class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
        >
          <img
            :src="image.url"
            :alt="image.alt || 'Album image'"
            class="w-full h-auto object-cover"
          />

          <!-- Overlay with actions -->
          <div class="image-hover-overlay">
            <div class="flex items-center space-x-2">
              <button
                class="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                title="Download"
                @click.stop="downloadImage(image)"
              >
                📥
              </button>
              <button
                class="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                title="Info"
                @click.stop="showImageInfo(image)"
              >
                ℹ️
              </button>
              <button
                class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Delete"
                @click.stop="deleteImage(image._id)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore && images.length > 0" class="flex justify-center py-4">
      <button
        :disabled="isLoadingMore"
        class="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2"
        @click="loadMore"
      >
        <div
          v-if="isLoadingMore"
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"
        ></div>
        <span v-else>Load more</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="images.length === 0 && !isLoading" class="text-center py-12">
      <div class="text-6xl mb-4">📷</div>
      <h3 class="text-xl font-medium text-white mb-2">No images yet</h3>
      <p class="text-gray-400">Upload your first images!</p>
    </div>
  </div>

  <!-- Image Slider Modal -->
  <ImageSlider
    v-if="showSlider"
    :images="images"
    :current-index="currentImageIndex"
    @close="closeSlider"
    @next="nextImage"
    @prev="prevImage"
    @go-to="goToImage"
  />

  <!-- Image Info Modal -->
  <ImageInfoModal
    v-if="selectedImageInfo"
    :image="selectedImageInfo"
    @close="selectedImageInfo = null"
  />
</template>

<script setup>
import ImageSlider from './ImageSlider.vue'
import ImageInfoModal from './ImageInfoModal.vue'

// Props
const props = defineProps({
  albumId: {
    type: String,
    required: true,
  },
})

// Data
const images = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isUploading = ref(false)
const uploadingCount = ref(0)
const isDragOver = ref(false)
const sortBy = ref('random')
const currentPage = ref(1)
const itemsPerPage = 20
const hasMore = ref(true)
const totalImages = ref(0)

// Modal states
const showSlider = ref(false)
const currentImageIndex = ref(0)
const selectedImageInfo = ref(null)

// Refs
const fileInput = ref(null)

// Computed
const { $toast } = useNuxtApp()

// Methods
const loadImages = async (reset = false) => {
  if (reset) {
    isLoading.value = true
    currentPage.value = 1
    images.value = []
  } else {
    isLoadingMore.value = true
  }

  try {
    const { data } = await $fetch(`/api/albums/${props.albumId}/images`, {
      query: {
        page: currentPage.value,
        limit: itemsPerPage,
        sort: sortBy.value,
      },
    })

    if (reset) {
      images.value = data.images || []
    } else {
      images.value.push(...(data.images || []))
    }

    totalImages.value = data.total || 0
    hasMore.value = data.hasMore || false
  } catch (error) {
    console.error('Error loading images:', error)
    $toast.error('Failed to load images!')
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return

  currentPage.value++
  await loadImages(false)
}

const handleSortChange = () => {
  loadImages(true)
}

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  uploadFiles(files)
  // Reset input
  event.target.value = ''
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  const files = Array.from(event.dataTransfer.files)
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length > 0) {
    uploadFiles(imageFiles)
  } else {
    $toast.error('Please only drag and drop image files!')
  }
}

const uploadFiles = async (files) => {
  if (files.length === 0) return

  // Validate file sizes
  const maxSize = 6 * 1024 * 1024 // 6MB
  const validFiles = files.filter((file) => {
    if (file.size > maxSize) {
      $toast.error(`File ${file.name}} is too large (max 10MB)`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  isUploading.value = true
  uploadingCount.value = validFiles.length

  const uploadPromises = validFiles.map((file) => uploadFile(file))

  try {
    const results = await Promise.all(uploadPromises)
    const successCount = results.filter((r) => r).length

    if (successCount > 0) {
      $toast.success(`Successfully uploaded ${successCount} images!`)
      await loadImages(true) // Refresh gallery
    }
  } catch (error) {
    console.error('Upload error:', error)
    $toast.error('An error occurred during upload!')
  } finally {
    isUploading.value = false
    uploadingCount.value = 0
  }
}

const uploadFile = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('albumId', props.albumId)

    const response = await $fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    return response.success
  } catch (error) {
    console.error('Error uploading file:', error)
    $toast.error(`Failed to upload ${file.name}`)
    return false
  }
}

const deleteImage = async (imageId) => {
  if (!confirm('Are you sure you want to delete this image?')) return

  try {
    await $fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
    })

    images.value = images.value.filter((img) => img._id !== imageId)
    totalImages.value--
    $toast.success('Image deleted!')
  } catch (error) {
    console.error('Error deleting image:', error)
    $toast.error('Failed to delete image!')
  }
}

const downloadImage = async (image) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = image.filename || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    $toast.success('Downloading...')
  } catch (error) {
    console.error('Download error:', error)
    $toast.error('Failed to download!')
  }
}

const showImageInfo = (image) => {
  selectedImageInfo.value = image
}

const openSlider = (index) => {
  currentImageIndex.value = index
  showSlider.value = true
}

const closeSlider = () => {
  showSlider.value = false
}

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++
  }
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const goToImage = (index) => {
  currentImageIndex.value = index
}

const refreshGallery = () => {
  loadImages(true)
}

// Initialize
onMounted(() => {
  loadImages(true)
})

// Infinite scroll
onMounted(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      if (hasMore.value && !isLoadingMore.value) {
        loadMore()
      }
    }
  }

  window.addEventListener('scroll', handleScroll)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>
