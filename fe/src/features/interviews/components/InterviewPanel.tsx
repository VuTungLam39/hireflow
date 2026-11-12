import { CalendarPlus, Check, Clock, MapPin, Pencil, Star, X } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared'
import { Button, Skeleton } from '@/components/ui'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { cn, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { useApplicationInterviews, useCancelInterview } from '../hooks/use-interviews'
import { averageOverall, formatSlot, isLink } from '../lib/format'
import { useNow } from '../hooks/use-now'
import { INTERVIEW_STATUS } from '../lib/constants'
import { PENDING_LABEL, pendingOf } from '../lib/pending'
import type { Interview, InterviewFeedback } from '../types'
import { FeedbackDialog } from './FeedbackDialog'
import { QuestionSuggestions } from './QuestionSuggestions'
import { ScheduleInterviewDialog } from './ScheduleInterviewDialog'

interface InterviewPanelProps {
  applicationId: string
  applicationStatus: string
  requirements: { id: string; label: string }[]
}

function FeedbackView({ feedback }: { feedback: InterviewFeedback }) {
  return (
    <div className="bg-canvas space-y-2 rounded-sm p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-ink font-medium">{feedback.author.fullName}</span>
        <span className="text-warn flex items-center gap-1 font-semibold">
          <Star className="size-4 fill-current" />
          {feedback.overall}/5
        </span>
      </div>
      <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {feedback.ratings.map((r) => (
          <li key={r.requirementId} className="text-ink-2 flex justify-between gap-2">
            <span className="truncate">{r.label}</span>
            <span className="text-ink font-medium tabular-nums">{r.score}</span>
          </li>
        ))}
      </ul>
      {feedback.comment && <p className="text-ink-2 whitespace-pre-line">{feedback.comment}</p>}
      <p className="text-ink-muted text-xs">Gửi {formatDateTime(feedback.submittedAt)}</p>
    </div>
  )
}

// F-INT-01 → 03
export function InterviewPanel({
  applicationId,
  applicationStatus,
  requirements,
}: InterviewPanelProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const canManage = usePermission(Permission.InterviewManage)
  const canFeedback = usePermission(Permission.InterviewFeedback)
  const { data, isPending, isError } = useApplicationInterviews(applicationId)
  const cancel = useCancelInterview()
  const [scheduling, setScheduling] = useState(false)
  const [editing, setEditing] = useState<Interview | null>(null)
  const [cancelling, setCancelling] = useState<Interview | null>(null)
  const [reviewing, setReviewing] = useState<Interview | null>(null)
  const now = useNow()

  if (isPending) return <Skeleton className="h-24" />
  if (isError && !data) return <p className="text-bad text-sm">Không tải được lịch phỏng vấn.</p>

  const interviews = data ?? []
  const canSchedule = canManage && applicationStatus === 'INTERVIEW'
  const myFeedback = (iv: Interview) => iv.feedbacks.find((f) => f.author.id === userId)

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="space-y-1">
          <Button size="sm" disabled={!canSchedule} onClick={() => setScheduling(true)}>
            <CalendarPlus />
            Đặt lịch phỏng vấn
          </Button>
          {!canSchedule && (
            <p className="text-ink-muted text-xs">Chuyển hồ sơ sang “Phỏng vấn” để đặt lịch.</p>
          )}
        </div>
      )}

      {interviews.length === 0 ? (
        <p className="text-ink-muted text-sm">Chưa có buổi phỏng vấn nào.</p>
      ) : (
        <ul className="space-y-3">
          {interviews.map((iv) => {
            const started = new Date(iv.scheduledAt).getTime() <= now
            const mine = myFeedback(iv)
            const assigned = iv.interviewers.some((i) => i.id === userId)
            const editableMine = !mine || new Date(mine.editableUntil).getTime() > now
            const avg = averageOverall(iv.feedbacks.map((f) => f.overall))
            const pending = pendingOf(iv, { now, userId, isInterviewer })
            return (
              <li key={iv.id} className="border-line bg-surface space-y-3 rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="type-subheading">Vòng {iv.round}</p>
                    <p className="text-ink-2 flex items-center gap-1.5 text-sm">
                      <Clock className="text-ink-faint size-4 shrink-0" />
                      {formatSlot(iv.scheduledAt, iv.durationMinutes)}
                    </p>
                    <p className="text-ink-2 flex min-w-0 items-center gap-1.5 text-sm">
                      <MapPin className="text-ink-faint size-4 shrink-0" />
                      {isLink(iv.location) ? (
                        <a
                          href={iv.location}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand truncate hover:underline"
                        >
                          {iv.location}
                        </a>
                      ) : (
                        <span className="truncate">{iv.location}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[13px] font-medium',
                      pending
                        ? PENDING_LABEL[pending].tone
                        : iv.status === 'COMPLETED'
                          ? 'text-good-ink'
                          : 'text-ink-muted',
                    )}
                  >
                    {pending ? PENDING_LABEL[pending].text : INTERVIEW_STATUS[iv.status].label}
                  </span>
                </div>

                <ul className="flex flex-wrap gap-2 text-xs">
                  {iv.interviewers.map((p) => (
                    <li
                      key={p.id}
                      className="bg-sunken text-ink-2 flex items-center gap-1 rounded-full px-2 py-1"
                    >
                      {p.submitted ? (
                        <Check aria-label="Đã gửi phiếu" className="text-good size-3.5" />
                      ) : null}
                      {p.fullName}
                    </li>
                  ))}
                </ul>

                {iv.cancelReason && (
                  <p className="text-ink-muted text-sm">Lý do huỷ: {iv.cancelReason}</p>
                )}

                {iv.feedbacks.length > 0 && (
                  <div className="space-y-2">
                    {avg !== null && iv.feedbacks.length > 1 && (
                      <p className="text-ink-2 text-sm">
                        Trung bình đánh giá chung: <strong>{avg}/5</strong> ({iv.feedbacks.length}{' '}
                        phiếu)
                      </p>
                    )}
                    {iv.feedbacks.map((f) => (
                      <FeedbackView key={f.id} feedback={f} />
                    ))}
                  </div>
                )}

                {(assigned || !isInterviewer) && iv.status !== 'CANCELLED' && (
                  <QuestionSuggestions interviewId={iv.id} />
                )}

                <div className="flex flex-wrap gap-2">
                  {canFeedback &&
                    assigned &&
                    iv.status !== 'CANCELLED' &&
                    (started ? (
                      editableMine ? (
                        <Button size="sm" onClick={() => setReviewing(iv)}>
                          <Star />
                          {mine ? 'Sửa phiếu đánh giá' : 'Gửi phiếu đánh giá'}
                        </Button>
                      ) : (
                        <p className="text-ink-muted text-xs">
                          Đã quá 24 giờ, phiếu không sửa được nữa.
                        </p>
                      )
                    ) : (
                      <p className="text-ink-muted text-xs">
                        Phiếu đánh giá mở khi buổi phỏng vấn bắt đầu.
                      </p>
                    ))}
                  {canManage && iv.status === 'SCHEDULED' && (
                    <>
                      {iv.feedbacks.length === 0 && (
                        <Button size="sm" variant="secondary" onClick={() => setEditing(iv)}>
                          <Pencil />
                          Đổi lịch
                        </Button>
                      )}
                      <Button size="sm" variant="danger-quiet" onClick={() => setCancelling(iv)}>
                        <X />
                        Huỷ buổi
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {scheduling && (
        <ScheduleInterviewDialog
          applicationId={applicationId}
          open
          onClose={() => setScheduling(false)}
        />
      )}
      {editing && (
        <ScheduleInterviewDialog
          applicationId={applicationId}
          interview={editing}
          open
          onClose={() => setEditing(null)}
        />
      )}
      {reviewing && (
        <FeedbackDialog
          interview={reviewing}
          requirements={requirements}
          existing={myFeedback(reviewing)}
          open
          onClose={() => setReviewing(null)}
        />
      )}
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title={cancelling ? `Huỷ buổi phỏng vấn vòng ${cancelling.round}?` : ''}
        description="Người phỏng vấn nhận thông báo huỷ và không còn thấy hồ sơ (nếu không có buổi khác)."
        tone="danger"
        confirmLabel="Huỷ buổi"
        requireReason={{ label: 'Lý do', placeholder: 'Ví dụ: ứng viên xin dời lịch' }}
        loading={cancel.isPending}
        onConfirm={(reason) =>
          cancelling &&
          cancel.mutate(
            { id: cancelling.id, reason: reason ?? '' },
            { onSuccess: () => setCancelling(null) },
          )
        }
      />
    </div>
  )
}
