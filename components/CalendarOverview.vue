<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Calendar Overview</h2>
        <p class="text-gray-600">Monthly team availability at a glance</p>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="previousMonth" class="btn-ghost p-2">
          <ChevronLeft class="w-5 h-5" />
        </button>
        <button @click="nextMonth" class="btn-ghost p-2">
          <ChevronRight class="w-5 h-5" />
        </button>
        <button @click="goToCurrentMonth" class="btn-ghost text-sm">
          Today
        </button>
      </div>
    </div>

    <!-- Month and Year Display -->
    <div class="text-center mb-6">
      <h3 class="text-xl font-semibold text-gray-800">
        {{ getMonthYearDisplay() }}
      </h3>
    </div>

    <!-- Calendar Grid -->
    <div class="overflow-x-auto">
      <div class="min-w-full">
        <!-- Days of week header -->
        <div class="grid grid-cols-7 gap-2 mb-4">
          <div
            v-for="day in daysOfWeek"
            :key="day"
            class="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 rounded-lg"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar days -->
        <div class="grid grid-cols-7 gap-2 mb-6">
          <div
            v-for="date in calendarDates"
            :key="date.dateString"
            :class="[
              'min-h-[88px] rounded-lg border-2 transition-all duration-200 relative',
              date.isCurrentMonth 
                ? 'bg-white border-gray-200' 
                : 'bg-gray-50 border-gray-100 opacity-50',
              isToday(date.dateString) && date.isCurrentMonth
                ? 'ring-2 ring-primary-300 border-primary-300'
                : ''
            ]"
          >
            <!-- Date number -->
            <div class="absolute top-2 left-2">
              <span
                :class="[
                  'text-sm font-medium',
                  isToday(date.dateString) && date.isCurrentMonth
                    ? 'bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : date.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                ]"
              >
                {{ date.day }}
              </span>
            </div>

            <!-- Time slots for this date -->
            <div v-if="date.isCurrentMonth" class="pt-8 p-2 space-y-0.5">
              <div
                v-for="timeSlot in getFilteredTimeSlots(date.dateString).slice(0, 2)"
                :key="timeSlot.id"
                :class="[
                  'text-xs p-1 rounded cursor-pointer transition-all duration-200 hover:scale-105 leading-tight',
                  getAvailabilityStyle(timeSlot.id, date.dateString)
                ]"
                @click="showAvailabilityDetails(timeSlot, date.dateString)"
                :title="getAvailabilityTooltip(timeSlot, date.dateString)"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium truncate">{{ timeSlot.name }}</span>
                </div>
              </div>
              
              <!-- Show more indicator if there are more than 2 time slots -->
              <div
                v-if="getFilteredTimeSlots(date.dateString).length > 2"
                class="text-xs text-gray-500 p-1 cursor-pointer hover:text-gray-700 transition-colors"
                @click="showAllTimeSlotsForDate(date.dateString)"
              >
                +{{ getFilteredTimeSlots(date.dateString).length - 2 }} more
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="timeSlots.length === 0" class="text-center py-12">
          <Calendar class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Time Slots</h3>
          <p class="text-gray-600">Add time slots to see team availability overview</p>
        </div>
      </div>
    </div>

    <!-- Availability Details Modal -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click="closeDetailsModal"
    >
      <div class="card max-w-md w-full" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Availability Details</h3>
          <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-6 h-6" />
          </button>
        </div>

        <div v-if="selectedDetails" class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-700 mb-2">
              {{ selectedDetails.timeSlot.name }}
            </div>
            <div class="text-xs text-gray-500 mb-2">
              {{ formatTime(selectedDetails.timeSlot.start_time) }} - {{ formatTime(selectedDetails.timeSlot.end_time) }}
            </div>
            <div class="text-sm text-gray-600">
              {{ formatDate(selectedDetails.date) }}
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="text-sm font-medium text-gray-900">Member Status</h4>
            <div
              v-for="member in selectedDetails.memberStatuses"
              :key="member.id"
              class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
            >
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {{ member.name.charAt(0).toUpperCase() }}
                </div>
                <span class="text-sm font-medium text-gray-900">{{ member.name }}</span>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full font-medium',
                  getStatusBadgeColor(member.status)
                ]"
              >
                {{ getStatusText(member.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- All Time Slots Modal -->
    <div
      v-if="showAllTimeSlotsModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click="closeAllTimeSlotsModal"
    >
      <div class="card max-w-lg w-full max-h-[80vh] overflow-y-auto" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">All Time Slots</h3>
          <button @click="closeAllTimeSlotsModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-6 h-6" />
          </button>
        </div>

        <div v-if="selectedDateForAllSlots" class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-700">
              {{ formatDate(selectedDateForAllSlots) }}
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="timeSlot in getFilteredTimeSlots(selectedDateForAllSlots)"
              :key="timeSlot.id"
              :class="[
                'p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105',
                getAvailabilityStyle(timeSlot.id, selectedDateForAllSlots)
              ]"
              @click="showAvailabilityDetails(timeSlot, selectedDateForAllSlots)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-white">{{ timeSlot.name }}</div>
                  <div class="text-xs text-white/90">
                    {{ formatTime(timeSlot.start_time) }} - {{ formatTime(timeSlot.end_time) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-white">
                    {{ getAvailabilityPercentage(timeSlot.id, selectedDateForAllSlots) }}%
                  </div>
                  <div class="text-xs text-white/90">
                    {{ getAvailableCount(timeSlot.id, selectedDateForAllSlots) }}/{{ getTotalMembers() }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend - moved to bottom -->
    <div class="flex items-center justify-center space-x-6 mt-6 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 rounded bg-gradient-to-r from-green-400 to-green-500 border-2"></div>
        <span class="text-sm text-gray-700">100% Available</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-blue-500"></div>
        <span class="text-sm text-gray-700">80%+ Available</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 rounded bg-gray-200 border-2 border-dashed border-gray-300"></div>
        <span class="text-sm text-gray-700">No data</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-vue-next'
import type { TimeSlot, MemberAvailability } from '~/types'

interface Props {
  calendarId: string
  timeSlots: TimeSlot[]
  memberAvailability: MemberAvailability[]
}

interface CalendarDate {
  dateString: string
  day: number
  isCurrentMonth: boolean
}

const props = defineProps<Props>()

const currentMonth = ref(new Date())
const showDetailsModal = ref(false)
const showAllTimeSlotsModal = ref(false)
const selectedDetails = ref<{
  timeSlot: TimeSlot
  date: string
  memberStatuses: Array<{ id: string; name: string; status: string | null }>
} | null>(null)
const selectedDateForAllSlots = ref<string | null>(null)

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarDates = computed((): CalendarDate[] => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  
  // Use UTC to avoid timezone issues
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  
  // Get the first Sunday of the calendar view
  const startDate = new Date(firstDay)
  startDate.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay())
  
  // Get the last Saturday of the calendar view
  const endDate = new Date(lastDay)
  endDate.setUTCDate(lastDay.getUTCDate() + (6 - lastDay.getUTCDay()))
  
  const dates: CalendarDate[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push({
      dateString: current.toISOString().split('T')[0],
      day: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === month
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }
  
  return dates
})

const previousMonth = () => {
  const newDate = new Date(currentMonth.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentMonth.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentMonth.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentMonth.value = newDate
}

const goToCurrentMonth = () => {
  currentMonth.value = new Date()
}

const getMonthYearDisplay = (): string => {
  return currentMonth.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

const isToday = (date: string): boolean => {
  // Get today's date in local timezone but format consistently
  const today = new Date()
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return date === todayString
}

const getTotalMembers = (): number => {
  return props.memberAvailability.length
}

const getAvailableCount = (timeSlotId: string, date: string): number => {
  return props.memberAvailability.filter(member => {
    const status = member.schedules[date]?.[timeSlotId]?.status
    return status === 'available'
  }).length
}

const getMaybeCount = (timeSlotId: string, date: string): number => {
  return props.memberAvailability.filter(member => {
    const status = member.schedules[date]?.[timeSlotId]?.status
    return status === 'maybe'
  }).length
}

const getAvailabilityPercentage = (timeSlotId: string, date: string): number => {
  const totalMembers = getTotalMembers()
  if (totalMembers === 0) return 0
  
  const availableCount = getAvailableCount(timeSlotId, date)
  const maybeCount = getMaybeCount(timeSlotId, date)
  
  // Count "maybe" as 0.5 availability
  const effectiveAvailable = availableCount + (maybeCount * 0.5)
  
  return Math.round((effectiveAvailable / totalMembers) * 100)
}

const getAvailabilityStyle = (timeSlotId: string, date: string): string => {
  const percentage = getAvailabilityPercentage(timeSlotId, date)
  const totalMembers = getTotalMembers()
  
  if (totalMembers === 0) {
    return 'bg-gray-200 border-gray-300 border-dashed text-gray-500'
  }
  
  if (percentage === 100) {
    return 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-sm'
  } else if (percentage >= 80) {
    return 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-sm'
  } else if (percentage >= 50) {
    return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-sm'
  } else if (percentage > 0) {
    return 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-sm'
  } else {
    return 'bg-gray-200 border-gray-300 border-dashed text-gray-500'
  }
}

const getFilteredTimeSlots = (date: string) => {
  // Always show only time slots with 80%+ availability
  return props.timeSlots.filter(timeSlot => {
    const percentage = getAvailabilityPercentage(timeSlot.id, date)
    return percentage >= 80
  })
}

const getAvailabilityTooltip = (timeSlot: TimeSlot, date: string): string => {
  const percentage = getAvailabilityPercentage(timeSlot.id, date)
  const availableCount = getAvailableCount(timeSlot.id, date)
  const totalMembers = getTotalMembers()
  
  return `${timeSlot.name} - ${formatShortDate(date)}\n${percentage}% available (${availableCount}/${totalMembers} members)`
}

const showAvailabilityDetails = (timeSlot: TimeSlot, date: string) => {
  const memberStatuses = props.memberAvailability.map(member => ({
    id: member.member_id,
    name: member.member_name,
    status: member.schedules[date]?.[timeSlot.id]?.status || null
  }))

  selectedDetails.value = {
    timeSlot,
    date,
    memberStatuses
  }
  
  showDetailsModal.value = true
  showAllTimeSlotsModal.value = false
}

const showAllTimeSlotsForDate = (date: string) => {
  selectedDateForAllSlots.value = date
  showAllTimeSlotsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedDetails.value = null
}

const closeAllTimeSlotsModal = () => {
  showAllTimeSlotsModal.value = false
  selectedDateForAllSlots.value = null
}

const getStatusBadgeColor = (status: string | null): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case 'maybe':
      return 'bg-yellow-100 text-yellow-800'
    case 'unavailable':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
</script>