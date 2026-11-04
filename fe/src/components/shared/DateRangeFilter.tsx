import { useState } from 'react'
import { Input, Popover } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import {
  isoDayToVnText as toVn,
  shiftIsoDay as shift,
  todayIsoDay as todayIso,
  vnTextToIsoDay as toIso,
  withDaySlashes as withSlashes,
} from '@/lib/vn-day'
import { FilterTrigger } from './FilterBar'

const PRESETS = [
  { label: 'Hôm nay', range: (t: string) => [t, t] },
  { label: '7 ngày qua', range: (t: string) => [shift(t, -6), t] },
  { label: '30 ngày qua', range: (t: string) => [shift(t, -29), t] },
  { label: 'Tháng này', range: (t: string) => [`${t.slice(0, 8)}01`, t] },
] as const

function DayInput({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string | undefined
  onCommit: (iso: string) => void
}) {
  const [text, setText] = useState(toVn(value))
  const [invalid, setInvalid] = useState(false)
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    setSynced(value)
    setText(toVn(value))
    setInvalid(false)
  }

  const commit = () => {
    if (!text) {
      setInvalid(false)
      onCommit('')
      return
    }
    const iso = toIso(text)
    setInvalid(!iso)
    if (iso) onCommit(iso)
  }

  return (
    <label className="type-label space-y-1">
      {label}
      <Input
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        aria-invalid={invalid || undefined}
        invalid={invalid}
        value={text}
        onChange={(e) => setText(withSlashes(e.target.value))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      {invalid && <span className="text-bad block text-xs font-normal">Ngày không hợp lệ</span>}
    </label>
  )
}

// Design Spec mục 8
export function DateRangeFilter({
  label,
  from,
  to,
  onChange,
}: {
  label: string
  from?: string
  to?: string
  onChange: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const on = !!(from || to)
  const today = todayIso()

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label={`Lọc theo ${label.toLowerCase()}`}
      className="w-80 p-3"
      trigger={(props) => (
        <FilterTrigger
          {...props}
          label={label}
          value={
            !on
              ? undefined
              : from && to
                ? from === to
                  ? formatDate(from)
                  : `${formatDate(from)} – ${formatDate(to)}`
                : from
                  ? `từ ${formatDate(from)}`
                  : `đến ${formatDate(to!)}`
          }
          onClear={() => onChange('', '')}
        />
      )}
    >
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const [f, t] = p.range(today)
          const active = from === f && to === t
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(f, t)
                setOpen(false)
              }}
              className={cn(
                'rounded-sm border px-2.5 py-1 text-[13px] font-medium transition-colors',
                active
                  ? 'border-brand/40 bg-brand-soft text-brand'
                  : 'border-line-strong text-ink-2 hover:border-ink-faint hover:text-ink',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      <div className="border-line-soft mt-3 grid grid-cols-2 gap-2 border-t pt-3">
        <DayInput label="Từ ngày" value={from} onCommit={(f) => onChange(f, to ?? '')} />
        <DayInput label="Đến ngày" value={to} onCommit={(t) => onChange(from ?? '', t)} />
      </div>
    </Popover>
  )
}
