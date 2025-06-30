import { createClient } from '@supabase/supabase-js'
import type { CreateTimeSlotRequest, ApiResponse, TimeSlot } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<TimeSlot>> => {
  try {
    const body = await readBody(event) as CreateTimeSlotRequest
    
    if (!body.calendar_id || !body.name || !body.start_time || !body.end_time) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Calendar ID, name, start time, and end time are required'
      })
    }

    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
    
    const { data, error } = await supabase
      .from('time_slots')
      .insert([{
        calendar_id: body.calendar_id,
        name: body.name.trim(),
        start_time: body.start_time,
        end_time: body.end_time
      }])
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error creating time slot:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create time slot'
    })
  }
})