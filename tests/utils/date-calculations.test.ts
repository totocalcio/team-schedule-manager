import { describe, it, expect, vi } from 'vitest'
import { getCurrentWeekDates, getWeekRange } from '~/utils/supabase'

describe('Date Calculations - Edge Cases', () => {
  describe('getCurrentWeekDates edge cases', () => {
    it('should handle leap year correctly', () => {
      const testDate = new Date('2024-02-29') // Leap year
      const dates = getCurrentWeekDates(testDate)
      
      expect(dates).toHaveLength(7)
      expect(dates[0]).toBe('2024-02-25') // Sunday
      expect(dates[4]).toBe('2024-02-29') // Thursday (leap day)
      expect(dates[6]).toBe('2024-03-02') // Saturday
    })

    it('should handle non-leap year February', () => {
      const testDate = new Date('2023-02-28') // Non-leap year
      const dates = getCurrentWeekDates(testDate)
      
      expect(dates).toHaveLength(7)
      expect(dates[0]).toBe('2023-02-26') // Sunday
      expect(dates[2]).toBe('2023-02-28') // Tuesday (last day of Feb)
      expect(dates[3]).toBe('2023-03-01') // Wednesday (first day of Mar)
    })

    it('should handle daylight saving time transition', () => {
      // Test around DST transition (second Sunday in March for US)
      const testDate = new Date('2024-03-10') // DST starts
      const dates = getCurrentWeekDates(testDate)
      
      expect(dates).toHaveLength(7)
      expect(dates[0]).toBe('2024-03-10') // Sunday (DST starts)
      expect(dates[6]).toBe('2024-03-16') // Saturday
    })

    it('should handle different timezones consistently', () => {
      // Test with a date that might cross timezone boundaries
      const testDate = new Date('2024-01-01T00:00:00Z')
      const dates = getCurrentWeekDates(testDate)
      
      expect(dates).toHaveLength(7)
      // Should always return dates in YYYY-MM-DD format regardless of timezone
      dates.forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })

  describe('Week calculation consistency', () => {
    it('should maintain week consistency across different starting days', () => {
      const sunday = new Date('2024-01-14')
      const monday = new Date('2024-01-15')
      const saturday = new Date('2024-01-20')
      
      const sundayWeek = getCurrentWeekDates(sunday)
      const mondayWeek = getCurrentWeekDates(monday)
      const saturdayWeek = getCurrentWeekDates(saturday)
      
      // All should return the same week
      expect(sundayWeek).toEqual(mondayWeek)
      expect(mondayWeek).toEqual(saturdayWeek)
    })

    it('should handle week boundaries correctly', () => {
      const lastDayOfWeek = new Date('2024-01-20') // Saturday
      const firstDayOfNextWeek = new Date('2024-01-21') // Sunday
      
      const week1 = getCurrentWeekDates(lastDayOfWeek)
      const week2 = getCurrentWeekDates(firstDayOfNextWeek)
      
      expect(week1[6]).toBe('2024-01-20') // Last day of first week
      expect(week2[0]).toBe('2024-01-21') // First day of second week
      expect(week1).not.toEqual(week2)
    })
  })

  describe('getWeekRange formatting edge cases', () => {
    it('should handle same month range', () => {
      const dates = ['2024-01-14', '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19', '2024-01-20']
      const result = getWeekRange(dates)
      expect(result).toBe('Jan 14 - Jan 20, 2024')
    })

    it('should handle cross-year range', () => {
      const dates = ['2023-12-31', '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06']
      const result = getWeekRange(dates)
      expect(result).toBe('Dec 31 - Jan 6, 2024')
    })

    it('should handle very long month names', () => {
      const dates = ['2024-09-01', '2024-09-02', '2024-09-03', '2024-09-04', '2024-09-05', '2024-09-06', '2024-09-07']
      const result = getWeekRange(dates)
      expect(result).toBe('Sep 1 - Sep 7, 2024')
    })
  })
})