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
}

/** Thanh tab dạng "segmented". Nội dung tab do component cha render theo `value`. */
export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('inline-flex gap-1 rounded-lg bg-slate-100 p-1', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
              active ? 'text-primary bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs text-slate-400 tabular-nums">{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
