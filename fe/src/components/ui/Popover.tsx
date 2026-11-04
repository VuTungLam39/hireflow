import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TriggerProps {
  'aria-expanded': boolean
  'aria-haspopup': 'dialog' | 'menu' | 'listbox'
  'aria-controls': string
  onClick: () => void
}

const menuItems = (menu: HTMLElement | null) =>
  Array.from(
    menu?.querySelectorAll<HTMLElement>(
      '[role^="menuitem"]:not([disabled]):not([aria-disabled="true"])',
    ) ?? [],
  )

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
    if (!open || role !== 'menu') return
    const items = menuItems(document.getElementById(id))
    ;(items.find((el) => el.getAttribute('aria-checked') === 'true') ?? items[0])?.focus()
  }, [open, role, id])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onOpenChange(false)
        ;(ref.current?.querySelector('[aria-expanded]') as HTMLElement | null)?.focus()
        return
      }
      if (role !== 'menu' || !ref.current?.contains(document.activeElement)) return
      if (e.key === 'Tab') {
        onOpenChange(false)
        return
      }
      const items = menuItems(document.getElementById(id))
      if (items.length === 0) return
      const at = items.indexOf(document.activeElement as HTMLElement)
      const next =
        e.key === 'ArrowDown'
          ? (at + 1) % items.length
          : e.key === 'ArrowUp'
            ? (at - 1 + items.length) % items.length
            : e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? items.length - 1
                : null
      if (next === null) return
      e.preventDefault()
      items[next].focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange, role, id])

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
