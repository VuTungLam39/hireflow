import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tabId } from './tab-id'

function useOverflowEdges(ref: RefObject<HTMLDivElement | null>) {
  const [edges, setEdges] = useState({ start: false, end: false })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges({
        start: el.scrollLeft > 1,
        end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [ref])
  return edges
}

interface Tab<T extends string> {
  id: T
  label: string
  // App Screens 3.2
  count?: number
  /** Tô số đếm khi > 0: marker = việc chờ bạn, bad = lỗi cần xử lý */
  tone?: 'marker' | 'bad'
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
  label?: string
  idPrefix?: string
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  label,
  idPrefix,
}: TabsProps<T>) {
  const autoId = useId()
  const prefix = idPrefix ?? autoId
  const listRef = useRef<HTMLDivElement>(null)
  const edges = useOverflowEdges(listRef)

  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!list || !active) return
    const left = active.offsetLeft - list.offsetLeft
    if (left < list.scrollLeft || left + active.offsetWidth > list.scrollLeft + list.clientWidth)
      list.scrollLeft = left - (list.clientWidth - active.offsetWidth) / 2
  }, [value])

  const nudge = (dir: 1 | -1) => {
    const list = listRef.current
    if (list) list.scrollLeft += dir * Math.round(list.clientWidth * 0.7)
  }

  const move = (from: number, delta: number) => {
    const next = tabs[(from + delta + tabs.length) % tabs.length]
    onChange(next.id)
    requestAnimationFrame(() =>
      document.getElementById(tabId(prefix, next.id))?.focus({ preventScroll: true }),
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="border-line -mb-px flex [scrollbar-width:none] gap-5 overflow-x-auto scroll-smooth border-b"
      >
        {tabs.map((tab, index) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              id={tabId(prefix, tab.id)}
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
              {!!tab.count && (
                <span
                  className={cn(
                    'num rounded-xs text-[13px] font-normal',
                    active ? 'text-ink-2' : 'text-ink-muted',
                    tab.count > 0 &&
                      tab.tone === 'marker' &&
                      'bg-marker text-ink px-1.5 font-semibold',
                    tab.count > 0 && tab.tone === 'bad' && 'text-bad font-semibold',
                  )}
                >
                  {tab.count.toLocaleString('vi-VN')}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {edges.start && <EdgeArrow side="start" onClick={() => nudge(-1)} />}
      {edges.end && <EdgeArrow side="end" onClick={() => nudge(1)} />}
    </div>
  )
}

function EdgeArrow({ side, onClick }: { side: 'start' | 'end'; onClick: () => void }) {
  const Icon = side === 'start' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClick}
      className={cn(
        'bg-surface text-ink-muted hover:text-ink absolute top-0 bottom-px flex w-8 items-center transition-colors',
        side === 'start' ? 'left-0 justify-start' : 'right-0 justify-end',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
