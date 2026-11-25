import { useState } from 'react'
import {
  Button,
  chipClass,
  Dialog,
  DialogFooter,
  FormField,
  RatingScale,
  Textarea,
} from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'
import { cn, formatTimeOnDate } from '@/lib/utils'
import { useSubmitFeedback } from '../hooks/use-interviews'
import { RECOMMENDATION, RECOMMENDATION_ORDER, SCORE_LABEL } from '../lib/constants'
import type { Interview, InterviewFeedback, Recommendation } from '../types'
import { QuestionSuggestions } from './QuestionSuggestions'

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
  const [recommendation, setRecommendation] = useState<Recommendation | undefined>(
    existing?.recommendation ?? undefined,
  )
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missing = requirements.filter((r) => !ratings[r.id])
  const scoreLabels = [1, 2, 3, 4, 5].map((n) => SCORE_LABEL[n])

  const save = () => {
    setTouched(true)
    // P5
    const first = missing[0]
      ? `fb-${missing[0].id}`
      : !overall
        ? 'fb-overall'
        : !recommendation
          ? 'fb-recommendation'
          : null
    if (first) {
      document.querySelector<HTMLInputElement>(`input[name="${first}"]`)?.focus()
      return
    }
    if (comment.length > 2000) return
    setError(null)
    submit.mutate(
      {
        id: interview.id,
        input: {
          overall: overall!,
          ratings: requirements.map((r) => ({ requirementId: r.id, score: ratings[r.id] })),
          comment: comment.trim() || undefined,
          recommendation: recommendation!,
        },
      },
      {
        onSuccess: onClose,
        // OP-1
        onError: (e) => setError(getErrorMessage(e)),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? 'Sửa Phiếu đánh giá' : 'Phiếu đánh giá'}
      description={`Vòng ${interview.round}. Chấm 1–5 cho từng tiêu chí của tin.`}
      size="lg"
    >
      <div className="space-y-5">
        <QuestionSuggestions interviewId={interview.id} />
        <div className="border-line space-y-4 rounded-md border p-4">
          {requirements.map((r) => (
            <RatingScale
              key={r.id}
              name={`fb-${r.id}`}
              legend={r.label}
              labels={scoreLabels}
              value={ratings[r.id]}
              error={touched && !ratings[r.id] ? 'Chọn mức đánh giá cho tiêu chí này.' : undefined}
              onChange={(score) => setRatings((prev) => ({ ...prev, [r.id]: score }))}
            />
          ))}
          <RatingScale
            name="fb-overall"
            legend="Đánh giá chung"
            labels={scoreLabels}
            value={overall}
            error={touched && !overall ? 'Chọn mức đánh giá chung.' : undefined}
            onChange={setOverall}
            className="border-line-soft border-t pt-4"
          />
        </div>
        {/* MVP 3.1 · BR-INT-06 · VF-10 */}
        <fieldset
          aria-invalid={(touched && !recommendation) || undefined}
          aria-describedby={touched && !recommendation ? 'fb-recommendation-error' : undefined}
          className="space-y-1.5"
        >
          <legend className="type-label mb-1.5">Đề xuất tuyển</legend>
          <div className="flex flex-wrap gap-1.5">
            {RECOMMENDATION_ORDER.map((r) => (
              <label
                key={r}
                className={cn(
                  chipClass(recommendation === r),
                  'has-focus-visible:outline-ui-focus relative cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                )}
              >
                <input
                  type="radio"
                  name="fb-recommendation"
                  value={r}
                  checked={recommendation === r}
                  onChange={() => setRecommendation(r)}
                  className="absolute inset-0 cursor-pointer appearance-none focus-visible:outline-none"
                />
                {RECOMMENDATION[r].label}
              </label>
            ))}
          </div>
          {touched && !recommendation && (
            <p id="fb-recommendation-error" className="text-ui-danger text-[13px]">
              Chọn đề xuất của bạn.
            </p>
          )}
        </fieldset>
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
          <p role="alert" className="text-bad text-sm">
            Chưa gửi được Phiếu đánh giá · nội dung vẫn được giữ. {error}
          </p>
        )}
        {/* P5-D13a */}
        <p className="type-caption">
          {existing
            ? `Bạn sửa được tới ${formatTimeOnDate(existing.editableUntil)}; sau đó phiếu bị khoá.`
            : 'Bạn sửa được trong 24 giờ sau khi gửi; sau đó phiếu bị khoá và Hiring Manager thấy bản cuối.'}
        </p>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submit.isPending}>
            Huỷ
          </Button>
          <Button type="button" loading={submit.isPending} onClick={save}>
            {error ? 'Thử lại' : existing ? 'Lưu thay đổi' : 'Gửi Phiếu đánh giá'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
