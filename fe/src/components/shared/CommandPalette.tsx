import { CornerDownLeft, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Kbd, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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
  const ref = useRef<HTMLDialogElement>(null)
  const listId = useId()
  const [active, setActive] = useState(0)
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const [prevFlat, setPrevFlat] = useState(flat)
  if (flat !== prevFlat) {
    setPrevFlat(flat)
    setActive(0)
  }

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, listId])

  const select = (item: CommandItem | undefined) => {
    if (!item) return
    onClose()
    item.onSelect()
  }

  let index = -1

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label="Tìm nhanh"
      className="border-line bg-surface shadow-float backdrop:bg-ink/40 mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-[600px] rounded-md border p-0"
    >
      {open && (
        <div>
          <div className="border-line flex items-center gap-3 border-b px-4">
            <Search className="text-ink-muted size-[18px] shrink-0" />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={flat.length ? `${listId}-${active}` : undefined}
              value={query}
              placeholder={placeholder}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => Math.min(flat.length - 1, a + 1))
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => Math.max(0, a - 1))
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  select(flat[active])
                }
              }}
              className="text-ink placeholder:text-ink-muted h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
            {loading && <Spinner className="text-ink-muted size-4" />}
            <Kbd>Esc</Kbd>
          </div>
          <div
            id={listId}
            role="listbox"
            className="max-h-[min(420px,60dvh)] overflow-y-auto p-1.5"
          >
            {flat.length === 0 ? (
              <p className="text-ink-muted px-3 py-6">{loading ? 'Đang tìm…' : emptyText}</p>
            ) : (
              groups.map((group) =>
                group.items.length === 0 ? null : (
                  <div key={group.label} role="group" aria-label={group.label} className="py-1">
                    <p className="type-overline px-2.5 pt-1.5 pb-1">{group.label}</p>
                    {group.items.map((item) => {
                      index += 1
                      const i = index
                      return (
                        <div
                          key={item.id}
                          id={`${listId}-${i}`}
                          role="option"
                          aria-selected={i === active}
                          onPointerMove={() => setActive(i)}
                          onClick={() => select(item)}
                          className={cn(
                            'rounded-inset flex cursor-pointer items-center gap-3 px-2.5 py-2',
                            i === active ? 'bg-sunken text-ink' : 'text-ink-2',
                          )}
                        >
                          {item.leading}
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.hint && <span className="type-caption truncate">{item.hint}</span>}
                          {i === active && <CornerDownLeft className="text-ink-muted size-3.5" />}
                        </div>
                      )
                    })}
                  </div>
                ),
              )
            )}
          </div>
          <div className="border-line type-caption flex gap-4 border-t px-4 py-2">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> chọn
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Enter</Kbd> mở
            </span>
          </div>
        </div>
      )}
    </dialog>
  )
}
