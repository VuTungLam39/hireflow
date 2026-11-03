import { useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { DataTable, DensityToggle, PageHeader, SearchInput, type Column } from '@/components/shared'
import { Avatar, Button } from '@/components/ui'
import { useDensity } from '@/hooks/use-density'
import { useListParams } from '@/hooks/use-list-params'
import { useOnVisible } from '@/hooks/use-on-visible'
import { formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useCandidates } from '../hooks/use-candidates'
import { candidateListSchema } from '../schemas/candidate.schema'
import type { CandidateListItem } from '../types'

const columns: Column<CandidateListItem>[] = [
  {
    key: 'candidate',
    header: 'Ứng viên',
    cell: (c) => (
      <div className="flex items-center gap-3">
        <Avatar name={c.fullName} size="sm" />
        <div className="min-w-0">
          <Link
            to={links.candidateDetail(c.id)}
            className="text-ink hover:text-brand font-medium transition-colors"
          >
            {c.fullName}
          </Link>
          <p className="type-caption truncate">
            {c.anonymizedAt ? `Đã ẩn danh ${formatDate(c.anonymizedAt)}` : c.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'phone',
    header: 'Điện thoại',
    hideOnMobile: true,
    cell: (c) => <span className="text-ink-2 num">{c.phone ?? '—'}</span>,
  },
  {
    key: 'applications',
    header: 'Số lần nộp',
    align: 'right',
    cell: (c) => <span className="type-num">{c.applicationCount}</span>,
  },
  {
    key: 'lastAppliedAt',
    header: 'Nộp gần nhất',
    align: 'right',
    cell: (c) => (
      <span className="type-caption whitespace-nowrap">{formatDate(c.lastAppliedAt)}</span>
    ),
  },
]

// US-14 · BR-CAND-03 · Design Spec 6.7
export default function CandidatesPage() {
  const [params, setParams] = useListParams(candidateListSchema)
  const query = useCandidates(params.search)
  const navigate = useNavigate()
  const [density, setDensity] = useDensity()
  const sentinel = useRef<HTMLDivElement>(null)
  const items = query.data?.pages.flatMap((p) => p.items)

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }
  useOnVisible(sentinel, loadMore, !!query.hasNextPage && !query.isFetchingNextPage)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho ứng viên"
        description="Mỗi email là một ứng viên, kèm mọi lần nộp. Dùng để tìm lại người cũ cho vị trí mới."
      />

      <SearchInput
        size="lg"
        value={params.search}
        onChange={(search) => setParams({ search })}
        placeholder="Tìm theo tên hoặc email – gõ không dấu cũng được"
        label="Tìm ứng viên theo tên hoặc email"
        className="max-w-2xl"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="type-caption num">
          {items &&
            `Đang hiện ${items.length.toLocaleString('vi-VN')} ứng viên${query.hasNextPage ? ' · cuộn để xem thêm' : ''}`}
        </p>
        <DensityToggle value={density} onChange={setDensity} />
      </div>

      <DataTable
        caption="Kho ứng viên"
        columns={columns}
        data={items}
        rowKey={(c) => c.id}
        rowLabel={(c) => c.fullName}
        onRowOpen={(c) => void navigate(links.candidateDetail(c.id))}
        density={density}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending && !query.isFetchingNextPage}
        emptyTitle={
          params.search ? `Không thấy ai khớp “${params.search}”` : 'Kho ứng viên còn trống'
        }
        emptyDescription={
          params.search
            ? 'Thử tìm bằng email, hoặc chỉ một phần của tên.'
            : 'Ứng viên được thêm vào kho khi họ nộp hồ sơ hoặc khi bạn tải CV hộ.'
        }
      />

      {query.hasNextPage && (
        <div ref={sentinel} className="flex justify-center">
          <Button variant="secondary" loading={query.isFetchingNextPage} onClick={loadMore}>
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  )
}
