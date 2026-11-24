import { Command } from 'cmdk'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Popover, menuItemClass } from '@/components/ui'
import { cn } from '@/lib/utils'
import { usePublicCompanies, usePublicCompany } from '../hooks/use-public-jobs'

// RR-05: lọc công ty chịu được ≥50 công ty – tìm phía server theo chữ gõ
export function CompanyCombobox({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (slug: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const list = usePublicCompanies({ page: 1, limit: 20, search: search || undefined })
  const items = (list.data?.items ?? []).filter((c) => c.openJobs > 0)
  const inList = items.find((c) => c.slug === value)
  // nhãn công ty đã chọn khi nó không nằm trong trang kết quả hiện tại
  const selected = usePublicCompany(value && !inList ? value : '')
  const label = inList?.name ?? selected.data?.name

  const pick = (slug: string | undefined) => {
    onChange(slug)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label="Lọc theo công ty"
      className="w-72 p-0"
      trigger={(props) => (
        <Button variant="secondary" {...props}>
          <span className="max-w-48 truncate">{value ? (label ?? 'Công ty') : 'Mọi công ty'}</span>
          <ChevronDown />
        </Button>
      )}
    >
      <Command shouldFilter={false} label="Lọc theo công ty" className="flex flex-col">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Gõ tên công ty…"
          className="border-line-soft text-ink w-full border-b bg-transparent px-3 py-2.5 text-sm outline-none"
        />
        <Command.List className="max-h-72 overflow-y-auto p-1.5">
          <Command.Item value="__all" onSelect={() => pick(undefined)} className={itemClass}>
            <span className="flex-1">Mọi công ty</span>
            {!value && <Check className="text-brand!" />}
          </Command.Item>
          {items.map((c) => (
            <Command.Item
              key={c.slug}
              value={c.slug}
              onSelect={() => pick(c.slug)}
              className={itemClass}
            >
              <span className="flex-1 truncate">{c.name}</span>
              <span className="num text-ink-muted text-xs">{c.openJobs}</span>
              {c.slug === value && <Check className="text-brand!" />}
            </Command.Item>
          ))}
          {!list.isFetching && items.length === 0 && (
            <Command.Empty className="type-caption px-2.5 py-2">
              {search ? `Chưa có công ty khớp “${search}”` : 'Chưa có công ty nào'}
            </Command.Empty>
          )}
        </Command.List>
      </Command>
    </Popover>
  )
}

const itemClass = cn(
  menuItemClass,
  'cursor-default data-[selected=true]:bg-sunken data-[selected=true]:text-ink',
)
