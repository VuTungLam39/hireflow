import { RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'

interface ErrorStateProps {
  error: unknown
  /** Thường là `refetch` của useQuery */
  onRetry?: () => void
}

/** R8: trạng thái lỗi, luôn có nút thử lại */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="animate-fade-in flex flex-col items-center gap-3 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/40">
        <TriangleAlert className="size-5" />
      </div>
      <p className="font-medium text-slate-800">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw />
          Thử lại
        </Button>
      )}
    </div>
  )
}
