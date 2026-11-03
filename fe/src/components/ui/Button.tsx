import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonStyle } from './button-variants'
import { Spinner } from './Spinner'

interface ButtonProps extends ComponentProps<'button'>, ButtonStyle {
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
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size }), loading && '[&>svg]:hidden', className)}
      {...props}
    >
      {loading && <Spinner className="size-3.5" />}
      {children}
    </button>
  )
}
