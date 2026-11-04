import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MoreHorizontal,
  PencilLine,
  RotateCw,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Can, ErrorState, SidePanel } from '@/components/shared'
import { Button, Kbd, Popover, Skeleton, Tabs, Tooltip, menuItemClass } from '@/components/ui'
import { InterviewPanel, useApplicationInterviews } from '@/features/interviews'
import { useHotkeys } from '@/hooks/use-hotkeys'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { APPLICATION_SOURCE } from '../constants'
import { CvSheet } from '../components/CvSheet'
import { CvTextDialog } from '../components/CvTextDialog'
import { HistoryTimeline } from '../components/HistoryTimeline'
import { NotesPanel } from '../components/NotesPanel'
import { RequirementList } from '../components/RequirementList'
import { ScoreMeter } from '../components/Score'
import { StatusActions } from '../components/StatusActions'
import { ScoreFlags, StatusPill } from '../components/StatusBadges'
import {
  useApplication,
  useApplicationNotes,
  useCvUrl,
  useRescore,
} from '../hooks/use-applications'
import { useReviewNavigation } from '../hooks/use-review-navigation'
import { foundMarkIds, type EvidenceMarkInput } from '../lib/evidence'
import type { ApplicationDetail } from '../types'

type Tab = 'history' | 'notes' | 'interviews'

// US-04, US-07 · Design Spec 6.1
export default function ApplicationDetailPage() {
  const { id = '' } = useParams()
  const { data: app, isPending, isError, error, refetch } = useApplication(id)
  const nav = useReviewNavigation(id)
  const navigate = useNavigate()
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(isInterviewer ? 'interviews' : 'history')
  const [cvOpen, setCvOpen] = useState(false)

  useHotkeys({
    j: () => nav.hasNext && nav.next(),
    k: () => nav.hasPrev && nav.prev(),
    Escape: () => void navigate(nav.backTo),
  })

  const marks = useMemo<EvidenceMarkInput[]>(() => {
    if (!app || isInterviewer) return []
    const byId = new Map(app.breakdown.map((b) => [b.requirementId, b]))
    return app.requirements.flatMap((r, i) => {
      const quote = byId.get(r.id)?.evidence
      return quote ? [{ id: r.id, n: i + 1, quote }] : []
    })
  }, [app, isInterviewer])

  const locatable = useMemo(
    () => (app?.cv?.text ? foundMarkIds(app.cv.text, marks) : new Set<string>()),
    [app, marks],
  )

  if (isPending) return <ReviewSkeleton />
  if (isError) return <ErrorState title="Chưa mở được hồ sơ" error={error} onRetry={refetch} />

  const select = (reqId: string) => {
    setActiveId(reqId)
    if (window.matchMedia?.('(max-width: 63.99rem)').matches) setCvOpen(true)
  }

  const sheet = (
    <CvPanel
      app={app}
      marks={marks}
      activeId={activeId}
      onMarkClick={setActiveId}
      className="h-full"
    />
  )

  return (
    <div className="pb-20 lg:pb-0">
      <header className="border-line -mx-4 -mt-6 border-b px-4 pt-4 pb-5 md:-mx-6 md:-mt-8 md:px-6 md:pt-5 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to={nav.backTo}
            className="type-caption hover:text-ink inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Hồ sơ ứng tuyển
          </Link>
          <div className="flex items-center gap-1">
            {nav.enabled && (
              <div className="flex items-center gap-1">
                <Tooltip
                  label={
                    <>
                      Hồ sơ trước{' '}
                      <Kbd className="ml-1 border-white/20 bg-transparent text-white">K</Kbd>
                    </>
                  }
                >
                  <Button
                    variant="quiet"
                    size="icon-sm"
                    aria-label="Hồ sơ trước"
                    disabled={!nav.hasPrev}
                    onClick={nav.prev}
                  >
                    <ChevronLeft />
                  </Button>
                </Tooltip>
                <span className="type-caption num min-w-14 text-center">
                  {nav.position?.toLocaleString('vi-VN')}/{nav.total?.toLocaleString('vi-VN')}
                </span>
                <Tooltip
                  label={
                    <>
                      Hồ sơ kế tiếp{' '}
                      <Kbd className="ml-1 border-white/20 bg-transparent text-white">J</Kbd>
                    </>
                  }
                >
                  <Button
                    variant="quiet"
                    size="icon-sm"
                    aria-label="Hồ sơ kế tiếp"
                    disabled={!nav.hasNext}
                    onClick={nav.next}
                  >
                    <ChevronRight />
                  </Button>
                </Tooltip>
              </div>
            )}
            <MoreMenu app={app} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h1 className="type-title">{app.candidate.fullName}</h1>
              <StatusPill status={app.status} className="text-sm" />
            </div>
            <p className="type-body text-ink-muted mt-1">
              <span className="text-ink-2 font-medium">{app.job.title}</span>
              {' · '}nộp {formatDate(app.createdAt)}
              {app.source && ` · ${APPLICATION_SOURCE[app.source].phrase}`}
              {' · '}
              {app.candidate.email}
              {app.candidate.phone && ` · ${app.candidate.phone}`}
            </p>
          </div>
          <StatusActions
            applicationId={app.id}
            status={app.status}
            className="bg-surface border-line fixed inset-x-0 bottom-0 z-20 justify-end border-t px-4 py-3 lg:static lg:border-0 lg:bg-transparent lg:p-0 [&:empty]:hidden"
          />
        </div>
      </header>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <section
          aria-label={isInterviewer ? 'Phiếu đánh giá của bạn' : 'Mức phù hợp'}
          className="min-w-0"
        >
          {isInterviewer ? (
            <>
              <h2 className="type-overline mb-3">Phiếu đánh giá của bạn</h2>
              <p className="type-body mb-4">
                Mức phù hợp được ẩn để bạn chấm độc lập. Đọc CV rồi chấm từng tiêu chí của tin.
              </p>
              <InterviewPanel
                applicationId={app.id}
                applicationStatus={app.status}
                requirements={app.requirements}
              />
            </>
          ) : (
            <ScorePanel app={app} activeId={activeId} locatable={locatable} onSelect={select} />
          )}
          <Button
            variant="secondary"
            className="mt-6 w-full lg:hidden"
            onClick={() => setCvOpen(true)}
            disabled={!app.cv?.text}
          >
            <FileText />
            Xem CV
          </Button>
        </section>

        <div className="hidden lg:block">
          <div className="sticky top-[72px] h-[calc(100dvh-96px)]">{sheet}</div>
        </div>
      </div>

      <section aria-label="Hoạt động" className="border-line mt-10 border-t pt-2">
        <ActivityTabs app={app} tab={tab} onTab={setTab} isInterviewer={isInterviewer} />
      </section>

      <SidePanel
        open={cvOpen}
        onClose={() => setCvOpen(false)}
        title={app.candidate.fullName}
        subtitle={app.cv?.fileName}
        width={720}
      >
        <div className="-mx-5 -my-4">{sheet}</div>
      </SidePanel>
    </div>
  )
}

function ScorePanel({
  app,
  activeId,
  locatable,
  onSelect,
}: {
  app: ApplicationDetail
  activeId: string | null
  locatable: ReadonlySet<string>
  onSelect: (id: string) => void
}) {
  const [cvTextOpen, setCvTextOpen] = useState(false)
  const matches = Object.fromEntries(app.breakdown.map((b) => [b.requirementId, b.match]))
  const outdated = app.scoredJdVersion !== null && app.scoredJdVersion !== app.job.jdVersion
  const busy = app.aiStatus === 'PENDING' || app.aiStatus === 'PROCESSING'

  return (
    <div>
      <h2 className="type-overline mb-3">Mức phù hợp</h2>

      {busy && (
        <div aria-live="polite">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-3 h-2 w-full" />
          <p className="type-body mt-3">
            <span className="text-ink font-medium">Đang đọc CV</span> · thường mất dưới 1 phút.
            Trang tự cập nhật khi xong.
          </p>
        </div>
      )}

      {app.aiStatus === 'FAILED' && (
        <div role="alert" className="bg-bad-soft rounded-sm px-4 py-3">
          <p className="text-bad type-subheading">Không đọc được CV</p>
          <p className="type-body mt-0.5">
            {app.aiError ?? 'Tệp có thể là ảnh scan nên không lấy được chữ.'}
          </p>
          {app.cv?.parseStatus === 'FAILED' && (
            <Can permission={Permission.AiRescore}>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setCvTextOpen(true)}
              >
                <PencilLine />
                Nhập nội dung CV
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
          <ScoreMeter score={app.score} requirements={app.requirements} matches={matches} />
          <p className="type-caption mt-3">
            Tính tự động từ CV theo {app.requirements.length} tiêu chí của tin – bạn là người quyết
            định.
          </p>
          {(app.flags.length > 0 || outdated) && (
            <div className="mt-3 space-y-1">
              <ScoreFlags flags={app.flags} />
              {outdated && (
                <p className="text-warn text-[13px]">
                  Điểm theo tiêu chí phiên bản {app.scoredJdVersion}; tin đang ở phiên bản{' '}
                  {app.job.jdVersion}.
                </p>
              )}
            </div>
          )}
          <div className="mt-5">
            <RequirementList
              requirements={app.requirements}
              breakdown={app.breakdown}
              activeId={activeId}
              locatable={locatable}
              onSelect={onSelect}
            />
          </div>
        </>
      )}
    </div>
  )
}

function CvPanel({
  app,
  marks,
  activeId,
  onMarkClick,
  className,
}: {
  app: ApplicationDetail
  marks: EvidenceMarkInput[]
  activeId: string | null
  onMarkClick: (id: string) => void
  className?: string
}) {
  if (!app.cv)
    return (
      <div className="border-line bg-surface h-full rounded-md border p-8">
        <p className="type-heading">CV đã được xoá</p>
        <p className="type-body mt-1">
          Ứng viên đã yêu cầu ẩn danh nên tệp và nội dung CV không còn.
        </p>
      </div>
    )
  if (!app.cv.text)
    return (
      <div className="border-line bg-surface h-full rounded-md border p-8">
        <p className="type-heading">Chưa có nội dung CV</p>
        <p className="type-body mt-1">
          {app.cv.parseStatus === 'FAILED'
            ? 'Không lấy được chữ từ tệp. Bạn có thể nhập nội dung CV ở cột bên trái.'
            : 'Hệ thống đang đọc tệp CV.'}
        </p>
      </div>
    )
  return (
    <CvSheet
      text={app.cv.text}
      marks={marks}
      activeId={activeId}
      onMarkClick={onMarkClick}
      className={className}
      header={
        <p className="type-caption mb-6 flex flex-wrap items-center justify-between gap-2">
          <span>
            Tờ CV · {app.cv.fileName}
            {app.cv.textEnteredAt && ' · Nội dung nhập tay'}
          </span>
          {marks.length > 0 && (
            <span>
              <span className="mark-evidence">dạ quang</span> = căn cứ cho tiêu chí
            </span>
          )}
        </p>
      }
    />
  )
}

function MoreMenu({ app }: { app: ApplicationDetail }) {
  const [open, setOpen] = useState(false)
  const rescore = useRescore(app.id)
  const cvUrl = useCvUrl()
  const canRescore = usePermission(Permission.AiRescore)
  const canCv = usePermission(Permission.CvRead)
  const canCandidate = usePermission(Permission.CandidateRead)
  const busy = app.aiStatus === 'PENDING' || app.aiStatus === 'PROCESSING'

  if (!canRescore && !canCv && !canCandidate) return null

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      role="menu"
      label="Thao tác khác"
      className="w-60"
      trigger={(props) => (
        <Button variant="quiet" size="icon-sm" aria-label="Thao tác khác" {...props}>
          <MoreHorizontal />
        </Button>
      )}
    >
      {canCv && app.cv && (
        <button
          type="button"
          role="menuitem"
          className={menuItemClass}
          onClick={() => {
            setOpen(false)
            cvUrl.mutate(app.cv!.fileId, { onSuccess: ({ url }) => window.open(url, '_blank') })
          }}
        >
          <Download />
          Tải CV gốc
        </button>
      )}
      {canCandidate && (
        <Link
          role="menuitem"
          to={links.candidateDetail(app.candidate.id)}
          className={menuItemClass}
        >
          <UserRound />
          Mọi lần nộp của ứng viên
        </Link>
      )}
      {canRescore && (
        <button
          type="button"
          role="menuitem"
          disabled={busy || rescore.isPending}
          className={menuItemClass}
          onClick={() => {
            setOpen(false)
            rescore.mutate()
          }}
        >
          <RotateCw />
          Chấm lại theo tiêu chí hiện hành
        </button>
      )}
    </Popover>
  )
}

function ActivityTabs({
  app,
  tab,
  onTab,
  isInterviewer,
}: {
  app: ApplicationDetail
  tab: Tab
  onTab: (t: Tab) => void
  isInterviewer: boolean
}) {
  const notes = useApplicationNotes(app.id)
  const interviews = useApplicationInterviews(app.id)
  const tabs = [
    { id: 'history' as const, label: 'Lịch sử' },
    { id: 'notes' as const, label: 'Ghi chú', count: notes.data?.length },
    ...(isInterviewer
      ? []
      : [{ id: 'interviews' as const, label: 'Phỏng vấn', count: interviews.data?.length }]),
  ]
  const current = isInterviewer && tab === 'interviews' ? 'history' : tab

  return (
    <>
      <Tabs tabs={tabs} value={current} onChange={onTab} label="Hoạt động của hồ sơ" />
      <div role="tabpanel" className="pt-5">
        {current === 'history' && <HistoryTimeline applicationId={app.id} />}
        {current === 'notes' && <NotesPanel applicationId={app.id} />}
        {current === 'interviews' && (
          <InterviewPanel
            applicationId={app.id}
            applicationStatus={app.status}
            requirements={app.requirements}
          />
        )}
      </div>
    </>
  )
}

function ReviewSkeleton() {
  return (
    <div aria-busy aria-label="Đang tải hồ sơ">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-10 w-80 max-w-full" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[5fr_7fr]">
        <div className="space-y-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="hidden h-[70vh] rounded-md lg:block" />
      </div>
    </div>
  )
}
