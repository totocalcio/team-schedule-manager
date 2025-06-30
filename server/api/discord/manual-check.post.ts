import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { calendar_id } = body

    if (!calendar_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Calendar ID is required'
      })
    }

    console.log('Manual Discord notification check started for calendar:', calendar_id)
    
    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )

    // Get Discord notification settings for this calendar
    const { data: notificationSetting, error: settingsError } = await supabase
      .from('discord_notifications')
      .select(`
        *,
        calendars (
          id,
          name
        )
      `)
      .eq('calendar_id', calendar_id)
      .eq('enabled', true)
      .single()

    if (settingsError || !notificationSetting) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No enabled Discord notification found for this calendar'
      })
    }

    const calendarName = notificationSetting.calendars?.name || 'Unknown Calendar'
    
    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    // Get time slots for this calendar
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('calendar_id', calendar_id)

    if (timeSlotsError) {
      throw new Error(`Failed to fetch time slots: ${timeSlotsError.message}`)
    }

    // Get members for this calendar
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('calendar_id', calendar_id)

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`)
    }

    if (!members || members.length === 0) {
      return {
        success: true,
        message: 'No members found for this calendar',
        calendar_name: calendarName,
        date_checked: tomorrowDate,
        slots_found: 0
      }
    }

    // Get schedules for tomorrow only
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('calendar_id', calendar_id)
      .eq('date', tomorrowDate)

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`)
    }

    // Find 100% available slots for tomorrow
    const availableSlots = []
    
    for (const timeSlot of timeSlots || []) {
      // Count available members for this slot
      const slotSchedules = (schedules || []).filter(s => 
        s.time_slot_id === timeSlot.id
      )
      
      const availableCount = slotSchedules.filter(s => s.status === 'available').length
      const totalMembers = members.length
      
      // Check if 100% available (all members marked as available)
      if (availableCount === totalMembers && totalMembers > 0) {
        availableSlots.push({
          date: tomorrowDate,
          name: timeSlot.name,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time,
          available_count: availableCount,
          total_count: totalMembers
        })
      }
    }

    // Send notification if there are 100% available slots for tomorrow
    if (availableSlots.length > 0) {
      const notificationResult = await $fetch('/api/discord/send-notification', {
        method: 'POST',
        body: {
          webhook_url: notificationSetting.webhook_url,
          calendar_name: calendarName,
          available_slots: availableSlots
        }
      })

      return {
        success: true,
        message: `Manual notification sent for ${availableSlots.length} available slots`,
        calendar_name: calendarName,
        date_checked: tomorrowDate,
        slots_found: availableSlots.length,
        notification_sent: true,
        available_slots: availableSlots,
        result: notificationResult
      }
    } else {
      return {
        success: true,
        message: 'No 100% available slots found for tomorrow',
        calendar_name: calendarName,
        date_checked: tomorrowDate,
        slots_found: 0,
        notification_sent: false,
        total_members: members.length,
        total_time_slots: timeSlots?.length || 0
      }
    }

  } catch (error: any) {
    console.error('Error in manual Discord notification check:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Manual Discord notification check failed: ${error.message}`
    })
  }
})