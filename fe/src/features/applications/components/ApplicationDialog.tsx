import { ArrowRight, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { DetailDialog, ErrorState } from '@/components/shared'
import { Skeleton, buttonVariants } from '@/components/ui'
import { InterviewPanel, useApplicationInterviews } from '@/features/interviews'
import { useDetailLink } from '@/hooks/use-detail'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { APPLICATION_SOURCE } from '../constants'
import { useApplication, useApplicationNotes } from '../hooks/use-applications'
import { HistoryTimeline } from './HistoryTimeline'
import { NotesPanel } from './NotesPanel'
import { useEvidenceMarks } from '../hooks/use-evidence-marks'
import { CvPanel, ScorePanel } from './ReviewPanels'
import { AiStatusBadge, StatusPill } from './StatusBadges'

type Tab = 'app-score' | 'app-review' | 'app-cv' | 'app-notes' | 'app-interviews' | 'app-history'

interface ApplicationDialogProps {
  id: string
  onClose: () => void
}

// US-04
export function ApplicationDialog({ id, onClose }: ApplicationDialogProps) {
  const query = useApplication(id)
  const app = query.data
  const notes = useApplicationNotes(id)
  const interviews = useApplicationInterviews(id)
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const canCandidate = usePermission(Permission.CandidateRead)
  const detailLink = useDetailLink()
  const [tab, setTab] = useState<Tab>(isInterviewer ? 'app-review' : 'app-score')
  const [activeId, setActiveId] = useState<string | null>(null)
  const { marks, locatable } = useEvidenceMarks(app, isInterviewer)

  const tabs: { id: Tab; label: string; count?: number }[] = [
    isInterviewer
      ? { id: 'app-review', label: 'Phiếu đánh giá' }
      : { id: 'app-score', label: 'Mức phù hợp' },
    { id: 'app-cv', label: 'CV' },
    { id: 'app-notes', label: 'Ghi chú', count: notes.data?.length },
    ...(isInterviewer
      ? []
      : [{ id: 'app-interviews' as const, label: 'Phỏng vấn', count: interviews.data?.length }]),
    { id: 'app-history', label: 'Lịch sử' },
  ]

  return (
    <DetailDialog
      open
      onClose={onClose}
      label="Nội dung hồ sơ"
      title={app?.candidate.fullName ?? 'Hồ sơ'}
      badge={
        app && (
          <>
            <StatusPill status={app.status} />
            {!isInterviewer && <AiStatusBadge status={app.aiStatus} />}
          </>
        )
      }
      subtitle={
        app && (
          <>
            <span className="text-ink-2 font-medium">{app.job.title}</span>
            {' · '}nộp {formatDate(app.createdAt)}
            {app.source && ` · ${APPLICATION_SOURCE[app.source].phrase}`}
            {app.candidate.email && ` · ${app.candidate.email}`}
            {app.candidate.phone && ` · ${app.candidate.phone}`}
          </>
        )
      }
      tabs={app ? tabs : undefined}
      tab={tab}
      onTab={setTab}
      footer={
        <>
          {canCandidate && app ? (
            <Link
              to={detailLink('candidate', app.candidate.id)}
              className={buttonVariants({ variant: 'quiet', size: 'sm' })}
            >
              <UserRound />
              Mọi lần nộp của ứng viên
            </Link>
          ) : (
            <span />
          )}
          <Link to={links.applicationDetail(id)} className={buttonVariants()}>
            Mở bàn duyệt CV
            <ArrowRight />
          </Link>
        </>
      }
    >
      {query.isPending ? (
        <div aria-busy aria-label="Đang tải hồ sơ" className="space-y-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError && !query.data ? (
        <ErrorState title="Chưa mở được hồ sơ" error={query.error} onRetry={query.refetch} />
      ) : (
        <>
          {tab === 'app-score' && (
            <ScorePanel
              app={query.data}
              heading={false}
              activeId={activeId}
              locatable={locatable}
              onSelect={(reqId) => {
                setActiveId(reqId)
                setTab('app-cv')
              }}
            />
          )}
          {tab === 'app-review' && (
            <>
              <p className="type-body mb-4">
                Mức phù hợp được ẩn để bạn chấm độc lập. Đọc CV ở tab bên cạnh rồi chấm từng tiêu
                chí của tin.
              </p>
              <InterviewPanel
                applicationId={id}
                applicationStatus={query.data.status}
                requirements={query.data.requirements}
              />
            </>
          )}
          {tab === 'app-cv' && (
            <div className="-mx-5 -my-5 h-[calc(100%+2.5rem)] sm:-mx-6">
              <CvPanel
                app={query.data}
                marks={marks}
                activeId={activeId}
                onMarkClick={setActiveId}
                className="h-full rounded-none border-0"
              />
            </div>
          )}
          {tab === 'app-notes' && <NotesPanel applicationId={id} />}
          {tab === 'app-interviews' && (
            <InterviewPanel
              applicationId={id}
              applicationStatus={query.data.status}
              requirements={query.data.requirements}
            />
          )}
          {tab === 'app-history' && <HistoryTimeline applicationId={id} />}
        </>
      )}
    </DetailDialog>
  )
}
