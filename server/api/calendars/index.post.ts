import { createClient } from '@supabase/supabase-js'
import type { CreateCalendarRequest, ApiResponse, Calendar } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<Calendar>> => {
  try {
    const body = await readBody(event) as CreateCalendarRequest
    
    if (!body.name || body.name.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Calendar name is required'
      })
    }

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
    
    const { data, error } = await supabase
      .from('calendars')
      .insert([{
        name: body.name.trim(),
        description: body.description?.trim() || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
      })
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error creating calendar:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create calendar: ${error.message || 'Unknown error'}`
    })
  }
})