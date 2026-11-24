import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { fieldBase, fieldInvalid } from './field-styles'

interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  invalid?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const heights = { sm: 'h-8', md: 'h-9', lg: 'h-11' } as const

export function Input({ className, invalid, size = 'md', ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, heights[size], 'px-3', invalid && fieldInvalid, className)}
      {...props}
    />
  )
}
