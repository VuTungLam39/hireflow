import { X } from 'lucide-react'
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  variant?: 'side' | 'sheet'
  width?: number
}

export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'side',
  width = 480,
}: SidePanelProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const sheet = variant === 'sheet'

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
      style={sheet ? undefined : ({ '--panel-w': `${width}px` } as CSSProperties)}
      className={cn(
        'bg-surface text-ink-2 border-line backdrop:bg-ink/30 m-0 max-h-none max-w-none p-0',
        sheet
          ? 'inset-x-0 top-auto bottom-0 max-h-[85dvh] w-full rounded-t-md border-t'
          : 'inset-y-0 right-0 left-auto h-dvh w-full border-l sm:w-(--panel-w)',
      )}
    >
      {open && (
        <div className={cn('flex flex-col', sheet ? 'max-h-[85dvh]' : 'h-dvh')}>
          <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-ink truncate font-serif text-lg leading-6 font-semibold"
              >
                {title}
              </h2>
              {subtitle && <div className="type-caption mt-0.5">{subtitle}</div>}
            </div>
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="text-ink-muted hover:bg-sunken hover:text-ink -m-1.5 rounded-sm p-1.5 transition-colors"
            >
              <X className="size-[18px]" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="border-line flex flex-wrap justify-end gap-2 border-t px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
