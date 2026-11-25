import { memo } from 'react'
import { Select } from '@/components/ui'
import type { Requirement } from '@/features/jobs'
import { cn } from '@/lib/utils'

// VF-03: mức trọng số kèm chữ
export const WEIGHT_OPTIONS = [
  { value: 1, label: '1 · ít quan trọng' },
  { value: 2, label: '2 · quan trọng' },
  { value: 3, label: '3 · rất quan trọng' },
] as const

interface WeightSelectProps {
  requirement: Requirement
  index: number
  value: number
  changed: boolean
  onChange: (requirementId: string, weight: number) => void
}

export const WeightSelect = memo(function WeightSelect({
  requirement,
  index,
  value,
  changed,
  onChange,
}: WeightSelectProps) {
  const id = `weight-${requirement.id}`
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="type-label block min-w-0 truncate">
        <span className="text-ink-muted num mr-1.5">{index + 1}</span>
        {requirement.label}
        {requirement.type === 'MUST' && <span className="text-warn ml-1">·&nbsp;bắt buộc</span>}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(requirement.id, Number(e.target.value))}
        className={cn('mt-1 w-full', changed && '[&_select]:border-brand')}
      >
        {WEIGHT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  )
})
