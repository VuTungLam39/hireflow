import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
  /** Chỉ cho nút xác nhận trong hộp thoại xoá/từ chối (Design system 10.7) */
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  /** Hành động tiêu cực ngoài hộp thoại: Từ chối, Đóng tin, Xoá trong trang */
  'danger-outline':
    'bg-white text-red-600 border border-red-200 shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
} as const

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-11 px-6 text-base rounded-lg',
} as const

export type ButtonStyle = { variant?: keyof typeof variants; size?: keyof typeof sizes }

/** Class của Button – dùng cho <Link> trông như nút (không lồng <button> trong <a>) */
export function buttonVariants({ variant = 'primary', size = 'md' }: ButtonStyle = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap',
    'transition-all duration-150 active:scale-[0.98]',
    'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    variants[variant],
    sizes[size],
  )
}
