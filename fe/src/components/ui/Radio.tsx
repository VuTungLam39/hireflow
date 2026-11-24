import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RadioOption {
  value: string
  label: ReactNode
  description?: ReactNode
}

interface RadioGroupProps {
  legend: ReactNode
  name: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function RadioGroup({
  legend,
  name,
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
}: RadioGroupProps) {
  return (
    <fieldset disabled={disabled} className={cn('space-y-2', className)}>
      <legend className="type-label mb-1.5">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-start gap-2.5">
          <span className="flex h-[22px] items-center">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === undefined ? undefined : value === o.value}
              defaultChecked={defaultValue === undefined ? undefined : defaultValue === o.value}
              onChange={() => onChange?.(o.value)}
              className="accent-ui-primary size-4 cursor-pointer disabled:cursor-not-allowed"
            />
          </span>
          <span className="min-w-0">
            <span className="text-ui-fg-2 block">{o.label}</span>
            {o.description && <span className="type-caption block">{o.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
