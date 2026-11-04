import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-brand font-semibold text-white hover:bg-brand-hover active:bg-brand-hover',
  inverse: 'bg-surface font-semibold text-ink hover:bg-canvas',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas hover:border-ink-faint',
  quiet: 'text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'bg-bad text-white hover:bg-bad/90',
  'danger-quiet': 'text-bad hover:bg-bad-soft',
} as const

const sizes = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'size-9',
  'icon-sm': 'size-8',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes
export type ButtonStyle = { variant?: ButtonVariant; size?: ButtonSize }

export function buttonVariants({ variant = 'primary', size = 'md' }: ButtonStyle = {}) {
  return cn(
    'relative inline-flex items-center justify-center gap-1.5 rounded-sm font-medium whitespace-nowrap select-none',
    'transition-colors duration-150 ease-(--ease-standard)',
    'disabled:pointer-events-none',
    '[&:disabled:not([data-loading])]:bg-sunken [&:disabled:not([data-loading])]:text-ink-faint [&:disabled:not([data-loading])]:border-transparent',
    'aria-disabled:cursor-not-allowed aria-disabled:bg-sunken aria-disabled:text-ink-faint',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    'pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2',
    variants[variant],
    sizes[size],
  )
}
