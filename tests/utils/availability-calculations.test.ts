import { describe, it, expect } from 'vitest'
import { 
  calculateTeamAvailability, 
  getAvailabilityLevel, 
  getMonthDates, 
  getCalendarWeeks,
  type CalendarDate 
} from '~/utils/supabase'

describe('Team Availability Calculations', () => {
  const mockMemberAvailability = [
    {
      member_id: '1',
      member_name: 'Alice',
      schedules: {
        '2024-01-15': {
          'slot1': { status: 'available' },
          'slot2': { status: 'maybe' }
        },
        '2024-01-16': {
          'slot1': { status: 'unavailable' }
        }
      }
    },
    {
      member_id: '2',
      member_name: 'Bob',
      schedules: {
        '2024-01-15': {
          'slot1': { status: 'available' },
          'slot2': { status: 'available' }
        },
        '2024-01-16': {
          'slot1': { status: 'maybe' }
        }
      }
    },
    {
      member_id: '3',
      member_name: 'Charlie',
      schedules: {
        '2024-01-15': {
          'slot1': { status: 'maybe' },
          'slot2': { status: 'unavailable' }
        }
      }
    }
  ]

  describe('calculateTeamAvailability', () => {
    it('should calculate availability correctly for all available', () => {
      const result = calculateTeamAvailability(mockMemberAvailability, 'slot1', '2024-01-15')
      
      expect(result.availableCount).toBe(2) // Alice, Bob
      expect(result.maybeCount).toBe(1) // Charlie
      expect(result.unavailableCount).toBe(0)
      expect(result.totalCount).toBe(3)
      expect(result.percentage).toBe(83) // (2 + 0.5) / 3 * 100 = 83.33 -> 83
    })

    it('should calculate availability for mixed statuses', () => {
      const result = calculateTeamAvailability(mockMemberAvailability, 'slot2', '2024-01-15')
      
      expect(result.availableCount).toBe(1) // Bob
      expect(result.maybeCount).toBe(1) // Alice
      expect(result.unavailableCount).toBe(1) // Charlie
      expect(result.totalCount).toBe(3)
      expect(result.percentage).toBe(50) // (1 + 0.5) / 3 * 100 = 50
    })

    it('should handle no schedules for date/slot', () => {
      const result = calculateTeamAvailability(mockMemberAvailability, 'slot2', '2024-01-16')
      
      expect(result.availableCount).toBe(0)
      expect(result.maybeCount).toBe(0)
      expect(result.unavailableCount).toBe(0)
      expect(result.totalCount).toBe(3)
      expect(result.percentage).toBe(0)
    })

    it('should handle empty member list', () => {
      const result = calculateTeamAvailability([], 'slot1', '2024-01-15')
      
      expect(result.availableCount).toBe(0)
      expect(result.maybeCount).toBe(0)
      expect(result.unavailableCount).toBe(0)
      expect(result.totalCount).toBe(0)
      expect(result.percentage).toBe(0)
    })

    it('should handle partial availability', () => {
      const result = calculateTeamAvailability(mockMemberAvailability, 'slot1', '2024-01-16')
      
      expect(result.availableCount).toBe(0)
      expect(result.maybeCount).toBe(1) // Bob
      expect(result.unavailableCount).toBe(1) // Alice
      expect(result.totalCount).toBe(3)
      expect(result.percentage).toBe(17) // (0 + 0.5) / 3 * 100 = 16.67 -> 17
    })
  })

  describe('getAvailabilityLevel', () => {
    it('should return correct levels for different percentages', () => {
      expect(getAvailabilityLevel(100)).toBe('excellent')
      expect(getAvailabilityLevel(95)).toBe('good')
      expect(getAvailabilityLevel(80)).toBe('good')
      expect(getAvailabilityLevel(75)).toBe('fair')
      expect(getAvailabilityLevel(50)).toBe('fair')
      expect(getAvailabilityLevel(25)).toBe('poor')
      expect(getAvailabilityLevel(1)).toBe('poor')
      expect(getAvailabilityLevel(0)).toBe('none')
    })

    it('should handle edge cases', () => {
      expect(getAvailabilityLevel(79)).toBe('fair')
      expect(getAvailabilityLevel(81)).toBe('good')
      expect(getAvailabilityLevel(49)).toBe('poor')
      expect(getAvailabilityLevel(51)).toBe('fair')
    })
  })

  describe('Integration tests', () => {
    it('should work together for real-world scenarios', () => {
      // Scenario: Team planning meeting
      const teamMeeting = [
        {
          member_id: '1',
          member_name: 'Project Manager',
          schedules: {
            '2024-01-15': {
              'morning': { status: 'available' }
            }
          }
        },
        {
          member_id: '2',
          member_name: 'Developer 1',
          schedules: {
            '2024-01-15': {
              'morning': { status: 'available' }
            }
          }
        },
        {
          member_id: '3',
          member_name: 'Developer 2',
          schedules: {
            '2024-01-15': {
              'morning': { status: 'maybe' }
            }
          }
        },
        {
          member_id: '4',
          member_name: 'Designer',
          schedules: {
            '2024-01-15': {
              'morning': { status: 'unavailable' }
            }
          }
        }
      ]

      const availability = calculateTeamAvailability(teamMeeting, 'morning', '2024-01-15')
      const level = getAvailabilityLevel(availability.percentage)

      expect(availability.availableCount).toBe(2)
      expect(availability.maybeCount).toBe(1)
      expect(availability.unavailableCount).toBe(1)
      expect(availability.percentage).toBe(63) // (2 + 0.5) / 4 * 100 = 62.5 -> 63
      expect(level).toBe('fair')
    })
  })

  describe('getMonthDates', () => {
    it('should return all dates in a month', () => {
      const dates = getMonthDates(2024, 0) // January 2024 (month is 0-indexed)
      expect(dates).toHaveLength(31)
      expect(dates[0]).toBe('2024-01-01')
      expect(dates[30]).toBe('2024-01-31')
    })

    it('should handle February in leap year', () => {
      const dates = getMonthDates(2024, 1) // February 2024 (leap year, month is 0-indexed)
      expect(dates).toHaveLength(29)
      expect(dates[0]).toBe('2024-02-01')
      expect(dates[28]).toBe('2024-02-29')
    })

    it('should handle February in non-leap year', () => {
      const dates = getMonthDates(2023, 1) // February 2023 (non-leap year, month is 0-indexed)
      expect(dates).toHaveLength(28)
      expect(dates[0]).toBe('2023-02-01')
      expect(dates[27]).toBe('2023-02-28')
    })
  })

  describe('getCalendarWeeks', () => {
    it('should return proper calendar weeks for a month', () => {
      const weeks = getCalendarWeeks(2024, 0) // January 2024 (month is 0-indexed)
      
      // Should have 5 or 6 weeks
      expect(weeks.length).toBeGreaterThanOrEqual(5)
      expect(weeks.length).toBeLessThanOrEqual(6)
      
      // Each week should have 7 days
      weeks.forEach(week => {
        expect(week).toHaveLength(7)
      })
      
      // First day should be a Sunday
      const firstDate = new Date(weeks[0][0].dateString)
      expect(firstDate.getDay()).toBe(0) // Sunday is 0
      
      // Last day should be a Saturday
      const lastWeek = weeks[weeks.length - 1]
      const lastDate = new Date(lastWeek[6].dateString)
      expect(lastDate.getDay()).toBe(6) // Saturday is 6
    })

    it('should correctly mark current month dates', () => {
      const weeks = getCalendarWeeks(2024, 0) // January 2024 (month is 0-indexed)
      const allDates = weeks.flat()
      
      const currentMonthDates = allDates.filter(date => date.isCurrentMonth)
      const otherMonthDates = allDates.filter(date => !date.isCurrentMonth)
      
      expect(currentMonthDates).toHaveLength(31) // January has 31 days
      expect(otherMonthDates.length).toBeGreaterThan(0) // Should have some dates from other months
      
      // Verify that current month dates are actually in January 2024
      currentMonthDates.forEach(date => {
        const dateObj = new Date(date.dateString)
        expect(dateObj.getFullYear()).toBe(2024)
        expect(dateObj.getMonth()).toBe(0) // January is month 0
      })
    })
  })
})