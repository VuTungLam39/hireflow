import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TimelineEntry {
  id: string
  title: ReactNode
  meta?: ReactNode
  quote?: ReactNode
  tone?: 'default' | 'good' | 'bad' | 'muted'
  aside?: ReactNode
}

const dot = {
  default: 'bg-ink-2',
  good: 'bg-good',
  bad: 'bg-bad',
  muted: 'bg-ink-faint',
} as const

export function Timeline({ items, className }: { items: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 && (
            <span aria-hidden className="bg-line absolute top-3 bottom-0 left-[3.5px] w-px" />
          )}
          <span
            aria-hidden
            className={cn(
              'relative mt-[7px] size-2 shrink-0 rounded-full',
              dot[item.tone ?? 'default'],
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-ink">{item.title}</p>
              {item.aside}
            </div>
            {item.meta && <p className="type-caption">{item.meta}</p>}
            {item.quote && (
              <blockquote className="border-line text-ink-2 bg-sunken/60 mt-1.5 rounded-xs border-l-2 px-3 py-1.5 text-[13px]">
                {item.quote}
              </blockquote>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
