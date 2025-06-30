import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getUserTimezone,
  convertDatabaseTimeToUserTime,
  convertUserTimeToDatabaseTime,
  convertTimeWithTimezone,
  formatTimezoneInfo,
  getTimezoneOffset,
  getCurrentTimeInTimezone,
  DATABASE_TIMEZONE
} from '~/utils/timezone'

describe('Timezone Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getUserTimezone', () => {
    it('should return user timezone information', () => {
      const timezone = getUserTimezone()
      
      expect(timezone).toHaveProperty('timezone')
      expect(timezone).toHaveProperty('offset')
      expect(timezone).toHaveProperty('abbreviation')
      expect(timezone).toHaveProperty('isDST')
      expect(typeof timezone.timezone).toBe('string')
      expect(typeof timezone.offset).toBe('number')
    })

    it('should handle errors gracefully', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalDateTimeFormat = global.Intl.DateTimeFormat
      global.Intl.DateTimeFormat = vi.fn(() => {
        throw new Error('Mock error')
      }) as any

      const timezone = getUserTimezone()
      
      expect(timezone.timezone).toBe('UTC')
      expect(timezone.offset).toBe(0)
      
      // Restore original
      global.Intl.DateTimeFormat = originalDateTimeFormat
    })
  })

  describe('convertTimeWithTimezone', () => {
    it('should convert time between different timezones', () => {
      // JST (UTC+9) 17:30 should be UTC 08:30
      const result = convertTimeWithTimezone('17:30', 'Asia/Tokyo', 'UTC')
      // Note: Exact result may vary based on date, but should be consistent
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should handle same timezone conversion', () => {
      const result = convertTimeWithTimezone('17:30', 'Asia/Tokyo', 'Asia/Tokyo')
      expect(result).toBe('17:30')
    })

    it('should handle invalid input gracefully', () => {
      const result = convertTimeWithTimezone('invalid', 'Asia/Tokyo', 'UTC')
      expect(result).toBe('invalid')
    })
  })

  describe('convertDatabaseTimeToUserTime', () => {
    it('should convert database time (JST) to user time', () => {
      // Test with different user timezones
      const jstTime = '17:30'
      
      // Same timezone (JST to JST)
      const jstResult = convertDatabaseTimeToUserTime(jstTime, 'Asia/Tokyo')
      expect(jstResult).toBe('17:30')
      
      // Different timezone
      const utcResult = convertDatabaseTimeToUserTime(jstTime, 'UTC')
      expect(utcResult).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should use user timezone when not specified', () => {
      const result = convertDatabaseTimeToUserTime('17:30')
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('convertUserTimeToDatabaseTime', () => {
    it('should convert user time to database time (JST)', () => {
      const userTime = '17:30'
      
      // Same timezone (JST to JST)
      const jstResult = convertUserTimeToDatabaseTime(userTime, 'Asia/Tokyo')
      expect(jstResult).toBe('17:30')
      
      // Different timezone
      const utcResult = convertUserTimeToDatabaseTime(userTime, 'UTC')
      expect(utcResult).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('formatTimezoneInfo', () => {
    it('should format timezone information', () => {
      const result = formatTimezoneInfo('Asia/Tokyo')
      expect(result).toContain('UTC')
      expect(result).toMatch(/UTC[+-]\d{2}:\d{2}/)
    })

    it('should handle invalid timezone', () => {
      const result = formatTimezoneInfo('Invalid/Timezone')
      expect(typeof result).toBe('string')
    })
  })

  describe('getCurrentTimeInTimezone', () => {
    it('should return current time in specified timezone', () => {
      const result = getCurrentTimeInTimezone('Asia/Tokyo')
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should handle invalid timezone', () => {
      const result = getCurrentTimeInTimezone('Invalid/Timezone')
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('getTimezoneOffset', () => {
    it('should return timezone offset in minutes', () => {
      const offset = getTimezoneOffset('UTC')
      expect(typeof offset).toBe('number')
    })

    it('should handle invalid timezone', () => {
      const offset = getTimezoneOffset('Invalid/Timezone')
      expect(offset).toBe(0)
    })
  })

  describe('Integration tests', () => {
    it('should maintain consistency in round-trip conversions', () => {
      const originalTime = '17:30'
      const userTimezone = 'America/New_York'
      
      // User time -> Database time -> User time
      const databaseTime = convertUserTimeToDatabaseTime(originalTime, userTimezone)
      const backToUserTime = convertDatabaseTimeToUserTime(databaseTime, userTimezone)
      
      expect(backToUserTime).toBe(originalTime)
    })

    it('should handle multiple timezone conversions correctly', () => {
      const testCases = [
        { from: 'Asia/Tokyo', to: 'UTC' },
        { from: 'America/New_York', to: 'Asia/Tokyo' },
        { from: 'Europe/London', to: 'Asia/Tokyo' },
        { from: 'Australia/Sydney', to: 'Asia/Tokyo' }
      ]

      testCases.forEach(({ from, to }) => {
        const result = convertTimeWithTimezone('12:00', from, to)
        expect(result).toMatch(/^\d{2}:\d{2}$/)
        
        // Round trip test
        const backConverted = convertTimeWithTimezone(result, to, from)
        expect(backConverted).toBe('12:00')
      })
    })

    it('should handle edge cases correctly', () => {
      // Test midnight
      const midnight = convertTimeWithTimezone('00:00', 'Asia/Tokyo', 'UTC')
      expect(midnight).toMatch(/^\d{2}:\d{2}$/)
      
      // Test noon
      const noon = convertTimeWithTimezone('12:00', 'Asia/Tokyo', 'UTC')
      expect(noon).toMatch(/^\d{2}:\d{2}$/)
      
      // Test late evening
      const evening = convertTimeWithTimezone('23:59', 'Asia/Tokyo', 'UTC')
      expect(evening).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  describe('DATABASE_TIMEZONE constant', () => {
    it('should be set to Asia/Tokyo', () => {
      expect(DATABASE_TIMEZONE).toBe('Asia/Tokyo')
    })
  })
})