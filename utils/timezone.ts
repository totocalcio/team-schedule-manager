// International timezone conversion utilities
// Database uses JST (Asia/Tokyo) consistently, UI converts to user timezone

export interface TimezoneInfo {
  timezone: string
  offset: number // minutes from UTC
  abbreviation: string
  isDST: boolean
}

export const DATABASE_TIMEZONE = 'Asia/Tokyo'

/**
 * Get user's timezone information
 */
export const getUserTimezone = (): TimezoneInfo => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()
    
    // Get detailed timezone information
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    
    const parts = formatter.formatToParts(now)
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || ''
    
    // Calculate offset in minutes
    const offset = -now.getTimezoneOffset()
    
    // DST detection (simplified)
    const jan = new Date(now.getFullYear(), 0, 1)
    const jul = new Date(now.getFullYear(), 6, 1)
    const isDST = now.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
    
    return {
      timezone,
      offset,
      abbreviation: timeZoneName,
      isDST
    }
  } catch (error) {
    console.error('Error getting user timezone:', error)
    // Fallback: UTC
    return {
      timezone: 'UTC',
      offset: 0,
      abbreviation: 'UTC',
      isDST: false
    }
  }
}

/**
 * Convert database time (JST) to user's local time
 */
export const convertDatabaseTimeToUserTime = (databaseTime: string, userTimezone?: string): string => {
  try {
    const timezone = userTimezone || getUserTimezone().timezone
    
    // Interpret database time as JST
    const [hours, minutes] = databaseTime.split(':').map(Number)
    
    // Create JST time with today's date
    const today = new Date()
    const jstDate = new Date()
    
    // Set time in JST timezone
    const jstTime = new Intl.DateTimeFormat('sv-SE', {
      timeZone: DATABASE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes))
    
    // Convert JST time to Date object
    const jstDateTime = new Date(jstTime + '+09:00') // Explicitly specify JST offset
    
    // Convert to user's timezone
    const userTime = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(jstDateTime)
    
    return userTime
  } catch (error) {
    console.error('Error converting database time to user time:', error)
    return databaseTime // Fallback: return original time
  }
}

/**
 * Convert user's local time to database time (JST)
 */
export const convertUserTimeToDatabaseTime = (userTime: string, userTimezone?: string): string => {
  try {
    const timezone = userTimezone || getUserTimezone().timezone
    
    const [hours, minutes] = userTime.split(':').map(Number)
    
    // Create user's time with today's date
    const today = new Date()
    
    // Set time in user's timezone
    const userDateTime = new Date()
    userDateTime.setHours(hours, minutes, 0, 0)
    
    // Convert user time to ISO string then to JST
    const userTimeString = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes))
    
    // Convert user time to UTC then to JST
    const utcTime = new Date(userTimeString)
    
    // Convert to JST
    const jstTime = new Intl.DateTimeFormat('sv-SE', {
      timeZone: DATABASE_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(utcTime)
    
    return jstTime
  } catch (error) {
    console.error('Error converting user time to database time:', error)
    return userTime // Fallback: return original time
  }
}

/**
 * More accurate time conversion (timezone library approach)
 */
export const convertTimeWithTimezone = (
  time: string, 
  fromTimezone: string, 
  toTimezone: string
): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const today = new Date()
    
    // Create date/time in source timezone
    const sourceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
    
    // Create time string in source timezone
    const sourceTimeString = new Intl.DateTimeFormat('sv-SE', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(sourceDate)
    
    // Convert to UTC
    const utcDate = new Date(sourceTimeString)
    
    // Convert to target timezone
    const targetTime = new Intl.DateTimeFormat('sv-SE', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(utcDate)
    
    return targetTime
  } catch (error) {
    console.error('Error converting time with timezone:', error)
    return time
  }
}

/**
 * Format timezone information for display
 */
export const formatTimezoneInfo = (timezone?: string): string => {
  try {
    const tz = timezone || getUserTimezone().timezone
    const now = new Date()
    
    // Get timezone name
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'long'
    })
    
    const parts = formatter.formatToParts(now)
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || tz
    
    // Calculate offset
    const offset = getTimezoneOffset(tz)
    const offsetHours = Math.floor(Math.abs(offset) / 60)
    const offsetMinutes = Math.abs(offset) % 60
    const offsetSign = offset >= 0 ? '+' : '-'
    const offsetString = `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`
    
    return `${timeZoneName} (${offsetString})`
  } catch (error) {
    console.error('Error formatting timezone info:', error)
    return timezone || 'Unknown'
  }
}

/**
 * Get timezone offset in minutes
 */
export const getTimezoneOffset = (timezone: string): number => {
  try {
    const now = new Date()
    
    // Time in UTC
    const utcTime = new Date(now.toISOString())
    
    // Time in specified timezone
    const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    
    // Calculate difference in minutes
    const diffMs = tzTime.getTime() - utcTime.getTime()
    return Math.round(diffMs / (1000 * 60))
  } catch (error) {
    console.error('Error getting timezone offset:', error)
    return 0
  }
}

/**
 * Get current time in specified timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): string => {
  try {
    const now = new Date()
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now)
  } catch (error) {
    console.error('Error getting current time in timezone:', error)
    return new Date().toTimeString().substring(0, 5)
  }
}

/**
 * Debug: Detailed timezone conversion information
 */
export const debugTimezoneConversion = (
  time: string,
  fromTimezone: string = DATABASE_TIMEZONE,
  toTimezone?: string
) => {
  const userTz = toTimezone || getUserTimezone().timezone
  
  console.log('=== Timezone Conversion Debug ===')
  console.log('Input time:', time)
  console.log('From timezone:', fromTimezone)
  console.log('To timezone:', userTz)
  console.log('Database timezone:', DATABASE_TIMEZONE)
  
  const converted = convertTimeWithTimezone(time, fromTimezone, userTz)
  console.log('Converted time:', converted)
  
  const backConverted = convertTimeWithTimezone(converted, userTz, fromTimezone)
  console.log('Back converted:', backConverted)
  
  console.log('User timezone info:', getUserTimezone())
  console.log('Current time in database TZ:', getCurrentTimeInTimezone(DATABASE_TIMEZONE))
  console.log('Current time in user TZ:', getCurrentTimeInTimezone(userTz))
  
  return {
    input: time,
    fromTimezone,
    toTimezone: userTz,
    converted,
    backConverted,
    userTimezoneInfo: getUserTimezone()
  }
}