import { createClient } from '@supabase/supabase-js'
import type { ApiResponse, TimeSlot } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<TimeSlot[]>> => {
  try {
    const query = getQuery(event)
    const calendarId = query.calendarId as string
    
    if (!calendarId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Calendar ID is required'
      })
    }

    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
    
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('start_time', { ascending: true })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Error fetching time slots:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch time slots'
    })
  }
})