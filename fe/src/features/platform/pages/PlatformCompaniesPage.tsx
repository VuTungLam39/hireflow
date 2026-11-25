import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { DataTable, FilterBar, PageHeader, SearchInput, type Column } from '@/components/shared'
import { FilterTabs } from '@/components/ui'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import type { OrganizationStatus } from '@/types/user'
import { OrgStatusBadge } from '../components/OrgStatusBadge'
import { ORG_STATUS } from '../constants'
import { useOrganizations } from '../hooks/use-platform'
import type { PlatformOrganization } from '../types'

const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const

const listSchema = z.object({
  ...pageFields,
  search: z.string().optional().catch(undefined),
  // US-20: mặc định lọc công ty chờ duyệt
  status: z.enum([...STATUSES, 'all']).catch('PENDING'),
})

// MVP 3 · US-20, F-PLAT-01
export default function PlatformCompaniesPage() {
  const [params, setParams] = useListParams(listSchema)
  const navigate = useNavigate()
  const status = params.status === 'all' ? undefined : (params.status as OrganizationStatus)
  const query = useOrganizations({
    page: params.page,
    limit: params.limit,
    search: params.search,
    status,
  })

  const columns: Column<PlatformOrganization>[] = [
    {
      key: 'name',
      header: 'Công ty',
      priority: 1,
      sticky: 'start',
      cell: (o) => (
        <div className="min-w-0">
          <Link
            to={links.platformCompany(o.id)}
            className="text-ink hover:text-brand font-medium transition-colors"
          >
            {o.name}
          </Link>
          <p className="type-caption truncate">MST {o.taxCode ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Email Admin',
      priority: 3,
      cell: (o) => <span className="text-ink-2 break-all">{o.adminEmail ?? '—'}</span>,
    },
    {
      key: 'website',
      header: 'Website',
      priority: 4,
      cell: (o) =>
        o.website ? (
          <a
            href={o.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-ink-2 hover:text-brand break-all underline"
          >
            {o.website.replace(/^https:\/\//, '')}
          </a>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Đăng ký',
      priority: 3,
      cell: (o) => (
        <span className="type-caption whitespace-nowrap">{formatDate(o.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      priority: 1,
      cell: (o) => <OrgStatusBadge status={o.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Công ty trên sàn"
        description="Duyệt công ty mới đăng ký, khoá hoặc mở khoá công ty đang hoạt động."
      />

      <FilterTabs
        label="Lọc theo trạng thái công ty"
        tabs={[
          ...STATUSES.map((s) => ({ id: s, label: ORG_STATUS[s].label })),
          { id: 'all' as const, label: 'Tất cả' },
        ]}
        value={params.status}
        onChange={(id) => setParams({ status: id })}
      />

      <FilterBar active={[]}>
        <SearchInput
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="Tên, slug hoặc mã số thuế"
          label="Tìm công ty"
        />
      </FilterBar>

      <DataTable
        caption="Danh sách công ty trên sàn"
        columns={columns}
        data={query.data?.items}
        rowKey={(o) => o.id}
        rowLabel={(o) => o.name}
        onRowClick={(o) => navigate(links.platformCompany(o.id))}
        isPending={query.isPending}
        isError={query.isError}
        dataUpdatedAt={query.dataUpdatedAt}
        layout="container"
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending}
        emptyTitle={
          params.status === 'PENDING' ? 'Không có công ty nào chờ duyệt' : 'Không có công ty nào'
        }
        emptyDescription="Công ty tự đăng ký ở trang Nhà tuyển dụng sẽ hiện ở tab Chờ duyệt."
        meta={query.data?.meta}
        onPageChange={(page) => setParams({ page })}
      />
    </div>
  )
}
