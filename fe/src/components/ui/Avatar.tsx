import { cn } from '@/lib/utils'

const palette = [
  'bg-earth-moss text-earth-moss-ink',
  'bg-earth-clay text-earth-clay-ink',
  'bg-earth-sand text-earth-sand-ink',
  'bg-earth-stone text-earth-stone-ink',
  'bg-earth-plum text-earth-plum-ink',
  'bg-earth-sea text-earth-sea-ink',
] as const

const sizes = {
  xs: 'size-6 text-xs',
  sm: 'size-7 text-xs',
  md: 'size-9 text-[13px]',
  lg: 'size-12 text-base',
} as const

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '')
  return (first + last).toUpperCase()
}

function colorOf(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return palette[Math.abs(hash) % palette.length]
}

interface AvatarProps {
  name: string
  size?: keyof typeof sizes
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.02em]',
        sizes[size],
        colorOf(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
