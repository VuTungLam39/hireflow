import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:border-slate-300',
        'focus:border-primary focus:ring-primary/20 placeholder:text-slate-400 focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-slate-100',
        invalid && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
        className,
      )}
      {...props}
    />
  )
}
