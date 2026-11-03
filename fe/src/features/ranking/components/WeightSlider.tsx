import { memo } from 'react'
import { WEIGHT_MAX, WEIGHT_MIN, type Requirement } from '@/features/jobs'
import { cn } from '@/lib/utils'

interface WeightSliderProps {
  requirement: Requirement
  index: number
  value: number
  changed: boolean
  onChange: (requirementId: string, weight: number) => void
}

export const WeightSlider = memo(function WeightSlider({
  requirement,
  index,
  value,
  changed,
  onChange,
}: WeightSliderProps) {
  const id = `weight-${requirement.id}`
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="type-label min-w-0 truncate">
          <span className="text-ink-muted num mr-1.5">{index + 1}</span>
          {requirement.label}
          {requirement.type === 'MUST' && <span className="text-warn ml-1">·&nbsp;bắt buộc</span>}
        </label>
        <span
          className={cn(
            'num shrink-0 font-serif text-base leading-5 font-bold',
            changed ? 'text-brand' : 'text-ink',
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
        aria-label={requirement.label}
        aria-valuetext={`Trọng số ${value} trên ${WEIGHT_MAX}`}
        onChange={(e) => onChange(requirement.id, Number(e.target.value))}
        className="accent-brand mt-1 h-5 w-full cursor-pointer"
      />
    </div>
  )
})
