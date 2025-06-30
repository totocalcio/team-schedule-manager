import { createClient } from '@supabase/supabase-js'
import { getCurrentTimeInTimezone, DATABASE_TIMEZONE } from '~/utils/timezone'

export default defineEventHandler(async (event) => {
  try {
    console.log('Discord notification check started')
    
    const config = useRuntimeConfig()
    const supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )

    // Get all enabled Discord notification settings
    const { data: notificationSettings, error: settingsError } = await supabase
      .from('discord_notifications')
      .select(`
        *,
        calendars (
          id,
          name
        )
      `)
      .eq('enabled', true)

    if (settingsError) {
      throw new Error(`Failed to fetch notification settings: ${settingsError.message}`)
    }

    if (!notificationSettings || notificationSettings.length === 0) {
      return {
        success: true,
        message: 'No enabled Discord notifications found'
      }
    }

    const results = []

    for (const setting of notificationSettings) {
      try {
        const calendarId = setting.calendar_id
        const calendarName = setting.calendars?.name || 'Unknown Calendar'
        
        // Check if it's time to send notification (considering timezone)
        const notificationTime = setting.notification_time
        const currentTime = getCurrentTimeInTimezone(DATABASE_TIMEZONE) // Get JST time
        
        console.log(`Calendar ${calendarName}: notification_time=${notificationTime}, current_time=${currentTime}`)
        
        // Exact time check (only at the specified minute)
        const [notifHour, notifMin] = notificationTime.split(':').map(Number)
        const [currentHour, currentMin] = currentTime.split(':').map(Number)
        
        console.log(`Time check for ${calendarName}:`, {
          notificationTime,
          currentTime,
          timezone: DATABASE_TIMEZONE,
          notifHour,
          notifMin,
          currentHour,
          currentMin,
          exactMatch: currentHour === notifHour && currentMin === notifMin,
          debug: {
            notifHour,
            notifMin,
            currentHour,
            currentMin,
            serverTimeString: currentTime,
            notificationTimeString: notificationTime
          }
        })
        
        // Execute only at exact time (hour and minute must match)
        const isRightTime = currentHour === notifHour && currentMin === notifMin
        
        if (!isRightTime) {
          console.log(`Skipping ${calendarName}: not the right time. Current: ${currentHour}:${String(currentMin).padStart(2, '0')}, Target: ${notifHour}:${String(notifMin).padStart(2, '0')}`)
          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: 'skipped',
            slots_found: 0,
            notification_sent: false,
            result: `Skipped - not exact time. Current: ${currentTime} JST, Target: ${notificationTime} JST`
          })
          continue
        }
        
        console.log(`Processing ${calendarName}: time matches!`)
        
        // Get tomorrow's date
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowDate = tomorrow.toISOString().split('T')[0]
        
        console.log(`Checking availability for ${calendarName} on ${tomorrowDate}`)

        // Get time slots for this calendar
        const { data: timeSlots, error: timeSlotsError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('calendar_id', calendarId)

        if (timeSlotsError) {
          console.error(`Error fetching time slots for calendar ${calendarId}:`, timeSlotsError)
          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: tomorrowDate,
            slots_found: 0,
            notification_sent: false,
            error: `Time slots error: ${timeSlotsError.message}`
          })
          continue
        }

        // Get members for this calendar
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('calendar_id', calendarId)

        if (membersError) {
          console.error(`Error fetching members for calendar ${calendarId}:`, membersError)
          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: tomorrowDate,
            slots_found: 0,
            notification_sent: false,
            error: `Members error: ${membersError.message}`
          })
          continue
        }

        if (!members || members.length === 0) {
          console.log(`No members found for calendar ${calendarId}`)
          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: tomorrowDate,
            slots_found: 0,
            notification_sent: false,
            result: 'No members found for this calendar'
          })
          continue
        }

        // Get schedules for tomorrow only
        const { data: schedules, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('calendar_id', calendarId)
          .eq('date', tomorrowDate)

        if (schedulesError) {
          console.error(`Error fetching schedules for calendar ${calendarId}:`, schedulesError)
          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: tomorrowDate,
            slots_found: 0,
            notification_sent: false,
            error: `Schedules error: ${schedulesError.message}`
          })
          continue
        }

        // Find 100% available slots for tomorrow
        const availableSlots = []
        
        console.log(`Checking ${timeSlots?.length || 0} time slots for ${members.length} members on ${tomorrowDate}`)
        
        for (const timeSlot of timeSlots || []) {
          // Count available members for this slot
          const slotSchedules = (schedules || []).filter(s => 
            s.time_slot_id === timeSlot.id
          )
          
          const availableCount = slotSchedules.filter(s => s.status === 'available').length
          const totalMembers = members.length
          
          console.log(`Time slot ${timeSlot.name}: ${availableCount}/${totalMembers} available`)
          
          // Check if 100% available (all members marked as available)
          if (availableCount === totalMembers && totalMembers > 0) {
            console.log(`✅ 100% available slot found: ${timeSlot.name}`)
            availableSlots.push({
              date: tomorrowDate,
              name: timeSlot.name,
              start_time: timeSlot.start_time,
              end_time: timeSlot.end_time,
              available_count: availableCount,
              total_count: totalMembers
            })
          } else {
            console.log(`❌ Not 100% available: ${timeSlot.name} (${availableCount}/${totalMembers})`)
          }
        }

        // Send notification if there are 100% available slots for tomorrow
        if (availableSlots.length > 0) {
          console.log(`Sending notification for ${availableSlots.length} available slots`)
          const notificationResult = await $fetch('/api/discord/send-notification', {
            method: 'POST',
            body: {
              webhook_url: setting.webhook_url,
              calendar_name: calendarName,
              available_slots: availableSlots
            }
          })

          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: tomorrowDate,
            slots_found: availableSlots.length,
            notification_sent: true,
            result: notificationResult
          })
        } else {
          console.log(`No 100% available slots found for ${calendarName} on ${tomorrowDate}`)
          results.push({
            calendar_id: calendarId,
            calendar_name: calendarName,
            date_checked: tomorrowDate,
            slots_found: 0,
            notification_sent: false,
            result: `No 100% available slots found for tomorrow. Total time slots: ${timeSlots?.length || 0}, Total members: ${members.length}`
          })
        }

      } catch (error) {
        console.error(`Error processing calendar ${setting.calendar_id}:`, error)
        results.push({
          calendar_id: setting.calendar_id,
          calendar_name: setting.calendars?.name || 'Unknown',
          date_checked: 'tomorrow',
          slots_found: 0,
          notification_sent: false,
          error: error.message
        })
      }
    }

    return {
      success: true,
      message: `Processed ${notificationSettings.length} notification settings for tomorrow's schedule`,
      results
    }

  } catch (error: any) {
    console.error('Error in Discord notification check:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Discord notification check failed: ${error.message}`
    })
  }
})