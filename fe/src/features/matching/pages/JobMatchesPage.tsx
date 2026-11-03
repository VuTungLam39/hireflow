import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader, Summary } from '@/components/shared'
import { Skeleton, Spinner, buttonVariants } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { formatDateTime } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { MatchCard } from '../components/MatchCard'
import { useInviteMatch, useJobMatches } from '../hooks/use-matching'

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
  const { data, isPending, isError, error, refetch } = useJobMatches(id)
  const invite = useInviteMatch(id)
  useDocumentTitle(data ? `Ứng viên cũ phù hợp · ${data.job.title}` : 'Ứng viên cũ phù hợp')

  if (isPending)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96 max-w-full" />
        <SearchingSkeleton />
      </div>
    )
  if (isError) return <ErrorState title="Chưa tải được gợi ý" error={error} onRetry={refetch} />

  const { job, items, pending } = data
  const searching = job.status !== 'DRAFT' && pending && items.length === 0
  const invited = items.filter((m) => m.applicationId).length

  return (
    <div className="space-y-6">
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
              !searching && `${items.length} người từ 50 điểm`,
              invited > 0 && `${invited} đã mời`,
              data.computedAt && `cập nhật ${formatDateTime(data.computedAt)}`,
            ]}
          />
        }
        actions={
          <Link to={links.jobEdit(job.id)} className={buttonVariants({ variant: 'secondary' })}>
            Xem tin và tiêu chí
          </Link>
        }
      />

      <p className="type-caption max-w-2xl">
        Người từng nộp hồ sơ (còn trong hạn lưu CV) được chấm theo tiêu chí hiện hành của tin, cùng
        công thức và bằng chứng như hồ sơ thường. Hiện tối đa 10 người.
      </p>

      {pending && items.length > 0 && (
        <p className="type-body flex items-center gap-2" role="status">
          <Spinner className="size-3.5" />
          Tiêu chí vừa thay đổi, đang tìm lại…
        </p>
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
