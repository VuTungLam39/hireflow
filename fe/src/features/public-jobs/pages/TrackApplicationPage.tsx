import { CircleX } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared'
import { AlertDialog, Button, buttonVariants, Spinner } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { cn, formatDate } from '@/lib/utils'
import { SITE_NAME } from '@/prerender/shared'
import { links, paths } from '@/routes/paths'
import { useApplicationTrack, useWithdrawApplication } from '../hooks/use-public-jobs'
import type { TrackStage } from '../types'

// KH MVP 3 mục 9.4
const STAGE_TEXT: Record<TrackStage, { label: string; hint: string }> = {
  RECEIVED: { label: 'Đã nhận hồ sơ', hint: 'Công ty đã nhận hồ sơ và sẽ xem xét sớm.' },
  REVIEWING: { label: 'Đang xem xét', hint: 'Công ty đang xem xét hồ sơ của bạn.' },
  INTERVIEW: {
    label: 'Mời phỏng vấn',
    hint: 'Công ty muốn phỏng vấn bạn và sẽ liên hệ trực tiếp để hẹn lịch.',
  },
  DECIDED: {
    label: 'Đã có kết quả',
    hint: 'Hồ sơ đã có kết quả, vui lòng chờ công ty liên hệ.',
  },
  WITHDRAWN: { label: 'Bạn đã rút hồ sơ', hint: 'Công ty sẽ không xét hồ sơ này nữa.' },
}

// MVP 3 · US-26, BR-APP-14
export default function TrackApplicationPage() {
  useDocumentTitle(`Theo dõi hồ sơ – ${SITE_NAME}`)
  const token = useSearchParams()[0].get('t') ?? ''
  const track = useApplicationTrack(token)
  const withdraw = useWithdrawApplication(token)
  const [confirming, setConfirming] = useState(false)

  if (token && track.isPending)
    return (
      <div role="status" className="text-ink-2 flex items-center justify-center gap-3 py-16">
        <Spinner />
        Đang tải trạng thái hồ sơ…
      </div>
    )

  if (track.isError && getErrorCode(track.error) !== 'TOKEN_INVALID')
    return <ErrorState error={track.error} onRetry={() => track.refetch()} />

  // Không nói rõ lý do (sai, hết hạn hay hồ sơ đã bị xoá)
  if (!track.data)
    return (
      <div className="mx-auto max-w-[480px]">
        <CircleX aria-hidden className="text-bad mb-4 size-8" />
        <h1 className="type-title">Link không còn hiệu lực</h1>
        <p className="type-body text-ink-2 mt-2">
          Link theo dõi hết hạn sau 90 ngày kể từ ngày nộp. Nếu cần hỏi về hồ sơ, hãy liên hệ trực
          tiếp công ty bạn đã ứng tuyển.
        </p>
        <Link
          to={paths.publicJobs}
          className={cn(buttonVariants({ variant: 'secondary' }), 'mt-8')}
        >
          Xem vị trí đang tuyển
        </Link>
      </div>
    )

  const { jobTitle, companyName, companySlug, appliedAt, stage, withdrawable } = track.data
  const text = STAGE_TEXT[stage]
  return (
    <div className="mx-auto max-w-[560px] space-y-6">
      <header className="space-y-1">
        <p className="type-caption">Theo dõi hồ sơ</p>
        <h1 className="type-title">{jobTitle}</h1>
        <p className="type-body text-ink-2">
          <Link to={links.publicCompany(companySlug)} className="text-brand underline">
            {companyName}
          </Link>{' '}
          · Nộp ngày {formatDate(appliedAt)}
        </p>
      </header>

      <section aria-labelledby="track-stage" className="border-line rounded-md border p-5">
        <h2 id="track-stage" className="type-heading">
          {text.label}
        </h2>
        <p className="type-body text-ink-2 mt-1">{text.hint}</p>
      </section>

      {withdrawable && (
        <div className="space-y-2">
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Rút hồ sơ
          </Button>
          <p className="type-caption">Rút xong thì không hoàn tác được qua link này.</p>
        </div>
      )}

      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Rút hồ sơ?"
        description={`Công ty sẽ không xét hồ sơ của bạn cho vị trí "${jobTitle}" nữa.`}
        confirmLabel="Rút hồ sơ"
        confirmVariant="danger"
        loading={withdraw.isPending}
        onConfirm={() =>
          withdraw.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false)
              toast.success('Đã rút hồ sơ')
            },
            onError: (error) => {
              setConfirming(false)
              toast.error(getErrorMessage(error))
              track.refetch()
            },
          })
        }
      />
    </div>
  )
}
