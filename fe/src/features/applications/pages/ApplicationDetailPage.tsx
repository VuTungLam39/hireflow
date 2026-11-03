import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  FileText,
  GitBranch,
  Mail,
  PencilLine,
  Phone,
  RotateCw,
  Gauge,
  TriangleAlert,
} from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Can, ErrorState, PageHeader } from '@/components/shared'
import { Avatar, Badge, Button, Card, CardTitle, PageLoader, Skeleton, Tabs } from '@/components/ui'
import { InterviewPanel } from '@/features/interviews'
import { usePermission } from '@/hooks/use-permission'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { Permission } from '@/lib/permissions'
import { formatRelative } from '@/lib/utils'
import { links } from '@/routes/paths'
import { CvTextDialog } from '../components/CvTextDialog'
import { HistoryTimeline } from '../components/HistoryTimeline'
import { NotesPanel } from '../components/NotesPanel'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
import { StatusActions } from '../components/StatusActions'
import { AiStatusBadge, ApplicationStatusBadge, ScoreFlags } from '../components/StatusBadges'
import { useApplication, useCvUrl, useRescore } from '../hooks/use-applications'

// Trình xem CV có thể nặng (sau này là PDF viewer) → tải lười (FE Architecture mục 9.2)
const CvTextViewer = lazy(() =>
  import('../components/CvTextViewer').then((m) => ({ default: m.CvTextViewer })),
)

type Tab = 'history' | 'notes'

/** Chi tiết application: điểm, bằng chứng, CV gốc, trạng thái, lịch sử, ghi chú (US-04, US-07) */
export default function ApplicationDetailPage() {
  const { id = '' } = useParams()
  const { data: app, isPending, isError, error, refetch } = useApplication(id)
  const rescore = useRescore(id)
  const cvUrl = useCvUrl()
  const [evidence, setEvidence] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('history')
  const [cvTextOpen, setCvTextOpen] = useState(false)
  const canReadCandidate = usePermission(Permission.CandidateRead)
  // BR-INT-02
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)

  if (isPending) return <PageLoader />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  const outdated = app.scoredJdVersion !== null && app.scoredJdVersion !== app.job.jdVersion
  const matched = app.breakdown.filter((b) => b.match === 1).length

  // Presigned URL hết hạn sau 5 phút: lấy URL mới mỗi lần mở, không lưu lâu
  const openOriginalCv = () =>
    app.cv && cvUrl.mutate(app.cv.fileId, { onSuccess: ({ url }) => window.open(url, '_blank') })

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to={links.applications({ jobId: app.job.id })}>
            <ArrowLeft className="size-4" />
            {app.job.title}
          </Link>
        }
        title={
          <span className="flex items-center gap-4">
            <Avatar name={app.candidate.fullName} size="lg" />
            <span>
              {canReadCandidate ? (
                <Link
                  to={links.candidateDetail(app.candidate.id)}
                  className="hover:text-brand transition-colors"
                  title="Xem mọi lần nộp của ứng viên"
                >
                  {app.candidate.fullName}
                </Link>
              ) : (
                app.candidate.fullName
              )}
              <span className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-normal tracking-normal">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {app.candidate.email}
                </span>
                {app.candidate.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {app.candidate.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Nộp {formatRelative(app.createdAt)}
                </span>
              </span>
            </span>
          </span>
        }
        actions={<ApplicationStatusBadge status={app.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {isInterviewer ? (
            <Card className="space-y-2">
              <CardTitle icon={<Gauge />}>Mức phù hợp</CardTitle>
              <p className="text-ink-2 text-sm">
                Điểm và bằng chứng của AI được ẩn để bạn đánh giá độc lập. Đọc CV bên dưới rồi chấm
                theo từng tiêu chí trong phiếu đánh giá.
              </p>
            </Card>
          ) : (
            <Card className="space-y-5">
              <CardTitle
                icon={<Gauge />}
                aside={
                  <div className="flex items-center gap-2">
                    <AiStatusBadge status={app.aiStatus} />
                    <Can permission={Permission.AiRescore}>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={rescore.isPending}
                        disabled={app.aiStatus === 'PENDING' || app.aiStatus === 'PROCESSING'}
                        onClick={() => rescore.mutate()}
                      >
                        {!rescore.isPending && <RotateCw />}
                        Chấm lại
                      </Button>
                    </Can>
                  </div>
                }
              >
                Mức phù hợp
              </CardTitle>

              {(app.aiStatus === 'PENDING' || app.aiStatus === 'PROCESSING') && (
                <div className="bg-info-soft/70 flex items-center gap-4 rounded-md p-4">
                  <div className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{ animationDelay: `${i * 0.2}s` }}
                        className="animate-blink bg-info size-2 rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-info text-sm">
                    Hệ thống đang đọc CV và chấm điểm. Trang tự cập nhật khi xong.
                  </p>
                </div>
              )}
              {app.aiStatus === 'FAILED' && (
                <div className="bg-bad-soft space-y-3 rounded-md p-4">
                  <p role="alert" className="text-bad flex items-start gap-2 text-sm">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    Chấm điểm thất bại: {app.aiError ?? 'không rõ lý do'}
                  </p>
                  {app.cv?.parseStatus === 'FAILED' && (
                    <Can permission={Permission.AiRescore}>
                      <Button size="sm" variant="secondary" onClick={() => setCvTextOpen(true)}>
                        <PencilLine />
                        Nhập text CV
                      </Button>
                      <CvTextDialog
                        applicationId={app.id}
                        open={cvTextOpen}
                        onClose={() => setCvTextOpen(false)}
                      />
                    </Can>
                  )}
                </div>
              )}
              {app.aiStatus === 'DONE' && app.score !== null && (
                <>
                  <div className="bg-canvas/80 flex flex-wrap items-center gap-5 rounded-md p-4">
                    <span className="type-figure">{app.score}</span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-ink-2 text-sm">
                        Khớp đầy đủ{' '}
                        <span className="text-ink font-semibold">
                          {matched}/{app.requirements.length}
                        </span>{' '}
                        tiêu chí của job. Bấm vào bằng chứng để xem đúng đoạn trong CV.
                      </p>
                      <ScoreFlags flags={app.flags} />
                      {outdated && (
                        <Badge tone="warning">
                          Điểm theo tiêu chí phiên bản {app.scoredJdVersion}, job đang ở phiên bản{' '}
                          {app.job.jdVersion}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ScoreBreakdown
                    requirements={app.requirements}
                    breakdown={app.breakdown}
                    activeEvidence={evidence}
                    onEvidenceClick={setEvidence}
                  />
                </>
              )}
            </Card>
          )}

          <Card className="space-y-4">
            <CardTitle icon={<CalendarClock />}>Phỏng vấn</CardTitle>
            <InterviewPanel
              applicationId={app.id}
              applicationStatus={app.status}
              requirements={app.requirements}
            />
          </Card>

          <Card className="space-y-4">
            <CardTitle
              icon={<FileText />}
              aside={
                app.cv && (
                  <Can permission={Permission.CvRead}>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={cvUrl.isPending}
                      onClick={openOriginalCv}
                    >
                      {!cvUrl.isPending && <ExternalLink />}
                      Mở file gốc
                    </Button>
                  </Can>
                )
              }
            >
              <span className="flex flex-wrap items-center gap-2">
                {app.cv?.fileName ?? 'CV'}
                {app.cv?.textEnteredAt && <Badge tone="info">Text nhập tay</Badge>}
              </span>
            </CardTitle>
            {!app.cv ? (
              <p className="text-ink-muted text-sm">CV đã bị xoá do ứng viên yêu cầu ẩn danh.</p>
            ) : app.cv.text ? (
              <Suspense fallback={<Skeleton className="h-64" />}>
                <CvTextViewer text={app.cv.text} highlight={evidence} />
              </Suspense>
            ) : (
              <p className="text-ink-muted text-sm">Chưa có nội dung CV đã đọc.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <Card className="space-y-4">
            <CardTitle icon={<GitBranch />}>Đổi trạng thái</CardTitle>
            <StatusActions applicationId={app.id} status={app.status} />
          </Card>

          <Card className="space-y-4">
            <Tabs
              tabs={[
                { id: 'history', label: 'Lịch sử' },
                { id: 'notes', label: 'Ghi chú' },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div key={tab}>
              {tab === 'history' ? (
                <HistoryTimeline applicationId={app.id} />
              ) : (
                <NotesPanel applicationId={app.id} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
