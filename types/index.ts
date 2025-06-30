export interface Calendar {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  calendar_id: string
  name: string
  email?: string
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  id: string
  calendar_id: string
  name: string
  start_time: string // HH:MM format
  end_time: string   // HH:MM format
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  calendar_id: string
  member_id: string
  time_slot_id: string
  date: string // YYYY-MM-DD format
  status: 'available' | 'maybe' | 'unavailable'
  notes?: string
  created_at: string
  updated_at: string
}

export interface ScheduleWithDetails extends Schedule {
  member: Member
  time_slot: TimeSlot
}

export interface CalendarWithCounts extends Calendar {
  member_count: number
  time_slot_count: number
}

export interface MemberAvailability {
  member_id: string
  member_name: string
  schedules: {
    [date: string]: {
      [time_slot_id: string]: Schedule
    }
  }
}

export interface WeeklyScheduleData {
  dates: string[]
  time_slots: TimeSlot[]
  member_availability: MemberAvailability[]
}

export interface CreateCalendarRequest {
  name: string
  description?: string
  password?: string
}

export interface CreateMemberRequest {
  calendar_id: string
  name: string
  role?: 'admin' | 'member'
}

export interface CreateTimeSlotRequest {
  calendar_id: string
  name: string
  start_time: string
  end_time: string
}

export interface CreateScheduleRequest {
  calendar_id: string
  member_id: string
  time_slot_id: string
  date: string
  status: 'available' | 'maybe' | 'unavailable'
  notes?: string
}

export interface DeleteCalendarRequest {
  password?: string
}

export interface UpdateScheduleRequest {
  status?: 'available' | 'maybe' | 'unavailable'
  notes?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export type AvailabilityStatus = 'available' | 'maybe' | 'unavailable' | null

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time_slot_id: string
  member_count: number
  available_count: number
  maybe_count: number
  unavailable_count: number
}

export interface DiscordNotificationSettings {
  id: string
  calendar_id: string
  webhook_url: string
  notification_time: string // HH:MM format
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreateDiscordNotificationRequest {
  calendar_id: string
  webhook_url: string
  notification_time: string
  enabled?: boolean
}