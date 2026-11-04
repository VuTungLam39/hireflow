import { formatDate } from './utils'

const VN_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/
const DAY_MS = 86_400_000

/** "31/12/2026" → "2026-12-31"; null nếu sai định dạng hoặc ngày không tồn tại */
export function vnTextToIsoDay(text: string): string | null {
  const m = VN_DATE.exec(text.trim())
  if (!m) return null
  const [, d, mo, y] = m
  const date = new Date(Date.UTC(+y, +mo - 1, +d))
  return date.getUTCDate() === +d && date.getUTCMonth() === +mo - 1 ? `${y}-${mo}-${d}` : null
}

/** "2026-12-31" → "31/12/2026" */
export const isoDayToVnText = (iso: string | null | undefined) =>
  iso ? iso.split('-').reverse().join('/') : ''

/** Gõ "31122026" thành "31/12/2026" */
export function withDaySlashes(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}

/** Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD */
export function todayIsoDay(now: Date = new Date()) {
  const [d, m, y] = formatDate(now.toISOString()).split('/')
  return `${y}-${m}-${d}`
}

export function shiftIsoDay(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Số ngày từ hôm nay (giờ Việt Nam) tới ngày `iso`; âm nếu đã qua */
export function daysUntilIsoDay(iso: string, now: Date = new Date()) {
  const today = Date.parse(`${todayIsoDay(now)}T00:00:00Z`)
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - today) / DAY_MS)
}
