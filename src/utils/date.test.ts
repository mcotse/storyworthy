import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getTodayDateString,
  formatDateString,
  getRelativeTime,
  isFutureDate,
  isTodayDate,
  getTimeOfDay,
  calculateStreak,
  dateToString,
  getCalendarDays,
  getNextMonth,
  getPrevMonth,
} from './date'

describe('date utilities', () => {
  describe('getTodayDateString', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const result = getTodayDateString()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('formatDateString', () => {
    it('returns "Today" for today\'s date', () => {
      const today = getTodayDateString()
      expect(formatDateString(today)).toBe('Today')
    })

    it('returns formatted date for past days', () => {
      const result = formatDateString('2024-01-10')
      expect(result).toContain('Jan')
      expect(result).toContain('10')
      expect(result).toContain('2024')
    })
  })

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns "just now" for recent timestamps', () => {
      const now = Date.now()
      expect(getRelativeTime(now - 30000)).toBe('just now')
    })

    it('returns minutes ago', () => {
      const now = Date.now()
      expect(getRelativeTime(now - 5 * 60 * 1000)).toBe('5 minutes ago')
    })

    it('returns hours ago', () => {
      const now = Date.now()
      expect(getRelativeTime(now - 3 * 60 * 60 * 1000)).toBe('3 hours ago')
    })

    it('returns "yesterday" for 1 day ago', () => {
      const now = Date.now()
      expect(getRelativeTime(now - 25 * 60 * 60 * 1000)).toBe('yesterday')
    })

    it('returns days ago', () => {
      const now = Date.now()
      expect(getRelativeTime(now - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago')
    })
  })

  describe('isFutureDate', () => {
    it('returns true for future dates', () => {
      expect(isFutureDate('2099-01-20')).toBe(true)
    })

    it('returns false for past dates', () => {
      expect(isFutureDate('2020-01-10')).toBe(false)
    })

    it('returns false for today', () => {
      const today = getTodayDateString()
      expect(isFutureDate(today)).toBe(false)
    })
  })

  describe('isTodayDate', () => {
    it('returns true for today', () => {
      const today = getTodayDateString()
      expect(isTodayDate(today)).toBe(true)
    })

    it('returns false for other days', () => {
      expect(isTodayDate('2020-01-14')).toBe(false)
      expect(isTodayDate('2099-01-16')).toBe(false)
    })
  })

  describe('getTimeOfDay', () => {
    it('returns morning for 5-11 AM', () => {
      expect(getTimeOfDay(new Date('2024-01-15T05:00:00').getTime())).toBe('morning')
      expect(getTimeOfDay(new Date('2024-01-15T10:59:00').getTime())).toBe('morning')
    })

    it('returns afternoon for 11 AM - 5 PM', () => {
      expect(getTimeOfDay(new Date('2024-01-15T11:00:00').getTime())).toBe('afternoon')
      expect(getTimeOfDay(new Date('2024-01-15T16:59:00').getTime())).toBe('afternoon')
    })

    it('returns evening for 5-9 PM', () => {
      expect(getTimeOfDay(new Date('2024-01-15T17:00:00').getTime())).toBe('evening')
      expect(getTimeOfDay(new Date('2024-01-15T20:59:00').getTime())).toBe('evening')
    })

    it('returns night for 9 PM - 5 AM', () => {
      expect(getTimeOfDay(new Date('2024-01-15T21:00:00').getTime())).toBe('night')
      expect(getTimeOfDay(new Date('2024-01-15T04:59:00').getTime())).toBe('night')
    })
  })

  describe('calculateStreak', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns 0 for empty array', () => {
      expect(calculateStreak([])).toEqual({ current: 0, longest: 0 })
    })

    it('calculates current streak correctly', () => {
      const dates = ['2024-01-15', '2024-01-14', '2024-01-13']
      const result = calculateStreak(dates)
      expect(result.current).toBe(3)
    })

    it('calculates longest streak correctly', () => {
      const dates = ['2024-01-15', '2024-01-10', '2024-01-09', '2024-01-08', '2024-01-07']
      const result = calculateStreak(dates)
      expect(result.longest).toBe(4)
    })

    it('handles 1-day grace period', () => {
      // Missing yesterday but have today and day before yesterday
      const dates = ['2024-01-15', '2024-01-13']
      const result = calculateStreak(dates)
      expect(result.current).toBe(2)
    })

    it('breaks streak after more than 1 day gap', () => {
      const dates = ['2024-01-15', '2024-01-12']
      const result = calculateStreak(dates)
      expect(result.current).toBe(1)
    })
  })

  describe('dateToString', () => {
    it('converts Date to YYYY-MM-DD string', () => {
      const date = new Date(2024, 0, 15) // Use local date constructor
      expect(dateToString(date)).toBe('2024-01-15')
    })
  })

  describe('getCalendarDays', () => {
    it('returns array of days with isCurrentMonth flag', () => {
      const days = getCalendarDays(2024, 0) // January 2024
      expect(days.length).toBeGreaterThanOrEqual(28)
      expect(days.length).toBeLessThanOrEqual(42)
      expect(days[0]).toHaveProperty('date')
      expect(days[0]).toHaveProperty('isCurrentMonth')
    })

    it('includes days from adjacent months', () => {
      const days = getCalendarDays(2024, 0)
      const otherMonthDays = days.filter(d => !d.isCurrentMonth)
      expect(otherMonthDays.length).toBeGreaterThan(0)
    })
  })

  describe('getNextMonth / getPrevMonth', () => {
    it('getNextMonth increments month correctly', () => {
      expect(getNextMonth(2024, 0)).toEqual({ year: 2024, month: 1 })
      expect(getNextMonth(2024, 11)).toEqual({ year: 2025, month: 0 })
    })

    it('getPrevMonth decrements month correctly', () => {
      expect(getPrevMonth(2024, 1)).toEqual({ year: 2024, month: 0 })
      expect(getPrevMonth(2024, 0)).toEqual({ year: 2023, month: 11 })
    })
  })
})
