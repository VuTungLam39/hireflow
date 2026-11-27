import * as RM from '@radix-ui/react-dropdown-menu'
import { Fragment, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { usePortalContainer } from './portal-container'

export interface DropdownMenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  /** mục nguy hiểm phải mở AlertDialog trong onSelect, không chạy thẳng */
  variant?: 'danger'
  disabled?: boolean
  separated?: boolean
}

interface DropdownMenuProps {
  /** nút mở – phải là một phần tử nhận ref (Button/IconButton không bọc Tooltip) */
  trigger: ReactNode
  items: DropdownMenuItem[]
  align?: 'start' | 'end'
  note?: ReactNode
  className?: string
}

const itemClass =
  'flex w-full cursor-default items-center gap-2.5 rounded-inset px-2.5 py-2 text-left text-sm text-ink-2 outline-none select-none data-highlighted:bg-sunken data-highlighted:text-ink data-disabled:text-ink-faint [&_svg]:size-4 [&_svg]:text-ink-muted'

export function DropdownMenu({
  trigger,
  items,
  align = 'start',
  note,
  className,
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const container = usePortalContainer()
  return (
    <RM.Root modal={false}>
      <RM.Trigger asChild ref={triggerRef}>
        {trigger}
      </RM.Trigger>
      <RM.Portal container={container}>
        <RM.Content
          align={align}
          sideOffset={4}
          className={cn(
            'border-line bg-surface shadow-float animate-float-in z-50 min-w-48 origin-(--radix-dropdown-menu-content-transform-origin) rounded-md border p-1',
            className,
          )}
        >
          {items.map((item) => (
            <Fragment key={item.label}>
              {item.separated && <RM.Separator className="border-line-soft my-1 border-t" />}
              <RM.Item
                disabled={item.disabled}
                onSelect={() => {
                  // hộp thoại mở từ mục menu ghi nhớ nút mở menu để trả focus khi đóng
                  triggerRef.current?.focus()
                  item.onSelect()
                }}
                className={cn(
                  itemClass,
                  item.variant === 'danger' &&
                    !item.disabled &&
                    'text-bad data-highlighted:text-bad [&_svg]:text-bad',
                )}
              >
                {item.icon}
                {item.label}
              </RM.Item>
            </Fragment>
          ))}
          {note && <p className="type-caption px-2.5 pt-1 pb-1.5">{note}</p>}
        </RM.Content>
      </RM.Portal>
    </RM.Root>
  )
}
