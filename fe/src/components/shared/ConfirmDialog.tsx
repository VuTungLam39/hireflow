import { useState } from 'react'
import { Button, Dialog, FormField, Textarea } from '@/components/ui'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  /** Bắt buộc nhập lý do (ví dụ chuyển sang REJECTED) */
  requireReason?: { label: string; placeholder?: string }
  onConfirm: (reason?: string) => void
}

/** Hộp xác nhận dùng chung thay cho window.confirm; có biến thể bắt nhập lý do */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Xác nhận',
  tone = 'primary',
  loading,
  requireReason,
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
        {description && <p className="text-sm text-slate-600">{description}</p>}
        {requireReason && (
          <FormField
            label={requireReason.label}
            htmlFor="confirm-reason"
            error={touched && reasonMissing ? 'Vui lòng nhập lý do' : undefined}
          >
            <Textarea
              id="confirm-reason"
              placeholder={requireReason.placeholder}
              invalid={touched && reasonMissing}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button variant={tone} loading={loading} onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
