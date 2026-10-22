import { cn } from '@/lib/utils'

interface ChipOption<T extends string> {
  value: T
  label: string
  /** Chấm màu theo tone (ví dụ trạng thái) */
  dotClass?: string
}

interface ChipGroupProps<T extends string> {
  label: string
  options: ChipOption<T>[]
  /** undefined = "Tất cả" */
  value: T | undefined
  onChange: (value: T | undefined) => void
  allLabel?: string
}

/**
 * Bộ lọc dạng chip cho tập giá trị nhỏ (trạng thái): thấy hết lựa chọn, bấm một lần.
 * Tập lớn (job, phòng ban) vẫn dùng Select.
 */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel = 'Tất cả',
}: ChipGroupProps<T>) {
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
      active
        ? 'border-primary/30 bg-primary-soft text-primary'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
    )

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={value === undefined}
        className={chip(value === undefined)}
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
          className={chip(value === opt.value)}
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
