import { useState, type ReactNode } from 'react'
import { Button, Dialog, DialogFooter, FormField, Textarea, chipClass } from '@/components/ui'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  requireReason?: { label: string; placeholder?: string; suggestions?: readonly string[] }
  children?: ReactNode
  onConfirm: (reason?: string) => void
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  tone = 'primary',
  loading,
  requireReason,
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const reasonMissing = !!requireReason && !reason.trim()

  const close = () => {
    setReason('')
    setTouched(false)
    onClose()
  }

  const confirm = () => {
    setTouched(true)
    if (reasonMissing) return
    onConfirm(requireReason ? reason.trim() : undefined)
  }

  return (
    <Dialog open={open} onClose={close} title={title}>
      <div className="space-y-4">
        {description && <div className="text-ink-2">{description}</div>}
        {children}
        {requireReason && (
          <FormField
            label={requireReason.label}
            htmlFor="confirm-reason"
            error={touched && reasonMissing ? 'Nhập lý do để tiếp tục' : undefined}
          >
            {requireReason.suggestions && requireReason.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {requireReason.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={chipClass(reason === s)}
                    onClick={() => setReason(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              id="confirm-reason"
              placeholder={requireReason.placeholder}
              invalid={touched && reasonMissing}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
        )}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={close}>
          {cancelLabel}
        </Button>
        <Button variant={tone} loading={loading} onClick={confirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
