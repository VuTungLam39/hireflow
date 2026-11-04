import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar } from '@/components/ui'
import { CommandPalette, type CommandGroup } from '@/components/shared'
import { useCandidateSearch } from '@/features/candidates'
import { useHotkeys } from '@/hooks/use-hotkeys'
import { usePermission } from '@/hooks/use-permission'
import { hasPermission, Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { navGroups } from './nav-config'

const strip = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export function QuickSearch() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const user = useAuthStore((s) => s.user)
  const canSearch = usePermission(Permission.CandidateRead)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const search = useCandidateSearch(canSearch && open ? query : '')

  useHotkeys({ 'mod+k': () => setOpen(!open), '/': () => setOpen(true) })

  const groups = useMemo<CommandGroup[]>(() => {
    const q = strip(query.trim())
    const pages = navGroups
      .flatMap((g) => g.items)
      .filter((i) => hasPermission(user, i.permission))
      .filter((i) => !q || strip(i.label).includes(q))
      .slice(0, q ? 5 : 8)
      .map((i) => ({
        id: `page-${i.to}`,
        label: i.label,
        leading: <i.icon className="text-ink-muted size-4" />,
        hint: 'Trang',
        onSelect: () => void navigate(i.to),
      }))
    const people =
      query.trim().length >= 2
        ? (search.data?.items ?? []).map((c) => ({
            id: `cand-${c.id}`,
            label: (
              <span>
                <span className="text-ink font-medium">{c.fullName}</span>
                <span className="type-caption ml-2">{c.email}</span>
              </span>
            ),
            leading: <Avatar name={c.fullName} size="xs" />,
            hint: c.lastAppliedAt ? `nộp ${formatDate(c.lastAppliedAt)}` : undefined,
            onSelect: () => void navigate(links.candidateDetail(c.id)),
          }))
        : []
    return [
      { label: 'Ứng viên', items: people },
      { label: 'Đi tới', items: pages },
    ]
  }, [query, search.data, user, navigate])

  return (
    <CommandPalette
      open={open}
      onClose={() => {
        setOpen(false)
        setQuery('')
      }}
      query={query}
      onQueryChange={setQuery}
      groups={groups}
      loading={search.isFetching}
      placeholder={canSearch ? 'Tìm ứng viên theo tên, email hoặc tìm trang…' : 'Tìm trang…'}
      emptyText={
        query.trim().length >= 2
          ? `Không thấy ai tên hoặc email chứa “${query.trim()}”.`
          : 'Gõ ít nhất 2 ký tự để tìm ứng viên.'
      }
    />
  )
}
