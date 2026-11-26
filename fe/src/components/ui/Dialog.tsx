import * as RD from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const widths = {
  sm: 'min-[600px]:max-w-[480px]',
  md: 'min-[600px]:max-w-[480px]',
  lg: 'min-[600px]:max-w-[640px]',
} as const

/** Radix chỉ trả focus về <Trigger> của nó; call site mở bằng nút ngoài → tự nhớ phần tử đang focus */
export function useReturnFocus() {
  const returnTo = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: () => {
      returnTo.current = document.activeElement as HTMLElement | null
    },
    onCloseAutoFocus: (e: Event) => {
      e.preventDefault()
      returnTo.current?.focus()
    },
  }
}

export const overlayClass = 'bg-ink/40 fixed inset-0 z-50'

// <600 px: toàn màn hình (contract Dialog)
export const dialogPanelClass =
  'border-line bg-surface text-ink-2 shadow-float animate-float-in fixed inset-0 z-50 overflow-y-auto p-5 focus:outline-none min-[600px]:inset-auto min-[600px]:top-1/2 min-[600px]:left-1/2 min-[600px]:max-h-[calc(100dvh-2rem)] min-[600px]:w-[calc(100%-2rem)] min-[600px]:-translate-x-1/2 min-[600px]:-translate-y-1/2 min-[600px]:rounded-md min-[600px]:border min-[600px]:p-6'

export const dialogTitleClass =
  'text-ink font-display text-xl leading-7 font-semibold tracking-[-0.01em]'

export function Dialog({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
}: DialogProps) {
  const focus = useReturnFocus()
  return (
    <RD.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange?.(o)
        if (!o) onClose?.()
      }}
    >
      <RD.Portal>
        <RD.Overlay className={`${overlayClass} animate-overlay-in`} />
        <RD.Content
          {...focus}
          className={cn(dialogPanelClass, widths[size])}
          {...(!description && { 'aria-describedby': undefined })}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <RD.Title className={dialogTitleClass}>{title}</RD.Title>
              {description && (
                <RD.Description asChild>
                  <div className="type-caption mt-1">{description}</div>
                </RD.Description>
              )}
            </div>
            <RD.Close
              aria-label="Đóng"
              className="text-ink-muted hover:bg-sunken hover:text-ink -m-1.5 rounded-sm p-1.5 transition-colors"
            >
              <X className="size-[18px]" />
            </RD.Close>
          </div>
          {children}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-surface border-line-soft sticky bottom-0 -mx-5 mt-6 -mb-5 flex flex-wrap justify-end gap-2 border-t px-5 py-4 min-[600px]:-mx-6 min-[600px]:-mb-6 min-[600px]:px-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
