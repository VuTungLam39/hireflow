import { mediaSrc } from '@/features/company'
import { cn } from '@/lib/utils'

const SIZE = { sm: 'size-10 text-sm', md: 'size-12 text-base', lg: 'size-16 text-xl' } as const

// MVP 3 · US-22: logo trên thẻ tin, thẻ công ty; chưa có logo thì hiện chữ cái đầu
export function CompanyLogo({
  name,
  logoUrl,
  size = 'sm',
  className,
}: {
  name: string
  logoUrl: string | null
  size?: keyof typeof SIZE
  className?: string
}) {
  const box = cn('border-line bg-surface shrink-0 rounded-sm border', SIZE[size], className)
  if (logoUrl)
    return (
      <img
        src={mediaSrc({ url: logoUrl })}
        alt=""
        loading="lazy"
        width={64}
        height={64}
        className={cn(box, 'object-contain')}
      />
    )
  return (
    <span
      aria-hidden
      className={cn(box, 'text-ink-2 flex items-center justify-center font-semibold')}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
