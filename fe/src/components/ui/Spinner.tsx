import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="text-primary flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
