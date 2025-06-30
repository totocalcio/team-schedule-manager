<template>
  <div class="relative" data-dropdown @click="handleDropdownClick">
    <button
      ref="buttonRef"
      @click="toggleDropdown"
      :class="[
        'w-full text-xs p-1 rounded transition-all duration-200 hover:scale-105 flex items-center justify-between',
        getStatusColor(currentStatus)
      ]"
      :title="`${memberName} - ${getStatusText(currentStatus)}`"
    >
      <span class="truncate">{{ memberName.split(' ')[0] }}</span>
      <ChevronDown class="w-3 h-3 ml-1 flex-shrink-0" />
    </button>
    
    <!-- Dropdown Portal - render at body level -->
    <Teleport to="body" v-if="isOpen">
      <div
        class="fixed w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-[99999] overflow-hidden"
        :style="dropdownStyle"
        @click.stop
      >
        <button
          v-for="option in statusOptions"
          :key="option.value"
          @click="selectStatus(option.value)"
          :class="[
            'w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 border-none bg-transparent',
            currentStatus === option.value && 'bg-blue-50 text-blue-700'
          ]"
          type="button"
        >
          <div :class="['w-3 h-3 rounded-full', option.colorClass]"></div>
          <span>{{ option.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  memberName: string
  currentStatus: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  statusChange: [status: string | null]
  dropdownToggle: [isOpen: boolean, dropdownId: string]
}>()

const isOpen = ref(false)
const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`
const dropdownStyle = ref({})
const buttonRef = ref<HTMLElement>()

const statusOptions = [
  { value: 'available', label: 'Available', colorClass: 'bg-green-500' },
  { value: 'maybe', label: 'Maybe', colorClass: 'bg-yellow-500' },
  { value: 'unavailable', label: 'Unavailable', colorClass: 'bg-red-500' },
  { value: null, label: 'Not Set', colorClass: 'bg-gray-300' }
]

const calculateDropdownPosition = () => {
  if (!buttonRef.value) return {}
  
  const rect = buttonRef.value.getBoundingClientRect()
  const dropdownHeight = 32 * 4 + 8 // 4 options * 32px height + padding
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  
  // Calculate optimal position
  let top = rect.bottom + 4
  let left = rect.left
  
  // Adjust if dropdown would go below viewport
  if (top + dropdownHeight > viewportHeight) {
    top = rect.top - dropdownHeight - 4
  }
  
  // Adjust if dropdown would go beyond right edge
  if (left + 128 > viewportWidth) { // 128px = w-32
    left = viewportWidth - 128 - 8
  }
  
  // Ensure dropdown doesn't go beyond left edge
  if (left < 8) {
    left = 8
  }
  
  return {
    top: `${Math.max(8, top)}px`,
    left: `${left}px`
  }
}

const toggleDropdown = () => {
  const newState = !isOpen.value
  
  if (newState && buttonRef.value) {
    // Calculate position with viewport constraints
    dropdownStyle.value = calculateDropdownPosition()
  }
  
  isOpen.value = newState
  emit('dropdownToggle', newState, dropdownId)
}

const selectStatus = (status: string | null) => {
  emit('statusChange', status)
  isOpen.value = false
  emit('dropdownToggle', false, dropdownId)
}

// Prevent dropdown from closing when clicking inside
const handleDropdownClick = (event: Event) => {
  event.stopPropagation()
}

// Close dropdown when parent requests it
const closeDropdown = () => {
  isOpen.value = false
}

// Expose the close method to parent
defineExpose({
  closeDropdown
})

// Close dropdown when clicking outside or on scroll/resize
onMounted(() => {
  const handleClickOutside = (event: Event) => {
    const target = event.target as Element
    const dropdown = target.closest('[data-dropdown]')
    if (!dropdown) {
      if (isOpen.value) {
        isOpen.value = false
        emit('dropdownToggle', false, dropdownId)
      }
    }
  }
  
  const handleScroll = () => {
    if (isOpen.value) {
      // Recalculate position on scroll
      dropdownStyle.value = calculateDropdownPosition()
    }
  }
  
  const handleResize = () => {
    if (isOpen.value) {
      // Recalculate position on resize
      dropdownStyle.value = calculateDropdownPosition()
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true) // Use capture for all scroll events
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', handleScroll, true)
    window.removeEventListener('resize', handleResize)
  })
})

// Watch for button position changes (e.g., when grid layout changes)
watch(() => isOpen.value, (newValue) => {
  if (newValue) {
    // Recalculate position when dropdown opens
    nextTick(() => {
      dropdownStyle.value = calculateDropdownPosition()
    })
  }
})
</script>