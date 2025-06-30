export default defineEventHandler(async (event) => {
  try {
    console.log('=== Test Discord Notification Check ===')
    const now = new Date()
    console.log('Current time:', now.toISOString())
    console.log('Current UTC time:', now.toTimeString().substring(0, 5))
    
    // Call the notification check endpoint
    const result = await $fetch('/api/discord/check-and-notify', {
      method: 'POST'
    })
    
    return {
      success: true,
      message: 'Test notification check completed',
      current_time: now.toISOString(),
      current_utc_time: now.toTimeString().substring(0, 5),
      result
    }
    
  } catch (error: any) {
    console.error('Test notification check failed:', error)
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      current_time: new Date().toISOString()
    }
  }
})