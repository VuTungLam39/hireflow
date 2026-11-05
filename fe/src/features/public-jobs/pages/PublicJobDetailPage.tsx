import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '@/components/shared'
import { Skeleton, buttonVariants } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn, formatDate, formatDaysAgo } from '@/lib/utils'
import { jobTitle } from '@/prerender/shared'
import { paths } from '@/routes/paths'
import { JobFacts } from '@/features/jobs'
import { useHydrated } from '@/hooks/use-hydrated'
import { ApplyForm } from '../components/ApplyForm'
import { CompanyAbout } from '../components/CompanyAbout'
import { usePublicJob } from '../hooks/use-public-jobs'

// F-PUB-02, F-PUB-03 · BR-APP-07 · Design Spec 6.11
export default function PublicJobDetailPage() {
  const { id = '' } = useParams()
  const { data: job, isPending, isError, error, refetch } = usePublicJob(id)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLElement>(null)
  const formInView = useInView(formRef)
  const hydrated = useHydrated()
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
    <div className="space-y-8 pb-20 lg:pb-0">
      <Link
        to={paths.publicJobs}
        className="type-caption hover:text-ink inline-flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Tất cả vị trí
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 space-y-8">
          <header className="space-y-3">
            <h1 className="type-display">{job.title}</h1>
            <p className="text-ink-2 text-[15px] leading-6">
              {job.department.name} · {job.location}{' '}
              <span className="text-ink-muted whitespace-nowrap">
                · đăng{' '}
                <time dateTime={job.publishedAt ?? undefined} title={formatDate(job.publishedAt)}>
                  {formatDaysAgo(job.publishedAt, undefined, { hoursToday: true })}
                </time>
              </span>
            </p>
            <JobFacts job={job} relativeDeadline={hydrated} className="mt-5" />
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

          {job.benefits && (
            <section className="space-y-3">
              <h2 className="type-heading">Quyền lợi</h2>
              <ul className="type-read-lg list-disc space-y-1 pl-5">
                {job.benefits
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            </section>
          )}

          <CompanyAbout />
        </article>

        <aside
          ref={formRef}
          id="ung-tuyen"
          aria-label="Ứng tuyển"
          className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start"
        >
          <div className="border-line bg-surface rounded-md border p-5 sm:p-6">
            {job.expired ? (
              <div role="status" className="space-y-2">
                <h2 className="type-heading text-xl">Đã hết hạn nhận hồ sơ</h2>
                <p className="type-body">
                  Vị trí này đã qua hạn nộp ngày {formatDate(job.deadline)}. Bạn có thể xem các vị
                  trí khác đang tuyển.
                </p>
                <Link to={paths.publicJobs} className={buttonVariants({ variant: 'secondary' })}>
                  Xem vị trí đang tuyển
                </Link>
              </div>
            ) : submitted ? (
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
                <h2 className="text-ink font-display text-xl font-semibold">
                  Ứng tuyển vị trí này
                </h2>
                <p className="type-caption mt-1 mb-5">Chỉ mất khoảng một phút.</p>
                <ApplyForm jobId={job.id} onSuccess={() => setSubmitted(true)} />
              </>
            )}
          </div>
        </aside>
      </div>

      {!submitted && !job.expired && (
        <div
          className={cn(
            'border-line bg-surface fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 transition-transform duration-200 lg:hidden',
            formInView && 'translate-y-full',
          )}
          aria-hidden={formInView || undefined}
        >
          <a
            href="#ung-tuyen"
            tabIndex={formInView ? -1 : undefined}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
            onClick={(e) => {
              e.preventDefault()
              formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
              formRef.current
                ?.querySelector<HTMLInputElement>('input')
                ?.focus({ preventScroll: true })
            }}
          >
            Ứng tuyển vị trí này
          </a>
        </div>
      )}
    </div>
  )
}

// F-PUB-03
function useInView(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return inView
}
