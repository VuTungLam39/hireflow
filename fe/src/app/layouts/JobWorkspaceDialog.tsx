import { useState } from 'react'
import { DetailDialog, ErrorState } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import {
  JobApplicationHighlights,
  JobApplicationsList,
  HrUploadDialog,
  type ApplicationStatus,
} from '@/features/applications'
import {
  JobActionBar,
  JobInfoSection,
  JobOverview,
  JobRequirementsSection,
  JobStatusBadge,
  useCanEditJob,
  useJob,
} from '@/features/jobs'
import { JobMatchesView } from '@/features/matching'
import { RankingWorkspace } from '@/features/ranking'
import { useOpenDetail } from '@/hooks/use-detail'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { FunnelReport } from '@/features/dashboard'
import { shiftIsoDay, todayIsoDay } from '@/lib/vn-day'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'

// BE nhận tối đa 366 ngày: tin đăng lâu hơn thì xem 12 tháng gần nhất
const funnelSince = (startedAt: string) => {
  const start = todayIsoDay(new Date(startedAt))
  const floor = shiftIsoDay(todayIsoDay(), -365)
  return start > floor ? start : floor
}

const TABS = ['overview', 'content', 'criteria', 'applications', 'ranking', 'matches'] as const
export type JobTab = (typeof TABS)[number]

interface JobWorkspaceDialogProps {
  id: string
  tab?: string
  onClose: () => void
}

// F-JOB-01 → 09 · US-05 · US-10
export function JobWorkspaceDialog({ id, tab: initialTab, onClose }: JobWorkspaceDialogProps) {
  const query = useJob(id)
  const job = query.data
  const canEdit = useCanEditJob(job)
  const canInvite = usePermission(Permission.ApplicationCreate)
  const canSeeFunnel = usePermission(Permission.DashboardRead)
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const openDetail = useOpenDetail()
  const [tab, setTab] = useState<JobTab>(
    TABS.includes(initialTab as JobTab) ? (initialTab as JobTab) : 'overview',
  )
  const [uploadOpen, setUploadOpen] = useState(false)
  const [appStatus, setAppStatus] = useState<ApplicationStatus | undefined>()

  const live = job && job.status !== 'DRAFT'
  const tabs: { id: JobTab; label: string; count?: number; tone?: 'marker' }[] = job
    ? [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'content', label: 'Nội dung tin' },
        { id: 'criteria', label: 'Tiêu chí chấm', count: job.requirements.length },
        ...(live
          ? [
              { id: 'applications' as const, label: 'Hồ sơ', count: job.applicationCount },
              ...(isInterviewer ? [] : [{ id: 'ranking' as const, label: 'Xếp hạng' }]),
              ...(canInvite ? [{ id: 'matches' as const, label: 'Ứng viên cũ phù hợp' }] : []),
            ]
          : []),
      ]
    : []
  const current = tabs.some((t) => t.id === tab) ? tab : 'overview'

  const openApplications = (status?: string) => {
    setAppStatus(status as ApplicationStatus | undefined)
    setTab('applications')
  }

  return (
    <DetailDialog
      open
      size="lg"
      onClose={onClose}
      label="Việc với tin tuyển dụng"
      title={job?.title ?? 'Tin tuyển dụng'}
      badge={job && <JobStatusBadge status={job.status} />}
      subtitle={
        job && (
          <>
            {job.department.name} · {job.location}
            {job.publishedAt ? ` · đăng ${formatDate(job.publishedAt)}` : ' · chưa đăng'}
            {job.status === 'CLOSED' && ' · tin đã đóng: chỉ xem'}
          </>
        )
      }
      tabs={job ? tabs : undefined}
      tab={current}
      onTab={(t) => {
        if (t === 'applications') setAppStatus(undefined)
        setTab(t)
      }}
      footer={
        job && (
          <>
            <span className="type-caption">{!canEdit && 'Bạn chỉ có quyền xem tin này'}</span>
            <JobActionBar job={job} onDeleted={onClose} onUpload={() => setUploadOpen(true)} />
            <HrUploadDialog
              jobId={job.id}
              jobTitle={job.title}
              open={uploadOpen}
              onClose={() => setUploadOpen(false)}
              onUploaded={(application) => openDetail('application', application.id)}
            />
          </>
        )
      }
    >
      {query.isPending ? (
        <div aria-busy aria-label="Đang tải tin" className="space-y-3">
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title="Chưa mở được tin" error={query.error} onRetry={query.refetch} />
      ) : (
        <>
          {current === 'overview' && (
            <JobOverview
              job={query.data}
              onOpenApplications={openApplications}
              highlights={
                <JobApplicationHighlights
                  jobId={id}
                  onOpenRanking={() => setTab('ranking')}
                  onOpenAll={() => openApplications()}
                />
              }
              funnel={
                canSeeFunnel && (
                  <FunnelReport
                    jobId={id}
                    since={funnelSince(query.data.publishedAt ?? query.data.createdAt)}
                    headingLevel="h3"
                  />
                )
              }
            />
          )}
          {current === 'content' &&
            (canEdit ? (
              <JobInfoSection job={query.data} heading={false} split />
            ) : (
              <div className="type-read whitespace-pre-line">{query.data.jdText}</div>
            ))}
          {current === 'criteria' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <JobRequirementsSection job={query.data} heading={false} />
              <aside
                aria-label="Cách chấm"
                className="border-line bg-canvas/50 type-body space-y-3 rounded-md border px-5 py-5 lg:sticky lg:top-0"
              >
                <p className="type-caption">Cách chấm</p>
                <p>
                  <span className="text-ink font-medium">Bắt buộc</span> thiếu thì hồ sơ bị gắn cờ,{' '}
                  <span className="text-ink font-medium">Nên có</span> chỉ cộng điểm.
                </p>
                <p>
                  <span className="text-ink font-medium">Trọng số 1–3</span> quyết định tiêu chí
                  nặng nhẹ ra sao trong điểm trên 100.
                </p>
                <p>
                  Lưu tiêu chí tăng phiên bản lên{' '}
                  <span className="text-ink num font-medium">{query.data.jdVersion + 1}</span>
                  {query.data.status === 'OPEN' && query.data.applicationCount > 0 && (
                    <>
                      {' '}
                      và chấm lại{' '}
                      <span className="text-ink num font-medium">
                        {query.data.applicationCount.toLocaleString('vi-VN')} hồ sơ
                      </span>
                    </>
                  )}
                  .
                </p>
              </aside>
            </div>
          )}
          {current === 'applications' && (
            <JobApplicationsList key={appStatus ?? 'all'} jobId={id} initialStatus={appStatus} />
          )}
          {current === 'ranking' && (
            <RankingWorkspace jobId={id} embedded onOpenApplications={() => openApplications()} />
          )}
          {current === 'matches' && <JobMatchesView jobId={id} embedded />}
        </>
      )}
    </DetailDialog>
  )
}
