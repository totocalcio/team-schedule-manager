import { createClient } from '@supabase/supabase-js'
import { getCurrentTimeInTimezone, DATABASE_TIMEZONE } from '~/utils/timezone'

export default defineEventHandler(async (event) => {
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

    // Get Discord notification settings
    const { data: settings, error } = await supabase
      .from('discord_notifications')
      .select('*')
      .eq('calendar_id', calendarId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    const currentTime = getCurrentTimeInTimezone(DATABASE_TIMEZONE) // JST時間
    
    let timeComparison = null
    if (settings) {
      const notificationTime = settings.notification_time
      const [notifHour, notifMin] = notificationTime.split(':').map(Number)
      const [currentHour, currentMin] = currentTime.split(':').map(Number)
      
      const notifMinutes = notifHour * 60 + notifMin
      const currentMinutes = currentHour * 60 + currentMin
      const timeDiff = Math.abs(currentMinutes - notifMinutes)
      
      timeComparison = {
        notificationTime,
        currentTime,
        timezone: DATABASE_TIMEZONE,
        notifHour,
        notifMin,
        currentHour,
        currentMin,
        notifMinutes,
        currentMinutes,
        timeDiff,
        shouldTrigger: timeDiff <= 2,
        isRightHour: currentHour === notifHour,
        minuteDiff: Math.abs(currentMin - notifMin)
      }
    }

    return {
      success: true,
      data: {
        settings,
        currentDatabaseTime: currentTime,
        currentDatabaseTimestamp: new Date().toISOString(),
        databaseTimezone: DATABASE_TIMEZONE,
        timeComparison,
        explanation: {
          message: 'All times are in JST (Asia/Tokyo) timezone',
          databaseTimezone: DATABASE_TIMEZONE,
          userNote: 'UI automatically converts between user timezone and database timezone'
        }
      }
    }

  } catch (error: any) {
    console.error('Error in debug settings:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Debug settings failed: ${error.message}`
    })
  }
})