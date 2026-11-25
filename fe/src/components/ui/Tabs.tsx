import * as RT from '@radix-ui/react-tabs'
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

function useScrollActive(listRef: RefObject<HTMLDivElement | null>, value: string) {
  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[data-active]')
    if (!list || !active) return
    const left = active.offsetLeft - list.offsetLeft
    if (left < list.scrollLeft || left + active.offsetWidth > list.scrollLeft + list.clientWidth)
      list.scrollLeft = left - (list.clientWidth - active.offsetWidth) / 2
  }, [listRef, value])
}

const listClass = 'border-line -mb-px flex gap-5 overflow-x-auto scroll-smooth border-b'
const itemClass = (active: boolean) =>
  cn(
    'relative -mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-sm whitespace-nowrap transition-colors duration-150',
    active
      ? 'border-brand text-ink font-semibold'
      : 'text-ink-muted hover:text-ink border-transparent font-medium',
  )

function TabLabel<T extends string>({ tab, active }: { tab: Tab<T>; active: boolean }) {
  return (
    <>
      {tab.label}
      {!!tab.count && ' '}
      {!!tab.count && (
        <span
          className={cn(
            'num rounded-xs text-[13px] font-normal',
            active ? 'text-ink-2' : 'text-ink-muted',
            tab.count > 0 && tab.tone === 'marker' && 'bg-marker text-ink px-1.5 font-semibold',
            tab.count > 0 && tab.tone === 'bad' && 'text-bad font-semibold',
          )}
        >
          {/* P3-05 */}
          <span className="sr-only">(</span>
          {tab.count.toLocaleString('vi-VN')}
          <span className="sr-only">)</span>
        </span>
      )}
    </>
  )
}

function Scroller({
  listRef,
  children,
}: {
  listRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const edges = useOverflowEdges(listRef)
  const nudge = (dir: 1 | -1) => {
    const list = listRef.current
    if (list) list.scrollLeft += dir * Math.round(list.clientWidth * 0.7)
  }
  return (
    <div className="relative">
      {children}
      {edges.start && <EdgeArrow side="start" onClick={() => nudge(-1)} />}
      {edges.end && <EdgeArrow side="end" onClick={() => nudge(1)} />}
    </div>
  )
}

/** Tab có panel – Radix Tabs (P5-D04 điều kiện 3, P5-D11b). Panel đặt bằng TabsPanel bên trong children */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  label,
  listClassName,
  children,
}: TabsProps<T> & { listClassName?: string; children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null)
  useScrollActive(listRef, value)
  return (
    <RT.Root value={value} onValueChange={(v) => onChange(v as T)} className={className}>
      <div className={listClassName}>
        <Scroller listRef={listRef}>
          <RT.List ref={listRef} aria-label={label} className={listClass}>
            {tabs.map((tab) => (
              <RT.Trigger
                key={tab.id}
                value={tab.id}
                data-active={tab.id === value || undefined}
                // Radix đổi tab ở mousedown; trình đọc màn hình có thể chỉ gửi click
                onClick={() => onChange(tab.id)}
                className={itemClass(tab.id === value)}
              >
                <TabLabel tab={tab} active={tab.id === value} />
              </RT.Trigger>
            ))}
          </RT.List>
        </Scroller>
      </div>
      {children}
    </RT.Root>
  )
}

export const TabsPanel = RT.Content

/** Thanh lọc trạng thái (không có panel) – radiogroup/radio, P5-D04 */
export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  label,
}: TabsProps<T>) {
  const prefix = useId()
  const listRef = useRef<HTMLDivElement>(null)
  useScrollActive(listRef, value)
  const idOf = (id: string) => `${prefix}-${id}`

  const move = (from: number, delta: number) => {
    const next = tabs[(((from + delta) % tabs.length) + tabs.length) % tabs.length]
    onChange(next.id)
    requestAnimationFrame(() =>
      document.getElementById(idOf(next.id))?.focus({ preventScroll: true }),
    )
  }

  return (
    <div className={className}>
      <Scroller listRef={listRef}>
        <div ref={listRef} role="radiogroup" aria-label={label} className={listClass}>
          {tabs.map((tab, index) => {
            const active = tab.id === value
            return (
              <button
                key={tab.id}
                id={idOf(tab.id)}
                type="button"
                role="radio"
                aria-checked={active}
                data-active={active || undefined}
                tabIndex={active ? 0 : -1}
                onClick={() => onChange(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') move(index, 1)
                  if (e.key === 'ArrowLeft') move(index, -1)
                  // F-18
                  if (e.key === 'Home') move(0, 0)
                  if (e.key === 'End') move(tabs.length - 1, 0)
                  if (e.key === 'Home' || e.key === 'End') e.preventDefault()
                }}
                className={itemClass(active)}
              >
                <TabLabel tab={tab} active={active} />
              </button>
            )
          })}
        </div>
      </Scroller>
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
