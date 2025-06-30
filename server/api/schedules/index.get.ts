import { createClient } from '@supabase/supabase-js'
import type { ApiResponse, MemberAvailability, TimeSlot, Member } from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<{ 
  time_slots: TimeSlot[], 
  member_availability: MemberAvailability[]
}>> => {
  try {
    console.log('=== Schedules API called ===')
    
    const query = getQuery(event)
    const calendarId = query.calendarId as string
    const startDate = query.startDate as string
    const endDate = query.endDate as string
    
    console.log('Query params:', { calendarId, startDate, endDate })
    
    if (!calendarId) {
      console.error('Calendar ID is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Calendar ID is required'
      })
    }

    const config = useRuntimeConfig()
    
    console.log('Runtime config check:', { 
      hasUrl: !!config.public.supabaseUrl, 
      hasKey: !!config.public.supabaseAnonKey,
      url: config.public.supabaseUrl ? 'configured' : 'missing',
      key: config.public.supabaseAnonKey ? 'configured' : 'missing'
    })
    
    if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
      console.error('Supabase configuration is missing')
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase configuration is missing. Please check your environment variables.'
      })
    }
    
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
    
    console.log('Supabase client created successfully')
    
    // Get time slots
    console.log('Fetching time slots...')
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('start_time', { ascending: true })


    if (timeSlotsError) {
      console.error('Time slots error details:', timeSlotsError)
      throw createError({
        statusCode: 500,
        statusMessage: `Time slots error: ${timeSlotsError.message}`
      })
    }

    // Get members
    console.log('Fetching members...')
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('created_at', { ascending: true })


    if (membersError) {
      console.error('Members error details:', membersError)
      throw createError({
        statusCode: 500,
        statusMessage: `Members error: ${membersError.message}`
      })
    }

    // Get schedules with date filtering if provided
    console.log('Fetching schedules...')
    let schedulesQuery = supabase
      .from('schedules')
      .select('*')
      .eq('calendar_id', calendarId)

    if (startDate) {
      schedulesQuery = schedulesQuery.gte('date', startDate)
    }
    
    if (endDate) {
      schedulesQuery = schedulesQuery.lte('date', endDate)
    }

    const { data: schedules, error: schedulesError } = await schedulesQuery


    if (schedulesError) {
      console.error('Schedules error details:', schedulesError)
      throw createError({
        statusCode: 500,
        statusMessage: `Schedules error: ${schedulesError.message}`
      })
    }

    console.log('Starting member availability transformation...')

    // Validate data before transformation
    if (!Array.isArray(members)) {
      console.error('Members is not an array:', typeof members, members)
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid members data received from database'
      })
    }

    if (!Array.isArray(schedules)) {
      console.error('Schedules is not an array:', typeof schedules, schedules)
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid schedules data received from database'
      })
    }

    // Transform schedules into member availability format
    const memberAvailability: MemberAvailability[] = members
      .filter(member => {
        const isValid = member && 
                       typeof member === 'object' && 
                       member.id && 
                       typeof member.id === 'string' &&
                       member.name &&
                       typeof member.name === 'string'
        
        if (!isValid) {
          console.warn('Invalid member found:', member)
        }
        
        return isValid
      })
      .map(member => {
        console.log(`Processing member: ${member.name} (${member.id})`)
        
        const memberSchedules: { [date: string]: { [time_slot_id: string]: any } } = {}
        
        const memberSchedulesList = schedules.filter(schedule => {
          const isValid = schedule && 
                         schedule.member_id === member.id &&
                         schedule.date && 
                         typeof schedule.date === 'string' &&
                         schedule.time_slot_id && 
                         typeof schedule.time_slot_id === 'string'
          
          if (!isValid && schedule?.member_id === member.id) {
            console.warn('Invalid schedule found for member:', schedule)
          }
          
          return isValid
        })
        
        console.log(`Found ${memberSchedulesList.length} schedules for member ${member.name}`)
        
        memberSchedulesList.forEach(schedule => {
          if (!memberSchedules[schedule.date]) {
            memberSchedules[schedule.date] = {}
          }
          memberSchedules[schedule.date][schedule.time_slot_id] = schedule
        })
        
        return {
          member_id: member.id,
          member_name: member.name,
          schedules: memberSchedules
        }
      })

    console.log('Member availability created:', { 
      count: memberAvailability.length,
      details: memberAvailability.map(ma => ({
        name: ma.member_name,
        scheduleCount: Object.keys(ma.schedules).length
      }))
    })

    const result = {
      time_slots: timeSlots || [],
      member_availability: memberAvailability
    }

    console.log('API response prepared successfully')

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    console.error('=== Schedules API Error ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Full error object:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error?.message || 'Unknown error'}`
    })
  }
})