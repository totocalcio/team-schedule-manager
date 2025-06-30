<template>
  <div class="min-h-screen p-4 mb-24">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-5xl md:leading-[1.5] font-bold text-gradient mb-4">
          Team Schedule Manager
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Coordinate team schedules efficiently with our comprehensive calendar and availability management platform
        </p>
      </div>
      
      <!-- Main Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <button
          type="button"
          @click="showCreateModal = true"
          class="btn-primary flex items-center justify-center space-x-2 text-lg px-8 py-4 cursor-pointer"
        >
          <Plus class="w-6 h-6" />
          <span>Create New Calendar</span>
        </button>
        
        <button
          type="button"
          @click="refreshRecentCalendars"
          class="btn-ghost flex items-center justify-center space-x-2 text-lg px-8 py-4 cursor-pointer"
          :disabled="loadingRecent"
        >
          <Loader2 v-if="loadingRecent" class="w-6 h-6 animate-spin" />
          <RotateCcw v-else class="w-6 h-6" />
          <span>{{ loadingRecent ? 'Loading...' : 'Refresh' }}</span>
        </button>
        
        <button
          type="button"
          v-if="accessedCalendars.length > 0"
          @click="clearAllAccess"
          class="btn-ghost flex items-center justify-center space-x-2 text-lg px-8 py-4 text-red-600 hover:text-red-700 cursor-pointer"
        >
          <Trash2 class="w-6 h-6" />
          <span>Clear History</span>
        </button>
      </div>
      
      <!-- Recent Calendars -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Your Calendars</h2>
          <div class="text-sm text-gray-500">
            {{ accessedCalendars.length }} calendar{{ accessedCalendars.length !== 1 ? 's' : '' }} accessed
          </div>
        </div>
        
        <div v-if="recentCalendars.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CalendarCard
            v-for="calendar in recentCalendars"
            :key="calendar.id"
            :calendar="calendar"
            @select="selectCalendar"
            @delete="showDeleteModal"
          />
        </div>
        
        <div v-else-if="!loadingRecent" class="text-center py-12">
          <Calendar class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Calendars Accessed Yet</h3>
          <p class="text-gray-600 mb-6">Create your first calendar or access an existing one to get started</p>
          <button type="button" @click="showCreateModal = true" class="btn-primary cursor-pointer">
            Create Your First Calendar
          </button>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="glass rounded-xl p-6 animate-pulse">
            <div class="h-6 bg-gray-200 rounded mb-3"></div>
            <div class="h-4 bg-gray-200 rounded mb-4"></div>
            <div class="flex justify-between">
              <div class="h-4 bg-gray-200 rounded w-24"></div>
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Access by ID -->
      <div class="mb-12">
        <div class="card max-w-md mx-auto">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Access Calendar by ID</h3>
          <p class="text-gray-600 text-sm mb-4">
            If you have a calendar ID, you can access it directly
          </p>
          <form @submit.prevent="accessCalendarById" class="space-y-4">
            <input
              v-model="calendarIdInput"
              type="text"
              placeholder="Enter calendar ID"
              class="input-field"
              :disabled="loadingAccess"
            />
            <button
              type="submit"
              class="btn-primary w-full flex items-center justify-center space-x-2 cursor-pointer"
              :disabled="loadingAccess || !calendarIdInput.trim()"
            >
              <Loader2 v-if="loadingAccess" class="w-4 h-4 animate-spin" />
              <ExternalLink v-else class="w-4 h-4" />
              <span>{{ loadingAccess ? 'Accessing...' : 'Access Calendar' }}</span>
            </button>
          </form>
          <div v-if="accessError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{{ accessError }}</p>
          </div>
        </div>
      </div>
      
      <!-- Features -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div class="card text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Smart Team Coordination</h3>
          <p class="text-gray-600">Manage team members with real-time availability tracking and intelligent scheduling suggestions</p>
        </div>
        
        <div class="card text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Dynamic Time Management</h3>
          <p class="text-gray-600">Create flexible time slots with cross-timezone support and automated availability calculations</p>
        </div>
        
        <div class="card text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Interactive Calendar Views</h3>
          <p class="text-gray-600">Weekly schedule grid and monthly overview with visual availability indicators and instant updates</p>
        </div>
        
        <div class="card text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Discord Integration</h3>
          <p class="text-gray-600">Automated notifications when your team has 100% availability for tomorrow's activities</p>
        </div>
        
        <div class="card text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-secondary-600 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
          <p class="text-gray-600">Password-protected calendars with local access history and secure data management</p>
        </div>
        
        <div class="card text-center">
          <div class="w-16 h-16 bg-gradient-to-r from-accent-600 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Global Accessibility</h3>
          <p class="text-gray-600">Multi-timezone support with automatic time conversion and browser-based notifications</p>
        </div>
      </div>
      
      <!-- Privacy Notice -->
      <div class="card bg-blue-50 border-blue-200 max-w-2xl mx-auto">
        <div class="flex items-start space-x-3">
          <Shield class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-lg font-semibold text-blue-900 mb-2">Privacy Protection</h4>
            <p class="text-blue-800 text-sm">
              Your calendar access history is stored locally in your browser only. 
              Only calendars you've previously accessed will be visible to you. 
              No one else can see your calendar list.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Create Calendar Modal -->
      <CreateCalendarModal
        :show="showCreateModal"
        @close="showCreateModal = false"
        @created="handleCalendarCreated"
      />
      
      <!-- Delete Calendar Modal -->
      <DeleteCalendarModal
        :show="showDeleteCalendarModal"
        :calendar="calendarToDelete"
        @close="closeDeleteModal"
        @deleted="handleCalendarDeleted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Calendar, Users, Clock, RotateCcw, Loader2, ExternalLink, Shield, Trash2, MessageSquare, Globe } from 'lucide-vue-next'
import type { CalendarWithCounts } from '~/types'
import { useSupabase } from '~/utils/supabase'
import { 
  getAccessedCalendars, 
  addAccessedCalendar, 
  removeAccessedCalendar, 
  clearAccessedCalendars,
  type CalendarAccess 
} from '~/utils/calendar-access'

// SEO
useHead({
  title: 'Team Schedule Manager - Coordinate Team Availability',
  meta: [
    { name: 'description', content: 'Comprehensive team schedule management platform for coordinating availability and planning events efficiently.' }
  ]
})

const recentCalendars = ref<(CalendarWithCounts & { lastAccessed: string })[]>([])
const accessedCalendars = ref<CalendarAccess[]>([])
const showCreateModal = ref(false)
const loadingRecent = ref(false)
const calendarIdInput = ref('')
const loadingAccess = ref(false)
const accessError = ref('')
const showDeleteCalendarModal = ref(false)
const calendarToDelete = ref<CalendarWithCounts | null>(null)

const refreshRecentCalendars = async () => {
  loadingRecent.value = true
  accessError.value = ''
  
  try {
    // Get accessed calendars from localStorage
    accessedCalendars.value = getAccessedCalendars()
    
    if (accessedCalendars.value.length === 0) {
      recentCalendars.value = []
      return
    }
    
    const supabase = useSupabase()
    
    // Get calendar IDs from localStorage
    const calendarIds = accessedCalendars.value.map(c => c.id)
    
    // Fetch calendar details for accessed calendars only
    const { data: calendars, error: calendarsError } = await supabase
      .from('calendars')
      .select('id, name, description, created_at, updated_at, password_hash')
      .in('id', calendarIds)

    if (calendarsError) {
      console.error('Error fetching calendars:', calendarsError)
      throw new Error(`Database error: ${calendarsError.message}`)
    }

    if (!calendars || calendars.length === 0) {
      recentCalendars.value = []
      return
    }

    // Get counts for each calendar
    const calendarsWithCounts = await Promise.all(
      calendars.map(async (calendar) => {
        try {
          // Get member count
          const { count: memberCount, error: memberError } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('calendar_id', calendar.id)

          if (memberError) {
            console.error(`Error counting members for calendar ${calendar.id}:`, memberError)
          }

          // Get time slot count
          const { count: timeSlotCount, error: timeSlotError } = await supabase
            .from('time_slots')
            .select('*', { count: 'exact', head: true })
            .eq('calendar_id', calendar.id)

          if (timeSlotError) {
            console.error(`Error counting time slots for calendar ${calendar.id}:`, timeSlotError)
          }

          // Get last accessed time from localStorage
          const accessInfo = accessedCalendars.value.find(a => a.id === calendar.id)

          return {
            ...calendar,
            member_count: memberCount || 0,
            time_slot_count: timeSlotCount || 0,
            lastAccessed: accessInfo?.lastAccessed || new Date().toISOString()
          }
        } catch (error) {
          console.error(`Error processing calendar ${calendar.id}:`, error)
          const accessInfo = accessedCalendars.value.find(a => a.id === calendar.id)
          return {
            ...calendar,
            member_count: 0,
            time_slot_count: 0,
            lastAccessed: accessInfo?.lastAccessed || new Date().toISOString()
          }
        }
      })
    )

    // Sort by last accessed (most recent first)
    recentCalendars.value = calendarsWithCounts.sort((a, b) => 
      new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    )
  } catch (error) {
    console.error('Error in recent calendars:', error)
    recentCalendars.value = []
  } finally {
    loadingRecent.value = false
  }
}

const selectCalendar = (calendar: CalendarWithCounts) => {
  // Update access history
  addAccessedCalendar({ id: calendar.id, name: calendar.name })
  navigateTo(`/calendar/${calendar.id}`)
}

const handleCalendarCreated = (calendar: any) => {
  showCreateModal.value = false
  // Add to access history
  addAccessedCalendar({ id: calendar.id, name: calendar.name })
  navigateTo(`/calendar/${calendar.id}`)
}

const accessCalendarById = async () => {
  const calendarId = calendarIdInput.value.trim()
  if (!calendarId) return
  
  loadingAccess.value = true
  accessError.value = ''
  
  try {
    const supabase = useSupabase()
    
    // Check if calendar exists
    const { data: calendar, error } = await supabase
      .from('calendars')
      .select('id, name')
      .eq('id', calendarId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        accessError.value = 'Calendar not found. Please check the ID and try again.'
      } else {
        accessError.value = 'Failed to access calendar. Please try again.'
      }
      return
    }

    // Add to access history
    addAccessedCalendar({ id: calendar.id, name: calendar.name })
    
    // Navigate to calendar
    navigateTo(`/calendar/${calendar.id}`)
  } catch (error) {
    console.error('Error accessing calendar by ID:', error)
    accessError.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loadingAccess.value = false
  }
}

const removeCalendarAccess = (calendarId: string) => {
  removeAccessedCalendar(calendarId)
  refreshRecentCalendars()
}

const clearAllAccess = () => {
  if (confirm('Are you sure you want to clear all calendar access history? This cannot be undone.')) {
    clearAccessedCalendars()
    refreshRecentCalendars()
  }
}

const showDeleteModal = (calendar: CalendarWithCounts) => {
  calendarToDelete.value = calendar
  showDeleteCalendarModal.value = true
}

const closeDeleteModal = () => {
  showDeleteCalendarModal.value = false
  calendarToDelete.value = null
}

const handleCalendarDeleted = (calendar: CalendarWithCounts) => {
  // Remove from access history
  removeCalendarAccess(calendar.id)
  
  // Close modal
  closeDeleteModal()
  
  // Refresh the list
  refreshRecentCalendars()
}

const formatLastAccessed = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

// Load recent calendars on mount
onMounted(() => {
  refreshRecentCalendars()
})

// Clear access error when input changes
watch(() => calendarIdInput.value, () => {
  accessError.value = ''
})
</script>