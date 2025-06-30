import { describe, it, expect } from 'vitest'
import { cycleAvailabilityStatus, getStatusColor, getStatusText } from '~/utils/supabase'

describe('Status Logic - Comprehensive Tests', () => {
  describe('cycleAvailabilityStatus state machine', () => {
    it('should follow the correct state transition cycle', () => {
      // Test the complete cycle: null -> available -> maybe -> unavailable -> null
      let status: string | null = null
      
      status = cycleAvailabilityStatus(status)
      expect(status).toBe('available')
      
      status = cycleAvailabilityStatus(status)
      expect(status).toBe('maybe')
      
      status = cycleAvailabilityStatus(status)
      expect(status).toBe('unavailable')
      
      status = cycleAvailabilityStatus(status)
      expect(status).toBe(null)
      
      // Should cycle back to available
      status = cycleAvailabilityStatus(status)
      expect(status).toBe('available')
    })

    it('should handle multiple cycles consistently', () => {
      let status: string | null = null
      const expectedCycle = ['available', 'maybe', 'unavailable', null]
      
      // Test 3 complete cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const expectedStatus of expectedCycle) {
          status = cycleAvailabilityStatus(status)
          expect(status).toBe(expectedStatus)
        }
      }
    })

    it('should handle edge cases and invalid inputs', () => {
      expect(cycleAvailabilityStatus(undefined as any)).toBe('available')
      expect(cycleAvailabilityStatus('random-string')).toBe('available')
      expect(cycleAvailabilityStatus(123 as any)).toBe('available')
      expect(cycleAvailabilityStatus(true as any)).toBe('available')
      expect(cycleAvailabilityStatus(false as any)).toBe('available')
    })
  })

  describe('getStatusColor consistency', () => {
    it('should return consistent colors for valid statuses', () => {
      const availableColor = getStatusColor('available')
      const maybeColor = getStatusColor('maybe')
      const unavailableColor = getStatusColor('unavailable')
      const nullColor = getStatusColor(null)
      
      // Colors should be consistent across multiple calls
      expect(getStatusColor('available')).toBe(availableColor)
      expect(getStatusColor('maybe')).toBe(maybeColor)
      expect(getStatusColor('unavailable')).toBe(unavailableColor)
      expect(getStatusColor(null)).toBe(nullColor)
    })

    it('should return valid Tailwind CSS classes', () => {
      const statuses = ['available', 'maybe', 'unavailable', null]
      
      statuses.forEach(status => {
        const colorClass = getStatusColor(status)
        // Should contain bg- and text- classes
        expect(colorClass).toMatch(/bg-/)
        expect(colorClass).toMatch(/text-/)
        // Should be a valid CSS class string
        expect(typeof colorClass).toBe('string')
        expect(colorClass.length).toBeGreaterThan(0)
      })
    })

    it('should handle invalid inputs gracefully', () => {
      const invalidInputs = ['', 'invalid', undefined, 123, true, false, {}]
      
      invalidInputs.forEach(input => {
        const result = getStatusColor(input as any)
        expect(result).toBe('bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300')
      })
    })
  })

  describe('getStatusText user experience', () => {
    it('should provide clear, user-friendly text', () => {
      expect(getStatusText('available')).toBe('Available')
      expect(getStatusText('maybe')).toBe('Maybe')
      expect(getStatusText('unavailable')).toBe('Unavailable')
      expect(getStatusText(null)).toBe('Click to set')
    })

    it('should handle case sensitivity', () => {
      expect(getStatusText('AVAILABLE')).toBe('Click to set') // Should not match
      expect(getStatusText('Available')).toBe('Click to set') // Should not match
      expect(getStatusText('available')).toBe('Available') // Should match
    })

    it('should provide helpful fallback text', () => {
      const invalidInputs = ['', 'invalid', undefined, 123, true, false]
      
      invalidInputs.forEach(input => {
        const result = getStatusText(input as any)
        expect(result).toBe('Click to set')
      })
    })
  })

  describe('Status integration tests', () => {
    it('should maintain consistency between status functions', () => {
      const statuses = ['available', 'maybe', 'unavailable', null]
      
      statuses.forEach(status => {
        const color = getStatusColor(status)
        const text = getStatusText(status)
        const nextStatus = cycleAvailabilityStatus(status)
        
        // Each status should have a color, text, and next status
        expect(color).toBeTruthy()
        expect(text).toBeTruthy()
        expect(nextStatus !== status || status === null).toBeTruthy() // Status should change (except null can cycle back to null)
      })
    })

    it('should support complete user interaction flow', () => {
      // Simulate user clicking through all statuses
      let currentStatus: string | null = null
      const interactions = []
      
      for (let i = 0; i < 8; i++) { // Two complete cycles
        const color = getStatusColor(currentStatus)
        const text = getStatusText(currentStatus)
        
        interactions.push({ status: currentStatus, color, text })
        currentStatus = cycleAvailabilityStatus(currentStatus)
      }
      
      // Should have 8 interactions with 4 unique statuses repeated twice
      expect(interactions).toHaveLength(8)
      
      // First 4 and last 4 should be identical (complete cycles)
      for (let i = 0; i < 4; i++) {
        expect(interactions[i].status).toBe(interactions[i + 4].status)
        expect(interactions[i].color).toBe(interactions[i + 4].color)
        expect(interactions[i].text).toBe(interactions[i + 4].text)
      }
    })
  })
})