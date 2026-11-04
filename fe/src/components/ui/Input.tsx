import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { fieldBase, fieldInvalid } from './field-styles'

interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, 'h-9 px-3', invalid && fieldInvalid, className)}
      {...props}
    />
  )
}
