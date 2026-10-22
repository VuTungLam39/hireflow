import { ArrowRight, BadgeCheck, X } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared'
import { Button } from '@/components/ui'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import {
  APPLICATION_STATUS,
  NEXT_STATUS,
  REASON_REQUIRED,
  type ApplicationStatus,
} from '../constants'
import { useChangeStatus } from '../hooks/use-applications'

interface StatusActionsProps {
  applicationId: string
  status: ApplicationStatus
}

/**
 * Chỉ hiện nút cho bước hợp lệ (NEXT_STATUS) và đúng quyền:
 * - OFFER → HIRED: application:approve-offer (Hiring Manager của phòng, Admin)
 * - OFFER → REJECTED: thêm cả application:approve-offer – Hiring Manager từ chối ở bước
 *   đề nghị qua route /decline-offer (BR-STS-05)
 * - Còn lại: application:update-status (HR, Admin)
 */
export function StatusActions({ applicationId, status }: StatusActionsProps) {
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
    return <p className="text-sm text-slate-500">Hồ sơ đã ở trạng thái kết thúc.</p>
  }
  if (!options.length) {
    return <p className="text-sm text-slate-500">Bạn không có quyền đổi trạng thái hồ sơ này.</p>
  }

  const needReason = !!target && REASON_REQUIRED.includes(target)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((next) => (
          <Button
            key={next}
            size="sm"
            variant={
              next === 'REJECTED'
                ? 'danger-outline'
                : next === 'WITHDRAWN'
                  ? 'secondary'
                  : 'primary'
            }
            onClick={() => setTarget(next)}
          >
            {next === 'HIRED' ? (
              <>
                <BadgeCheck />
                Duyệt nhận việc
              </>
            ) : next === 'REJECTED' ? (
              <>
                <X />
                Từ chối
              </>
            ) : next === 'WITHDRAWN' ? (
              'Ứng viên rút'
            ) : (
              <>
                {APPLICATION_STATUS[next].label}
                <ArrowRight />
              </>
            )}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        title={target ? `Chuyển sang "${APPLICATION_STATUS[target].label}"?` : ''}
        description={
          target && APPLICATION_STATUS[target].terminal
            ? 'Đây là trạng thái kết thúc, không thể quay lại.'
            : undefined
        }
        tone={target === 'REJECTED' ? 'danger' : 'primary'}
        requireReason={
          needReason
            ? { label: 'Lý do', placeholder: 'Ví dụ: chưa đủ kinh nghiệm NestJS' }
            : undefined
        }
        loading={changeStatus.isPending}
        onConfirm={(reason) => {
          if (!target) return
          // Không có quyền đổi trạng thái chung → đang từ chối ở bước OFFER bằng quyền duyệt offer
          const declineOffer = target === 'REJECTED' && status === 'OFFER' && !canUpdate
          changeStatus.mutate({ status: target, reason, declineOffer })
          setTarget(null)
        }}
      />
    </>
  )
}
