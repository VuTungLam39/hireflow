import { Link } from 'react-router'
import { EmptyState, ErrorState, SearchInput } from '@/components/shared'
import { Pagination, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useListParams } from '@/hooks/use-list-params'
import { SITE_NAME } from '@/prerender/shared'
import { links } from '@/routes/paths'
import { CompanyLogo } from '../components/CompanyLogo'
import { usePublicCompanies } from '../hooks/use-public-jobs'
import { companiesListSchema } from '../schemas'

// MVP 3 · F-PUB-10, US-23: danh bạ công ty ACTIVE có trang công ty
export default function CompaniesPage() {
  const [params, setParams] = useListParams(companiesListSchema)
  const { data, isPending, isError, error, refetch } = usePublicCompanies(params)
  useDocumentTitle(`Công ty đang tuyển – ${SITE_NAME}`)
  const items = data?.items ?? []

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-5">
        <h1 className="type-display">Công ty trên HireFlow</h1>
        <p className="type-read-lg">Tìm hiểu nơi bạn sẽ làm việc trước khi gửi hồ sơ.</p>
        <SearchInput
          size="lg"
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="Tên công ty"
          label="Tìm công ty"
          className="max-w-md"
        />
      </header>

      {isPending ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-36 w-full rounded-md" />
            </li>
          ))}
        </ul>
      ) : isError && !data ? (
        <ErrorState title="Chưa tải được danh sách công ty" error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title={params.search ? `Chưa có công ty khớp “${params.search}”` : 'Chưa có công ty nào'}
          description="Trang công ty hiện khi công ty được duyệt và có đủ tên, logo, giới thiệu."
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <li key={c.slug}>
                <Link
                  to={links.publicCompany(c.slug)}
                  className="group border-line hover:border-ink-faint flex h-full flex-col gap-4 rounded-md border p-5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CompanyLogo name={c.name} logoUrl={c.logoUrl} size="md" />
                    <div className="min-w-0">
                      <h2 className="text-ink group-hover:text-brand truncate font-semibold transition-colors">
                        {c.name}
                      </h2>
                      {c.industries.length > 0 && (
                        <p className="type-caption truncate">{c.industries.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  {c.tagline && <p className="type-body text-ink-2 line-clamp-2">{c.tagline}</p>}
                  <p className="text-brand mt-auto text-sm font-medium">
                    {c.openJobs > 0
                      ? `${c.openJobs.toLocaleString('vi-VN')} vị trí đang tuyển`
                      : 'Chưa có vị trí đang tuyển'}
                  </p>
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
