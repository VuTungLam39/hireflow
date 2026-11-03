import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SystemMessageProps {
  code?: string
  title: string
  children?: ReactNode
  actions?: ReactNode
  standalone?: boolean
}

export function SystemMessage({ code, title, children, actions, standalone }: SystemMessageProps) {
  return (
    <section
      className={cn(
        'max-w-xl py-10',
        standalone && 'bg-canvas mx-auto flex min-h-dvh flex-col justify-center px-6',
      )}
    >
      {code && <p className="type-overline mb-3">{code}</p>}
      <h1 className="type-title">{title}</h1>
      {children && <div className="type-read mt-2">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
    </section>
  )
}
