import * as RD from '@radix-ui/react-dialog'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonVariants } from './button-variants'
import { dialogTitleClass, overlayClass, useReturnFocus } from './Dialog'
import { IconButton } from './IconButton'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** bắt buộc – nơi duy nhất để thao tác đổi trạng thái */
  detailHref: string
  /** nhãn do nơi gọi truyền theo GLOSSARY (vd. hồ sơ / ứng viên / tin) */
  prev?: { label: string; onSelect: () => void }
  next?: { label: string; onSelect: () => void }
  /** DL-16: chỉ nội dung xem – không đặt nút đổi trạng thái/từ chối/Offer/xoá ở đây */
  children: ReactNode
}

// Quick view – DL-16: không có hành động đổi trạng thái
export function Sheet({ open, onOpenChange, title, detailHref, prev, next, children }: SheetProps) {
  const focus = useReturnFocus()
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className={overlayClass} />
        <RD.Content
          aria-describedby={undefined}
          {...focus}
          className="bg-surface text-ink-2 shadow-float animate-slide-in-right min-[600px]:border-line fixed inset-0 z-50 flex flex-col focus:outline-none min-[600px]:left-auto min-[600px]:w-[480px] min-[600px]:border-l"
        >
          <div className="border-line-soft flex items-center gap-2 border-b px-5 py-3">
            <RD.Title className={`${dialogTitleClass} min-w-0 flex-1 truncate text-lg`}>
              {title}
            </RD.Title>
            {prev && <IconButton label={prev.label} icon={<ChevronUp />} onClick={prev.onSelect} />}
            {next && (
              <IconButton label={next.label} icon={<ChevronDown />} onClick={next.onSelect} />
            )}
            <RD.Close
              aria-label="Đóng"
              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            >
              <X />
            </RD.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          <div className="border-line-soft border-t px-5 py-3">
            <Link to={detailHref} className={buttonVariants({ variant: 'primary' })}>
              Mở chi tiết
            </Link>
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
