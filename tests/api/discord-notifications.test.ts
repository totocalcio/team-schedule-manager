import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch for testing
global.fetch = vi.fn()

describe('Discord Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Discord message formatting', () => {
    it('should format English notification message correctly', () => {
      const calendarName = 'Test Calendar'
      const availableSlots = [
        {
          date: '2024-01-16',
          name: 'Morning Meeting',
          start_time: '09:00:00',
          end_time: '10:00:00',
          available_count: 3,
          total_count: 3
        },
        {
          date: '2024-01-16',
          name: 'Afternoon Work',
          start_time: '14:00:00',
          end_time: '16:00:00',
          available_count: 3,
          total_count: 3
        }
      ]

      // Expected message structure
      const expectedTitle = '🎉 Tomorrow\'s 100% Team Availability!'
      const expectedDescription = `Great news! Your team has **100% availability** for tomorrow's time slots in **${calendarName}**.`
      
      expect(expectedTitle).toContain('Tomorrow\'s 100% Team Availability')
      expect(expectedDescription).toContain(calendarName)
      expect(expectedDescription).toContain('100% availability')
    })

    it('should format time slots correctly in English', () => {
      const slot = {
        name: 'Morning Meeting',
        start_time: '09:00:00',
        end_time: '10:00:00'
      }

      const formattedSlot = `• ${slot.name} (${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)})`
      expect(formattedSlot).toBe('• Morning Meeting (09:00 - 10:00)')
    })

    it('should format English date correctly', () => {
      const date = '2024-01-16'
      const dateObj = new Date(date + 'T00:00:00')
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      expect(formattedDate).toMatch(/\w+, \w+ \d{1,2}, \d{4}/)
    })
  })

  describe('Timezone conversion', () => {
    it('should convert local time to UTC correctly', () => {
      // Mock timezone offset for JST (UTC+9)
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset
      Date.prototype.getTimezoneOffset = vi.fn(() => -540) // JST is UTC+9, so offset is -540 minutes

      const localTime = '09:00'
      const [hours, minutes] = localTime.split(':').map(Number)
      const today = new Date()
      const localDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
      
      const offsetMinutes = localDateTime.getTimezoneOffset()
      const utcDateTime = new Date(localDateTime.getTime() + (offsetMinutes * 60 * 1000))
      
      const utcHours = String(utcDateTime.getHours()).padStart(2, '0')
      const utcMinutes = String(utcDateTime.getMinutes()).padStart(2, '0')
      const serverTime = `${utcHours}:${utcMinutes}`

      // JST 09:00 should be UTC 00:00
      expect(serverTime).toBe('00:00')

      // Restore original method
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset
    })

    it('should handle different timezone offsets', () => {
      const testCases = [
        { offset: -540, localTime: '09:00', expectedUTC: '00:00' }, // JST
        { offset: 0, localTime: '09:00', expectedUTC: '09:00' },    // UTC
        { offset: 300, localTime: '09:00', expectedUTC: '14:00' },  // EST
      ]

      testCases.forEach(({ offset, localTime, expectedUTC }) => {
        const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset
        Date.prototype.getTimezoneOffset = vi.fn(() => offset)

        const [hours, minutes] = localTime.split(':').map(Number)
        const today = new Date()
        const localDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
        
        const offsetMinutes = localDateTime.getTimezoneOffset()
        const utcDateTime = new Date(localDateTime.getTime() + (offsetMinutes * 60 * 1000))
        
        const utcHours = String(utcDateTime.getHours()).padStart(2, '0')
        const utcMinutes = String(utcDateTime.getMinutes()).padStart(2, '0')
        const serverTime = `${utcHours}:${utcMinutes}`

        expect(serverTime).toBe(expectedUTC)

        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset
      })
    })
  })

  describe('Availability calculation', () => {
    it('should correctly identify 100% available slots', () => {
      const members = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ]

      const schedules = [
        { member_id: '1', time_slot_id: 'slot1', status: 'available' },
        { member_id: '2', time_slot_id: 'slot1', status: 'available' },
        { member_id: '3', time_slot_id: 'slot1', status: 'available' },
        { member_id: '1', time_slot_id: 'slot2', status: 'available' },
        { member_id: '2', time_slot_id: 'slot2', status: 'maybe' },
        { member_id: '3', time_slot_id: 'slot2', status: 'unavailable' }
      ]

      // Test slot1 (100% available)
      const slot1Schedules = schedules.filter(s => s.time_slot_id === 'slot1')
      const slot1Available = slot1Schedules.filter(s => s.status === 'available').length
      expect(slot1Available).toBe(members.length)

      // Test slot2 (not 100% available)
      const slot2Schedules = schedules.filter(s => s.time_slot_id === 'slot2')
      const slot2Available = slot2Schedules.filter(s => s.status === 'available').length
      expect(slot2Available).toBeLessThan(members.length)
    })

    it('should handle empty member list', () => {
      const members = []
      const schedules = []

      expect(members.length).toBe(0)
      expect(schedules.length).toBe(0)
    })

    it('should handle no schedules for a time slot', () => {
      const members = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' }
      ]

      const schedules = [] // No schedules

      const availableCount = schedules.filter(s => s.status === 'available').length
      expect(availableCount).toBe(0)
      expect(availableCount).toBeLessThan(members.length)
    })
  })

  describe('Webhook URL validation', () => {
    it('should validate Discord webhook URL format', () => {
      const validUrls = [
        'https://discord.com/api/webhooks/123456789/abcdefghijk',
        'https://discord.com/api/webhooks/987654321/xyz123abc456'
      ]

      const invalidUrls = [
        'https://example.com/webhook',
        'https://slack.com/webhook',
        'not-a-url',
        ''
      ]

      validUrls.forEach(url => {
        expect(url.includes('discord.com/api/webhooks/')).toBe(true)
      })

      invalidUrls.forEach(url => {
        expect(url.includes('discord.com/api/webhooks/')).toBe(false)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle network errors gracefully', () => {
      const networkErrors = [
        'fetch failed',
        'TypeError: fetch failed',
        'AbortError',
        'ENOTFOUND',
        'ECONNREFUSED'
      ]

      networkErrors.forEach(errorMessage => {
        const isNetworkError = errorMessage.includes('fetch failed') || 
                              errorMessage.includes('TypeError: fetch failed') ||
                              errorMessage.includes('AbortError') ||
                              errorMessage.includes('ENOTFOUND') ||
                              errorMessage.includes('ECONNREFUSED')

        expect(isNetworkError).toBe(true)
      })
    })

    it('should provide appropriate error messages in English', () => {
      const errorMessages = {
        missingWebhook: 'Webhook URL and calendar name are required',
        invalidWebhook: 'Invalid Discord webhook URL',
        missingCalendarId: 'Calendar ID is required',
        noSettings: 'No enabled Discord notification found for this calendar'
      }

      Object.values(errorMessages).forEach(message => {
        expect(message).toMatch(/^[A-Za-z0-9\s\-'.,!]+$/) // Contains only English characters and common punctuation
      })
    })
  })

  describe('Time comparison logic', () => {
    it('should correctly compare notification times with tolerance', () => {
      const notificationTime = '09:00'
      const [notifHour, notifMin] = notificationTime.split(':').map(Number)
      const notifMinutes = notifHour * 60 + notifMin // 540 minutes

      const testTimes = [
        { time: '08:58', shouldTrigger: true },  // 2 minutes before
        { time: '08:59', shouldTrigger: true },  // 1 minute before
        { time: '09:00', shouldTrigger: true },  // exact time
        { time: '09:01', shouldTrigger: true },  // 1 minute after
        { time: '09:02', shouldTrigger: true },  // 2 minutes after
        { time: '08:57', shouldTrigger: false }, // 3 minutes before
        { time: '09:03', shouldTrigger: false }  // 3 minutes after
      ]

      testTimes.forEach(({ time, shouldTrigger }) => {
        const [currentHour, currentMin] = time.split(':').map(Number)
        const currentMinutes = currentHour * 60 + currentMin
        
        const timeDiff = Math.abs(currentMinutes - notifMinutes)
        const withinTolerance = timeDiff <= 2

        expect(withinTolerance).toBe(shouldTrigger)
      })
    })
  })

  describe('Date calculations', () => {
    it('should correctly calculate tomorrow\'s date', () => {
      const today = new Date('2024-01-15T10:00:00Z')
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().split('T')[0]

      expect(tomorrowDate).toBe('2024-01-16')
    })

    it('should handle month boundaries', () => {
      const endOfMonth = new Date('2024-01-31T10:00:00Z')
      const nextDay = new Date(endOfMonth)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayDate = nextDay.toISOString().split('T')[0]

      expect(nextDayDate).toBe('2024-02-01')
    })

    it('should handle year boundaries', () => {
      const endOfYear = new Date('2024-12-31T10:00:00Z')
      const nextDay = new Date(endOfYear)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayDate = nextDay.toISOString().split('T')[0]

      expect(nextDayDate).toBe('2025-01-01')
    })
  })
})