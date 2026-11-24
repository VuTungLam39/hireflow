import { MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, DropdownMenu } from '@/components/ui'

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
  return (
    <DropdownMenu
      align="end"
      className="w-64"
      note={note}
      items={items.map(({ danger, ...i }) => ({ ...i, variant: danger ? 'danger' : undefined }))}
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <MoreHorizontal />
        </Button>
      }
    />
  )
}
