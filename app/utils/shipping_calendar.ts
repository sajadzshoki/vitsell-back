import { DateTime } from 'luxon'
import ShippingCalendarHoliday from '#models/shipping_calendar_holiday'

/** 0=شنبه … 6=جمعه */
export function iranWeekday(date: DateTime): number {
  const luxon = date.weekday // 1=Mon … 7=Sun
  if (luxon === 6) return 0 // Sat
  if (luxon === 7) return 1 // Sun
  return luxon + 1 // Mon=2 … Fri=6
}

export function isFriday(date: DateTime): boolean {
  return iranWeekday(date) === 6
}

export function toDateKey(date: DateTime): string {
  return date.toISODate() || ''
}

export async function loadHolidayDateSet(from: DateTime, to: DateTime): Promise<Set<string>> {
  const rows = await ShippingCalendarHoliday.query()
    .where('date', '>=', from.toISODate()!)
    .where('date', '<=', to.toISODate()!)
  return new Set(rows.map((r) => r.date.toISODate()!).filter(Boolean))
}

export function parseTimeToMinutes(value: string): number {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return -1
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return -1
  return h * 60 + min
}

export function normalizeTime(value: string): string | null {
  const minutes = parseTimeToMinutes(value)
  if (minutes < 0) return null
  const h = Math.floor(minutes / 60)
  const min = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
