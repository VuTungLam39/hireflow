import { MessageCircleQuestion, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useSuggestQuestions } from '../hooks/use-interviews'

// Mở rộng MVP 2 – E5 · BR-INT-04: chỉ hiển thị để tham khảo, không lưu vào phiếu, không dùng điểm
export function QuestionSuggestions({
  interviewId,
  className,
}: {
  interviewId: string
  className?: string
}) {
  const suggest = useSuggestQuestions(interviewId)

  if (!suggest.data)
    return (
      <div className={cn('space-y-1.5', className)}>
        <Button
          size="sm"
          variant="secondary"
          loading={suggest.isPending}
          onClick={() => suggest.mutate()}
        >
          <MessageCircleQuestion />
          Gợi ý câu hỏi
        </Button>
        {suggest.isPending && (
          <p className="type-caption" role="status">
            Đang soạn câu hỏi theo tiêu chí của tin và CV, thường mất 5–15 giây…
          </p>
        )}
        {suggest.isError && (
          <p role="alert" className="text-bad text-sm">
            Chưa gợi ý được câu hỏi: {getErrorMessage(suggest.error)}. Phiếu đánh giá vẫn dùng bình
            thường.
          </p>
        )}
      </div>
    )

  const items = suggest.data.items
  return (
    <section
      aria-label="Câu hỏi gợi ý"
      className={cn('border-line bg-canvas/60 space-y-3 rounded-md border p-4', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="type-subheading">Câu hỏi gợi ý</h3>
        <button
          type="button"
          onClick={() => suggest.reset()}
          className="type-caption hover:text-ink inline-flex items-center gap-1 transition-colors"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Ẩn
        </button>
      </div>
      <p className="type-caption">
        Soạn từ tiêu chí của tin và nội dung CV, không dựa trên điểm chấm CV. Chỉ để tham khảo,
        không lưu vào phiếu.
      </p>
      {items.length === 0 ? (
        <p className="text-ink-muted text-sm">Tin này chưa có tiêu chí để gợi ý câu hỏi.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.requirementId} className="space-y-1">
              <p className="type-body-strong">{item.label}</p>
              {item.questions.length ? (
                <ul className="type-body text-ink-2 list-disc space-y-1 pl-5">
                  {item.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p className="type-caption">Chưa có gợi ý cho tiêu chí này.</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
