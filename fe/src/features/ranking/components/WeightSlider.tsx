import { memo } from 'react'
import { RequirementTypeBadge, WEIGHT_MAX, WEIGHT_MIN, type Requirement } from '@/features/jobs'
import { cn } from '@/lib/utils'

interface WeightSliderProps {
  requirement: Requirement
  value: number
  /** Khác trọng số đã lưu → đánh dấu đang sửa */
  changed: boolean
  onChange: (requirementId: string, weight: number) => void
}

export const WeightSlider = memo(function WeightSlider({
  requirement,
  value,
  changed,
  onChange,
}: WeightSliderProps) {
  const id = `weight-${requirement.id}`
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="min-w-0 flex-1 truncate text-sm font-medium">
          {requirement.label}
        </label>
        <RequirementTypeBadge type={requirement.type} />
        <span
          key={value}
          className={cn(
            'animate-float-in flex size-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors',
            changed ? 'bg-warn-soft text-warn' : 'bg-sunken text-ink-2',
          )}
        >
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(requirement.id, Number(e.target.value))}
        className="accent-brand focus-visible:ring-brand/30 h-1.5 w-full cursor-pointer rounded-full focus-visible:ring-4 focus-visible:outline-none"
      />
      <div aria-hidden className="text-ink-faint flex justify-between px-0.5 text-xs">
        {Array.from({ length: WEIGHT_MAX - WEIGHT_MIN + 1 }, (_, i) => (
          <span key={i}>{WEIGHT_MIN + i}</span>
        ))}
      </div>
    </div>
  )
})
