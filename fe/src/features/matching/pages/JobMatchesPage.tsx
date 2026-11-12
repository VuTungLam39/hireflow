import { ArrowLeft, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader, Summary } from '@/components/shared'
import { Button, Skeleton, Spinner, buttonVariants } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDateTime } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { MatchCard } from '../components/MatchCard'
import { useInviteMatch, useJobMatches } from '../hooks/use-matching'
import { useCrumb } from '@/hooks/use-crumb'

function SearchingSkeleton() {
  return (
    <div role="status" className="border-line bg-surface rounded-md border">
      <p className="type-body flex items-center gap-2 px-5 pt-4">
        <Spinner className="size-3.5" />
        Đang tìm trong hồ sơ cũ…
      </p>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex gap-3 px-5 py-4">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3.5 w-72 max-w-full" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// US-10 · F-MATCH-01, F-MATCH-02 · Design Spec 6.6
export default function JobMatchesPage() {
  const { id = '' } = useParams()
  return <JobMatchesView jobId={id} />
}

const SLOW_MS = 30_000

function useSlowWait(waiting: boolean, attempt: number) {
  const [slowAttempt, setSlowAttempt] = useState<number | null>(null)
  useEffect(() => {
    if (!waiting) return
    const timer = window.setTimeout(() => setSlowAttempt(attempt), SLOW_MS)
    return () => window.clearTimeout(timer)
  }, [waiting, attempt])
  return waiting && slowAttempt === attempt
}

export function JobMatchesView({ jobId, embedded }: { jobId: string; embedded?: boolean }) {
  const [attempt, setAttempt] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const slow = useSlowWait(waiting, attempt)
  const { data, isPending, isError, error, refetch, isFetching } = useJobMatches(jobId, {
    poll: !slow,
  })
  const nowWaiting = !!data && data.job.status !== 'DRAFT' && data.pending
  if (nowWaiting !== waiting) setWaiting(nowWaiting)
  const retry = () => {
    setAttempt((a) => a + 1)
    void refetch()
  }
  const invite = useInviteMatch(jobId)
  useCrumb(embedded || !data ? undefined : `Ứng viên cũ · ${data.job.title}`)
  useDocumentTitle(
    embedded ? undefined : data ? `Ứng viên cũ phù hợp · ${data.job.title}` : 'Ứng viên cũ phù hợp',
  )

  if (isPending)
    return (
      <div className="space-y-6">
        {!embedded && <Skeleton className="h-10 w-96 max-w-full" />}
        <SearchingSkeleton />
      </div>
    )
  if (isError && !data)
    return <ErrorState title="Chưa tải được gợi ý" error={error} onRetry={refetch} />

  const { job, items, pending } = data
  const searching = job.status !== 'DRAFT' && pending && items.length === 0
  const invited = items.filter((m) => m.applicationId).length

  const facts = [
    !searching && `${items.length} người từ 50 điểm`,
    invited > 0 && `${invited} đã mời`,
    data.computedAt && `cập nhật ${formatDateTime(data.computedAt)}`,
  ]

  return (
    <div className="space-y-6">
      {embedded ? (
        <p className="text-ink-muted num">
          <Summary items={facts} />
        </p>
      ) : (
        <PageHeader
          breadcrumb={
            <Link to={paths.jobs}>
              <ArrowLeft className="size-4" />
              Tin tuyển dụng
            </Link>
          }
          title="Ứng viên cũ phù hợp"
          description={
            <Summary
              items={[
                <span key="j" className="text-ink-2 font-medium">
                  {job.title}
                </span>,
                ...facts,
              ]}
            />
          }
          actions={
            <Link to={links.jobEdit(job.id)} className={buttonVariants({ variant: 'secondary' })}>
              Xem tin và tiêu chí
            </Link>
          }
        />
      )}

      {pending && items.length > 0 && (
        <div role="status" className="type-body flex flex-wrap items-center gap-x-3 gap-y-1">
          {slow ? (
            <>
              <span>
                <span className="text-ink font-medium">Tìm lại đang lâu hơn bình thường.</span> Danh
                sách dưới đây theo tiêu chí cũ.
              </span>
              <Button variant="secondary" size="sm" loading={isFetching} onClick={retry}>
                <RotateCw />
                Thử lại
              </Button>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <Spinner className="size-3.5" />
              Tiêu chí vừa thay đổi, đang tìm lại…
            </span>
          )}
        </div>
      )}

      {job.status === 'DRAFT' ? (
        <EmptyState
          title="Tin chưa được đăng"
          description="Đăng tin để hệ thống tìm người cũ phù hợp với tiêu chí."
          action={
            <Link to={links.jobEdit(job.id)} className={buttonVariants({ variant: 'secondary' })}>
              Mở tin để đăng
            </Link>
          }
        />
      ) : searching && slow ? (
        <EmptyState
          title="Đang lâu hơn bình thường"
          description="Việc tìm trong hồ sơ cũ thường xong trong vài giây. Dịch vụ tìm kiếm có thể đang bận hoặc vừa khởi động lại – thử lại sau ít phút."
          action={
            <Button variant="secondary" loading={isFetching} onClick={retry}>
              <RotateCw />
              Thử lại
            </Button>
          }
        />
      ) : searching ? (
        <SearchingSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có ai trong hồ sơ cũ đạt từ 50 điểm cho tin này"
          description="Thử nới tiêu chí (giảm trọng số hoặc chuyển bớt sang “Nên có”) rồi xem lại."
        />
      ) : (
        <ul className="border-line bg-surface divide-line-soft -mx-4 divide-y border-y md:mx-0 md:rounded-md md:border">
          {items.map((match) => (
            <MatchCard
              key={match.candidate.id}
              match={match}
              canInvite={job.status === 'OPEN'}
              inviting={invite.isPending && invite.variables === match.candidate.id}
              onInvite={(candidateId) => invite.mutate(candidateId)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
