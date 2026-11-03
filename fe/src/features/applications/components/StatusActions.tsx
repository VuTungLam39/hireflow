import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared'
import { Button } from '@/components/ui'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import {
  APPLICATION_STATUS,
  NEXT_STATUS,
  REASON_REQUIRED,
  REJECT_REASONS,
  REOPENABLE,
  type ApplicationStatus,
} from '../constants'
import { useChangeStatus, useReopen } from '../hooks/use-applications'

interface StatusActionsProps {
  applicationId: string
  status: ApplicationStatus
  className?: string
}

const label = (next: ApplicationStatus) =>
  next === 'HIRED'
    ? 'Duyệt nhận việc'
    : next === 'REJECTED'
      ? 'Từ chối hồ sơ'
      : next === 'WITHDRAWN'
        ? 'Ghi nhận ứng viên rút'
        : `Chuyển sang ${APPLICATION_STATUS[next].label}`

// BR-STS-01 → 05
export function StatusActions({ applicationId, status, className }: StatusActionsProps) {
  const canUpdate = usePermission(Permission.ApplicationUpdateStatus)
  const canApprove = usePermission(Permission.ApplicationApproveOffer)
  const changeStatus = useChangeStatus(applicationId)
  const [target, setTarget] = useState<ApplicationStatus | null>(null)

  const allowed = (next: ApplicationStatus) => {
    if (next === 'HIRED') return canApprove
    if (next === 'REJECTED' && status === 'OFFER') return canUpdate || canApprove
    return canUpdate
  }
  const options = NEXT_STATUS[status].filter(allowed)

  if (APPLICATION_STATUS[status].terminal) {
    return (
      <div className={cn('flex flex-wrap items-center gap-3', className)}>
        <p className="type-caption">Hồ sơ đã ở trạng thái kết thúc.</p>
        {canUpdate && REOPENABLE.includes(status) && <ReopenAction applicationId={applicationId} />}
      </div>
    )
  }
  if (!options.length) return null

  const forward = options.filter((s) => s !== 'REJECTED' && s !== 'WITHDRAWN')
  const needReason = !!target && REASON_REQUIRED.includes(target)

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {options.includes('WITHDRAWN') && (
          <Button variant="quiet" onClick={() => setTarget('WITHDRAWN')}>
            {label('WITHDRAWN')}
          </Button>
        )}
        {options.includes('REJECTED') && (
          <Button variant="danger-quiet" onClick={() => setTarget('REJECTED')}>
            {label('REJECTED')}
          </Button>
        )}
        {forward.map((next) => (
          <Button key={next} onClick={() => setTarget(next)}>
            {next === 'HIRED' && <Check />}
            {label(next)}
            {next !== 'HIRED' && <ArrowRight />}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        title={target ? `${label(target)}?` : ''}
        description={
          target && APPLICATION_STATUS[target].terminal
            ? 'Đây là trạng thái kết thúc. Muốn xét lại sau này, bạn có thể mở lại hồ sơ.'
            : target
              ? `Hồ sơ sẽ chuyển sang “${APPLICATION_STATUS[target].label}” và được ghi vào lịch sử.`
              : undefined
        }
        confirmLabel={target ? label(target) : 'Xác nhận'}
        tone={target === 'REJECTED' ? 'danger' : 'primary'}
        requireReason={
          needReason
            ? {
                label: 'Lý do',
                placeholder: 'Ví dụ: chưa đủ kinh nghiệm NestJS',
                suggestions: REJECT_REASONS,
              }
            : undefined
        }
        loading={changeStatus.isPending}
        onConfirm={(reason) => {
          if (!target) return
          const declineOffer = target === 'REJECTED' && status === 'OFFER' && !canUpdate
          changeStatus.mutate({ status: target, reason, declineOffer })
          setTarget(null)
        }}
      />
    </>
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
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Mở lại hồ sơ?"
        description={`Hồ sơ chuyển về “${APPLICATION_STATUS.SCREENING.label}”, giữ nguyên mức phù hợp và lịch sử.`}
        confirmLabel="Mở lại"
        requireReason={{
          label: 'Lý do',
          placeholder: 'Ví dụ: ứng viên liên hệ lại, muốn xét tiếp',
        }}
        loading={reopen.isPending}
        onConfirm={(reason) => reopen.mutate(reason ?? '', { onSuccess: () => setOpen(false) })}
      />
    </>
  )
}
