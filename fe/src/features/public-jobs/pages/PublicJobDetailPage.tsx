import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDate, VN_TIME_ZONE } from '@/lib/utils'
import { jobTitle } from '@/prerender/shared'
import { paths } from '@/routes/paths'
import { ApplyForm } from '../components/ApplyForm'
import { usePublicJob } from '../hooks/use-public-jobs'

// F-PUB-02, F-PUB-03 · BR-APP-07 · Design Spec 6.11
export default function PublicJobDetailPage() {
  const { id = '' } = useParams()
  const { data: job, isPending, isError, error, refetch } = usePublicJob(id)
  const [submitted, setSubmitted] = useState(false)
  useDocumentTitle(job ? jobTitle(job.title) : undefined)

  if (isPending)
    return (
      <div className="space-y-4" aria-busy aria-label="Đang tải vị trí">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-96 max-w-full" />
        <Skeleton className="h-64 w-full max-w-[680px]" />
      </div>
    )
  if (isError) return <ErrorState title="Chưa mở được vị trí này" error={error} onRetry={refetch} />

  const must = job.requirements.filter((r) => r.type === 'MUST')
  const nice = job.requirements.filter((r) => r.type === 'NICE')

  return (
    <div className="space-y-8">
      <Link
        to={paths.publicJobs}
        className="type-caption hover:text-ink inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Tất cả vị trí
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,680px)_1fr]">
        <article className="min-w-0 space-y-8">
          <header className="space-y-2">
            <p className="type-overline">
              {job.department.name} · {job.location}
            </p>
            <h1 className="type-display">{job.title}</h1>
            <p className="type-caption">Đăng {formatDate(job.publishedAt, VN_TIME_ZONE)}</p>
          </header>

          {job.requirements.length > 0 && (
            <section className="space-y-3">
              <h2 className="type-heading">Chúng tôi tìm người</h2>
              <ul className="type-read-lg list-disc space-y-1 pl-5">
                {must.map((r) => (
                  <li key={r.label}>{r.label}</li>
                ))}
              </ul>
              {nice.length > 0 && (
                <p className="type-read-lg text-ink-muted">
                  Là lợi thế nếu bạn có: {nice.map((r) => r.label).join(', ')}.
                </p>
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="type-heading">Mô tả công việc</h2>
            <p className="type-read-lg whitespace-pre-wrap">{job.jdText}</p>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-line bg-surface rounded-md border p-5 sm:p-6">
            {submitted ? (
              <div role="status" className="space-y-3">
                <span className="bg-good-soft text-good flex size-10 items-center justify-center rounded-full">
                  <Check className="size-5" />
                </span>
                <h2 className="type-heading text-xl">Chúng tôi đã nhận hồ sơ của bạn</h2>
                <p className="type-body">
                  Bộ phận tuyển dụng sẽ đọc CV và liên hệ qua email trong vòng 7 ngày làm việc nếu
                  bạn phù hợp với vị trí.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-ink font-serif text-xl font-semibold">Ứng tuyển vị trí này</h2>
                <p className="type-caption mt-1 mb-5">Chỉ mất khoảng một phút.</p>
                <ApplyForm jobId={job.id} onSuccess={() => setSubmitted(true)} />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
