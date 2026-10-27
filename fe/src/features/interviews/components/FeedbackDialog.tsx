import { useState } from 'react'
import { Button, Dialog, FormField, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useSubmitFeedback } from '../hooks/use-interviews'
import { SCORE_LABEL } from '../lib/constants'
import type { Interview, InterviewFeedback } from '../types'

interface RatingInputProps {
  label: string
  value: number | undefined
  onChange: (score: number) => void
  invalid?: boolean
}

export function RatingInput({ label, value, onChange, invalid }: RatingInputProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-slate-700">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} – ${SCORE_LABEL[score]}`}
            title={SCORE_LABEL[score]}
            onClick={() => onChange(score)}
            className={cn(
              'size-9 rounded-lg border text-sm font-semibold transition-colors',
              value === score
                ? 'border-primary bg-primary text-white'
                : invalid
                  ? 'border-red-300 text-slate-600 hover:bg-red-50'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}

interface FeedbackDialogProps {
  interview: Interview
  requirements: { id: string; label: string }[]
  existing?: InterviewFeedback
  open: boolean
  onClose: () => void
}

// F-INT-03, BR-INT-03
export function FeedbackDialog({
  interview,
  requirements,
  existing,
  open,
  onClose,
}: FeedbackDialogProps) {
  const submit = useSubmitFeedback()
  const initial = () =>
    Object.fromEntries(existing?.ratings.map((r) => [r.requirementId, r.score]) ?? [])
  const [ratings, setRatings] = useState<Record<string, number>>(initial)
  const [overall, setOverall] = useState<number | undefined>(existing?.overall)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missing = requirements.filter((r) => !ratings[r.id])
  const incomplete = missing.length > 0 || !overall

  const save = () => {
    setTouched(true)
    if (incomplete || comment.length > 2000) return
    submit.mutate(
      {
        id: interview.id,
        input: {
          overall: overall!,
          ratings: requirements.map((r) => ({ requirementId: r.id, score: ratings[r.id] })),
          comment: comment.trim() || undefined,
        },
      },
      {
        onSuccess: onClose,
        onError: (e) => setError(getErrorMessage(e)),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? 'Sửa phiếu đánh giá' : 'Phiếu đánh giá'}
      description={`Vòng ${interview.round}. Chấm 1–5 cho từng tiêu chí của tin; sửa được trong 24 giờ sau khi gửi.`}
      size="lg"
    >
      <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-slate-100 p-4">
          {requirements.map((r) => (
            <RatingInput
              key={r.id}
              label={r.label}
              value={ratings[r.id]}
              invalid={touched && !ratings[r.id]}
              onChange={(score) => setRatings((prev) => ({ ...prev, [r.id]: score }))}
            />
          ))}
          <div className="border-t border-slate-100 pt-3">
            <RatingInput
              label="Đánh giá chung"
              value={overall}
              invalid={touched && !overall}
              onChange={setOverall}
            />
          </div>
        </div>
        {touched && incomplete && (
          <p role="alert" className="text-sm text-red-600">
            Chấm đủ mọi tiêu chí và phần đánh giá chung.
          </p>
        )}
        <FormField
          label="Nhận xét (tuỳ chọn)"
          htmlFor="fb-comment"
          hint={`${comment.length}/2000`}
          error={comment.length > 2000 ? 'Tối đa 2000 ký tự' : undefined}
        >
          <Textarea
            id="fb-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Điểm mạnh, điểm cần lưu ý, đề xuất cho vòng sau…"
          />
        </FormField>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submit.isPending}>
            Huỷ
          </Button>
          <Button type="button" loading={submit.isPending} onClick={save}>
            {existing ? 'Lưu thay đổi' : 'Gửi phiếu'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
