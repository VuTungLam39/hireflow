import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ô chọn dùng thẻ <select> gốc (bàn phím, mobile picker sẵn có) nhưng bỏ mũi tên
 * mặc định của hệ điều hành để đồng bộ với theme. `className` áp cho khung ngoài
 * (độ rộng), mọi prop khác (kể cả `ref` của react-hook-form) đi vào <select>.
 */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-9 pl-3 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300',
          'focus:border-primary focus:ring-primary/20 focus:ring-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
      />
    </span>
  )
}
