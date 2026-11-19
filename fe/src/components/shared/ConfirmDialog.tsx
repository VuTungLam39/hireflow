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
  requireReason?: {
    label: string
    placeholder?: string
    suggestions?: readonly string[]
    /** Chọn một mã bằng chip; khi có codes, ô chữ chỉ bắt buộc với mã textRequiredFor */
    codes?: readonly { value: string; label: string }[]
    textRequiredFor?: string
  }
  children?: ReactNode
  onConfirm: (reason?: string, code?: string) => void
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
  const [code, setCode] = useState<string>()
  const [touched, setTouched] = useState(false)
  const codes = requireReason?.codes
  const codeMissing = !!codes && !code
  const reasonMissing =
    !!requireReason && !reason.trim() && (!codes || code === requireReason.textRequiredFor)

  const close = () => {
    setReason('')
    setCode(undefined)
    setTouched(false)
    onClose()
  }

  const confirm = () => {
    setTouched(true)
    if (codeMissing || reasonMissing) return
    onConfirm(requireReason ? reason.trim() || undefined : undefined, code)
  }

  return (
    <Dialog open={open} onClose={close} title={title}>
      <div className="space-y-4">
        {description && <div className="text-ink-2">{description}</div>}
        {children}
        {codes && (
          <fieldset className="space-y-1.5">
            <legend className="type-label">Lý do từ chối</legend>
            <div className="flex flex-wrap gap-1.5">
              {codes.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={code === c.value}
                  className={chipClass(code === c.value)}
                  onClick={() => setCode(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {touched && codeMissing && (
              <p role="alert" className="text-bad text-[13px]">
                Chọn một lý do để tiếp tục
              </p>
            )}
          </fieldset>
        )}
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
              maxLength={1000}
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
