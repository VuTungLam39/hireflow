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
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Tất cả vị trí
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <article className="animate-slide-up min-w-0 space-y-8">
          <header className="space-y-3">
            <span className="bg-primary-soft text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
              <Building2 className="size-3.5" />
              {job.department.name}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{job.title}</h1>
            <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
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
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 rounded-full',
                        req.type === 'MUST' ? 'bg-primary' : 'bg-slate-300',
                      )}
                    />
                    {req.label}
                    {req.type === 'NICE' && (
                      <span className="text-xs text-slate-400">(lợi thế)</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Mô tả công việc</h2>
            <p className="leading-relaxed whitespace-pre-wrap text-slate-600">{job.jdText}</p>
          </section>
        </article>

        <Card className="animate-slide-up self-start [animation-delay:80ms] lg:sticky lg:top-24">
          {submitted ? (
            <div className="animate-scale-in space-y-3 py-6 text-center" role="status">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                <CircleCheck className="size-7" />
              </span>
              <h2 className="text-lg font-semibold">Cảm ơn bạn đã ứng tuyển!</h2>
              <p className="text-sm text-slate-500">
                Chúng tôi đã nhận hồ sơ và sẽ liên hệ nếu bạn phù hợp với vị trí.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Ứng tuyển vị trí này</h2>
              <p className="mt-1 mb-5 text-sm text-slate-500">Chỉ mất khoảng một phút.</p>
              <ApplyForm jobId={job.id} onSuccess={() => setSubmitted(true)} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
