import * as RA from '@radix-ui/react-alert-dialog'
import { useState, type ReactNode } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import {
  DialogFooter,
  dialogPanelClass,
  dialogTitleClass,
  overlayClass,
  useReturnFocus,
} from './Dialog'
import { chipClass } from './field-styles'
import { FormField } from './FormField'
import { Textarea } from './Textarea'

export interface AlertDialogProps {
  open: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  /** loading do nơi gọi điều khiển; khi onConfirm trả promise thì tự quản */
  loading?: boolean
  requireReason?: {
    label: string
    placeholder?: string
    suggestions?: readonly string[]
    /** Chọn một mã bằng chip (không chọn sẵn – VF-01); ô chữ chỉ bắt buộc với mã textRequiredFor */
    codes?: readonly { value: string; label: string }[]
    textRequiredFor?: string
  }
  children?: ReactNode
  onConfirm: (reason?: string, code?: string) => unknown
}

export function AlertDialog({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  confirmVariant = 'primary',
  loading,
  requireReason,
  children,
  onConfirm,
}: AlertDialogProps) {
  const [reason, setReason] = useState('')
  const [code, setCode] = useState<string>()
  const [touched, setTouched] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const codes = requireReason?.codes
  const codeMissing = !!codes && !code
  const reasonMissing =
    !!requireReason && !reason.trim() && (!codes || code === requireReason.textRequiredFor)
  const busy = loading || pending
  const focus = useReturnFocus()

  const close = () => {
    if (busy) return
    setReason('')
    setCode(undefined)
    setTouched(false)
    setError(undefined)
    onOpenChange?.(false)
    onClose?.()
  }

  const confirm = async () => {
    setTouched(true)
    if (codeMissing || reasonMissing) return
    const result = onConfirm(requireReason ? reason.trim() || undefined : undefined, code)
    if (!(result instanceof Promise)) return
    setPending(true)
    setError(undefined)
    try {
      await result
      setPending(false)
      close()
    } catch (e) {
      // OP-1: giữ nội dung đã nhập, nút "Thử lại" rõ ràng
      setPending(false)
      setError(getErrorMessage(e, 'Chưa lưu được thay đổi'))
    }
  }

  return (
    <RA.Root open={open} onOpenChange={(o) => !o && close()}>
      <RA.Portal>
        <RA.Overlay className={overlayClass} />
        <RA.Content
          onCloseAutoFocus={focus.onCloseAutoFocus}
          onOpenAutoFocus={focus.onOpenAutoFocus}
          className={cn(dialogPanelClass, 'min-[600px]:max-w-[480px]')}
          {...(!description && { 'aria-describedby': undefined })}
        >
          <RA.Title className={cn(dialogTitleClass, 'mb-4')}>{title}</RA.Title>
          <div className="space-y-4">
            {description && (
              <RA.Description asChild>
                <div className="text-ink-2">{description}</div>
              </RA.Description>
            )}
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
                  <p role="alert" className="text-ui-danger text-[13px]">
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
                  aria-describedby={touched && reasonMissing ? 'confirm-reason-error' : undefined}
                />
              </FormField>
            )}
            {error && (
              <p role="alert" className="text-ui-danger text-[13px] leading-5">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            {/* phần tử đầu tiên = hành động ít phá huỷ nhất → Radix focus vào đây */}
            <RA.Cancel asChild>
              <Button variant="secondary" disabled={busy}>
                {cancelLabel}
              </Button>
            </RA.Cancel>
            <Button variant={confirmVariant} loading={busy} onClick={() => void confirm()}>
              {error ? 'Thử lại' : confirmLabel}
            </Button>
          </DialogFooter>
        </RA.Content>
      </RA.Portal>
    </RA.Root>
  )
}
