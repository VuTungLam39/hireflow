import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm',
        'focus:border-primary focus:ring-primary/30 focus:ring-2 focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}
