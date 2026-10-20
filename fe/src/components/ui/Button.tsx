import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-700 hover:bg-slate-100',
} as const

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
} as const

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}
