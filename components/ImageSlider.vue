<template>
  <div
    class="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
    @click="handleBackgroundClick"
  >
    <div class="relative w-full h-full flex flex-col">
      <!-- Header Controls -->
      <div
        class="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4"
      >
        <div class="flex items-center justify-between">
          <div class="text-white">
            <span class="text-sm opacity-75">{{ currentIndex + 1 }} / {{ images.length }}</span>
            <h3 class="font-medium">{{ currentImage.filename || 'Untitled' }}</h3>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Zoom Controls -->
            <button
              :disabled="zoomLevel <= 0.5"
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50"
              title="Zoom out"
              @click="zoomOut"
            >
              🔍-
            </button>

            <span class="text-white text-sm px-2">{{ Math.round(zoomLevel * 100) }}%</span>

            <button
              :disabled="zoomLevel >= 3"
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50"
              title="Zoom in"
              @click="zoomIn"
            >
              🔍+
            </button>

            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              title="Reset zoom"
              @click="resetZoom"
            >
              ⚡
            </button>

            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              title="Close"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <button
        v-if="currentIndex > 0"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
        @click="$emit('prev')"
      >
        ←
      </button>

      <button
        v-if="currentIndex < images.length - 1"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
        @click="$emit('next')"
      >
        →
      </button>

      <!-- Main Image Container -->
      <div
        class="flex-1 flex items-center justify-center p-4 pt-20 pb-24 overflow-hidden"
        @wheel="handleWheel"
        @mousedown="startPan"
        @mousemove="handlePan"
        @mouseup="endPan"
        @mouseleave="endPan"
      >
        <div
          ref="imageContainer"
          class="relative"
          :style="{
            transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }"
        >
          <img
            :src="currentImage.url"
            :alt="currentImage.alt || 'Image'"
            class="max-w-full max-h-full object-contain select-none"
            draggable="false"
            @click.stop
          />
        </div>
      </div>

      <!-- Thumbnails Strip -->
      <div
        class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent p-4"
      >
        <div
          ref="thumbnailContainer"
          class="flex space-x-2 overflow-x-auto scrollbar-hide"
          style="scrollbar-width: none; -ms-overflow-style: none"
        >
          <button
            v-for="(image, index) in images"
            :key="image._id"
            :class="[
              'flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200',
              index === currentIndex
                ? 'border-white scale-110'
                : 'border-transparent opacity-60 hover:opacity-80 hover:scale-105',
            ]"
            @click="goToImage(index)"
          >
            <img
              :src="image.thumbnailUrl || image.url"
              :alt="image.alt"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  currentIndex: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['close', 'prev', 'next', 'go-to'])

// Zoom and Pan state
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastPanX = ref(0)
const lastPanY = ref(0)

// Refs
const thumbnailContainer = ref(null)
const imageContainer = ref(null)

const currentImage = computed(() => props.images[props.currentIndex])

// Handle background click to close
const handleBackgroundClick = (e) => {
  // Only close if clicking on the background, not on the image or controls
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

// Zoom functions
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
    // Reset pan if zoomed out too much
    if (zoomLevel.value <= 1) {
      panX.value = 0
      panY.value = 0
    }
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

// Pan functions
const startPan = (e) => {
  if (zoomLevel.value > 1) {
    isPanning.value = true
    lastPanX.value = e.clientX
    lastPanY.value = e.clientY
  }
}

const handlePan = (e) => {
  if (isPanning.value && zoomLevel.value > 1) {
    const deltaX = e.clientX - lastPanX.value
    const deltaY = e.clientY - lastPanY.value

    panX.value += deltaX / zoomLevel.value
    panY.value += deltaY / zoomLevel.value

    lastPanX.value = e.clientX
    lastPanY.value = e.clientY
  }
}

const endPan = () => {
  isPanning.value = false
}

// Wheel zoom
const handleWheel = (e) => {
  e.preventDefault()
  if (e.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const goToImage = (index) => {
  emit('go-to', index)
  resetZoom()

  // Scroll thumbnail into view
  nextTick(() => {
    scrollThumbnailIntoView(index)
  })
}

const scrollThumbnailIntoView = (index) => {
  if (!thumbnailContainer.value) return

  const container = thumbnailContainer.value
  const thumbnail = container.children[index]

  if (thumbnail) {
    const containerRect = container.getBoundingClientRect()
    const thumbnailRect = thumbnail.getBoundingClientRect()

    const scrollLeft = thumbnail.offsetLeft - containerRect.width / 2 + thumbnailRect.width / 2

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    })
  }
}

// Watch for index changes to scroll thumbnail
watch(
  () => props.currentIndex,
  (newIndex) => {
    resetZoom()
    nextTick(() => {
      scrollThumbnailIntoView(newIndex)
    })
  }
)

// Keyboard navigation
onMounted(() => {
  const handleKeydown = (e) => {
    switch (e.key) {
      case 'Escape':
        emit('close')
        break
      case 'ArrowLeft':
        if (props.currentIndex > 0) {
          emit('prev')
        }
        break
      case 'ArrowRight':
        if (props.currentIndex < props.images.length - 1) {
          emit('next')
        }
        break
      case '+':
      case '=':
        zoomIn()
        break
      case '-':
        zoomOut()
        break
      case '0':
        resetZoom()
        break
    }
  }

  document.addEventListener('keydown', handleKeydown)

  // Initial thumbnail scroll
  nextTick(() => {
    scrollThumbnailIntoView(props.currentIndex)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
