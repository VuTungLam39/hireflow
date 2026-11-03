import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TriggerProps {
  'aria-expanded': boolean
  'aria-haspopup': 'dialog' | 'menu' | 'listbox'
  'aria-controls': string
  onClick: () => void
}

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: (props: TriggerProps) => ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  side?: 'bottom' | 'top'
  role?: 'dialog' | 'menu' | 'listbox'
  label?: string
  className?: string
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  role = 'dialog',
  label,
  className,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onOpenChange(false)
      ;(ref.current?.querySelector('[aria-expanded]') as HTMLElement | null)?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  return (
    <div ref={ref} className="relative inline-flex">
      {trigger({
        'aria-expanded': open,
        'aria-haspopup': role,
        'aria-controls': id,
        onClick: () => onOpenChange(!open),
      })}
      {open && (
        <div
          id={id}
          role={role}
          aria-label={label}
          className={cn(
            'border-line bg-surface shadow-float animate-float-in absolute z-50 min-w-48 rounded-md border p-1.5',
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            align === 'start' ? 'left-0 origin-top-left' : 'right-0 origin-top-right',
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export const menuItemClass =
  'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-sunken hover:text-ink focus-visible:bg-sunken focus-visible:outline-none disabled:text-ink-faint disabled:hover:bg-transparent [&_svg]:size-4 [&_svg]:text-ink-muted'
