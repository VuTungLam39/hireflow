import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Can, ErrorState, PageHeader, Summary } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { CandidateApplications, ContactForm, DangerZone } from '../components/CandidateSections'
import { useCandidate } from '../hooks/use-candidates'
import { useCrumb } from '@/hooks/use-crumb'

// US-14, US-16 · Design Spec 6.7
export default function CandidateDetailPage() {
  const { id = '' } = useParams()
  const { data: candidate, isPending, isError, error, refetch } = useCandidate(id)
  useCrumb(candidate?.fullName)

  if (isPending)
    return (
      <div aria-busy aria-label="Đang tải ứng viên" className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  if (isError && !candidate)
    return <ErrorState title="Chưa mở được ứng viên" error={error} onRetry={refetch} />

  const anonymized = !!candidate.anonymizedAt

  return (
    <div className="space-y-10">
      <PageHeader
        breadcrumb={
          <Link to={paths.candidates}>
            <ArrowLeft className="size-4" />
            Kho ứng viên
          </Link>
        }
        title={candidate.fullName}
        description={
          <Summary
            items={[
              !anonymized && candidate.email,
              candidate.phone,
              `trong kho từ ${formatDate(candidate.createdAt)}`,
              anonymized && `đã ẩn danh ${formatDate(candidate.anonymizedAt)}`,
            ]}
          />
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="apps-title" className="min-w-0">
          <h2 id="apps-title" className="type-heading mb-4">
            Các lần nộp ({candidate.applications.length})
          </h2>
          <CandidateApplications candidate={candidate} />
        </section>

        <aside className="space-y-10">
          <ContactForm candidate={candidate} />
        </aside>
      </div>

      {!anonymized && (
        <Can permission={Permission.CandidateAnonymize}>
          <DangerZone candidate={candidate} />
        </Can>
      )}
    </div>
  )
}
