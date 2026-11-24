import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, FilterMenu, SearchInput, StaleNotice } from '@/components/shared'
import { EMPLOYMENT_TYPE, JOB_LEVEL, WORK_MODE, deadlineState, formatSalary } from '@/features/jobs'
import { Button, ChipGroup, Dialog, DialogFooter, Pagination, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useHydrated } from '@/hooks/use-hydrated'
import { useListParams } from '@/hooks/use-list-params'
import { formatDate, formatDaysAgo } from '@/lib/utils'
import { SITE_NAME } from '@/prerender/shared'
import { links } from '@/routes/paths'
import { CompanyLogo } from '../components/CompanyLogo'
import { CompanyCombobox } from '../components/CompanyCombobox'
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
  const { data, isPending, isError, error, refetch, dataUpdatedAt } = usePublicJobs(params)
  const hydrated = useHydrated()
  useDocumentTitle(`Việc làm đang tuyển – ${SITE_NAME}`)

  const [sheet, setSheet] = useState(false)
  const facets = usePublicDepartments(params.search, params.company)
  const departments = (facets.data ?? []).map((d) => ({
    value: d.id,
    label: d.name,
    count: d.count,
  }))
  const dept = facets.data?.find((d) => d.id === params.departmentId)
  const items = data?.items ?? []

  const active = [
    params.company,
    params.departmentId,
    params.level,
    params.employmentType,
    params.workMode,
  ].filter(Boolean).length
  const clearFilters = () =>
    setParams({
      company: null,
      departmentId: null,
      level: null,
      employmentType: null,
      workMode: null,
    })
  const filters = (
    <>
      <CompanyCombobox
        value={params.company}
        onChange={(slug) => setParams({ company: slug ?? null, departmentId: null })}
      />
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
    </>
  )

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-5">
        <h1 className="type-display">Việc làm trên HireFlow</h1>
        {isError && data && (
          <StaleNotice updatedAt={dataUpdatedAt} onRetry={() => void refetch()} />
        )}
        <p className="type-read-lg">
          Vị trí đang tuyển của các công ty trên sàn. Nộp CV chỉ mất khoảng một phút.
        </p>
        <div className="flex max-w-2xl flex-col gap-2 sm:flex-row">
          <SearchInput
            size="lg"
            value={params.search}
            onChange={(value) => setParams({ search: value })}
            placeholder="Vị trí, kỹ năng, ví dụ: Backend"
            label="Tìm vị trí"
            className="sm:flex-[3]"
          />
          <SearchInput
            size="lg"
            value={params.location}
            onChange={(value) => setParams({ location: value })}
            placeholder="Địa điểm"
            label="Địa điểm"
            className="sm:flex-[2]"
          />
        </div>
        <div className="hidden flex-wrap gap-2 sm:flex" role="group" aria-label="Lọc thêm">
          {filters}
        </div>
        {/* RR-05: màn hình hẹp gom bộ lọc phụ vào một nút có đếm */}
        <Button variant="secondary" className="sm:hidden" onClick={() => setSheet(true)}>
          <SlidersHorizontal />
          Bộ lọc{active > 0 && ` (${active})`}
        </Button>
        <Dialog open={sheet} onClose={() => setSheet(false)} title="Bộ lọc">
          <div className="flex flex-col items-start gap-3">{filters}</div>
          <DialogFooter>
            <Button variant="secondary" onClick={clearFilters}>
              Xoá lọc
            </Button>
            <Button onClick={() => setSheet(false)}>Áp dụng</Button>
          </DialogFooter>
        </Dialog>
        {params.company && departments.length > 1 && (
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
      ) : isError && !data ? (
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
            {params.company && items[0] && ` tại ${items[0].company.name}`}
            {dept && ` · ${dept.name}`}
          </p>
          <ul className="border-line divide-line-soft -mt-6 divide-y border-y">
            {items.map((job) => (
              <li key={job.id}>
                <Link
                  to={links.publicJobDetail(job.id)}
                  className="group hover:bg-canvas -mx-4 flex items-center gap-4 px-4 py-5 transition-colors"
                >
                  <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="text-ink group-hover:text-brand block text-lg leading-7 font-semibold transition-colors">
                      {job.title}
                    </span>
                    <span className="type-body text-ink-muted block">
                      <span className="text-ink-2 font-medium">{job.company.name}</span> ·{' '}
                      {job.location} ·{' '}
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
