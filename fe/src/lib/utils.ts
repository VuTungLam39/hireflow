import { clsx, type ClassValue } from 'clsx'
import type { CSSProperties } from 'react'
import { twMerge } from 'tailwind-merge'

/** Gộp className, class Tailwind sau sẽ ghi đè class trước nếu xung đột */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Độ trễ xuất hiện theo thứ tự cho phần tử thứ `index` (đi kèm class `stagger`) */
export const staggerStyle = (index: number) => ({ '--i': index }) as CSSProperties

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
}

export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function formatDate(value: string | null | undefined, timeZone?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone }).format(new Date(value))
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
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit)
  }
  return 'vừa xong'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
