import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatTime,
  formatDate,
  formatShortDate,
  getCurrentWeekDates,
  getWeekRange,
  cycleAvailabilityStatus,
  getStatusColor,
  getStatusText
} from '~/utils/supabase'

describe('formatTime', () => {
  it('should format time correctly for 24-hour format', () => {
    expect(formatTime('09:30:00')).toBe('09:30')
    expect(formatTime('14:45:30')).toBe('14:45')
    expect(formatTime('00:00:00')).toBe('00:00')
    expect(formatTime('23:59:59')).toBe('23:59')
  })

  it('should handle time without seconds', () => {
    expect(formatTime('09:30')).toBe('09:30')
    expect(formatTime('14:45')).toBe('14:45')
  })

  it('should handle edge cases', () => {
    expect(formatTime('1:5')).toBe('1:5')
    expect(formatTime('')).toBe('')
  })
})

describe('formatDate', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  it('should format date correctly', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/Monday, January 15, 2024/)
  })

  it('should handle different date formats', () => {
    const result = formatDate('2024-12-25')
    expect(result).toMatch(/Wednesday, December 25, 2024/)
  })
})

describe('formatShortDate', () => {
  it('should format short date correctly', () => {
    const result = formatShortDate('2024-01-15')
    expect(result).toBe('Jan 15')
  })

  it('should handle different months', () => {
    expect(formatShortDate('2024-12-25')).toBe('Dec 25')
    expect(formatShortDate('2024-06-01')).toBe('Jun 1')
  })
})

describe('getCurrentWeekDates', () => {
  it('should return 7 dates starting from Sunday', () => {
    const testDate = new Date('2024-01-17') // Wednesday
    const dates = getCurrentWeekDates(testDate)
    
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2024-01-14') // Sunday
    expect(dates[6]).toBe('2024-01-20') // Saturday
  })

  it('should handle month boundaries', () => {
    const testDate = new Date('2024-02-01') // Thursday
    const dates = getCurrentWeekDates(testDate)
    
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2024-01-28') // Previous month
    expect(dates[6]).toBe('2024-02-03') // Current month
  })

  it('should handle year boundaries', () => {
    const testDate = new Date('2024-01-02') // Tuesday
    const dates = getCurrentWeekDates(testDate)
    
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2023-12-31') // Previous year
    expect(dates[6]).toBe('2024-01-06') // Current year
  })

  it('should use current date when no parameter provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-17T10:00:00Z'))
    
    const dates = getCurrentWeekDates()
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2024-01-14')
    
    vi.useRealTimers()
  })
})

describe('getWeekRange', () => {
  it('should return formatted week range', () => {
    const dates = ['2024-01-14', '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19', '2024-01-20']
    const result = getWeekRange(dates)
    expect(result).toBe('Jan 14 - Jan 20, 2024')
  })

  it('should handle cross-month ranges', () => {
    const dates = ['2024-01-28', '2024-01-29', '2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02', '2024-02-03']
    const result = getWeekRange(dates)
    expect(result).toBe('Jan 28 - Feb 3, 2024')
  })

  it('should handle empty array', () => {
    const result = getWeekRange([])
    expect(result).toBe('')
  })

  it('should handle single date', () => {
    const result = getWeekRange(['2024-01-15'])
    expect(result).toBe('Jan 15 - Jan 15, 2024')
  })
})

describe('cycleAvailabilityStatus', () => {
  it('should cycle through availability statuses correctly', () => {
    expect(cycleAvailabilityStatus(null)).toBe('available')
    expect(cycleAvailabilityStatus('available')).toBe('maybe')
    expect(cycleAvailabilityStatus('maybe')).toBe('unavailable')
    expect(cycleAvailabilityStatus('unavailable')).toBe(null)
  })

  it('should handle invalid status', () => {
    expect(cycleAvailabilityStatus('invalid')).toBe('available')
    expect(cycleAvailabilityStatus('')).toBe('available')
  })
})

describe('getStatusColor', () => {
  it('should return correct colors for each status', () => {
    expect(getStatusColor('available')).toBe('bg-green-500 text-white border-2 border-green-500')
    expect(getStatusColor('maybe')).toBe('bg-yellow-500 text-white border-2 border-yellow-500')
    expect(getStatusColor('unavailable')).toBe('bg-red-500 text-white border-2 border-red-500')
    expect(getStatusColor(null)).toBe('bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300')
  })

  it('should handle invalid status', () => {
    expect(getStatusColor('invalid')).toBe('bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300')
    expect(getStatusColor('')).toBe('bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300')
  })
})

describe('getStatusText', () => {
  it('should return correct text for each status', () => {
    expect(getStatusText('available')).toBe('Available')
    expect(getStatusText('maybe')).toBe('Maybe')
    expect(getStatusText('unavailable')).toBe('Unavailable')
    expect(getStatusText(null)).toBe('Click to set')
  })

  it('should handle invalid status', () => {
    expect(getStatusText('invalid')).toBe('Click to set')
    expect(getStatusText('')).toBe('Click to set')
  })
})