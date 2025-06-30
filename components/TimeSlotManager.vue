<template>
  <div class="card">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Time Slots</h2>
    
    <!-- Add time slot form -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <form @submit.prevent="addTimeSlot" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="slotName" class="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              id="slotName"
              v-model="newTimeSlot.name"
              type="text"
              required
              class="input-field"
              placeholder="e.g., Morning Session"
            />
          </div>
          <div>
            <label for="startTime" class="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              id="startTime"
              v-model="newTimeSlot.start_time"
              type="time"
              required
              class="input-field"
            />
          </div>
          <div>
            <label for="endTime" class="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <input
              id="endTime"
              v-model="newTimeSlot.end_time"
              type="time"
              required
              class="input-field"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            type="submit"
            :class="[
              'btn-primary flex items-center space-x-2',
              (loading || !isValidTimeSlot) && 'opacity-50 cursor-not-allowed'
            ]"
            :disabled="loading || !isValidTimeSlot"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Clock v-else class="w-4 h-4" />
            <span>{{ loading ? 'Adding Time Slot...' : 'Add Time Slot' }}</span>
          </button>
        </div>
      </form>
    </div>
    
    <!-- Time slots list -->
    <div v-if="timeSlots.length > 0" class="space-y-3">
      <div
        v-for="timeSlot in timeSlots"
        :key="timeSlot.id"
        class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <div class="flex items-center space-x-3 flex-1">
          <div class="w-10 h-10 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full flex items-center justify-center text-white">
            <Clock class="w-5 h-5" />
          </div>
          <div class="flex-1 space-y-2">
            <!-- Editable name -->
            <EditableText
              :value="timeSlot.name"
              label="time slot name"
              placeholder="Enter time slot name"
              text-class="font-medium text-gray-900"
              @update="(newName) => updateTimeSlotName(timeSlot.id, newName)"
            />
            
            <!-- Editable times -->
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">Start:</span>
                <EditableText
                  :value="timeSlot.start_time"
                  label="start time"
                  placeholder="HH:MM"
                  input-type="time"
                  text-class="text-sm text-gray-600"
                  input-class="text-sm"
                  @update="(newTime) => updateTimeSlotStartTime(timeSlot.id, newTime)"
                />
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">End:</span>
                <EditableText
                  :value="timeSlot.end_time"
                  label="end time"
                  placeholder="HH:MM"
                  input-type="time"
                  text-class="text-sm text-gray-600"
                  input-class="text-sm"
                  @update="(newTime) => updateTimeSlotEndTime(timeSlot.id, newTime)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <button
          @click="deleteTimeSlot(timeSlot.id)"
          class="text-red-400 hover:text-red-600 transition-colors p-2"
          :title="`Remove ${timeSlot.name}`"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <Clock class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Time Slots Yet</h3>
      <p class="text-gray-600">Add time slots to define when team members can be available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Clock, Trash2, Loader2 } from 'lucide-vue-next'
import type { TimeSlot, CreateTimeSlotRequest } from '~/types'
import { useSupabase } from '~/utils/supabase'

interface Props {
  calendarId: string
  timeSlots: TimeSlot[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const showForm = ref(false)
const loading = ref(false)

const newTimeSlot = reactive<CreateTimeSlotRequest>({
  calendar_id: props.calendarId,
  name: '',
  start_time: '',
  end_time: ''
})

const isValidTimeSlot = computed(() => {
  if (!newTimeSlot.name.trim() || !newTimeSlot.start_time || !newTimeSlot.end_time) {
    return false
  }
  
  // 日をまたぐ時間帯（例：23:00 ~ 1:00）を許可
  // 開始時間と終了時間が同じでなければ有効とする
  return newTimeSlot.start_time !== newTimeSlot.end_time
})

const resetForm = () => {
  newTimeSlot.name = ''
  newTimeSlot.start_time = ''
  newTimeSlot.end_time = ''
}

const addTimeSlot = async () => {
  if (!isValidTimeSlot.value) return
  
  loading.value = true
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('time_slots')
      .insert([{
        calendar_id: props.calendarId,
        name: newTimeSlot.name.trim(),
        start_time: newTimeSlot.start_time,
        end_time: newTimeSlot.end_time
      }])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    
    resetForm()
    showForm.value = false
    emit('refresh')
  } catch (error) {
    console.error('Error adding time slot:', error)
  } finally {
    loading.value = false
  }
}

const deleteTimeSlot = async (timeSlotId: string) => {
  if (!confirm('Are you sure you want to remove this time slot? This will also remove all associated schedules.')) return
  
  try {
    const supabase = useSupabase()
    
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', timeSlotId)
      .eq('calendar_id', props.calendarId)

    if (error) {
      throw new Error(error.message)
    }
    
    emit('refresh')
  } catch (error) {
    console.error('Error deleting time slot:', error)
  }
}

const updateTimeSlotName = async (timeSlotId: string, newName: string) => {
  if (!newName.trim()) return
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('time_slots')
      .update({ name: newName.trim() })
      .eq('id', timeSlotId)
      .eq('calendar_id', props.calendarId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update local state
    const timeSlotIndex = props.timeSlots.findIndex(ts => ts.id === timeSlotId)
    if (timeSlotIndex !== -1) {
      props.timeSlots[timeSlotIndex].name = newName.trim()
    }
    
    emit('refresh')
  } catch (error: any) {
    console.error('Error updating time slot name:', error)
    throw error
  }
}

const updateTimeSlotStartTime = async (timeSlotId: string, newStartTime: string) => {
  if (!newStartTime.trim()) return
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('time_slots')
      .update({ start_time: newStartTime.trim() })
      .eq('id', timeSlotId)
      .eq('calendar_id', props.calendarId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update local state
    const timeSlotIndex = props.timeSlots.findIndex(ts => ts.id === timeSlotId)
    if (timeSlotIndex !== -1) {
      props.timeSlots[timeSlotIndex].start_time = newStartTime.trim()
    }
    
    emit('refresh')
  } catch (error: any) {
    console.error('Error updating time slot start time:', error)
    throw error
  }
}

const updateTimeSlotEndTime = async (timeSlotId: string, newEndTime: string) => {
  if (!newEndTime.trim()) return
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('time_slots')
      .update({ end_time: newEndTime.trim() })
      .eq('id', timeSlotId)
      .eq('calendar_id', props.calendarId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update local state
    const timeSlotIndex = props.timeSlots.findIndex(ts => ts.id === timeSlotId)
    if (timeSlotIndex !== -1) {
      props.timeSlots[timeSlotIndex].end_time = newEndTime.trim()
    }
    
    emit('refresh')
  } catch (error: any) {
    console.error('Error updating time slot end time:', error)
    throw error
  }
}
</script>