import { createClient } from '@supabase/supabase-js'
import type { ApiResponse, Member } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<Member[]>> => {
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
      .from('members')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('created_at', { ascending: true })

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
    console.error('Error fetching members:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch members'
    })
  }
})