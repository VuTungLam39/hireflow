import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { fieldBase, fieldInvalid } from './field-styles'

interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        'min-h-24 px-3 py-2 leading-[22px]',
        invalid && fieldInvalid,
        className,
      )}
      {...props}
    />
  )
}
