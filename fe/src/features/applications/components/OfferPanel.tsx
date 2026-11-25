import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  Button,
  Dialog,
  DialogFooter,
  FormField,
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import { useApplicationInterviews } from '@/features/interviews'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { formatDate, formatDateTime } from '@/lib/utils'
import { OFFER_STATUS } from '../constants'
import { useOfferAction, useOffers, useSaveOffer } from '../hooks/use-offers'
import type { ApplicationStatus } from '../constants'
import type { Offer, OfferInput } from '../types'
import { OfferStatusBadge } from './StatusBadges'

const formatMoney = (o: Pick<Offer, 'salaryAmount' | 'salaryCurrency' | 'salaryPeriod'>) =>
  `${o.salaryAmount.toLocaleString('vi-VN')} ${o.salaryCurrency}/${o.salaryPeriod === 'MONTH' ? 'tháng' : 'năm'}`

const FIELD_ID = {
  salaryAmount: 'of-amount',
  respondBy: 'of-respond',
  startDate: 'of-start',
} as const

const todayIso = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)

// MVP 3.1 · F-OFFER-01, BR-OFFER-01 → 05: Interviewer không thấy panel (BR-OFFER-04)
// Slice 11 · Phase 03 file 08 (Offer Summary)
export function OfferPanel({
  applicationId,
  status,
}: {
  applicationId: string
  status: ApplicationStatus
}) {
  const canUpdate = usePermission(Permission.ApplicationUpdateStatus)
  const offers = useOffers(applicationId)
  const act = useOfferAction()
  const [editing, setEditing] = useState<Offer | 'new' | null>(null)
  const [reasonFor, setReasonFor] = useState<'return' | 'withdraw' | 'decline' | null>(null)
  const [letter, setLetter] = useState(false)

  const list = offers.data ?? []
  const current = list[0]
  const open = current && !OFFER_STATUS[current.status].closed ? current : undefined
  if (!list.length && !(status === 'INTERVIEW' && canUpdate)) return null

  const run = (action: string, body?: object) => open && act.mutate({ id: open.id, action, body })

  return (
    <section aria-labelledby="offer-title" className="border-line space-y-4 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="offer-title" className="type-heading">
            Offer
          </h2>
          {current && <OfferStatusBadge status={current.status} />}
        </div>
        {!open && status === 'INTERVIEW' && canUpdate && (
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus />
            Soạn Offer
          </Button>
        )}
      </div>

      {current && (
        <>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="type-caption">Mức lương</dt>
              <dd className="text-ink num font-semibold">{formatMoney(current)}</dd>
            </div>
            <div>
              <dt className="type-caption">Ngày bắt đầu</dt>
              <dd className="text-ink-2 num">{formatDate(current.startDate)}</dd>
            </div>
            <div>
              <dt className="type-caption">Hạn trả lời</dt>
              <dd className="text-ink-2 num">{formatDate(current.respondBy)}</dd>
            </div>
          </dl>
          {current.note && <p className="text-ink-2 text-sm whitespace-pre-line">{current.note}</p>}
          {current.statusReason && (
            <p className="text-ink-2 text-sm">Lý do: {current.statusReason}</p>
          )}
          <ApprovalTrail offer={current} />
          {current.status === 'PENDING_APPROVAL' && !current.canApprove && (
            <p className="type-caption">
              Đang chờ Hiring Manager phụ trách tin (hoặc Admin) duyệt.
            </p>
          )}
        </>
      )}

      {open && (
        <div className="flex flex-wrap gap-2">
          {open.status === 'DRAFT' && canUpdate && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(open)}>
                Sửa
              </Button>
              <Button size="sm" loading={act.isPending} onClick={() => run('submit')}>
                Gửi duyệt
              </Button>
            </>
          )}
          {/* BR-OFFER-03 */}
          {open.canApprove && (
            <>
              <Button size="sm" loading={act.isPending} onClick={() => run('approve')}>
                Duyệt Offer
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setReasonFor('return')}>
                Trả lại để sửa
              </Button>
            </>
          )}
          {open.status === 'APPROVED' && canUpdate && (
            <Button size="sm" loading={act.isPending} onClick={() => run('send')}>
              Đánh dấu đã gửi
            </Button>
          )}
          {open.status === 'SENT' && canUpdate && (
            <>
              <Button size="sm" loading={act.isPending} onClick={() => run('accept')}>
                Ứng viên nhận
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReasonFor('decline')}>
                Ứng viên từ chối
              </Button>
            </>
          )}
          {['APPROVED', 'SENT'].includes(open.status) && (
            <Button size="sm" variant="ghost" onClick={() => setLetter(true)}>
              <FileText />
              Xem thư Offer
            </Button>
          )}
          {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(open.status) && canUpdate && (
            <Button size="sm" variant="ghost" onClick={() => setReasonFor('withdraw')}>
              Rút Offer
            </Button>
          )}
        </div>
      )}

      {editing && (
        <OfferDialog
          applicationId={applicationId}
          offer={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <AlertDialog
        open={!!reasonFor}
        onClose={() => setReasonFor(null)}
        title={
          reasonFor === 'return'
            ? 'Trả lại Offer để sửa?'
            : reasonFor === 'withdraw'
              ? 'Rút Offer?'
              : 'Ghi nhận ứng viên từ chối Offer?'
        }
        description={
          reasonFor === 'decline'
            ? 'Hồ sơ chuyển sang "Từ chối" với lý do "Ứng viên từ chối". Không hoàn tác được.'
            : reasonFor === 'withdraw'
              ? 'Offer bị đóng; muốn tiếp tục phải soạn Offer mới.'
              : undefined
        }
        confirmLabel={
          reasonFor === 'return'
            ? 'Trả lại'
            : reasonFor === 'withdraw'
              ? 'Rút Offer'
              : 'Ghi nhận từ chối'
        }
        confirmVariant={reasonFor === 'return' ? 'primary' : 'danger'}
        requireReason={
          reasonFor === 'decline'
            ? undefined
            : { label: 'Lý do', placeholder: 'Ví dụ: lương vượt khung phòng ban' }
        }
        onConfirm={(reason) =>
          open &&
          act.mutateAsync({ id: open.id, action: reasonFor!, body: reason ? { reason } : {} })
        }
      />
      {letter && open && <OfferLetter offer={open} onClose={() => setLetter(false)} />}
    </section>
  )
}

// Phase 03 file 08
function ApprovalTrail({ offer }: { offer: Offer }) {
  const steps = [
    { label: `Soạn bởi ${offer.createdBy.fullName}`, at: offer.createdAt },
    offer.approvedBy && offer.approvedAt
      ? { label: `Duyệt bởi ${offer.approvedBy.fullName}`, at: offer.approvedAt }
      : null,
    offer.sentAt ? { label: 'Đã gửi ứng viên', at: offer.sentAt } : null,
    offer.decidedAt ? { label: OFFER_STATUS[offer.status].label, at: offer.decidedAt } : null,
  ].filter((s): s is { label: string; at: string } => !!s)
  return (
    <ol aria-label="Lịch sử duyệt Offer" className="border-line-soft space-y-1 border-l pl-3">
      {steps.map((s) => (
        <li key={s.label + s.at} className="type-caption">
          {s.label} · <span className="num">{formatDateTime(s.at)}</span>
        </li>
      ))}
    </ol>
  )
}

function OfferDialog({
  applicationId,
  offer,
  onClose,
}: {
  applicationId: string
  offer?: Offer
  onClose: () => void
}) {
  const save = useSaveOffer(applicationId)
  const interviews = useApplicationInterviews(applicationId)
  const noFeedback = !!interviews.data && !interviews.data.some((iv) => iv.feedbacks.length)
  const [form, setForm] = useState<OfferInput>({
    salaryAmount: offer?.salaryAmount ?? 0,
    salaryCurrency: offer?.salaryCurrency ?? 'VND',
    salaryPeriod: offer?.salaryPeriod ?? 'MONTH',
    startDate: offer?.startDate ?? '',
    respondBy: offer?.respondBy ?? '',
    note: offer?.note ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof OfferInput | 'root', string>>>({})
  const set = <K extends keyof OfferInput>(k: K, v: OfferInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    const next: typeof errors = {}
    if (!(form.salaryAmount > 0)) next.salaryAmount = 'Nhập mức lương lớn hơn 0'
    if (!form.respondBy) next.respondBy = 'Chọn hạn trả lời'
    else if (form.respondBy < todayIso()) next.respondBy = 'Hạn trả lời phải từ hôm nay trở đi'
    if (!form.startDate) next.startDate = 'Chọn ngày bắt đầu'
    else if (form.respondBy && form.startDate < form.respondBy)
      next.startDate = 'Ngày bắt đầu không được trước hạn trả lời'
    setErrors(next)
    // P5
    const first = (['salaryAmount', 'respondBy', 'startDate'] as const).find((k) => next[k])
    if (first) {
      document.getElementById(FIELD_ID[first])?.focus()
      return
    }
    save.mutate(
      { id: offer?.id, input: { ...form, note: form.note?.trim() || undefined } },
      {
        onSuccess: onClose,
        onError: (error) => {
          const fields: typeof errors = {}
          applyServerErrors<OfferInput>(error, (name, e) => {
            fields[name as keyof OfferInput] = e.message
          })
          setErrors(Object.keys(fields).length ? fields : { root: getErrorMessage(error) })
        },
      },
    )
  }

  return (
    <Dialog open onClose={onClose} title={offer ? 'Sửa Offer nháp' : 'Soạn Offer'} size="lg">
      <div className="space-y-4">
        {/* Q1, BR-STS-01 */}
        {!offer && noFeedback && (
          <p role="note" className="bg-warn-soft text-warn rounded-xs px-3 py-2 text-[13px]">
            Hồ sơ chưa có phiếu đánh giá phỏng vấn nào.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <FormField label="Mức lương" htmlFor="of-amount" error={errors.salaryAmount}>
            <Input
              id="of-amount"
              type="number"
              min={1}
              inputMode="numeric"
              invalid={!!errors.salaryAmount}
              value={form.salaryAmount || ''}
              onChange={(e) => set('salaryAmount', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Tiền tệ" htmlFor="of-currency">
            <Select
              id="of-currency"
              value={form.salaryCurrency}
              onChange={(e) =>
                set('salaryCurrency', e.target.value as OfferInput['salaryCurrency'])
              }
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </Select>
          </FormField>
          <FormField label="Kỳ" htmlFor="of-period">
            <Select
              id="of-period"
              value={form.salaryPeriod}
              onChange={(e) => set('salaryPeriod', e.target.value as OfferInput['salaryPeriod'])}
            >
              <option value="MONTH">Tháng</option>
              <option value="YEAR">Năm</option>
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Hạn trả lời" htmlFor="of-respond" error={errors.respondBy}>
            <Input
              id="of-respond"
              type="date"
              invalid={!!errors.respondBy}
              value={form.respondBy}
              onChange={(e) => set('respondBy', e.target.value)}
            />
          </FormField>
          <FormField label="Ngày bắt đầu" htmlFor="of-start" error={errors.startDate}>
            <Input
              id="of-start"
              type="date"
              invalid={!!errors.startDate}
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Điều kiện kèm theo (tuỳ chọn)" htmlFor="of-note">
          <Textarea
            id="of-note"
            rows={3}
            maxLength={2000}
            value={form.note ?? ''}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Ví dụ: thử việc 2 tháng, 13 tháng lương"
          />
        </FormField>
        {errors.root && (
          <p role="alert" className="text-bad text-sm">
            {errors.root}
          </p>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Huỷ
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {offer ? 'Lưu' : 'Tạo Offer nháp'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}

// BR-OFFER-05: HR in thành PDF từ trình duyệt rồi tự gửi
function OfferLetter({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const { candidateName, jobTitle, companyName } = offer.letter
  return (
    <Dialog open onClose={onClose} title="Thư Offer" size="lg">
      <article className="type-read space-y-3 print:text-black">
        <p className="type-caption">Đây là bản demo HireFlow, không dùng cho tuyển dụng thật.</p>
        <p>Kính gửi {candidateName},</p>
        <p>
          {companyName} trân trọng mời bạn nhận vị trí <strong>{jobTitle}</strong> với mức lương{' '}
          <strong>{formatMoney(offer)}</strong>, bắt đầu từ ngày {formatDate(offer.startDate)}.
        </p>
        {offer.note && <p className="whitespace-pre-line">{offer.note}</p>}
        <p>Vui lòng phản hồi trước ngày {formatDate(offer.respondBy)}.</p>
        <p>
          Trân trọng,
          <br />
          {companyName}
        </p>
      </article>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        <Button onClick={() => window.print()}>In / lưu PDF</Button>
      </DialogFooter>
    </Dialog>
  )
}
