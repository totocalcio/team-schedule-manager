<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="card max-w-md w-full">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Create New Calendar</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>
      
      <form @submit.prevent="createCalendar" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Calendar Name *
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            class="input-field"
            placeholder="Enter calendar name"
            maxlength="100"
          />
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            class="input-field min-h-[100px] resize-none"
            placeholder="Optional description"
            maxlength="500"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password Protection (Optional)
          </label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            class="input-field"
            placeholder="Leave empty for no password protection"
            maxlength="100"
          />
          <p class="text-xs text-gray-500 mt-1">
            If set, this password will be required to delete the calendar
          </p>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-ghost cursor-pointer"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary flex items-center space-x-2 cursor-pointer"
            :disabled="loading || !formData.name.trim()"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Calendar v-else class="w-4 h-4" />
            <span>{{ loading ? 'Creating...' : 'Create Calendar' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Calendar, Loader2 } from 'lucide-vue-next'
import type { CreateCalendarRequest } from '~/types'
import { useSupabase } from '~/utils/supabase'

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  created: [calendar: any]
}>()

const loading = ref(false)
const formData = reactive<CreateCalendarRequest>({
  name: '',
  description: '',
  password: ''
})

const createCalendar = async () => {
  if (!formData.name.trim()) return
  
  loading.value = true
  
  try {
    const supabase = useSupabase()
    
    // Hash password if provided
    let passwordHash = null
    if (formData.password && formData.password.trim()) {
      const { hashPassword } = await import('~/utils/password')
      passwordHash = await hashPassword(formData.password.trim())
    }
    
    const { data, error } = await supabase
      .from('calendars')
      .insert([{
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        password_hash: passwordHash
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    emit('created', data)
    
    // Reset form
    formData.name = ''
    formData.description = ''
    formData.password = ''
  } catch (error) {
    console.error('Error creating calendar:', error)
    // You might want to show a toast notification here
  } finally {
    loading.value = false
  }
}

// Reset form when modal is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    formData.name = ''
    formData.description = ''
    formData.password = ''
  }
})
</script>