<template>
  <div class="card group cursor-pointer relative" @click="$emit('select', calendar)">
    <!-- Delete button -->
    
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {{ calendar.name }}
          <Lock v-if="calendar.password_hash" class="w-4 h-4 inline-block ml-2 text-amber-500" title="Password protected" />
        </h3>
        <p v-if="calendar.description" class="text-gray-600 mt-1">
          {{ calendar.description }}
        </p>
      </div>
      <button
        @click.stop="$emit('delete', calendar)"
        class="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex-shrink-0 ml-4 cursor-pointer"
        title="Delete calendar"
        type="button"
      >
        <Trash2 class="w-5 h-5" />
      </button>
    </div>
    
    <div class="flex items-center justify-between text-sm text-gray-500">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <Users class="w-4 h-4" />
          <span>{{ calendar.member_count || 0 }} members</span>
        </div>
        <div class="flex items-center space-x-1">
          <Clock class="w-4 h-4" />
          <span>{{ calendar.time_slot_count || 0 }} time slots</span>
        </div>
      </div>
      <span class="text-xs">
        {{ formatDate(calendar.updated_at) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Users, Clock, Trash2, Lock } from 'lucide-vue-next'
import type { CalendarWithCounts } from '~/types'

interface Props {
  calendar: CalendarWithCounts
}

defineProps<Props>()
defineEmits<{
  select: [calendar: CalendarWithCounts]
  delete: [calendar: CalendarWithCounts]
}>()

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>