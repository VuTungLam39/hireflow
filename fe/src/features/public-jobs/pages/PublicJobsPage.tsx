import { ArrowRight, Building2, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { z } from 'zod'
import { EmptyState, ErrorState, SearchInput } from '@/components/shared'
import { Pagination, Skeleton } from '@/components/ui'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { formatRelative, staggerStyle } from '@/lib/utils'
import { links } from '@/routes/paths'
import { usePublicJobs } from '../hooks/use-public-jobs'

const listSchema = z.object({
  ...pageFields,
  limit: z.coerce.number().int().min(1).max(50).catch(12),
  search: z.string().optional().catch(undefined),
})

/** Danh sách job đang tuyển. MVP 1: CSR; MVP 2 prerender để có SEO (FE Architecture mục 2). */
export default function PublicJobsPage() {
  const [params, setParams] = useListParams(listSchema)
  const { data, isPending, isError, error, refetch } = usePublicJobs(params)

  return (
    <div className="space-y-10">
      <section className="from-primary-soft relative -mx-4 overflow-hidden rounded-none bg-gradient-to-b to-white px-4 py-12 text-center sm:mx-0 sm:rounded-3xl">
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl"
        />
        <div className="animate-slide-up relative space-y-4">
          <p className="text-primary text-sm font-medium">Chúng tôi đang tuyển</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Tìm công việc phù hợp với bạn
          </h1>
          <p className="mx-auto max-w-md text-slate-500">
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
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Chưa có vị trí phù hợp" description="Hãy quay lại sau nhé." />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.items.map((job, i) => (
              <li key={job.id} style={staggerStyle(i)} className="animate-slide-up stagger">
                <Link
                  to={links.publicJobDetail(job.id)}
                  className="group hover:border-primary/30 hover:shadow-raised flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Building2 className="size-3.5" />
                    {job.department.name}
                  </span>
                  <h2 className="group-hover:text-primary mt-2 text-lg font-semibold text-slate-900 transition-colors">
                    {job.title}
                  </h2>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm text-slate-500">
                    <span className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {formatRelative(job.publishedAt)}
                      </span>
                    </span>
                    <ArrowRight className="text-primary size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
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
