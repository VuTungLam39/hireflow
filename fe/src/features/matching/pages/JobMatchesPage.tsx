import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader } from '@/components/shared'
import { Card, PageLoader, Spinner } from '@/components/ui'
import { JobStatusBadge } from '@/features/jobs'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { links, paths } from '@/routes/paths'
import { MatchCard } from '../components/MatchCard'
import { useInviteMatch, useJobMatches } from '../hooks/use-matching'

// US-10 · Kickoff 15.3
export default function JobMatchesPage() {
  const { id = '' } = useParams()
  const { data, isPending, isError, error, refetch } = useJobMatches(id)
  const invite = useInviteMatch(id)
  useDocumentTitle(data ? `Ứng viên cũ phù hợp · ${data.job.title}` : 'Ứng viên cũ phù hợp')

  if (isPending) return <PageLoader />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  const { job, items, pending } = data
  const searching = job.status !== 'DRAFT' && pending && items.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to={paths.jobs}>
            <ArrowLeft className="size-4" />
            Tin tuyển dụng
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            Ứng viên cũ phù hợp: {job.title}
            <JobStatusBadge status={job.status} />
          </span>
        }
        description="Người từng nộp hồ sơ (còn trong hạn lưu CV) được chấm theo tiêu chí hiện hành của tin, bằng cùng công thức và bằng chứng như hồ sơ thường. Chỉ hiện người từ 50 điểm, tối đa 10 người."
        actions={
          <Link
            to={links.jobEdit(job.id)}
            className="text-primary text-sm font-medium hover:underline"
          >
            Xem tin và tiêu chí →
          </Link>
        }
      />

      {pending && items.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-slate-500" role="status">
          <Spinner className="size-4" />
          Tiêu chí vừa thay đổi, đang tìm lại…
        </p>
      )}

      {job.status === 'DRAFT' ? (
        <EmptyState
          icon={Sparkles}
          title="Tin chưa được đăng"
          description="Đăng tin để hệ thống tìm ứng viên cũ phù hợp với tiêu chí."
        />
      ) : searching ? (
        <Card className="flex items-center gap-3 text-sm text-slate-600" role="status">
          <Spinner className="size-5" />
          Đang tìm ứng viên cũ phù hợp…
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Chưa có ứng viên cũ nào phù hợp"
          description="Không ai trong kho ứng viên đạt từ 50 điểm theo tiêu chí hiện tại."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((match) => (
            <MatchCard
              key={match.candidate.id}
              match={match}
              canInvite={job.status === 'OPEN'}
              inviting={invite.isPending && invite.variables === match.candidate.id}
              onInvite={(candidateId) => invite.mutate(candidateId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
