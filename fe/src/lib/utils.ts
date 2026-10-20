import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp className, class Tailwind sau sẽ ghi đè class trước nếu xung đột */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
}
