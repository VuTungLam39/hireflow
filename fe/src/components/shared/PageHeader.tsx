import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Nút hành động bên phải (thêm mới, lưu...) */
  actions?: ReactNode
  /** Dòng phía trên tiêu đề, ví dụ link quay lại */
  breadcrumb?: ReactNode
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="animate-fade-in space-y-2">
      {breadcrumb && (
        <div className="text-sm text-slate-500 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:transition-colors [&_a:hover]:text-slate-800">
          {breadcrumb}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
