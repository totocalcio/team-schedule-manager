import { createClient } from '@supabase/supabase-js'
import type { ApiResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse> => {
  try {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const calendarId = query.calendarId as string
    
    if (!id || !calendarId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID and Calendar ID are required'
      })
    }

    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
    
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
      .eq('calendar_id', calendarId)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Error deleting member:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete member'
    })
  }
})