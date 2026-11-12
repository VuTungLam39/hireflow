import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, FilterMenu, SearchInput } from '@/components/shared'
import { EMPLOYMENT_TYPE, JOB_LEVEL, WORK_MODE, deadlineState, formatSalary } from '@/features/jobs'
import { ChipGroup, Pagination, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useHydrated } from '@/hooks/use-hydrated'
import { useListParams } from '@/hooks/use-list-params'
import { formatDate, formatDaysAgo } from '@/lib/utils'
import { SITE_NAME } from '@/prerender/shared'
import { links } from '@/routes/paths'
import { usePublicDepartments, usePublicJobs } from '../hooks/use-public-jobs'
import { publicJobsListSchema } from '../schemas'
import type { PublicJobSummary } from '../types'

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))

// F-PUB-05 · Design Spec 11.1: lương · cấp bậc · chế độ · hạn nộp trên thẻ tin
function JobCardFacts({ job, hydrated }: { job: PublicJobSummary; hydrated: boolean }) {
  const salary = formatSalary(job.salary)
  const deadline = job.deadline && (hydrated ? deadlineState(job.deadline) : null)
  const parts = [salary, job.level && JOB_LEVEL[job.level], WORK_MODE[job.workMode]].filter(Boolean)
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
      <span className="text-ink-2 font-medium">{parts.join(' · ')}</span>
      {job.deadline && (
        <span className={deadline && deadline.tone !== 'muted' ? 'text-warn' : 'text-ink-muted'}>
          {deadline ? deadline.text : `Hạn ${formatDate(job.deadline)}`}
        </span>
      )}
    </span>
  )
}

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
          placeholder="Tìm vị trí, ví dụ: Backend"
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc thêm">
          <FilterMenu
            label="Cấp bậc"
            value={params.level}
            options={options(JOB_LEVEL)}
            onChange={(level) => setParams({ level: level ?? null })}
          />
          <FilterMenu
            label="Hình thức"
            value={params.employmentType}
            options={options(EMPLOYMENT_TYPE)}
            onChange={(employmentType) => setParams({ employmentType: employmentType ?? null })}
          />
          <FilterMenu
            label="Làm việc"
            value={params.workMode}
            options={options(WORK_MODE)}
            onChange={(workMode) => setParams({ workMode: workMode ?? null })}
          />
        </div>
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
                    <JobCardFacts job={job} hydrated={hydrated} />
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
