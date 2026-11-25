import * as RD from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { CornerDownLeft, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Kbd, Spinner } from '@/components/ui'
import { overlayClass, useReturnFocus } from '@/components/ui/Dialog'

export interface CommandItem {
  id: string
  label: ReactNode
  hint?: ReactNode
  leading?: ReactNode
  onSelect: () => void
}

export interface CommandGroup {
  label: string
  items: CommandItem[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (q: string) => void
  groups: CommandGroup[]
  loading?: boolean
  placeholder?: string
  emptyText?: ReactNode
}

// Contract Command Menu (P5-D06: cmdk) — chỉ điều hướng/mở chi tiết, không đổi trạng thái
export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  groups,
  loading,
  placeholder = 'Tìm ứng viên hoặc trang…',
  emptyText = 'Không thấy kết quả.',
}: CommandPaletteProps) {
  const focus = useReturnFocus()
  const empty = groups.every((g) => g.items.length === 0)

  return (
    <RD.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <RD.Portal>
        <RD.Overlay className={overlayClass} />
        <RD.Content
          aria-describedby={undefined}
          {...focus}
          className="border-line bg-surface shadow-float animate-float-in fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 rounded-md border focus:outline-none"
        >
          <RD.Title className="sr-only">Tìm nhanh</RD.Title>
          <Command shouldFilter={false} loop label="Tìm nhanh">
            <div className="border-line flex items-center gap-3 border-b px-4">
              <Search className="text-ink-muted size-[18px] shrink-0" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={onQueryChange}
                placeholder={placeholder}
                className="text-ink placeholder:text-ink-muted h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              {loading && <Spinner className="text-ink-muted size-4" />}
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(420px,60dvh)] overflow-y-auto p-1.5">
              {empty && (
                <p className="text-ink-muted px-3 py-6">{loading ? 'Đang tìm…' : emptyText}</p>
              )}
              {groups.map((group) =>
                group.items.length === 0 ? null : (
                  <Command.Group
                    key={group.label}
                    heading={group.label}
                    className="[&_[cmdk-group-heading]]:type-overline py-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-1"
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => {
                          onClose()
                          item.onSelect()
                        }}
                        className="rounded-inset text-ink-2 data-[selected=true]:bg-sunken data-[selected=true]:text-ink group flex cursor-pointer items-center gap-3 px-2.5 py-2"
                      >
                        {item.leading}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.hint && <span className="type-caption truncate">{item.hint}</span>}
                        <CornerDownLeft className="text-ink-muted hidden size-3.5 group-data-[selected=true]:block" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                ),
              )}
            </Command.List>
          </Command>
          <div className="border-line type-caption flex gap-4 border-t px-4 py-2">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> chọn
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Enter</Kbd> mở
            </span>
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
