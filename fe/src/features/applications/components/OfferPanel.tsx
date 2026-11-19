import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared'
import { Button, Dialog, DialogFooter, FormField, Input, Select, Textarea } from '@/components/ui'
import { useApplicationInterviews } from '@/features/interviews'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { formatDate, formatDateTime } from '@/lib/utils'
import { OFFER_STATUS } from '../constants'
import { useOfferAction, useOffers, useSaveOffer } from '../hooks/use-offers'
import type { ApplicationStatus } from '../constants'
import type { Offer, OfferInput } from '../types'

const formatMoney = (o: Pick<Offer, 'salaryAmount' | 'salaryCurrency' | 'salaryPeriod'>) =>
  `${o.salaryAmount.toLocaleString('vi-VN')} ${o.salaryCurrency}/${o.salaryPeriod === 'MONTH' ? 'tháng' : 'năm'}`

const todayIso = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)

// MVP 3.1 · F-OFFER-01, BR-OFFER-01 → 05: Interviewer không thấy panel (BR-OFFER-04)
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

  const run = (action: string, body?: object) =>
    open && act.mutate({ id: open.id, action, body }, { onSuccess: () => setReasonFor(null) })

  return (
    <section aria-labelledby="offer-title" className="border-line space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="offer-title" className="type-heading">
          Offer
        </h2>
        {!open && status === 'INTERVIEW' && canUpdate && (
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus />
            Soạn offer
          </Button>
        )}
      </div>

      {current && (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-sunken text-ink rounded-full px-2 py-0.5 font-medium">
              {OFFER_STATUS[current.status].label}
            </span>
            <span className="text-ink num font-semibold">{formatMoney(current)}</span>
            <span className="text-ink-2">
              · bắt đầu {formatDate(current.startDate)} · trả lời trước{' '}
              {formatDate(current.respondBy)}
            </span>
          </p>
          {current.statusReason && (
            <p className="text-ink-2 text-sm">Lý do: {current.statusReason}</p>
          )}
          {current.approvedBy && (
            <p className="type-caption">
              Duyệt bởi {current.approvedBy.fullName} lúc {formatDateTime(current.approvedAt!)}
            </p>
          )}
          {current.status === 'PENDING_APPROVAL' && !current.canApprove && (
            <p className="type-caption">
              Đang chờ Hiring Manager phụ trách tin (hoặc Admin) duyệt.
            </p>
          )}
        </div>
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
          {open.canApprove && (
            <>
              <Button size="sm" loading={act.isPending} onClick={() => run('approve')}>
                Duyệt offer
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
              <Button size="sm" variant="danger-quiet" onClick={() => setReasonFor('decline')}>
                Ứng viên từ chối
              </Button>
            </>
          )}
          {['APPROVED', 'SENT'].includes(open.status) && (
            <Button size="sm" variant="quiet" onClick={() => setLetter(true)}>
              <FileText />
              Xem thư offer
            </Button>
          )}
          {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(open.status) && canUpdate && (
            <Button size="sm" variant="quiet" onClick={() => setReasonFor('withdraw')}>
              Rút offer
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
      <ConfirmDialog
        open={!!reasonFor}
        onClose={() => setReasonFor(null)}
        title={
          reasonFor === 'return'
            ? 'Trả lại offer để sửa?'
            : reasonFor === 'withdraw'
              ? 'Rút offer?'
              : 'Ghi nhận ứng viên từ chối offer?'
        }
        description={
          reasonFor === 'decline'
            ? 'Hồ sơ chuyển sang "Từ chối" với lý do "Ứng viên từ chối".'
            : undefined
        }
        tone={reasonFor === 'return' ? 'primary' : 'danger'}
        loading={act.isPending}
        requireReason={
          reasonFor === 'decline'
            ? undefined
            : { label: 'Lý do', placeholder: 'Ví dụ: lương vượt khung phòng ban' }
        }
        onConfirm={(reason) => run(reasonFor!, reason ? { reason } : {})}
      />
      {letter && open && <OfferLetter offer={open} onClose={() => setLetter(false)} />}
    </section>
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
    if (Object.keys(next).length) return
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
    <Dialog open onClose={onClose} title={offer ? 'Sửa offer nháp' : 'Soạn offer'} size="lg">
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
            {offer ? 'Lưu' : 'Tạo offer nháp'}
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
    <Dialog open onClose={onClose} title="Thư offer" size="lg">
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
