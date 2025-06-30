import { createClient } from '@supabase/supabase-js'
import type { ApiResponse, CalendarWithCounts } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<CalendarWithCounts[]>> => {
  try {
    // Get environment variables directly
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl
    const supabaseAnonKey = config.public.supabaseAnonKey
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration')
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing Supabase configuration'
      })
    }
    
    // Create Supabase client directly
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get recent calendars
    const { data: calendars, error: calendarsError } = await supabase
      .from('calendars')
      .select('id, name, description, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (calendarsError) {
      console.error('Error fetching calendars:', calendarsError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${calendarsError.message}`
      })
    }


    if (!calendars || calendars.length === 0) {
      return {
        success: true,
        data: []
      }
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

          return {
            ...calendar,
            member_count: memberCount || 0,
            time_slot_count: timeSlotCount || 0
          }
        } catch (error) {
          console.error(`Error processing calendar ${calendar.id}:`, error)
          return {
            ...calendar,
            member_count: 0,
            time_slot_count: 0
          }
        }
      })
    )

    return {
      success: true,
      data: calendarsWithCounts
    }
  } catch (error: any) {
    console.error('Error in recent calendars API:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
})