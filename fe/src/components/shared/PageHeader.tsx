import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
  aside?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-1.5', className)}>
      {breadcrumb && (
        <div className="type-caption [&_a]:hover:text-ink md:hidden [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:transition-colors">
          {breadcrumb}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="type-title">{title}</h1>
          {description && <p className="text-ink-muted num mt-1">{description}</p>}
        </div>
        {(actions || aside) && (
          <div className="flex flex-wrap items-center gap-2">
            {aside}
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

const LEADING_NUMBER = /^(\d[\d.,]*\+?)(\s.*)$/s

/** Số đứng đầu mỗi mục in mực đậm, phần chữ giữ màu phụ: "**32** hồ sơ · **6** chờ xem" */
function SummaryItem({ item }: { item: ReactNode }) {
  if (typeof item !== 'string') return <>{item}</>
  const match = LEADING_NUMBER.exec(item)
  if (!match) return <>{item}</>
  return (
    <>
      <span className="text-ink font-semibold">{match[1]}</span>
      {match[2]}
    </>
  )
}

export function Summary({ items }: { items: (ReactNode | false | null | undefined)[] }) {
  const shown = items.filter(Boolean)
  return (
    <>
      {shown.map((item, i) => (
        <span key={i}>
          {i > 0 && (
            <span aria-hidden className="text-ink-faint mx-1.5">
              ·
            </span>
          )}
          <SummaryItem item={item} />
        </span>
      ))}
    </>
  )
}
