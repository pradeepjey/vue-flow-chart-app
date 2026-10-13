import { describe, expect, it } from 'vitest'
import { formatTimeZoneLabel, getTimeZones, isValidTime, minutesToTime, splitTime, timeToMinutes } from '@/utils/time'

describe('time utils', () => {
  it('validates HH:mm', () => {
    expect(isValidTime('09:00')).toBe(true)
    expect(isValidTime('23:59')).toBe(true)
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('9:00')).toBe(false)
    expect(isValidTime(null)).toBe(false)
  })

  it('converts to and from minutes', () => {
    expect(timeToMinutes('17:30')).toBe(1050)
    expect(Number.isNaN(timeToMinutes('x'))).toBe(true)
    expect(minutesToTime(1050)).toBe('17:30')
    expect(minutesToTime(-5)).toBe('00:00')
    expect(minutesToTime(5000)).toBe('23:59')
  })

  it('splits time with a safe fallback', () => {
    expect(splitTime('08:45')).toEqual({ hour: '08', minute: '45' })
    expect(splitTime('bad')).toEqual({ hour: '00', minute: '00' })
  })

  it('lists time zones with UTC first', () => {
    const zones = getTimeZones()
    expect(zones[0]).toBe('UTC')
    expect(zones.filter((z) => z === 'UTC')).toHaveLength(1)
  })

  it('formats zone labels', () => {
    expect(formatTimeZoneLabel('UTC')).toBe('(GMT+00:00) UTC')
    expect(formatTimeZoneLabel('Asia/Kuala_Lumpur')).toBe('(GMT+08:00) Asia/Kuala_Lumpur')
    expect(formatTimeZoneLabel('Not/AZone')).toBe('Not/AZone')
  })
})
