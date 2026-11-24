import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: ReactNode
  htmlFor: string
  error?: string
  description?: ReactNode
  /** tên cũ của description */
  hint?: ReactNode
  required?: boolean
  optional?: boolean
  className?: string
  children: ReactNode
}

type ControlProps = { 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' }

export function FormField({
  label,
  htmlFor,
  error,
  description,
  hint,
  required,
  optional,
  className,
  children,
}: FormFieldProps) {
  const help = description ?? hint
  const errorId = `${htmlFor}-error`
  const helpId = `${htmlFor}-hint`
  const ids = [error && errorId, help && helpId].filter(Boolean).join(' ')
  const only = Children.count(children) === 1 && isValidElement(children)
  const control = only
    ? cloneElement(children as ReactElement<ControlProps>, {
        'aria-describedby':
          [ids, (children as ReactElement<ControlProps>).props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined,
        'aria-invalid': error
          ? true
          : (children as ReactElement<ControlProps>).props['aria-invalid'],
      })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="type-label block">
        {label}
        {required && <span className="text-ui-muted font-normal"> (bắt buộc)</span>}
        {optional && <span className="text-ui-muted font-normal"> · không bắt buộc</span>}
      </label>
      {control}
      {error && (
        <p id={errorId} role="alert" className="text-ui-danger text-[13px] leading-5">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="type-caption">
          {help}
        </p>
      )}
    </div>
  )
}
