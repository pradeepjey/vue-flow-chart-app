const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidTime = (value: unknown): value is string => typeof value === 'string' && TIME_RE.test(value)

/** "HH:mm" -> minutes since midnight, or NaN when invalid. */
export function timeToMinutes(value: string | null | undefined): number {
  const match = TIME_RE.exec(value ?? '')
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN
}

export const pad2 = (n: number | string): string => String(n).padStart(2, '0')

export function minutesToTime(total: number): string {
  const clamped = Math.min(Math.max(Math.round(total), 0), 23 * 60 + 59)
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`
}

export const HOURS: readonly string[] = Array.from({ length: 24 }, (_, i) => pad2(i))
export const MINUTES: readonly string[] = Array.from({ length: 12 }, (_, i) => pad2(i * 5))

export interface TimeParts {
  hour: string
  minute: string
}

/** Split "HH:mm" into parts, falling back to 00:00. */
export function splitTime(value: string | null | undefined): TimeParts {
  if (!isValidTime(value)) return { hour: '00', minute: '00' }
  const [hour = '00', minute = '00'] = value.split(':')
  return { hour, minute }
}

/** IANA time zones offered in the business-hours drawer. */
export function getTimeZones(): string[] {
  let zones: string[] = []
  try {
    zones = Intl.supportedValuesOf?.('timeZone') ?? []
  } catch {
    zones = []
  }
  if (!zones.length) {
    zones = ['Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'America/New_York']
  }
  return ['UTC', ...zones.filter((z) => z !== 'UTC')]
}

/** "(GMT+08:00) Asia/Kuala_Lumpur" style label. */
export function formatTimeZoneLabel(zone: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(date)
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
    return `(${raw === 'GMT' ? 'GMT+00:00' : raw}) ${zone}`
  } catch {
    return zone
  }
}
