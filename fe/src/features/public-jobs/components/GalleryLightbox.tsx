import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { mediaSrc, type CompanyMedia } from '@/features/company'
import { cn } from '@/lib/utils'

// F-PUB-06 · E3: lightbox thư viện ảnh, điều khiển được bằng bàn phím
export function GalleryLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: CompanyMedia[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = index !== null
  const image = open ? images[index] : undefined
  const count = images.length

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const go = (step: number) => index !== null && onIndexChange((index + step + count) % count)

  return (
    <dialog
      ref={ref}
      aria-label="Thư viện ảnh"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (count < 2) return
        if (e.key === 'ArrowRight') go(1)
        else if (e.key === 'ArrowLeft') go(-1)
        else return
        e.preventDefault()
      }}
      className="backdrop:bg-ink/80 m-auto max-h-none w-full max-w-none bg-transparent p-0"
    >
      {image && (
        <figure className="mx-auto flex max-h-dvh w-full max-w-[1100px] flex-col gap-3 p-4 sm:p-8">
          <div className="flex items-center justify-between gap-4 text-white">
            <span className="text-sm tabular-nums" aria-live="polite">
              Ảnh {index! + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="-m-1.5 rounded-sm p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 items-center justify-center">
            <img
              src={mediaSrc(image)}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="max-h-[calc(100dvh-10rem)] w-auto max-w-full rounded-sm object-contain"
            />
            {count > 1 && (
              <>
                <NavButton side="left" onClick={() => go(-1)} />
                <NavButton side="right" onClick={() => go(1)} />
              </>
            )}
          </div>
          <figcaption className="text-center text-sm text-white/85">{image.alt}</figcaption>
        </figure>
      )}
    </dialog>
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Ảnh trước' : 'Ảnh sau'}
      onClick={onClick}
      className={cn(
        'bg-ink/60 hover:bg-ink/80 absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors',
        side === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}
