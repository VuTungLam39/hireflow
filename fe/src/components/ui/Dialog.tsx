import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Hộp thoại dùng thẻ <dialog> gốc của trình duyệt (có sẵn focus trap, phím Esc) */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
