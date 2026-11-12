import { cn } from '@/lib/utils'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('bg-sunken inline-flex rounded-sm p-0.5', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-inset border px-3 font-medium whitespace-nowrap transition-colors duration-150',
              size === 'sm' ? 'h-7 text-[13px]' : 'h-8 text-sm',
              active
                ? 'border-line bg-surface text-ink'
                : 'text-ink-muted hover:text-ink border-transparent',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
