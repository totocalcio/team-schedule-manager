<template>
  <div class="flex items-center space-x-2 group">
    <div v-if="!isEditing" class="flex items-center space-x-2 flex-1">
      <span :class="textClass">{{ displayValue }}</span>
      <button
        @click="startEditing"
        class="p-1 rounded hover:bg-gray-100"
        :title="`Edit ${label}`"
      >
        <Edit class="w-4 h-4 text-gray-500 hover:text-gray-700" />
      </button>
    </div>
    
    <div v-else class="flex items-center space-x-2 flex-1">
      <input
        ref="inputRef"
        v-model="editValue"
        :type="inputType"
        :class="[
          'flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          inputClass
        ]"
        :placeholder="placeholder"
        :maxlength="maxLength"
        @keydown.enter="handleEnterKey"
        @keydown.escape="cancelEdit"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @blur="saveEdit"
      />
      <button
        @click="saveEdit"
        class="p-1 rounded hover:bg-green-100 text-green-600"
        :disabled="loading || !isValidValue"
        title="Save"
      >
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
        <Check v-else class="w-4 h-4" />
      </button>
      <button
        @click="cancelEdit"
        class="p-1 rounded hover:bg-red-100 text-red-600"
        :disabled="loading"
        title="Cancel"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Check, X, Loader2 } from 'lucide-vue-next'

interface Props {
  value: string
  label?: string
  placeholder?: string
  textClass?: string
  inputClass?: string
  inputType?: string
  maxLength?: number
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'text',
  placeholder: 'Enter text',
  textClass: '',
  inputClass: '',
  inputType: 'text',
  maxLength: 100,
  required: true
})

const emit = defineEmits<{
  update: [value: string]
}>()

const isEditing = ref(false)
const editValue = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement>()
const isComposing = ref(false)

const displayValue = computed(() => props.value || 'Untitled')

const isValidValue = computed(() => {
  if (props.required) {
    return editValue.value.trim().length > 0
  }
  return true
})

const startEditing = () => {
  editValue.value = props.value
  isEditing.value = true
  
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

const cancelEdit = () => {
  editValue.value = props.value
  isEditing.value = false
}

const saveEdit = async () => {
  if (!isValidValue.value) {
    cancelEdit()
    return
  }
  
  const newValue = editValue.value.trim()
  
  // If value hasn't changed, just cancel
  if (newValue === props.value) {
    cancelEdit()
    return
  }
  
  loading.value = true
  
  try {
    emit('update', newValue)
    isEditing.value = false
  } catch (error) {
    console.error('Error updating value:', error)
    // Keep editing mode open on error
  } finally {
    loading.value = false
  }
}

const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = () => {
  isComposing.value = false
}

const handleEnterKey = (event: KeyboardEvent) => {
  // IME入力中（変換中）の場合はEnterキーを無視
  if (isComposing.value) {
    return
  }
  
  // IME入力が完了している場合のみ保存処理を実行
  event.preventDefault()
  saveEdit()
}

// Watch for external value changes
watch(() => props.value, (newValue) => {
  if (!isEditing.value) {
    editValue.value = newValue
  }
})
</script>