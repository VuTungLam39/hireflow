import { useRef } from 'react'
import { Link } from 'react-router'
import {
  DataTable,
  DensityToggle,
  PageHeader,
  SearchInput,
  Summary,
  type Column,
} from '@/components/shared'
import { Avatar, Button } from '@/components/ui'
import { StatusPill } from '@/features/applications'
import { useDetailLink, useOpenDetail } from '@/hooks/use-detail'
import { useDensity } from '@/hooks/use-density'
import { useListParams } from '@/hooks/use-list-params'
import { useOnVisible } from '@/hooks/use-on-visible'
import { formatDate } from '@/lib/utils'
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
          <CandidateName candidate={c} />
          <p className="type-caption truncate">
            {c.anonymizedAt ? `Đã ẩn danh ${formatDate(c.anonymizedAt)}` : c.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'lastJob',
    header: 'Tin nộp gần nhất',
    cell: (c) => <LastJob candidate={c} />,
  },
  {
    key: 'phone',
    header: 'Điện thoại',
    hideOnMobile: true,
    cell: (c) => <span className="text-ink-2 num">{c.phone ?? '—'}</span>,
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

// App Screens 7.4
function LastJob({ candidate: c }: { candidate: CandidateListItem }) {
  if (!c.lastJob) return <span className="text-ink-faint">—</span>
  const others = c.applicationCount - 1
  return (
    <div className="min-w-0">
      <p className="text-ink-2 truncate">{c.lastJob.title}</p>
      <p className="type-caption flex flex-wrap items-center gap-x-1.5">
        <StatusPill status={c.lastJob.status} />
        {others > 0 && <span>· và {others.toLocaleString('vi-VN')} lần nộp khác</span>}
      </p>
    </div>
  )
}

// App Screens 7.1
function CandidateMobileRow({ candidate: c }: { candidate: CandidateListItem }) {
  return (
    <div className="flex gap-3">
      <Avatar name={c.fullName} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-ink truncate font-medium">{c.fullName}</p>
          <span className="type-caption num shrink-0">{formatDate(c.lastAppliedAt)}</span>
        </div>
        <div className="mt-0.5">
          <LastJob candidate={c} />
        </div>
      </div>
    </div>
  )
}

// US-14 · BR-CAND-03 · Design Spec 6.7
function CandidateName({ candidate: c }: { candidate: CandidateListItem }) {
  const detailLink = useDetailLink()
  return (
    <Link
      to={detailLink('candidate', c.id)}
      className="text-ink hover:text-brand font-medium transition-colors"
    >
      {c.fullName}
    </Link>
  )
}

export default function CandidatesPage() {
  const [params, setParams] = useListParams(candidateListSchema)
  const query = useCandidates(params.search)
  const openDetail = useOpenDetail()
  const [density, setDensity] = useDensity()
  const sentinel = useRef<HTMLDivElement>(null)
  const items = query.data?.pages.flatMap((p) => p.items)
  const total = query.data?.pages[0]?.meta.totalItems ?? items?.length

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }
  useOnVisible(sentinel, loadMore, !!query.hasNextPage && !query.isFetchingNextPage)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho ứng viên"
        description={
          items && (
            <Summary
              items={[
                `${(total ?? 0).toLocaleString('vi-VN')} ứng viên${params.search ? ' khớp tìm kiếm' : ' trong kho'}`,
                'mỗi email là một người, gộp mọi lần nộp',
              ]}
            />
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          size="lg"
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="Tìm theo tên hoặc email – gõ không dấu cũng được"
          label="Tìm ứng viên theo tên hoặc email"
          className="max-w-2xl flex-1"
        />
        <div className="ml-auto">
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      <DataTable
        caption="Kho ứng viên"
        columns={columns}
        data={items}
        rowKey={(c) => c.id}
        rowLabel={(c) => c.fullName}
        mobileRow={(c) => <CandidateMobileRow candidate={c} />}
        onRowClick={(c) => openDetail('candidate', c.id)}
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
            {total !== undefined &&
              items &&
              ` (còn ${(total - items.length).toLocaleString('vi-VN')})`}
          </Button>
        </div>
      )}
    </div>
  )
}
