import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp className, class Tailwind sau sẽ ghi đè class trước nếu xung đột */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh'

// Design Spec mục 8: ngày giờ "27/10/2026, 14:30", luôn theo giờ Việt Nam
const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: VN_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function vnParts(value: string) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
  )
  return {
    date: `${parts.day}/${parts.month}/${parts.year}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

/** "27/10/2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return vnParts(value).date
}

/** "14:30" */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  return vnParts(value).time
}

/** "27/10/2026, 14:30" */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const { date, time } = vnParts(value)
  return `${date}, ${time}`
}

/** "14:30 ngày 27/10/2026" – dùng trong câu văn */
export function formatTimeOnDate(value: string | null | undefined): string {
  if (!value) return '—'
  const { date, time } = vnParts(value)
  return `${time} ngày ${date}`
}

/** "3 ngày trước", "vừa xong" */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return '—'
  const diff = (new Date(value).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return lowerFirst(rtf.format(Math.round(diff / seconds), unit))
  }
  return 'vừa xong'
}

const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase('vi') + text.slice(1)

function vnDayNumber(value: string | Date) {
  const [d, m, y] = vnParts(new Date(value).toISOString()).date.split('/').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

export function formatDaysAgo(
  value: string | null | undefined,
  now: Date = new Date(),
  { hoursToday = false } = {},
): string {
  if (!value) return '—'
  const days = Math.max(0, vnDayNumber(now) - vnDayNumber(value))
  if (days === 0) return hoursToday ? formatRelative(value) : 'hôm nay'
  if (days === 1) return 'hôm qua'
  return `${days.toLocaleString('vi-VN')} ngày trước`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
