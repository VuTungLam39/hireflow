import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
}

/** R8: trạng thái không có dữ liệu */
export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-2 py-12 text-center">
      <div className="bg-primary-soft text-primary/70 mb-2 flex size-12 items-center justify-center rounded-full ring-8 ring-slate-50">
        <Icon className="size-5" />
      </div>
      <p className="font-medium text-slate-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
