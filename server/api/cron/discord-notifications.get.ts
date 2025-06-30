import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('=== Discord Notification Cron Job Started ===')
    const startTime = new Date()
    
    // Call the existing check-and-notify endpoint
    const result = await $fetch('/api/discord/check-and-notify', {
      method: 'POST',
      headers: {
        'User-Agent': 'Discord-Notification-Cron'
      }
    })
    
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    
    console.log('=== Discord Notification Cron Job Completed ===')
    console.log(`Duration: ${duration}ms`)
    console.log('Result:', result)
    
    return {
      success: true,
      message: 'Discord notification cron job completed',
      duration: `${duration}ms`,
      timestamp: startTime.toISOString(),
      result
    }
    
  } catch (error: any) {
    console.error('=== Discord Notification Cron Job Failed ===')
    console.error('Error:', error)
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
})