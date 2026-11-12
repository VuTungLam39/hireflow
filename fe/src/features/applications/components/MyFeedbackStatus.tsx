import { Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { MyFeedback } from '../hooks/use-my-feedback'

// BR-INT-03 · App Screens 7.5
export function MyFeedbackStatus({ value }: { value: MyFeedback | undefined }) {
  if (!value) return <span className="text-ink-muted">—</span>
  if (value.kind === 'sent')
    return (
      <span className="text-good-ink inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap">
        <Check aria-hidden className="size-3.5" />
        Đã gửi
      </span>
    )
  if (value.kind === 'due')
    return (
      <span className="text-warn text-[13px] font-medium whitespace-nowrap">Cần gửi phiếu</span>
    )
  return (
    <span className="type-caption num whitespace-nowrap">Phỏng vấn {formatDate(value.at)}</span>
  )
}
