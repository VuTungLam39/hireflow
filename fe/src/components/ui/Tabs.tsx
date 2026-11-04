import { cn } from '@/lib/utils'

interface Tab<T extends string> {
  id: T
  label: string
  count?: number
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
  label?: string
}

export function Tabs<T extends string>({ tabs, value, onChange, className, label }: TabsProps<T>) {
  const move = (from: number, delta: number) => {
    const next = tabs[(from + delta + tabs.length) % tabs.length]
    onChange(next.id)
    requestAnimationFrame(() =>
      document.getElementById(`tab-${next.id}`)?.focus({ preventScroll: true }),
    )
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'border-line -mb-px flex [scrollbar-width:none] gap-5 overflow-x-auto border-b',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(index, 1)
              if (e.key === 'ArrowLeft') move(index, -1)
            }}
            className={cn(
              'relative -mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-sm whitespace-nowrap transition-colors duration-150',
              active
                ? 'border-brand text-ink font-semibold'
                : 'text-ink-muted hover:text-ink border-transparent font-medium',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'num text-[13px] font-normal',
                  active ? 'text-ink-2' : 'text-ink-muted',
                )}
              >
                {tab.count.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
