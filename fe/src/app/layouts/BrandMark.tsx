import { cn } from '@/lib/utils'

export const HF_MONOGRAM_PATH =
  'M5.5 8H11.5V9.5H10V15H15V9.5H13.5V8H26V12H24.6V10.4H18V15H23.5V17H18V22.5H19.5V24H13.5V22.5H15V17H10V22.5H11.5V24H5.5V22.5H7V9.5H5.5Z'

export const HF_MARKER_PATH = 'M4 19.6 27.5 18.6 28 23.4 4.4 24.6Z'

interface HfMonogramProps {
  className?: string
  title?: string
}

export function HfMonogram({ className, title }: HfMonogramProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn('size-8 shrink-0', className)}
    >
      <rect width="32" height="32" rx="7" className="fill-rail" />
      <path d={HF_MARKER_PATH} className="fill-marker-strong" />
      <path
        d={HF_MONOGRAM_PATH}
        className="fill-canvas stroke-rail"
        strokeWidth={0.6}
        paintOrder="stroke"
      />
    </svg>
  )
}

interface BrandMarkProps {
  className?: string
  onDark?: boolean
  light?: boolean
  size?: 'sm' | 'md' | 'lg'
  tagline?: boolean
  compact?: boolean
}

const sizes = {
  sm: { mark: 'size-7', word: 'text-[17px]' },
  md: { mark: 'size-8', word: 'text-lg' },
  lg: { mark: 'size-11', word: 'text-[26px]' },
} as const

export function BrandMark({
  className,
  onDark,
  light,
  size = 'md',
  tagline,
  compact,
}: BrandMarkProps) {
  const dark = onDark || light
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <HfMonogram className={sizes[size].mark} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-serif font-semibold tracking-[-0.015em]',
              sizes[size].word,
              dark ? 'text-rail-text' : 'text-ink',
            )}
          >
            HireFlow
          </span>
          {tagline && (
            <span
              className={cn(
                'mt-1 text-xs font-medium tracking-[0.06em] uppercase',
                dark ? 'text-rail-muted' : 'text-ink-muted',
              )}
            >
              Tuyển dụng có căn cứ
            </span>
          )}
        </span>
      )}
    </span>
  )
}
