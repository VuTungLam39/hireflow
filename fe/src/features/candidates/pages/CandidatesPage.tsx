import { ShieldOff } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { DataTable, FilterBar, PageHeader, SearchInput, type Column } from '@/components/shared'
import { Avatar, Badge, Button, Card } from '@/components/ui'
import { useListParams } from '@/hooks/use-list-params'
import { useOnVisible } from '@/hooks/use-on-visible'
import { formatDate, formatRelative } from '@/lib/utils'
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
        <Avatar name={c.fullName} size="sm" className="hidden md:inline-flex" />
        <div className="min-w-0">
          <Link
            to={links.candidateDetail(c.id)}
            className="hover:text-primary font-medium transition-colors"
          >
            {c.fullName}
          </Link>
          {c.anonymizedAt ? (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <ShieldOff className="size-3" />
              Đã ẩn danh {formatDate(c.anonymizedAt)}
            </p>
          ) : (
            <p className="text-xs text-slate-500">{c.email}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'phone',
    header: 'Điện thoại',
    cell: (c) => <span className="text-slate-600 tabular-nums">{c.phone ?? '—'}</span>,
  },
  {
    key: 'applications',
    header: 'Số hồ sơ',
    cell: (c) => (
      <Badge tone={c.applicationCount > 1 ? 'info' : 'neutral'}>
        <span className="tabular-nums">{c.applicationCount}</span> hồ sơ
      </Badge>
    ),
  },
  {
    key: 'lastAppliedAt',
    header: 'Nộp gần nhất',
    cell: (c) => (
      <span className="whitespace-nowrap text-slate-500">{formatRelative(c.lastAppliedAt)}</span>
    ),
  },
]

/**
 * Kho ứng viên chỉ đọc (US-14, BR-CAND-03): cuộn vô hạn theo cursor, tìm tên/email không dấu.
 * Hiring Manager chỉ thấy ứng viên từng nộp vào phòng mình – BE lọc, FE không tự lọc.
 */
export default function CandidatesPage() {
  const [params, setParams] = useListParams(candidateListSchema)
  const query = useCandidates(params.search)
  const sentinel = useRef<HTMLDivElement>(null)
  const items = query.data?.pages.flatMap((p) => p.items)

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }
  // Tắt trong lúc tải rồi bật lại: observer mới báo ngay nếu đáy danh sách vẫn đang hiện
  useOnVisible(sentinel, loadMore, !!query.hasNextPage && !query.isFetchingNextPage)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho ứng viên"
        description="Mỗi người một hồ sơ theo email, kèm mọi lần nộp. Tìm lại ứng viên cũ cho vị trí mới."
        actions={
          items && (
            <span className="text-sm text-slate-500">
              Đã tải{' '}
              <span className="font-semibold text-slate-900 tabular-nums">{items.length}</span> ứng
              viên{query.hasNextPage && ', cuộn để xem thêm'}
            </span>
          )
        }
      />

      <Card className="space-y-4">
        <FilterBar onReset={params.search ? () => setParams({ search: null }) : undefined}>
          <SearchInput
            value={params.search}
            onChange={(search) => setParams({ search })}
            placeholder="Tên hoặc email, gõ không dấu cũng được..."
          />
        </FilterBar>

        <DataTable
          columns={columns}
          data={items}
          rowKey={(c) => c.id}
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
          isFetching={query.isFetching && !query.isPending && !query.isFetchingNextPage}
          emptyTitle="Không có ứng viên nào"
          emptyDescription={params.search ? 'Thử từ khoá khác.' : undefined}
        />

        {query.hasNextPage && (
          <div ref={sentinel} className="flex justify-center">
            <Button variant="secondary" loading={query.isFetchingNextPage} onClick={loadMore}>
              Tải thêm
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
