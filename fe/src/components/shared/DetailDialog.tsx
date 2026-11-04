import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Tabs } from '@/components/ui'
import { cn } from '@/lib/utils'

interface DetailTab<T extends string> {
  id: T
  label: string
  count?: number
  tone?: 'marker' | 'bad'
}

interface DetailDialogProps<T extends string> {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  tabs?: DetailTab<T>[]
  tab?: T
  onTab?: (id: T) => void
  footer?: ReactNode
  children: ReactNode
  label: string
  size?: 'md' | 'lg'
  fit?: boolean
}

export function DetailDialog<T extends string>({
  open,
  onClose,
  title,
  subtitle,
  badge,
  tabs,
  tab,
  onTab,
  footer,
  children,
  label,
  size = 'md',
  fit = false,
}: DetailDialogProps<T>) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      titleRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [tab])

  useEffect(() => {
    const dialog = ref.current
    if (!fit || !open || !dialog || typeof ResizeObserver === 'undefined') return
    let tallest = 0
    const observer = new ResizeObserver(() => {
      const height = dialog.offsetHeight
      if (height > tallest) {
        tallest = height
        dialog.style.setProperty('--fit-min', `${height}px`)
      }
    })
    observer.observe(dialog)
    return () => {
      observer.disconnect()
      dialog.style.removeProperty('--fit-min')
    }
  }, [fit, open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
      className={cn(
        'bg-surface text-ink-2 border-line shadow-float backdrop:bg-ink/40 m-auto max-h-none max-w-none p-0 open:flex open:flex-col',
        'h-dvh w-full sm:rounded-md sm:border',
        size === 'md'
          ? 'sm:w-[min(800px,calc(100%-3rem))]'
          : 'sm:h-[calc(100dvh-4rem)] sm:w-[min(1200px,calc(100%-3rem))]',
        size === 'md' &&
          (fit
            ? 'sm:h-fit sm:max-h-[min(720px,calc(100dvh-4rem))] sm:min-h-[max(var(--fit-min,0px),min(420px,calc(100dvh-4rem)))]'
            : 'sm:h-[min(720px,calc(100dvh-4rem))]'),
      )}
    >
      {open && (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="px-5 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2
                    ref={titleRef}
                    id={titleId}
                    tabIndex={-1}
                    className="type-heading truncate text-xl leading-7 outline-none"
                  >
                    {title}
                  </h2>
                  {badge}
                </div>
                {subtitle && <div className="type-caption mt-1">{subtitle}</div>}
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="text-ink-muted hover:bg-sunken hover:text-ink -m-1.5 shrink-0 rounded-sm p-1.5 transition-colors"
              >
                <X className="size-[18px]" />
              </button>
            </div>
            {tabs && tab && onTab ? (
              <Tabs tabs={tabs} value={tab} onChange={onTab} label={label} className="mt-4" />
            ) : (
              <div className="border-line mt-4 border-b" />
            )}
          </header>
          <div
            ref={bodyRef}
            role={tabs ? 'tabpanel' : undefined}
            aria-labelledby={tabs && tab ? `tab-${tab}` : undefined}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [--sticky-top:0px] sm:px-6"
          >
            {children}
          </div>
          {footer && (
            <footer className="border-line flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  )
}
