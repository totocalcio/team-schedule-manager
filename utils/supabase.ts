import { createClient } from '@supabase/supabase-js'

export const useSupabase = () => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl
  const supabaseAnonKey = config.public.supabaseAnonKey
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const formatTime = (time: string): string => {
  // Simply return the time in HH:MM format (24-hour)
  return time.substring(0, 5) // Extract HH:MM from HH:MM:SS
}

export const formatDate = (date: string): string => {
  // Parse date string consistently to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatShortDate = (date: string): string => {
  // Parse date string consistently to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export const getCurrentWeekDates = (startDate?: Date): string[] => {
  const today = startDate || new Date()
  
  // Use UTC to avoid timezone issues
  const year = today.getFullYear()
  const month = today.getMonth()
  const date = today.getDate()
  const dayOfWeek = today.getDay()
  
  // Create start date in UTC
  const start = new Date(Date.UTC(year, month, date - dayOfWeek))
  
  const dates = []
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(Date.UTC(year, month, date - dayOfWeek + i))
    dates.push(currentDate.toISOString().split('T')[0])
  }
  
  return dates
}

export const getWeekRange = (dates: string[]): string => {
  if (dates.length === 0) return ''
  
  const startDate = new Date(dates[0])
  const endDate = new Date(dates[dates.length - 1])
  
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  
  return `${start} - ${end}`
}

export const cycleAvailabilityStatus = (current: string | null): string | null => {
  switch (current) {
    case 'available':
      return 'maybe'
    case 'maybe':
      return 'unavailable'
    case 'unavailable':
      return null
    default:
      return 'available'
  }
}

export const getStatusColor = (status: string | null): string => {
  switch (status) {
    case 'available':
      return 'bg-green-500 text-white border-2 border-green-500'
    case 'maybe':
      return 'bg-yellow-500 text-white border-2 border-yellow-500'
    case 'unavailable':
      return 'bg-red-500 text-white border-2 border-red-500'
    default:
      return 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
  }
}

export const getStatusText = (status: string | null): string => {
  switch (status) {
    case 'available':
      return 'Available'
    case 'maybe':
      return 'Maybe'
    case 'unavailable':
      return 'Unavailable'
    default:
      return 'Click to set'
  }
}

export const calculateTeamAvailability = (
  memberAvailability: any[],
  timeSlotId: string,
  date: string
): {
  availableCount: number
  maybeCount: number
  unavailableCount: number
  totalCount: number
  percentage: number
} => {
  const totalCount = memberAvailability.length
  
  if (totalCount === 0) {
    return {
      availableCount: 0,
      maybeCount: 0,
      unavailableCount: 0,
      totalCount: 0,
      percentage: 0
    }
  }
  
  let availableCount = 0
  let maybeCount = 0
  let unavailableCount = 0
  
  memberAvailability.forEach(member => {
    const status = member.schedules[date]?.[timeSlotId]?.status
    switch (status) {
      case 'available':
        availableCount++
        break
      case 'maybe':
        maybeCount++
        break
      case 'unavailable':
        unavailableCount++
        break
    }
  })
  
  // Calculate percentage with "maybe" counting as 0.5
  const effectiveAvailable = availableCount + (maybeCount * 0.5)
  const percentage = Math.round((effectiveAvailable / totalCount) * 100)
  
  return {
    availableCount,
    maybeCount,
    unavailableCount,
    totalCount,
    percentage
  }
}

export const getAvailabilityLevel = (percentage: number): 'excellent' | 'good' | 'fair' | 'poor' | 'none' => {
  if (percentage === 100) return 'excellent'
  if (percentage >= 80) return 'good'
  if (percentage >= 50) return 'fair'
  if (percentage > 0) return 'poor'
  return 'none'
}

export const getMonthDates = (year: number, month: number): string[] => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const dates = []
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    dates.push(formatDateToString(date))
  }
  
  return dates
}

export const getCalendarWeeks = (year: number, month: number): CalendarDate[][] => {
  // Use local timezone for calendar display
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get the first Sunday of the calendar view
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  // Get the last Saturday of the calendar view
  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
  
  const weeks: CalendarDate[][] = []
  let currentWeek: CalendarDate[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    currentWeek.push({
      dateString: formatDateToString(current),
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === month
    })
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return weeks
}

// Helper function to format date consistently
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface CalendarDate {
  dateString: string
  day: number
  isCurrentMonth: boolean
}