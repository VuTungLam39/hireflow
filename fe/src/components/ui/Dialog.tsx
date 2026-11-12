import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'max-w-[480px]', md: 'max-w-[480px]', lg: 'max-w-[640px]' } as const

export function Dialog({ open, onClose, title, description, children, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
      className={cn(
        'border-line bg-surface text-ink-2 shadow-float backdrop:bg-ink/40 m-auto w-[calc(100%-2rem)] rounded-md border p-0',
        'max-h-[calc(100dvh-2rem)]',
        widths[size],
      )}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-ink font-display text-xl leading-7 font-semibold tracking-[-0.01em]"
              >
                {title}
              </h2>
              {description && <div className="type-caption mt-1">{description}</div>}
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
          {children}
        </div>
      )}
    </dialog>
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-surface border-line-soft sticky bottom-0 -mx-5 mt-6 -mb-5 flex flex-wrap justify-end gap-2 border-t px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
