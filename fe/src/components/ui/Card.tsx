import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends ComponentProps<'div'> {
  /** Nổi nhẹ khi hover – dùng cho thẻ bấm được */
  interactive?: boolean
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'shadow-card rounded-xl border border-slate-200/80 bg-white p-6',
        interactive &&
          'hover:shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300',
        className,
      )}
      {...props}
    />
  )
}

/** Tiêu đề trong Card: chữ + icon nhỏ + phần phụ bên phải */
export function CardTitle({
  icon,
  children,
  aside,
}: {
  icon?: ReactNode
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        {icon && <span className="text-primary [&_svg]:size-4">{icon}</span>}
        {children}
      </h2>
      {aside}
    </div>
  )
}
