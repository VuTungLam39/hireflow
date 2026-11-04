import { cn } from '@/lib/utils'
import { chipClass } from './field-styles'

interface ChipOption<T extends string> {
  value: T
  label: string
  dotClass?: string
}

interface ChipGroupProps<T extends string> {
  label: string
  options: ChipOption<T>[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  allLabel?: string
}

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel = 'Tất cả',
}: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      <button
        type="button"
        role="radio"
        aria-checked={value === undefined}
        className={chipClass(value === undefined)}
        onClick={() => onChange(undefined)}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={chipClass(value === opt.value)}
          onClick={() => onChange(value === opt.value ? undefined : opt.value)}
        >
          {opt.dotClass && (
            <span aria-hidden className={cn('size-1.5 rounded-full', opt.dotClass)} />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
