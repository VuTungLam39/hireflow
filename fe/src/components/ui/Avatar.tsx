import { cn } from '@/lib/utils'

// Bảng màu dịu, đủ khác nhau để phân biệt người trong danh sách
const palette = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
] as const

const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-base' } as const

/** Chữ cái đầu của họ và tên: "Nguyễn Thu Hà" → "NH" */
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

/** Avatar chữ cái, màu cố định theo tên (cùng người luôn cùng màu) */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizes[size],
        colorOf(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
