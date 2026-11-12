import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface Kpi {
  label: string
  value: number | string | null | undefined
  compare?: ReactNode
  compareTone?: 'good' | 'bad' | 'muted'
  to?: string
  suffix?: string
}

const toneClass = { good: 'text-good-ink', bad: 'text-bad', muted: 'text-ink-muted' } as const

export function KpiStrip({
  items,
  loading,
  className,
}: {
  items: Kpi[]
  loading?: boolean
  className?: string
}) {
  return (
    <dl
      className={cn(
        'border-line sm:divide-line grid grid-cols-2 border-y sm:flex sm:divide-x',
        className,
      )}
    >
      {items.map((kpi, i) => {
        return (
          <div
            key={kpi.label}
            className={cn(
              'min-w-0 flex-1 py-4 sm:px-6 sm:first:pl-0',
              i % 2 === 1 && 'border-line border-l pl-4 sm:border-l-0',
              i >= 2 && 'border-line border-t sm:border-t-0',
              i % 2 === 0 && 'pr-4',
              kpi.to && 'hover:[&_.type-figure]:text-brand relative',
            )}
          >
            <dt className="type-caption">
              {kpi.to ? (
                <Link to={kpi.to} className="after:absolute after:inset-0">
                  {kpi.label}
                </Link>
              ) : (
                kpi.label
              )}
            </dt>
            <dd className="mt-1">
              {loading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <span className="type-figure">
                  {kpi.value == null
                    ? '—'
                    : typeof kpi.value === 'number'
                      ? kpi.value.toLocaleString('vi-VN')
                      : kpi.value}
                  {kpi.suffix && kpi.value != null && (
                    <span className="text-ink-muted ml-0.5 font-sans text-[13px] font-normal">
                      {kpi.suffix}
                    </span>
                  )}
                </span>
              )}
            </dd>
            {kpi.compare && !loading && (
              <dd className={cn('num mt-0.5 text-[13px]', toneClass[kpi.compareTone ?? 'muted'])}>
                {kpi.compare}
              </dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}
