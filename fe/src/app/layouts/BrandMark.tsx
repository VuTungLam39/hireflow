import { cn } from '@/lib/utils'

/** Logo HireFlow: khối vuông bo góc + chữ. Dùng chung cho sidebar, trang đăng nhập, trang công khai. */
export function BrandMark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          'flex size-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm',
          light
            ? 'bg-white/15 text-white ring-1 ring-white/25'
            : 'from-primary bg-gradient-to-br to-violet-500 text-white',
        )}
      >
        H
      </span>
      <span
        className={cn(
          'text-lg font-semibold tracking-tight',
          light ? 'text-white' : 'text-slate-900',
        )}
      >
        Hire<span className={light ? 'text-indigo-200' : 'text-primary'}>Flow</span>
      </span>
    </span>
  )
}
