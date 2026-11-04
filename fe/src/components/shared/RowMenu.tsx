import { MoreHorizontal } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Button, Popover, menuItemClass } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface RowMenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
  separated?: boolean
}

// App Screens 7.8
export function RowMenu({
  label,
  items,
  note,
}: {
  label: string
  items: RowMenuItem[]
  note?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      role="menu"
      label={label}
      className="w-64"
      trigger={(props) => (
        <Button variant="quiet" size="icon-sm" aria-label={label} {...props}>
          <MoreHorizontal />
        </Button>
      )}
    >
      {items.map((item) => (
        <Fragment key={item.label}>
          {item.separated && <div className="border-line-soft my-1 border-t" />}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={cn(
              menuItemClass,
              item.danger && !item.disabled && 'text-bad hover:text-bad [&_svg]:text-bad',
            )}
            onClick={() => {
              setOpen(false)
              item.onSelect()
            }}
          >
            {item.icon}
            {item.label}
          </button>
        </Fragment>
      ))}
      {note && <p className="type-caption px-2.5 pt-1 pb-1.5">{note}</p>}
    </Popover>
  )
}
