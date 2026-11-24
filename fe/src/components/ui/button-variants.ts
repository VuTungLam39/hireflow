import { cn } from '@/lib/utils'

const ghost = 'text-ui-fg-2 hover:bg-ui-sunken hover:text-ui-fg'

// Contract Phase 03: primary | secondary | ghost | danger | link.
// quiet / inverse / danger-quiet: tên cũ còn ở call site vùng khoá (slice 7–11), giữ tới slice đó.
const variants = {
  primary:
    'bg-ui-primary font-semibold text-ui-on-primary hover:bg-ui-primary-hover active:bg-ui-primary-hover',
  secondary:
    'bg-ui-surface text-ui-fg border border-ui-border hover:bg-ui-surface-hover hover:border-ui-border-hover',
  ghost,
  danger: 'bg-ui-danger text-ui-on-danger hover:bg-ui-danger/90',
  link: 'h-auto px-0 text-[length:inherit] text-ui-primary hover:underline underline-offset-2',
  quiet: ghost,
  inverse: 'bg-ui-surface font-semibold text-ui-fg hover:bg-ui-surface-hover',
  'danger-quiet': 'text-ui-danger hover:bg-ui-danger-soft',
} as const

const sizes = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'size-9 pointer-coarse:after:inset-x-auto pointer-coarse:after:left-1/2 pointer-coarse:after:w-11 pointer-coarse:after:-translate-x-1/2',
  'icon-sm':
    'size-8 pointer-coarse:after:inset-x-auto pointer-coarse:after:left-1/2 pointer-coarse:after:w-11 pointer-coarse:after:-translate-x-1/2',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes
export type ButtonStyle = { variant?: ButtonVariant; size?: ButtonSize }

export function buttonVariants({ variant = 'primary', size = 'md' }: ButtonStyle = {}) {
  return cn(
    'relative inline-flex items-center justify-center gap-1.5 rounded-ui font-medium whitespace-nowrap select-none',
    'transition-colors duration-150 ease-(--ease-standard)',
    'disabled:pointer-events-none',
    '[&:disabled:not([data-loading])]:bg-ui-sunken [&:disabled:not([data-loading])]:text-ui-muted [&:disabled:not([data-loading])]:border-transparent',
    'aria-disabled:cursor-not-allowed aria-disabled:bg-ui-sunken aria-disabled:text-ui-muted',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    'pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2',
    sizes[size],
    variants[variant],
  )
}
