<template>
  <div class="card">
    <!-- Dropdown Manager - handles exclusive dropdown control -->
    <div ref="dropdownManager" class="hidden"></div>
    
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Weekly Schedule</h2>
        <p class="text-gray-600">{{ getWeekRange(dates) }}</p>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="previousWeek" class="btn-ghost p-2">
          <ChevronLeft class="w-5 h-5" />
        </button>
        <button @click="nextWeek" class="btn-ghost p-2">
          <ChevronRight class="w-5 h-5" />
        </button>
        <button @click="goToCurrentWeek" class="btn-ghost text-sm">
          Today
        </button>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <div class="min-w-full">
        <!-- Header with dates -->
        <div class="grid grid-cols-8 gap-1 mb-2">
          <div class="p-3 text-sm font-medium text-gray-700">
            Member / Time
          </div>
          <div
            v-for="date in dates"
            :key="date"
            class="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 rounded-lg"
          >
            <div>{{ getDayName(date) }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ formatShortDate(date) }}</div>
          </div>
        </div>
        
        <!-- Schedule grid -->
        <div v-if="timeSlots.length > 0 && memberAvailability.length > 0" class="space-y-1">
          <div
            v-for="timeSlot in timeSlots"
            :key="timeSlot.id"
            class="grid grid-cols-8 gap-1"
          >
            <!-- Time slot header -->
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-sm font-medium text-gray-900">{{ timeSlot.name }}</div>
              <div class="text-xs text-gray-500">
                {{ formatTime(timeSlot.start_time) }} - {{ formatTime(timeSlot.end_time) }}
              </div>
            </div>
            
            <!-- Member availability for this time slot -->
            <div
              v-for="date in dates"
              :key="`${timeSlot.id}-${date}`"
              class="min-h-[80px] bg-gray-50 rounded-lg p-1 space-y-1 relative"
            >
              <div
                v-for="member in memberAvailability"
                :key="`${member.member_id}-${timeSlot.id}-${date}`"
                class="relative"
              >
                <AvailabilityDropdown
                  :ref="(el) => registerDropdown(el, `${member.member_id}-${timeSlot.id}-${date}`)"
                  :member-name="member.member_name"
                  :current-status="getScheduleStatus(member, timeSlot.id, date)"
                  @status-change="(status) => updateAvailability(member.member_id, timeSlot.id, date, status)"
                  @dropdown-toggle="handleDropdownToggle"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else class="text-center py-12">
          <Calendar class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Schedule Data</h3>
          <p class="text-gray-600">
            {{ timeSlots.length === 0 ? 'Add time slots to get started' : 'Add members to see their availability' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'
import type { TimeSlot, MemberAvailability } from '~/types'
import { useSupabase } from '~/utils/supabase'

interface Props {
  calendarId: string
  timeSlots: TimeSlot[]
  memberAvailability: MemberAvailability[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

// Dropdown management
const dropdownRefs = ref<Map<string, any>>(new Map())
const activeDropdownId = ref<string | null>(null)

const registerDropdown = (el: any, key: string) => {
  if (el) {
    dropdownRefs.value.set(key, el)
  } else {
    dropdownRefs.value.delete(key)
  }
}

const handleDropdownToggle = (isOpen: boolean, dropdownId: string) => {
  if (isOpen) {
    // Close all other dropdowns when one opens
    if (activeDropdownId.value && activeDropdownId.value !== dropdownId) {
      const previousDropdown = Array.from(dropdownRefs.value.values())
        .find(dropdown => dropdown && typeof dropdown.closeDropdown === 'function')
      
      // Close all dropdowns
      dropdownRefs.value.forEach(dropdown => {
        if (dropdown && typeof dropdown.closeDropdown === 'function') {
          dropdown.closeDropdown()
        }
      })
    }
    activeDropdownId.value = dropdownId
  } else {
    if (activeDropdownId.value === dropdownId) {
      activeDropdownId.value = null
    }
  }
}

const currentWeekStart = ref(new Date())
const dates = computed(() => getCurrentWeekDates(currentWeekStart.value))

// Watch for week changes and refresh schedules
watch(() => currentWeekStart.value, () => {
  emit('refresh')
}, { flush: 'post' })

const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() - 7)
  currentWeekStart.value = newDate
}

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() + 7)
  currentWeekStart.value = newDate
}

const goToCurrentWeek = () => {
  currentWeekStart.value = new Date()
}

const getDayName = (date: string): string => {
  // Parse date string consistently to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  return dateObj.toLocaleDateString('en-US', { weekday: 'short' })
}

const getScheduleStatus = (member: MemberAvailability, timeSlotId: string, date: string): string | null => {
  return member.schedules[date]?.[timeSlotId]?.status || null
}

const updateAvailability = async (memberId: string, timeSlotId: string, date: string, newStatus: string | null) => {
  const member = props.memberAvailability.find(m => m.member_id === memberId)
  if (!member) return
  
  try {
    const supabase = useSupabase()
    
    if (newStatus === null) {
      // Delete the schedule entry
      const existingSchedule = member.schedules[date]?.[timeSlotId]
      if (existingSchedule) {
        try {
          const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('id', existingSchedule.id)
            .eq('calendar_id', props.calendarId)

          if (deleteError) {
            console.error('Delete error:', deleteError)
          }
          
          // Update local state immediately for better UX
          if (member.schedules[date]) {
            delete member.schedules[date][timeSlotId]
            // If no more schedules for this date, remove the date entry
            if (Object.keys(member.schedules[date]).length === 0) {
              delete member.schedules[date]
            }
          }
        } catch (deleteError) {
          // Still update local state for better UX in WebContainer environment
          if (member.schedules[date]) {
            delete member.schedules[date][timeSlotId]
            if (Object.keys(member.schedules[date]).length === 0) {
              delete member.schedules[date]
            }
          }
        }
      } else {
        // No existing schedule to delete
      }
    } else {
      // Create or update the schedule entry
      try {
        const { data, error } = await supabase
          .from('schedules')
          .upsert([{
            calendar_id: props.calendarId,
            member_id: memberId,
            time_slot_id: timeSlotId,
            date,
            status: newStatus,
            notes: null
          }], {
            onConflict: 'member_id,time_slot_id,date'
          })
          .select()
          .single()

        if (error) {
          console.error('Upsert error:', error)
        }
        
        // Update local state immediately
        if (!member.schedules[date]) {
          member.schedules[date] = {}
        }
        member.schedules[date][timeSlotId] = {
          ...(data || {
            id: `temp-${Date.now()}`,
            calendar_id: props.calendarId,
            member_id: memberId,
            time_slot_id: timeSlotId,
            date,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }),
          status: newStatus
        }
      } catch (createError) {
        // Still update local state for better UX
        if (!member.schedules[date]) {
          member.schedules[date] = {}
        }
        member.schedules[date][timeSlotId] = {
          id: `temp-${Date.now()}`,
          calendar_id: props.calendarId,
          member_id: memberId,
          time_slot_id: timeSlotId,
          date,
          status: newStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    }
    
    // Delayed refresh to sync with server state
    setTimeout(() => {
      emit('refresh')
    }, 500) // Reduced delay for better UX
  } catch (error) {
    // Delayed refresh on error to sync with server state
    setTimeout(() => {
      emit('refresh')
    }, 500)
  }
}
</script>