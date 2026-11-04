import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, SearchInput } from '@/components/shared'
import { ChipGroup, Pagination, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useHydrated } from '@/hooks/use-hydrated'
import { useListParams } from '@/hooks/use-list-params'
import { formatDate, formatDaysAgo } from '@/lib/utils'
import { SITE_NAME } from '@/prerender/shared'
import { links } from '@/routes/paths'
import { usePublicDepartments, usePublicJobs } from '../hooks/use-public-jobs'
import { publicJobsListSchema } from '../schemas'

// F-PUB-01, F-PUB-04 · Design Spec 6.11
export default function PublicJobsPage() {
  const [params, setParams] = useListParams(publicJobsListSchema)
  const { data, isPending, isError, error, refetch } = usePublicJobs(params)
  const hydrated = useHydrated()
  useDocumentTitle(`Việc làm đang tuyển – ${SITE_NAME}`)

  const facets = usePublicDepartments(params.search)
  const departments = (facets.data ?? []).map((d) => ({
    value: d.id,
    label: d.name,
    count: d.count,
  }))
  const dept = facets.data?.find((d) => d.id === params.departmentId)
  const items = data?.items ?? []

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-5">
        <h1 className="type-display">Cơ hội nghề nghiệp tại HireFlow</h1>
        <p className="type-read-lg">
          Chúng tôi đọc mọi hồ sơ và phản hồi trong vòng 7 ngày làm việc. Nộp CV chỉ mất khoảng một
          phút.
        </p>
        <SearchInput
          size="lg"
          value={params.search}
          onChange={(value) => setParams({ search: value })}
          placeholder="Tìm vị trí, ví dụ: Backend, Marketing"
          label="Tìm vị trí"
          className="max-w-md"
        />
        {departments.length > 1 && (
          <ChipGroup
            label="Lọc theo phòng ban"
            allLabel="Mọi phòng ban"
            options={departments}
            allCount={facets.data?.reduce((sum, d) => sum + d.count, 0)}
            limit={5}
            moreLabel={(n) => `+${n} phòng ban khác`}
            value={params.departmentId}
            onChange={(departmentId) => setParams({ departmentId: departmentId ?? null })}
          />
        )}
      </header>

      {isPending ? (
        <div className="border-line divide-line-soft divide-y border-y">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2 py-5">
              <Skeleton className="h-5 w-72 max-w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Chưa tải được danh sách việc làm" error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            params.search
              ? `Chưa có vị trí khớp “${params.search}”`
              : 'Hiện chưa có vị trí đang tuyển'
          }
          description="Bạn có thể quay lại sau – các vị trí mới được đăng thường xuyên."
        />
      ) : (
        <>
          <p className="type-caption">
            {data.meta.totalItems.toLocaleString('vi-VN')} vị trí đang tuyển
            {dept && ` ở ${dept.name}`}
          </p>
          <ul className="border-line divide-line-soft -mt-6 divide-y border-y">
            {items.map((job) => (
              <li key={job.id}>
                <Link
                  to={links.publicJobDetail(job.id)}
                  className="group hover:bg-canvas -mx-4 flex items-center gap-4 px-4 py-5 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-ink group-hover:text-brand block text-lg leading-7 font-semibold transition-colors">
                      {job.title}
                    </span>
                    <span className="type-body text-ink-muted block">
                      {job.department.name} · {job.location} ·{' '}
                      {hydrated
                        ? `đăng ${formatDaysAgo(job.publishedAt, undefined, { hoursToday: true })}`
                        : formatDate(job.publishedAt)}
                    </span>
                  </span>
                  <ArrowRight className="text-ink-muted group-hover:text-brand size-5 shrink-0 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination meta={data.meta} onPageChange={(page) => setParams({ page })} />
        </>
      )}
    </div>
  )
}
