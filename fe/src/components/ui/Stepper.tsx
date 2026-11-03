import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  disabled?: boolean
  className?: string
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 5,
  label,
  disabled,
  className,
}: StepperProps) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)))
  const btn =
    'text-ink-2 hover:bg-sunken flex size-8 items-center justify-center transition-colors disabled:text-ink-faint disabled:hover:bg-transparent'
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'border-line bg-surface inline-flex h-9 items-center rounded-sm border',
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Giảm ${label}`}
        disabled={disabled || value <= min}
        onClick={() => set(value - 1)}
        className={btn}
      >
        <Minus className="size-3.5" />
      </button>
      <span aria-live="polite" className="num text-ink w-6 text-center font-semibold">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Tăng ${label}`}
        disabled={disabled || value >= max}
        onClick={() => set(value + 1)}
        className={btn}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
