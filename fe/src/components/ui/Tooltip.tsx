import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'right' | 'left'
  disabled?: boolean
  className?: string
}

const sides = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
} as const

export function Tooltip({ label, children, side = 'top', disabled, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const id = useId()

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = (delay: number) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(300)}
      onPointerLeave={hide}
      onFocus={(e) => e.target.matches(':focus-visible') && show(0)}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
      aria-describedby={open && !disabled ? id : undefined}
    >
      {children}
      {open && !disabled && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'bg-ink pointer-events-none absolute z-50 max-w-64 rounded-sm px-2 py-1 text-xs leading-4 font-normal whitespace-nowrap text-white',
            sides[side],
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'border-line bg-surface text-ink-muted num inline-flex h-5 min-w-5 items-center justify-center rounded-xs border px-1 font-sans text-xs leading-none font-medium',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
