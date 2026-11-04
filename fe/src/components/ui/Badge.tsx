import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { TONE_DOT } from './tones'

const tones = {
  neutral: 'bg-sunken text-ink-2',
  info: 'bg-info-soft text-info',
  success: 'bg-good-soft text-good-ink',
  warning: 'bg-warn-soft text-warn',
  danger: 'bg-bad-soft text-bad',
} as const

export type BadgeTone = keyof typeof tones

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5',
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
