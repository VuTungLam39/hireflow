import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label?: ReactNode
  description?: ReactNode
  indeterminate?: boolean
}

export function Checkbox({
  label,
  description,
  className,
  indeterminate,
  ...props
}: CheckboxProps) {
  const box = (
    <input
      type="checkbox"
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate
      }}
      className={cn(
        'accent-brand size-4 shrink-0 cursor-pointer disabled:cursor-not-allowed',
        !label && className,
      )}
      {...props}
    />
  )
  if (!label) return box
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5', className)}>
      <span className="flex h-[22px] items-center">{box}</span>
      <span className="min-w-0">
        <span className="text-ink-2 block">{label}</span>
        {description && <span className="type-caption block">{description}</span>}
      </span>
    </label>
  )
}
