<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="card max-w-md w-full">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Delete Calendar</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>
      
      <div class="mb-6">
        <div class="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle class="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 class="font-semibold text-red-900">Warning</h3>
            <p class="text-red-800 text-sm">
              This action cannot be undone. All members, time slots, and schedules will be permanently deleted.
            </p>
          </div>
        </div>
      </div>
      
      <div class="mb-6">
        <p class="text-gray-700 mb-4">
          Are you sure you want to delete "<strong>{{ calendar?.name }}</strong>"?
        </p>
        
        <div v-if="calendar?.password_hash" class="space-y-4">
          <div class="flex items-center space-x-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
            <Lock class="w-5 h-5" />
            <span class="text-sm font-medium">This calendar is password protected</span>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Enter password to confirm deletion *
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="input-field"
              placeholder="Enter calendar password"
              :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': passwordError }"
            />
            <p v-if="passwordError" class="text-red-600 text-sm mt-1">{{ passwordError }}</p>
          </div>
        </div>
        
        <div v-else class="bg-gray-50 p-3 rounded-lg">
          <p class="text-gray-600 text-sm">
            This calendar has no password protection. Click "Delete Calendar" to proceed.
          </p>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="btn-ghost cursor-pointer"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          @click="deleteCalendar"
          class="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
          :disabled="loading || (calendar?.password_hash && !password.trim())"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <Trash2 v-else class="w-4 h-4" />
          <span>{{ loading ? 'Deleting...' : 'Delete Calendar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, AlertTriangle, Lock, Trash2, Loader2 } from 'lucide-vue-next'
import type { Calendar } from '~/types'
import { useSupabase } from '~/utils/supabase'
import { verifyPassword } from '~/utils/password'

interface Props {
  show: boolean
  calendar: Calendar | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  deleted: [calendar: Calendar]
}>()

const loading = ref(false)
const password = ref('')
const passwordError = ref('')

const deleteCalendar = async () => {
  if (!props.calendar) return
  
  loading.value = true
  passwordError.value = ''
  
  try {
    // Verify password if calendar is password protected
    if (props.calendar.password_hash) {
      if (!password.value.trim()) {
        passwordError.value = 'Password is required'
        return
      }
      
      const isValidPassword = await verifyPassword(password.value.trim(), props.calendar.password_hash)
      if (!isValidPassword) {
        passwordError.value = 'Incorrect password'
        return
      }
    }
    
    const supabase = useSupabase()
    
    // Delete the calendar (cascade will handle related data)
    const { error } = await supabase
      .from('calendars')
      .delete()
      .eq('id', props.calendar.id)

    if (error) {
      throw new Error(error.message)
    }

    emit('deleted', props.calendar)
    
    // Reset form
    password.value = ''
    passwordError.value = ''
  } catch (error: any) {
    console.error('Error deleting calendar:', error)
    passwordError.value = error.message || 'Failed to delete calendar'
  } finally {
    loading.value = false
  }
}

// Reset form when modal is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    password.value = ''
    passwordError.value = ''
  }
})

// Clear password error when password changes
watch(() => password.value, () => {
  passwordError.value = ''
})
</script>