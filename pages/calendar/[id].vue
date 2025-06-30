<template>
  <div class="min-h-screen p-4 mb-24">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="navigateTo('/')"
            class="btn-ghost p-2"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <EditableText
              v-if="calendar"
              :value="calendar.name"
              label="calendar name"
              placeholder="Enter calendar name"
              text-class="text-3xl font-bold text-gray-900"
              @update="updateCalendarName"
            />
            <p v-if="calendar?.description" class="text-gray-600 mt-1">{{ calendar.description }}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="refreshData"
            class="btn-ghost p-2"
            :disabled="loading"
            title="Refresh data"
          >
            <RotateCcw :class="['w-5 h-5', loading && 'animate-spin']" />
          </button>
          
          <div class="flex items-center space-x-1 text-sm text-gray-500">
            <Users class="w-4 h-4" />
            <span>{{ members.length }} members</span>
          </div>
          
          <div class="flex items-center space-x-1 text-sm text-gray-500">
            <Clock class="w-4 h-4" />
            <span>{{ timeSlots.length }} time slots</span>
          </div>
          
          <button
            @click="showDeleteModal = true"
            class="btn-ghost p-2 text-red-600 hover:text-red-700"
            title="Delete calendar"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div v-for="i in 4" :key="i" class="glass rounded-xl p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded mb-4"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <AlertCircle class="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Failed to Load Calendar</h2>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <button @click="refreshData" class="btn-primary">Try Again</button>
      </div>
      
      <!-- Content -->
      <div v-else class="space-y-8">
        <!-- Calendar Overview -->
        <CalendarOverview
          :calendar-id="calendarId"
          :time-slots="timeSlots"
          :member-availability="memberAvailability"
        />
        
        <!-- Weekly Schedule Grid -->
        <WeeklyScheduleGrid
          :calendar-id="calendarId"
          :time-slots="timeSlots"
          :member-availability="memberAvailability"
          @refresh="refreshSchedules"
        />
        
        <!-- Management Panels -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Member Management -->
          <MemberManager
            :calendar-id="calendarId"
            :members="members"
            @refresh="refreshMembers"
          />
          
          <!-- Time Slot Management -->
          <TimeSlotManager
            :calendar-id="calendarId"
            :time-slots="timeSlots"
            @refresh="refreshTimeSlots"
          />
        </div>
        
        <!-- Discord Notifications -->
        <DiscordNotificationSettings
          :calendar-id="calendarId"
          :calendar-name="calendar?.name || 'Calendar'"
          @refresh="refreshData"
        />
      </div>
      
      <!-- Delete Calendar Modal -->
      <DeleteCalendarModal
        :show="showDeleteModal"
        :calendar="calendar"
        @close="showDeleteModal = false"
        @deleted="handleCalendarDeleted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Users, Clock, RotateCcw, AlertCircle, Trash2 } from 'lucide-vue-next'
import type { Calendar, Member, TimeSlot, MemberAvailability } from '~/types'
import { useSupabase } from '~/utils/supabase'
import { addAccessedCalendar } from '~/utils/calendar-access'

const route = useRoute()
const calendarId = route.params.id as string

// Data - Initialize refs before useHead
const calendar = ref<Calendar | null>(null)
const members = ref<Member[]>([])
const timeSlots = ref<TimeSlot[]>([])
const memberAvailability = ref<MemberAvailability[]>([])

// State
const loading = ref(true)
const error = ref<string | null>(null)
const showDeleteModal = ref(false)

// SEO
useHead({
  title: computed(() => calendar.value ? `${calendar.value.name} - Team Schedule Manager` : 'Loading...'),
  meta: [
    { name: 'description', content: 'Manage team schedules, availability, and coordination for your calendar.' }
  ]
})

// Methods
const loadCalendar = async () => {
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .eq('id', calendarId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Calendar not found')
      }
      throw new Error(error.message)
    }

    calendar.value = data
    
    // Add to access history when successfully loaded
    addAccessedCalendar({ id: data.id, name: data.name })
  } catch (err: any) {
    console.error('Error loading calendar:', err)
    throw new Error('Failed to load calendar details')
  }
}

const refreshMembers = async () => {
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    members.value = data || []
  } catch (err: any) {
    console.error('Error loading members:', err)
    throw new Error('Failed to load members')
  }
}

const refreshTimeSlots = async () => {
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    timeSlots.value = data || []
  } catch (err: any) {
    console.error('Error loading time slots:', err)
    throw new Error('Failed to load time slots')
  }
}

const refreshSchedules = async () => {
  try {
    const supabase = useSupabase()
    
    // Get current week dates from the WeeklyScheduleGrid component
    // We need to ensure we're getting the right week range
    const now = new Date()
    const dates = getCurrentWeekDates(now)
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]
    
    console.log('Refreshing schedules for date range:', { startDate, endDate })
    
    // Get time slots
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('start_time', { ascending: true })

    if (timeSlotsError) {
      throw new Error(`Time slots error: ${timeSlotsError.message}`)
    }

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('created_at', { ascending: true })

    if (membersError) {
      throw new Error(`Members error: ${membersError.message}`)
    }

    // Get schedules for a wider date range to ensure we have all needed data
    // Expand the range by 2 weeks on each side to handle week navigation
    const expandedStartDate = new Date(startDate)
    expandedStartDate.setDate(expandedStartDate.getDate() - 14)
    const expandedEndDate = new Date(endDate)
    expandedEndDate.setDate(expandedEndDate.getDate() + 14)
    
    let schedulesQuery = supabase
      .from('schedules')
      .select('*')
      .eq('calendar_id', calendarId)
      .gte('date', expandedStartDate.toISOString().split('T')[0])
      .lte('date', expandedEndDate.toISOString().split('T')[0])

    const { data: schedules, error: schedulesError } = await schedulesQuery

    if (schedulesError) {
      throw new Error(`Schedules error: ${schedulesError.message}`)
    }

    console.log('Loaded schedules:', schedules?.length || 0)

    // Transform schedules into member availability format
    const memberAvailabilityData: MemberAvailability[] = (members || [])
      .filter(member => member && member.id && member.name)
      .map(member => {
        const memberSchedules: { [date: string]: { [time_slot_id: string]: any } } = {}
        
        const memberSchedulesList = (schedules || []).filter(schedule => 
          schedule && 
          schedule.member_id === member.id &&
          schedule.date && 
          schedule.time_slot_id
        )
        
        memberSchedulesList.forEach(schedule => {
          if (!memberSchedules[schedule.date]) {
            memberSchedules[schedule.date] = {}
          }
          memberSchedules[schedule.date][schedule.time_slot_id] = schedule
        })
        
        return {
          member_id: member.id,
          member_name: member.name,
          schedules: memberSchedules
        }
      })
    
    memberAvailability.value = memberAvailabilityData
    
    console.log('Updated member availability:', memberAvailabilityData.length)
  } catch (err: any) {
    console.error('Error loading schedules:', err)
    throw err
  }
}

const refreshData = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      loadCalendar(),
      refreshMembers(),
      refreshTimeSlots(),
      refreshSchedules()
    ])
  } catch (err: any) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

const handleCalendarDeleted = (deletedCalendar: Calendar) => {
  showDeleteModal.value = false
  // Navigate back to home page
  navigateTo('/')
}

const updateCalendarName = async (newName: string) => {
  if (!calendar.value || !newName.trim()) return
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('calendars')
      .update({ name: newName.trim() })
      .eq('id', calendarId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update local state
    calendar.value.name = newName.trim()
    
    // Update access history with new name
    addAccessedCalendar({ id: calendar.value.id, name: newName.trim() })
  } catch (error: any) {
    console.error('Error updating calendar name:', error)
    throw error
  }
}

// Watch for member changes and refresh schedules
watch(() => members.value.length, (newLength, oldLength) => {
  if (oldLength !== undefined && newLength !== oldLength) {
    // Refresh schedules when members are added or removed
    setTimeout(() => {
      refreshSchedules()
    }, 100)
  }
}, { flush: 'post' })

// Initialize
onMounted(() => {
  refreshData()
})

// Handle route changes (if navigating between calendars)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== calendarId) {
    window.location.reload() // Simple reload for route changes
  }
})
</script>