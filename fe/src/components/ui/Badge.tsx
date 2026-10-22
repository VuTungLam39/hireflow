import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { TONE_DOT } from './tones'

/** Tone theo ngữ nghĩa, không theo màu: enum nghiệp vụ (trạng thái, cờ AI) map vào đây */
const tones = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/10',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/15',
} as const

export type BadgeTone = keyof typeof tones

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
  /** Chấm màu phía trước – dùng cho trạng thái */
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', TONE_DOT[tone])} />}
      {children}
    </span>
  )
}
