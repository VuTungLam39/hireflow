import { Button } from '@/components/ui'
import { formatTime } from '@/lib/utils'

// RR-10, F-02: làm mới thất bại trên dữ liệu cũ thì phải nói ra
export function StaleNotice({ updatedAt, onRetry }: { updatedAt: number; onRetry: () => void }) {
  return (
    <p role="status" className="type-caption flex items-center gap-1.5">
      Dữ liệu lúc {formatTime(new Date(updatedAt).toISOString())} ·
      <Button variant="link" onClick={onRetry}>
        Tải lại
      </Button>
    </p>
  )
}
