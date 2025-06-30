// Browser-based notification system for Discord notifications
// This runs in the user's browser and checks for notifications at the specified time

export interface NotificationSettings {
  calendar_id: string
  calendar_name: string
  webhook_url: string
  notification_time: string // HH:MM format in user's timezone
  enabled: boolean
}

export class BrowserNotificationManager {
  private settings: NotificationSettings | null = null
  private interval: NodeJS.Timeout | null = null
  private isActive = false
  private nextCheckTime: Date | null = null
  private onStatusChange?: (isActive: boolean, nextCheck: Date | null) => void

  constructor(onStatusChange?: (isActive: boolean, nextCheck: Date | null) => void) {
    this.onStatusChange = onStatusChange
  }

  start(settings: NotificationSettings) {
    if (this.isActive) {
      this.stop()
    }

    this.settings = settings
    this.isActive = true
    
    console.log('Starting browser notification system for calendar:', settings.calendar_name)
    
    // Check every 60 seconds
    this.interval = setInterval(() => {
      this.checkAndNotify()
    }, 60000)
    
    // Set initial next check time
    this.updateNextCheckTime()
    
    // Initial check
    this.checkAndNotify()
    
    this.notifyStatusChange()
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    
    this.isActive = false
    this.nextCheckTime = null
    this.settings = null
    
    console.log('Stopped browser notification system')
    this.notifyStatusChange()
  }

  private updateNextCheckTime() {
    this.nextCheckTime = new Date(Date.now() + 60000) // Next 60 seconds
    this.notifyStatusChange()
  }

  private notifyStatusChange() {
    if (this.onStatusChange) {
      this.onStatusChange(this.isActive, this.nextCheckTime)
    }
  }

  private async checkAndNotify() {
    if (!this.settings || !this.settings.enabled) return

    try {
      const now = new Date()
      const notificationTime = this.settings.notification_time
      
      // Check if it's time to send notification (with 1 minute tolerance)
      const [notifHour, notifMin] = notificationTime.split(':').map(Number)
      const [currentHour, currentMin] = [now.getHours(), now.getMinutes()]
      
      const notifMinutes = notifHour * 60 + notifMin
      const currentMinutes = currentHour * 60 + currentMin
      
      console.log('Browser notification check:', {
        notificationTime,
        currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
        timeDiff: Math.abs(currentMinutes - notifMinutes)
      })
      
      // Allow 2 minute window for execution
      if (Math.abs(currentMinutes - notifMinutes) <= 2) {
        console.log('Time to check for notifications!', {
          notificationTime,
          currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
        })
        
        await this.performNotificationCheck()
      }
      
      this.updateNextCheckTime()
    } catch (error) {
      console.error('Error in notification check:', error)
      this.updateNextCheckTime()
    }
  }

  private async performNotificationCheck() {
    if (!this.settings) return

    try {
      const response = await $fetch('/api/discord/manual-check', {
        method: 'POST',
        body: {
          calendar_id: this.settings.calendar_id
        }
      })

      if (response.notification_sent) {
        console.log('Notification sent successfully:', response)
      } else {
        console.log('No notification needed:', response.message)
      }
    } catch (error) {
      console.error('Failed to perform notification check:', error)
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      nextCheckTime: this.nextCheckTime,
      settings: this.settings
    }
  }

  getTimeUntilNextCheck(): string {
    if (!this.nextCheckTime) return 'calculating...'
    
    const now = new Date()
    const diff = this.nextCheckTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'checking now...'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }
}

// Global instance for managing notifications
let globalNotificationManager: BrowserNotificationManager | null = null

export const getNotificationManager = (onStatusChange?: (isActive: boolean, nextCheck: Date | null) => void): BrowserNotificationManager => {
  if (!globalNotificationManager) {
    globalNotificationManager = new BrowserNotificationManager(onStatusChange)
  }
  return globalNotificationManager
}

export const startBrowserNotifications = (settings: NotificationSettings, onStatusChange?: (isActive: boolean, nextCheck: Date | null) => void) => {
  const manager = getNotificationManager(onStatusChange)
  manager.start(settings)
  return manager
}

export const stopBrowserNotifications = () => {
  if (globalNotificationManager) {
    globalNotificationManager.stop()
  }
}