import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RatingScaleProps {
  legend: ReactNode
  name: string
  max?: number
  value?: number
  onChange?: (value: number) => void
  /** nhãn chữ cho từng mức, vd. ['Chưa đạt', …] */
  labels?: string[]
  invalid?: boolean

  error?: string
  disabled?: boolean
  className?: string
}

// VF-10: radio native nằm trong label định vị – không ẩn radio ra ngoài label
export function RatingScale({
  legend,
  name,
  max = 5,
  value,
  onChange,
  labels,
  invalid,
  error,
  disabled,
  className,
}: RatingScaleProps) {
  const errorId = useId()
  return (
    <fieldset
      disabled={disabled}
      aria-invalid={invalid || !!error || undefined}
      aria-describedby={error ? errorId : undefined}
      className={className}
    >
      <legend className="type-label mb-1.5">{legend}</legend>
      <div
        className={cn(
          'rounded-ui inline-flex overflow-hidden border',
          invalid || error ? 'border-ui-danger' : 'border-ui-border-strong',
        )}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <label
            key={n}
            className={cn(
              'text-ui-fg-2 relative flex h-9 min-w-11 cursor-pointer items-center justify-center px-3 text-sm font-medium',
              'border-ui-border-strong not-first:border-l',
              'hover:bg-ui-surface-hover has-checked:bg-ui-primary has-checked:text-ui-on-primary',
              'has-focus-visible:outline-ui-focus has-focus-visible:z-10 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2',
              'has-disabled:cursor-not-allowed has-disabled:opacity-50',
            )}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === undefined ? undefined : value === n}
              onChange={() => onChange?.(n)}
              aria-label={labels?.[n - 1] ? `${n} · ${labels[n - 1]}` : undefined}
              className="absolute inset-0 cursor-pointer appearance-none focus-visible:outline-none"
            />
            {n}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-ui-danger mt-1 text-[13px]">
          {error}
        </p>
      )}
    </fieldset>
  )
}
