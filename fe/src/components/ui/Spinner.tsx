import { cn } from '@/lib/utils'

export function Spinner({ className, label = 'Đang tải' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80',
        className,
      )}
    />
  )
}

export function TopProgress() {
  return (
    <div
      role="progressbar"
      aria-label="Đang tải"
      className="bg-brand-soft fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
    >
      <div className="bg-brand animate-progress h-full w-2/5" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="bg-canvas min-h-dvh">
      <TopProgress />
      <div className="flex min-h-dvh items-center justify-center">
        <span className="text-ink-muted font-display text-lg font-semibold">HireFlow</span>
      </div>
    </div>
  )
}
