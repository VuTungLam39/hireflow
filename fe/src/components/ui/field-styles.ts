import { cn } from '@/lib/utils'

export const fieldBase =
  'w-full rounded-ui border border-ui-border-strong bg-ui-surface text-sm text-ui-fg transition-[border-color,box-shadow] duration-150 placeholder:text-ui-muted hover:border-ui-border-hover focus:border-ui-primary focus:ring-3 focus:ring-ui-focus-soft focus:outline-none disabled:cursor-not-allowed disabled:bg-ui-sunken disabled:text-ui-muted disabled:hover:border-ui-border-strong'

export const fieldInvalid =
  'border-ui-danger hover:border-ui-danger focus:border-ui-danger focus:ring-ui-danger-soft'

export const chipClass = (active: boolean) =>
  cn(
    'inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
    active
      ? 'border-brand/25 bg-brand-soft text-brand'
      : 'border-line bg-surface text-ink-2 hover:border-ink-faint hover:text-ink',
  )
