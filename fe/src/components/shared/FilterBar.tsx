import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Button, Input, Popover, menuItemClass } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

interface FilterBarProps {
  children: ReactNode
  active?: ActiveFilter[]
  onReset?: () => void
  trailing?: ReactNode
}

export function FilterBar({ children, active = [], onReset, trailing }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {active.length > 0 && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-ink-muted hover:text-ink hover:bg-sunken inline-flex h-9 items-center gap-1 rounded-sm px-2 text-sm font-medium transition-colors"
        >
          <X className="size-4" />
          Xoá lọc
          <span className="num text-ink-faint font-normal">{active.length}</span>
        </button>
      )}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  )
}

type FilterTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  value?: string
  onClear?: () => void
}

export function FilterTrigger({ label, value, onClear, className, ...props }: FilterTriggerProps) {
  if (value == null) {
    return (
      <button
        type="button"
        {...props}
        className={cn(
          'group border-line-strong bg-surface text-ink-2 hover:border-ink-faint hover:text-ink aria-expanded:border-ink-faint aria-expanded:text-ink inline-flex h-9 items-center gap-1.5 rounded-sm border pr-2.5 pl-3 text-sm font-medium whitespace-nowrap transition-colors',
          className,
        )}
      >
        {label}
        <ChevronDown className="text-ink-muted size-4 transition-transform group-aria-expanded:rotate-180" />
      </button>
    )
  }
  return (
    <span className="border-brand/40 bg-brand-soft inline-flex h-9 items-stretch rounded-sm border">
      <button
        type="button"
        {...props}
        className={cn(
          'group hover:bg-brand/5 inline-flex items-center gap-1.5 rounded-l-[5px] pr-2 pl-3 text-sm whitespace-nowrap transition-colors',
          !onClear && 'rounded-r-[5px]',
          className,
        )}
      >
        <span className="text-brand">{label}:</span>
        <span className="text-ink max-w-40 truncate font-semibold">{value}</span>
        <ChevronDown className="text-brand size-4 transition-transform group-aria-expanded:rotate-180" />
      </button>
      {onClear && (
        <button
          type="button"
          aria-label={`Bỏ lọc ${label}`}
          onClick={onClear}
          className="border-brand/20 text-brand hover:bg-brand/10 inline-flex w-8 items-center justify-center rounded-r-[5px] border-l transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  )
}

interface FilterOption<T extends string> {
  value: T
  label: string
}

interface FilterMenuProps<T extends string> {
  label: string
  value: T | undefined
  options: FilterOption<T>[]
  onChange: (value: T | undefined) => void
  allLabel?: string
}

export function FilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  allLabel = 'Tất cả',
}: FilterMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  const pick = (v: T | undefined) => {
    onChange(v)
    setOpen(false)
  }
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      role="listbox"
      label={label}
      className="max-h-80 w-60 overflow-y-auto"
      trigger={(props) => (
        <FilterTrigger
          {...props}
          label={label}
          value={current?.label}
          onClear={() => onChange(undefined)}
        />
      )}
    >
      {[{ value: undefined, label: allLabel }, ...options].map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value ?? '__all'}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => pick(opt.value as T | undefined)}
            className={cn(menuItemClass, selected && 'text-ink font-medium')}
          >
            <span className="flex-1 truncate">{opt.label}</span>
            {selected && <Check className="text-brand!" />}
          </button>
        )
      })}
    </Popover>
  )
}

interface SearchInputProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  label?: string
  size?: 'md' | 'lg'
  className?: string
}

const DEBOUNCE_MS = 300

export function SearchInput({
  value,
  onChange,
  placeholder,
  label = 'Tìm kiếm',
  size = 'md',
  className,
}: SearchInputProps) {
  const [text, setText] = useState(value ?? '')
  const [prevValue, setPrevValue] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  if (value !== prevValue) {
    setPrevValue(value)
    setText(value ?? '')
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleChange = (next: string) => {
    setText(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(next.trim() || undefined), DEBOUNCE_MS)
  }

  return (
    <div className={cn('relative w-full', size === 'md' && 'sm:max-w-xs', className)}>
      <Search
        aria-hidden
        className={cn(
          'text-ink-muted pointer-events-none absolute top-1/2 -translate-y-1/2',
          size === 'lg' ? 'left-3.5 size-[18px]' : 'left-3 size-4',
        )}
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className={size === 'lg' ? 'h-11 pl-10 text-[15px]' : 'pl-9'}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  )
}

export function DensityToggle({
  value,
  onChange,
}: {
  value: 'comfortable' | 'compact'
  onChange: (v: 'comfortable' | 'compact') => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Mật độ bảng"
      className="bg-sunken inline-flex rounded-sm p-0.5"
    >
      {(
        [
          ['comfortable', 'Thoáng'],
          ['compact', 'Gọn'],
        ] as const
      ).map(([v, label]) => (
        <Button
          key={v}
          size="sm"
          variant="quiet"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'h-7 rounded-[5px] border px-2.5',
            value === v ? 'border-line bg-surface text-ink' : 'text-ink-muted border-transparent',
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
