import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('max-w-xl', compact ? 'py-4' : 'py-10', className)}>
      <p className="type-heading">{title}</p>
      {description && <p className="text-ink-muted mt-1">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}
