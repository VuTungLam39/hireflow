import * as RT from '@radix-ui/react-tooltip'
import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { usePortalContainer } from './portal-container'

interface TooltipProps {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'right' | 'left'
  disabled?: boolean
  className?: string
}

// Contract: hover mở sau 400 ms, focus mở ngay, Escape đóng; không chứa nội dung tương tác
export function Tooltip({ label, children, side = 'top', disabled, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  // như bản cũ: focus chỉ mở tooltip khi là focus bàn phím (:focus-visible), không khi tự focus sau cú bấm chuột
  const quietFocus = useRef(false)
  const container = usePortalContainer()
  return (
    <RT.Provider delayDuration={400} skipDelayDuration={200}>
      <RT.Root
        open={!disabled && open}
        onOpenChange={(o) => (o && quietFocus.current ? undefined : setOpen(o))}
      >
        <RT.Trigger asChild>
          <span
            className={cn('relative inline-flex', className)}
            onFocusCapture={(e) => {
              quietFocus.current = !(e.target as HTMLElement).matches(':focus-visible')
            }}
            onPointerEnter={() => {
              quietFocus.current = false
            }}
          >
            {children}
          </span>
        </RT.Trigger>
        <RT.Portal container={container}>
          <RT.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="bg-ink z-50 max-w-64 rounded-sm px-2 py-1 text-xs leading-4 font-normal text-white"
          >
            {label}
          </RT.Content>
        </RT.Portal>
      </RT.Root>
    </RT.Provider>
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
