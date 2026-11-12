import { cn } from '@/lib/utils'

export const fieldBase =
  'w-full rounded-sm border border-line-strong bg-surface text-sm text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-muted hover:border-ink-faint focus:border-brand focus:ring-3 focus:ring-brand-soft focus:outline-none disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted disabled:hover:border-line-strong'

export const fieldInvalid = 'border-bad hover:border-bad focus:border-bad focus:ring-bad-soft'

export const chipClass = (active: boolean) =>
  cn(
    'inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
    active
      ? 'border-brand/25 bg-brand-soft text-brand'
      : 'border-line bg-surface text-ink-2 hover:border-ink-faint hover:text-ink',
  )
