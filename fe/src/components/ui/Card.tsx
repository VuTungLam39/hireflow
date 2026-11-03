import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends ComponentProps<'div'> {
  interactive?: boolean
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border-line bg-surface rounded-md border p-5 sm:p-6',
        interactive && 'hover:border-ink-faint transition-colors duration-150',
        className,
      )}
      {...props}
    />
  )
}

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
      <h2 className="type-heading flex items-center gap-2">
        {icon && <span className="text-ink-muted [&_svg]:size-4">{icon}</span>}
        {children}
      </h2>
      {aside}
    </div>
  )
}
