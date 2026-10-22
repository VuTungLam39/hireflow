import { cn } from '@/lib/utils'

/** Khối giữ chỗ khi đang tải (R8: trạng thái loading), có vệt sáng chạy ngang */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-slate-100)_25%,var(--color-slate-200)_50%,var(--color-slate-100)_75%)] bg-size-[200%_100%]',
        className,
      )}
    />
  )
}
