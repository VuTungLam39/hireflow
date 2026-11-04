import { ArrowLeft, Building2, CalendarDays, CircleCheck, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '@/components/shared'
import { Card, PageLoader } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn, formatDate, VN_TIME_ZONE } from '@/lib/utils'
import { jobTitle } from '@/prerender/shared'
import { paths } from '@/routes/paths'
import { ApplyForm } from '../components/ApplyForm'
import { usePublicJob } from '../hooks/use-public-jobs'

/** Chi tiết job + form nộp CV. Sau khi nộp chỉ hiện lời cảm ơn, không lộ điểm hay trạng thái AI. */
export default function PublicJobDetailPage() {
  const { id = '' } = useParams()
  const { data: job, isPending, isError, error, refetch } = usePublicJob(id)
  const [submitted, setSubmitted] = useState(false)
  useDocumentTitle(job ? jobTitle(job.title) : undefined)

  if (isPending) return <PageLoader />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <Link
        to={paths.publicJobs}
        className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Tất cả vị trí
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <article className="min-w-0 space-y-8">
          <header className="space-y-3">
            <span className="bg-brand-soft text-brand inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
              <Building2 className="size-3.5" />
              {job.department.name}
            </span>
            <h1 className="text-ink text-3xl font-semibold tracking-tight">{job.title}</h1>
            <p className="text-ink-muted flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                Đăng {formatDate(job.publishedAt, VN_TIME_ZONE)}
              </span>
            </p>
          </header>

          {job.requirements.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Yêu cầu chính</h2>
              <ul className="flex flex-wrap gap-2">
                {job.requirements.map((req) => (
                  <li
                    key={req.label}
                    className="border-line bg-surface text-ink-2 inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 rounded-full',
                        req.type === 'MUST' ? 'bg-brand' : 'bg-line',
                      )}
                    />
                    {req.label}
                    {req.type === 'NICE' && (
                      <span className="text-ink-faint text-xs">(lợi thế)</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Mô tả công việc</h2>
            <p className="text-ink-2 leading-relaxed whitespace-pre-wrap">{job.jdText}</p>
          </section>
        </article>

        <Card className="self-start [animation-delay:80ms] lg:sticky lg:top-24">
          {submitted ? (
            <div className="animate-float-in space-y-3 py-6 text-center" role="status">
              <span className="bg-good-soft text-good ring-good-soft/50 mx-auto flex size-14 items-center justify-center rounded-full ring-8">
                <CircleCheck className="size-7" />
              </span>
              <h2 className="text-lg font-semibold">Cảm ơn bạn đã ứng tuyển!</h2>
              <p className="text-ink-muted text-sm">
                Chúng tôi đã nhận hồ sơ và sẽ liên hệ nếu bạn phù hợp với vị trí.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Ứng tuyển vị trí này</h2>
              <p className="text-ink-muted mt-1 mb-5 text-sm">Chỉ mất khoảng một phút.</p>
              <ApplyForm jobId={job.id} onSuccess={() => setSubmitted(true)} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
