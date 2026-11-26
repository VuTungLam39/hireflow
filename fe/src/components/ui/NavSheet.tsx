import * as RD from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button-variants'
import { overlayClass, useReturnFocus } from './Dialog'

interface NavSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

// P5-D06: điều hướng chính khi Rail compact (<600 px); khác Sheet quick view (DL-16)
export function NavSheet({ open, onOpenChange, title, children }: NavSheetProps) {
  const focus = useReturnFocus()
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className={`${overlayClass} animate-overlay-sheet`} />
        <RD.Content
          aria-describedby={undefined}
          {...focus}
          className="bg-rail shadow-float animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col focus:outline-none"
        >
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <RD.Title className="text-rail-text text-sm font-semibold">{title}</RD.Title>
            <RD.Close
              aria-label="Đóng menu"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'text-rail-muted hover:bg-rail-hover hover:text-white',
              )}
            >
              <X />
            </RD.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
