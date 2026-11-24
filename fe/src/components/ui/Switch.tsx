import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<ComponentProps<'input'>, 'type' | 'role'> {
  label: ReactNode
}

/** Chỉ cho cài đặt áp dụng ngay – không dùng trong form cần bấm Lưu */
export function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <label className={cn('inline-flex min-h-6 cursor-pointer items-center gap-2.5', className)}>
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="bg-ui-border-strong peer-checked:bg-ui-primary peer-focus-visible:outline-ui-focus peer-disabled:bg-ui-sunken relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform after:duration-150 peer-checked:after:translate-x-4"
      />
      <span className="text-ui-fg-2">{label}</span>
    </label>
  )
}
