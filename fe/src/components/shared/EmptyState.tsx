import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

// App Screens 11: khối rỗng giữ khung, một câu lý do và một việc nên làm
export function EmptyState({ title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-line-strong bg-canvas/50 flex flex-col gap-4 rounded-md border border-dashed sm:flex-row sm:items-center sm:justify-between',
        compact ? 'px-4 py-4' : 'px-6 py-7',
        className,
      )}
    >
      <div className="max-w-xl min-w-0">
        <p className="type-heading">{title}</p>
        {description && <p className="text-ink-muted mt-1">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  )
}
