import * as RP from '@radix-ui/react-popover'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TriggerProps {
  'aria-expanded': boolean
  'aria-haspopup': 'dialog' | 'menu' | 'listbox'
  'aria-controls': string
  onClick: () => void
}

const ITEMS =
  '[role^="menuitem"]:not([disabled]):not([aria-disabled="true"]), [role="option"]:not([disabled]):not([aria-disabled="true"])'

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
  const list = role !== 'dialog'
  const items = () =>
    Array.from(document.getElementById(id)?.querySelectorAll<HTMLElement>(ITEMS) ?? [])

  // F-13: menu và listbox đi bằng mũi tên, Home/End
  const onKeyDown = (e: KeyboardEvent) => {
    if (!list) return
    if (e.key === 'Tab' && role === 'menu') return onOpenChange(false)
    const all = items()
    if (all.length === 0) return
    const at = all.indexOf(document.activeElement as HTMLElement)
    const next =
      e.key === 'ArrowDown'
        ? (at + 1) % all.length
        : e.key === 'ArrowUp'
          ? (at - 1 + all.length) % all.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? all.length - 1
              : null
    if (next === null) return
    e.preventDefault()
    all[next].focus()
  }

  return (
    <RP.Root open={open} onOpenChange={onOpenChange}>
      <RP.Anchor asChild>
        <div ref={ref} className="relative inline-flex">
          {trigger({
            'aria-expanded': open,
            'aria-haspopup': role,
            'aria-controls': id,
            onClick: () => onOpenChange(!open),
          })}
          {/* không Portal: giữ vị trí DOM như bản cũ cho call site hiện có */}
          <RP.Content
            id={id}
            role={role}
            aria-label={label}
            align={align}
            side={side}
            sideOffset={6}
            collisionPadding={8}
            onKeyDown={onKeyDown}
            onEscapeKeyDown={(e) => {
              // Esc chỉ đóng popover, không lọt xuống dialog/phím tắt trang phía sau
              e.preventDefault()
              e.stopPropagation()
              onOpenChange(false)
              ref.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
            }}
            onOpenAutoFocus={(e) => {
              if (!list) return
              e.preventDefault()
              const all = items()
              ;(
                all.find((el) => el.matches('[aria-checked="true"], [aria-selected="true"]')) ??
                all[0]
              )?.focus()
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              ref.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
            }}
            onInteractOutside={(e) => {
              // bấm lại nút mở: để onClick của nút tự đóng, tránh đóng rồi mở lại
              if (ref.current?.contains(e.target as Node)) e.preventDefault()
            }}
            className={cn(
              'border-line bg-surface shadow-float animate-float-in z-50 min-w-48 rounded-md border p-1.5',
              className,
            )}
          >
            {children}
          </RP.Content>
        </div>
      </RP.Anchor>
    </RP.Root>
  )
}

export const menuItemClass =
  'flex w-full items-center gap-2.5 rounded-inset px-2.5 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-sunken hover:text-ink focus-visible:bg-sunken focus-visible:outline-none disabled:text-ink-faint disabled:hover:bg-transparent [&_svg]:size-4 [&_svg]:text-ink-muted'
