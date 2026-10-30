import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  /** Khối thương hiệu trang đăng nhập: logo trong suốt trên nền màu */
  light?: boolean
  /** Sidebar tối: logo gradient, chữ sáng */
  onDark?: boolean
}

/** Logo HireFlow: khối vuông bo góc + chữ. Dùng chung cho sidebar, trang đăng nhập, trang công khai. */
export function BrandMark({ className, light, onDark }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          'flex size-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm',
          light
            ? 'bg-white/15 text-white ring-1 ring-white/25'
            : 'from-primary to-accent shadow-glow bg-gradient-to-br text-white',
        )}
      >
        H
      </span>
      <span
        className={cn(
          'text-lg font-semibold tracking-tight',
          light || onDark ? 'text-white' : 'text-slate-900',
        )}
      >
        Hire
        <span className={light ? 'text-indigo-200' : onDark ? 'text-indigo-300' : 'text-primary'}>
          Flow
        </span>
      </span>
    </span>
  )
}
