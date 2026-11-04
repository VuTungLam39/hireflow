import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('bg-sunken animate-skeleton rounded-sm', className)} />
}
