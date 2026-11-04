import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="type-label block">
        {label}
        {optional && <span className="text-ink-muted font-normal"> · không bắt buộc</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-bad text-[13px] leading-5">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${htmlFor}-hint`} className="type-caption">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
