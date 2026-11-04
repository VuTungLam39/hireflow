import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { chipClass } from './field-styles'
import { Popover, menuItemClass } from './Popover'

interface ChipOption<T extends string> {
  value: T
  label: string
  count?: number
  dotClass?: string
}

interface ChipGroupProps<T extends string> {
  label: string
  options: ChipOption<T>[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  allLabel?: string
  allCount?: number
  limit?: number
  moreLabel?: (hidden: number) => string
}

function Count({ value }: { value?: number }) {
  if (value === undefined) return null
  return (
    <>
      {' '}
      <span className="num text-ink-muted font-normal">{value.toLocaleString('vi-VN')}</span>
    </>
  )
}

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel = 'Tất cả',
  allCount,
  limit,
  moreLabel = (n) => `+${n} mục khác`,
}: ChipGroupProps<T>) {
  const [open, setOpen] = useState(false)
  let shown = limit && options.length > limit + 1 ? options.slice(0, limit) : options
  const selected = options.find((o) => o.value === value)
  if (selected && !shown.includes(selected)) shown = [...shown.slice(0, -1), selected]
  const hidden = options.filter((o) => !shown.includes(o))

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
        <Count value={allCount} />
      </button>
      {shown.map((opt) => (
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
          <Count value={opt.count} />
        </button>
      ))}
      {hidden.length > 0 && (
        <Popover
          open={open}
          onOpenChange={setOpen}
          role="menu"
          label={moreLabel(hidden.length)}
          className="max-h-80 w-64 overflow-y-auto"
          trigger={(props) => (
            <button type="button" className={cn(chipClass(false), 'group')} {...props}>
              {moreLabel(hidden.length)}
              <ChevronDown className="size-3.5 transition-transform group-aria-expanded:rotate-180" />
            </button>
          )}
        >
          {hidden.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={false}
              className={cn(menuItemClass, 'justify-between')}
              onClick={() => {
                setOpen(false)
                onChange(opt.value)
              }}
            >
              {opt.label}
              <Count value={opt.count} />
            </button>
          ))}
        </Popover>
      )}
    </div>
  )
}
