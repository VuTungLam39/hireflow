import { isAxiosError } from 'axios'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { getErrorMessage, getErrorRef } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorState({
  error,
  onRetry,
  title = 'Chưa tải được dữ liệu',
  className,
}: ErrorStateProps) {
  const ref = getErrorRef(error)
  const message = getErrorMessage(error).replace(/[.\s]+$/, '')
  const status = isAxiosError(error) ? error.response?.status : undefined
  // P3-04, P3-09
  const retryable = status !== 403 && status !== 404
  const retryHint = retryable && !/thử lại/i.test(message)
  return (
    <div role="alert" className={cn('max-w-xl py-10', className)}>
      <p className="type-heading">{title}</p>
      <p className="text-ink-muted mt-1">
        {message}.{retryHint && ' Bạn thử lại sau giây lát.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {onRetry && retryable && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw />
            Thử lại
          </Button>
        )}
        {ref && <span className="type-caption type-code">Mã tham chiếu {ref}</span>}
      </div>
    </div>
  )
}
