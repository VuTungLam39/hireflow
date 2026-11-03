import { ArrowRight, Building2, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, SearchInput } from '@/components/shared'
import { Pagination, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useHydrated } from '@/hooks/use-hydrated'
import { useListParams } from '@/hooks/use-list-params'
import { formatDate, formatRelative, VN_TIME_ZONE } from '@/lib/utils'
import { SITE_NAME } from '@/prerender/shared'
import { links } from '@/routes/paths'
import { usePublicJobs } from '../hooks/use-public-jobs'
import { publicJobsListSchema } from '../schemas'

/** Danh sách job đang tuyển, prerender lúc build để có SEO (F-PUB-04, FE Architecture mục 2). */
export default function PublicJobsPage() {
  const [params, setParams] = useListParams(publicJobsListSchema)
  const { data, isPending, isError, error, refetch } = usePublicJobs(params)
  const hydrated = useHydrated()
  useDocumentTitle(`Việc làm đang tuyển – ${SITE_NAME}`)

  return (
    <div className="space-y-10">
      <section className="from-brand-soft relative -mx-4 overflow-hidden rounded-none px-4 py-12 text-center sm:mx-0 sm:rounded-md">
        <div
          aria-hidden
          className="bg-brand-soft/40 absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl"
        />
        <div className="relative space-y-4">
          <p className="text-brand text-sm font-medium">Chúng tôi đang tuyển</p>
          <h1 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Tìm công việc phù hợp với bạn
          </h1>
          <p className="text-ink-muted mx-auto max-w-md">
            Nộp CV chỉ trong một phút. Mọi hồ sơ đều được đọc và phản hồi.
          </p>
          <div className="flex justify-center pt-2 [&_input]:h-11 [&_input]:sm:max-w-sm">
            <SearchInput
              value={params.search}
              onChange={(search) => setParams({ search })}
              placeholder="Tìm vị trí, ví dụ: Backend"
            />
          </div>
        </div>
      </section>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Chưa có vị trí phù hợp" description="Hãy quay lại sau nhé." />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.items.map((job) => (
              <li key={job.id} className=" ">
                <Link
                  to={links.publicJobDetail(job.id)}
                  className="group hover:border-brand/30 border-line bg-surface flex h-full flex-col rounded-md border p-5 transition-all duration-200"
                >
                  <span className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium">
                    <Building2 className="size-3.5" />
                    {job.department.name}
                  </span>
                  <h2 className="group-hover:text-brand text-ink mt-2 text-lg font-semibold transition-colors">
                    {job.title}
                  </h2>
                  <div className="text-ink-muted mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
                    <span className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {hydrated
                          ? formatRelative(job.publishedAt)
                          : formatDate(job.publishedAt, VN_TIME_ZONE)}
                      </span>
                    </span>
                    <ArrowRight className="text-brand size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
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
