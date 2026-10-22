import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm transition-colors hover:border-slate-300',
        'focus:border-primary focus:ring-primary/20 placeholder:text-slate-400 focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-slate-100',
        invalid && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
        className,
      )}
      {...props}
    />
  )
}
