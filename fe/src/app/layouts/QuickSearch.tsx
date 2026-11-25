import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar } from '@/components/ui'
import { CommandPalette, type CommandGroup } from '@/components/shared'
import { applicationQueries, StatusPill } from '@/features/applications'
import { useCandidateSearch } from '@/features/candidates'
import { jobsApi } from '@/features/jobs'
import { useOpenDetail } from '@/hooks/use-detail'
import { useHotkeys } from '@/hooks/use-hotkeys'
import { hasPermission, Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { navGroups } from './nav-config'
import { QUICK_SEARCH_LABEL, useQuickSearchScope } from './quick-search-scope'

const strip = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export function QuickSearch() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const user = useAuthStore((s) => s.user)
  const scope = useQuickSearchScope()
  const navigate = useNavigate()
  const openDetail = useOpenDetail()
  const [query, setQuery] = useState('')
  const q = query.trim()
  const people = useCandidateSearch(scope === 'candidates' && open ? query : '')
  const apps = useQuery({
    ...applicationQueries.list({
      search: q,
      page: 1,
      limit: 6,
      sortBy: 'createdAt',
      order: 'DESC',
    }),
    enabled: scope === 'applications' && open && q.length >= 2,
    placeholderData: keepPreviousData,
  })

  const canJobs = hasPermission(user, Permission.JobRead)
  const jobs = useQuery({
    queryKey: ['quick-search', 'jobs', q],
    queryFn: () => jobsApi.list({ search: q, page: 1, limit: 5 }),
    enabled: canJobs && open && q.length >= 2,
    placeholderData: keepPreviousData,
  })

  useHotkeys({ 'mod+k': () => setOpen(!open), '/': () => setOpen(true) })

  const groups = useMemo<CommandGroup[]>(() => {
    const folded = strip(q)
    const pages = navGroups
      .flatMap((g) => g.items)
      .filter((i) => hasPermission(user, i.permission))
      .filter((i) => !folded || strip(i.label).includes(folded))
      .slice(0, folded ? 5 : 8)
      .map((i) => ({
        id: `page-${i.to}`,
        label: i.label,
        leading: <i.icon className="text-ink-muted size-4" />,
        hint: 'Trang',
        onSelect: () => void navigate(i.to),
      }))
    const found =
      q.length < 2
        ? []
        : scope === 'candidates'
          ? (people.data?.items ?? []).map((c) => ({
              id: `cand-${c.id}`,
              label: (
                <span>
                  <span className="text-ink font-medium">{c.fullName}</span>
                  <span className="type-caption ml-2">{c.email}</span>
                </span>
              ),
              leading: <Avatar name={c.fullName} size="xs" />,
              hint: c.lastAppliedAt ? `nộp ${formatDate(c.lastAppliedAt)}` : undefined,
              onSelect: () => openDetail('candidate', c.id),
            }))
          : scope === 'applications'
            ? (apps.data?.items ?? []).map((a) => ({
                id: `app-${a.id}`,
                label: (
                  <span>
                    <span className="text-ink font-medium">{a.candidate.fullName}</span>
                    <span className="type-caption ml-2">{a.job.title}</span>
                  </span>
                ),
                leading: <Avatar name={a.candidate.fullName} size="xs" />,
                hint: <StatusPill status={a.status} />,
                onSelect: () => openDetail('application', a.id),
              }))
            : []
    const foundJobs =
      q.length < 2 || !canJobs
        ? []
        : (jobs.data?.items ?? []).map((j) => ({
            id: `job-${j.id}`,
            label: <span className="text-ink font-medium">{j.title}</span>,
            hint: j.department.name,
            onSelect: () => openDetail('job', j.id),
          }))
    return [
      { label: QUICK_SEARCH_LABEL[scope], items: found },
      { label: 'Tìm tin tuyển dụng', items: foundJobs },
      { label: 'Đi tới', items: pages },
    ]
  }, [q, scope, people.data, apps.data, jobs.data, canJobs, user, navigate, openDetail])

  const noun = scope === 'applications' ? 'hồ sơ' : 'ứng viên'

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
      loading={(scope === 'candidates' ? people.isFetching : apps.isFetching) || jobs.isFetching}
      placeholder={
        scope === 'pages'
          ? 'Tìm trang…'
          : `${QUICK_SEARCH_LABEL[scope]} theo tên ứng viên, email; tìm tin tuyển dụng hoặc trang…`
      }
      emptyText={
        scope === 'pages'
          ? 'Không thấy trang nào khớp.'
          : q.length >= 2
            ? `Không thấy ${noun} nào có tên hoặc email chứa “${q}”.`
            : `Gõ ít nhất 2 ký tự để tìm ${noun}.`
      }
    />
  )
}
