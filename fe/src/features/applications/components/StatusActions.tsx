import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { AlertDialog, Button, FormField, Select } from '@/components/ui'
import { usePermission } from '@/hooks/use-permission'
import { getErrorCode } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import {
  APPLICATION_STATUS,
  NEXT_STATUS,
  REASON_REQUIRED,
  REJECT_REASON_INPUT,
  type RejectReasonCode,
  REOPENABLE,
  type ApplicationStatus,
} from '../constants'
import { useChangeStatus, useReopen } from '../hooks/use-applications'

interface StatusActionsProps {
  applicationId: string
  candidateName: string
  status: ApplicationStatus
  className?: string
  /** 403 khi lưu: vai không có quyền với hồ sơ trong phạm vi (ADR-0002) */
  onDenied?: () => void
}

const optionLabel = (next: ApplicationStatus) =>
  next === 'WITHDRAWN' ? 'Ứng viên rút hồ sơ' : APPLICATION_STATUS[next].label

// BR-STS-01 → 05 · P1 · P5-D11a: một nút mở hộp quyết định, không chọn sẵn (VF-01)
export function StatusActions({
  applicationId,
  candidateName,
  status,
  className,
  onDenied,
}: StatusActionsProps) {
  const canUpdate = usePermission(Permission.ApplicationUpdateStatus)
  const changeStatus = useChangeStatus(applicationId)
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<ApplicationStatus | ''>('')
  const [missing, setMissing] = useState(false)
  // MVP 3.1 · BR-STS-05: OFFER, HIRED đi qua khối Offer
  const options = NEXT_STATUS[status].filter((s) => s !== 'OFFER' && s !== 'HIRED')

  if (APPLICATION_STATUS[status].terminal) {
    return (
      <div className={cn('flex flex-wrap items-center gap-3', className)}>
        <p className="type-caption">Hồ sơ đã ở trạng thái kết thúc.</p>
        {canUpdate && REOPENABLE.includes(status) && <ReopenAction applicationId={applicationId} />}
      </div>
    )
  }
  if (!canUpdate || !options.length) return null

  const reject = target === 'REJECTED'
  const close = () => {
    setOpen(false)
    setTarget('')
    setMissing(false)
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Button className="max-lg:flex-1" onClick={() => setOpen(true)}>
        Chuyển trạng thái
      </Button>
      <AlertDialog
        open={open}
        onClose={close}
        title="Chuyển trạng thái hồ sơ"
        description={`${candidateName} · hiện tại: ${APPLICATION_STATUS[status].label}`}
        // VF-02: nhãn và kiểu nút theo trạng thái đã chọn
        confirmLabel={reject ? 'Xác nhận từ chối' : 'Xác nhận'}
        confirmVariant={reject ? 'danger' : 'primary'}
        requireReason={target && REASON_REQUIRED.includes(target) ? REJECT_REASON_INPUT : undefined}
        onConfirm={(reason, code) => {
          if (!target) {
            setMissing(true)
            return
          }
          return changeStatus
            .mutateAsync({ status: target, reason, reasonCode: code as RejectReasonCode })
            .then(close)
            .catch((error: unknown) => {
              if (getErrorCode(error) !== 'FORBIDDEN') throw error
              close()
              onDenied?.()
            })
        }}
      >
        <FormField
          label="Trạng thái mới"
          htmlFor="decision-status"
          error={missing && !target ? 'Chọn trạng thái mới.' : undefined}
          hint={status === 'INTERVIEW' ? 'Offer chỉ tạo trong mục Offer của hồ sơ.' : undefined}
        >
          <Select
            id="decision-status"
            className="w-full"
            value={target}
            aria-invalid={missing && !target}
            onChange={(e) => setTarget(e.target.value as ApplicationStatus | '')}
          >
            <option value="">— Chọn trạng thái —</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {optionLabel(s)}
              </option>
            ))}
          </Select>
        </FormField>
      </AlertDialog>
    </div>
  )
}

// F-APP-10, BR-APP-05
function ReopenAction({ applicationId }: { applicationId: string }) {
  const reopen = useReopen(applicationId)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <RotateCcw />
        Mở lại hồ sơ
      </Button>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Mở lại hồ sơ?"
        description={`Hồ sơ chuyển về “${APPLICATION_STATUS.SCREENING.label}”, giữ nguyên mức phù hợp và lịch sử.`}
        confirmLabel="Mở lại"
        requireReason={{
          label: 'Lý do',
          placeholder: 'Ví dụ: ứng viên liên hệ lại, muốn xét tiếp',
        }}
        onConfirm={(reason) => reopen.mutateAsync(reason ?? '')}
      />
    </>
  )
}
