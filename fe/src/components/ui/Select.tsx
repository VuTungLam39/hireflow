import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { fieldBase } from './field-styles'

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select
        className={cn(fieldBase, 'h-9 cursor-pointer appearance-none pr-9 pl-3')}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="text-ink-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </span>
  )
}
