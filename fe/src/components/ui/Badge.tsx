import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Tone theo ngữ nghĩa, không theo màu: enum nghiệp vụ (trạng thái, cờ AI) map vào đây */
const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
} as const

export type BadgeTone = keyof typeof tones

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
