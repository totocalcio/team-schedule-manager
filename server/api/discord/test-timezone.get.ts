import { 
  convertTimeWithTimezone, 
  getUserTimezone, 
  DATABASE_TIMEZONE,
  getCurrentTimeInTimezone 
} from '~/utils/timezone'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userTime = query.userTime as string || '17:30'
    const userTimezone = query.userTimezone as string || 'Asia/Tokyo'
    
    console.log('Testing timezone conversion:', { userTime, userTimezone })
    
    // ユーザー時間からデータベース時間（JST）に変換
    const databaseTime = convertTimeWithTimezone(userTime, userTimezone, DATABASE_TIMEZONE)
    
    // データベース時間からユーザー時間に逆変換
    const backConverted = convertTimeWithTimezone(databaseTime, DATABASE_TIMEZONE, userTimezone)
    
    // 現在時刻を各タイムゾーンで取得
    const currentJST = getCurrentTimeInTimezone(DATABASE_TIMEZONE)
    const currentUserTZ = getCurrentTimeInTimezone(userTimezone)
    
    // 複数のタイムゾーンでテスト
    const testTimezones = [
      'Asia/Tokyo',
      'America/New_York',
      'Europe/London',
      'America/Los_Angeles',
      'Australia/Sydney',
      'UTC'
    ]
    
    const timezoneTests = testTimezones.map(tz => ({
      timezone: tz,
      userTimeToJST: convertTimeWithTimezone(userTime, tz, DATABASE_TIMEZONE),
      jstToUserTime: convertTimeWithTimezone('17:30', DATABASE_TIMEZONE, tz),
      currentTime: getCurrentTimeInTimezone(tz)
    }))
    
    return {
      success: true,
      data: {
        input: {
          userTime,
          userTimezone,
          databaseTimezone: DATABASE_TIMEZONE
        },
        conversion: {
          userTimeToDatabaseTime: databaseTime,
          backConverted: backConverted,
          isRoundTrip: userTime === backConverted
        },
        currentTimes: {
          jst: currentJST,
          userTimezone: currentUserTZ
        },
        timezoneTests,
        examples: {
          tokyoUser: {
            input: '17:30 JST',
            database: convertTimeWithTimezone('17:30', 'Asia/Tokyo', DATABASE_TIMEZONE),
            note: 'Same timezone, no conversion needed'
          },
          newYorkUser: {
            input: '17:30 EST',
            database: convertTimeWithTimezone('17:30', 'America/New_York', DATABASE_TIMEZONE),
            note: 'EST to JST conversion'
          },
          londonUser: {
            input: '17:30 GMT',
            database: convertTimeWithTimezone('17:30', 'Europe/London', DATABASE_TIMEZONE),
            note: 'GMT to JST conversion'
          }
        }
      }
    }
    
  } catch (error: any) {
    console.error('Error in timezone test:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Timezone test failed: ${error.message}`
    })
  }
})