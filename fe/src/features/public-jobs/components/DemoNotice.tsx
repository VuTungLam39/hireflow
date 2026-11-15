import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Rà soát production Phase 6 · hướng A: bản demo, không nhận CV thật
export function DemoNotice({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        'border-line bg-sunken text-ink-2 flex gap-2 rounded-sm border px-3 py-2 text-sm',
        className,
      )}
    >
      <Info aria-hidden className="text-ink-muted mt-0.5 size-4 shrink-0" />
      <span>
        <strong className="font-semibold">Bản demo thực tập.</strong> HireFlow đang chạy thử để
        trình diễn, không phải kênh tuyển dụng thật của doanh nghiệp nào. Vui lòng không nộp CV
        thật; dùng CV mẫu hoặc thông tin giả.
      </span>
    </p>
  )
}
