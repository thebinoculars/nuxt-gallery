<template>
  <div
    class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
    @click="$emit('close')"
  >
    <div class="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-6" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">Image Information</h3>
        <button class="text-gray-400 hover:text-white" @click="$emit('close')">✕</button>
      </div>

      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">File name: </span>
          <span class="font-medium text-white text-right max-w-48" :title="image.filename || 'N/A'">
            {{ truncateText(image.filename || 'N/A', 20) }}
          </span>
        </div>

        <div class="flex justify-between">
          <span class="text-gray-400">File size: </span>
          <span class="font-medium text-white">{{ formatFileSize(image.size) }}</span>
        </div>

        <div class="flex justify-between">
          <span class="text-gray-400">Format: </span>
          <span class="font-medium text-white">{{ image.format?.toUpperCase() || 'N/A' }}</span>
        </div>

        <div class="flex justify-between">
          <span class="text-gray-400">Dimensions: </span>
          <span class="font-medium text-white"
            >{{ image.width || 0 }} × {{ image.height || 0 }}</span
          >
        </div>

        <div class="flex justify-between">
          <span class="text-gray-400">Uploaded at: </span>
          <span class="font-medium text-white">{{ formatDate(image.createdAt) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex space-x-2 pt-4 border-t border-gray-700 mt-4">
        <button class="btn-primary flex-1" @click="downloadImage">📥 Download</button>
        <button class="btn-secondary flex-1" @click="copyUrl">🔗 Copy URL</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  image: {
    type: Object,
    required: true,
  },
})

defineEmits(['close'])

const { $toast } = useNuxtApp()

const truncateText = (text, maxLength) => {
  if (!text) return 'N/A'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const downloadImage = async () => {
  try {
    const response = await fetch(props.image.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = props.image.filename || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    $toast.success('Downloading...')
  } catch (error) {
    $toast.error('Failed to download!')
  }
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.image.url)
    $toast.success('URL copied!')
  } catch (error) {
    $toast.error('Failed to copy URL!')
  }
}
</script>
