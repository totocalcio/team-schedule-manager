import { createClient } from '@supabase/supabase-js'
import type { CreateMemberRequest, ApiResponse, Member } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<Member>> => {
  try {
    const body = await readBody(event) as CreateMemberRequest
    
    if (!body.calendar_id || !body.name || body.name.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Calendar ID and member name are required'
      })
    }

    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
    
    const { data, error } = await supabase
      .from('members')
      .insert([{
        calendar_id: body.calendar_id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        role: body.role || 'member'
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
    console.error('Error creating member:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create member'
    })
  }
})