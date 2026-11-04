import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import { Can, ConfirmDialog, ErrorState, PageHeader, Summary, Timeline } from '@/components/shared'
import { Button, FormField, Input, Skeleton } from '@/components/ui'
import { APPLICATION_SOURCE, ScoreBadge, StatusPill } from '@/features/applications'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { useAnonymizeCandidate, useCandidate, useUpdateCandidate } from '../hooks/use-candidates'
import { candidateContactSchema, type CandidateContactForm } from '../schemas/candidate.schema'
import type { CandidateDetail } from '../types'

// US-14, US-16 · Design Spec 6.7
export default function CandidateDetailPage() {
  const { id = '' } = useParams()
  const { data: candidate, isPending, isError, error, refetch } = useCandidate(id)

  if (isPending)
    return (
      <div aria-busy aria-label="Đang tải ứng viên" className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  if (isError) return <ErrorState title="Chưa mở được ứng viên" error={error} onRetry={refetch} />

  const anonymized = !!candidate.anonymizedAt

  return (
    <div className="space-y-10">
      <PageHeader
        breadcrumb={
          <Link to={paths.candidates}>
            <ArrowLeft className="size-4" />
            Kho ứng viên
          </Link>
        }
        title={candidate.fullName}
        description={
          <Summary
            items={[
              !anonymized && candidate.email,
              candidate.phone,
              `trong kho từ ${formatDate(candidate.createdAt)}`,
              anonymized && `đã ẩn danh ${formatDate(candidate.anonymizedAt)}`,
            ]}
          />
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="apps-title" className="min-w-0">
          <h2 id="apps-title" className="type-heading mb-4">
            Các lần nộp ({candidate.applications.length})
          </h2>
          {candidate.applications.length === 0 ? (
            <p className="type-body">Không có lần nộp nào thuộc phạm vi bạn được xem.</p>
          ) : (
            <Timeline
              items={candidate.applications.map((a) => ({
                id: a.id,
                tone: a.status === 'HIRED' ? 'good' : a.status === 'REJECTED' ? 'bad' : 'default',
                title: (
                  <Link
                    to={links.applicationDetail(a.id)}
                    className="hover:text-brand font-semibold transition-colors"
                  >
                    {a.job.title}
                  </Link>
                ),
                aside: <ScoreBadge score={a.score} />,
                meta: (
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <StatusPill status={a.status} />
                    <span>
                      nộp {formatDate(a.createdAt)} · {APPLICATION_SOURCE[a.source].phrase}
                    </span>
                  </span>
                ),
              }))}
            />
          )}
        </section>

        <aside className="space-y-10">
          <ContactForm candidate={candidate} />
        </aside>
      </div>

      {!anonymized && (
        <Can permission={Permission.CandidateAnonymize}>
          <DangerZone candidate={candidate} />
        </Can>
      )}
    </div>
  )
}

// BR-CAND-01
function ContactForm({ candidate }: { candidate: CandidateDetail }) {
  const canUpdate = usePermission(Permission.CandidateUpdate)
  const editable = canUpdate && !candidate.anonymizedAt
  const update = useUpdateCandidate(candidate.id)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<CandidateContactForm>({
    resolver: zodResolver(candidateContactSchema),
    values: { fullName: candidate.fullName, phone: candidate.phone ?? '' },
  })

  const onSubmit = handleSubmit((values) =>
    update.mutate(
      { fullName: values.fullName, phone: values.phone || null },
      {
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    ),
  )

  return (
    <section aria-labelledby="contact-title">
      <h2 id="contact-title" className="type-heading mb-4">
        Thông tin liên hệ
      </h2>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Họ tên" htmlFor="cand-name" error={errors.fullName?.message}>
          <Input
            id="cand-name"
            disabled={!editable}
            invalid={!!errors.fullName}
            {...register('fullName')}
          />
        </FormField>
        <FormField
          label="Email"
          htmlFor="cand-email"
          hint="Email dùng để nhận ra ứng viên giữa các lần nộp nên không sửa được."
        >
          <Input
            id="cand-email"
            value={candidate.anonymizedAt ? '—' : candidate.email}
            disabled
            readOnly
          />
        </FormField>
        <FormField label="Số điện thoại" htmlFor="cand-phone" error={errors.phone?.message}>
          <Input
            id="cand-phone"
            type="tel"
            disabled={!editable}
            invalid={!!errors.phone}
            {...register('phone')}
          />
        </FormField>
        {errors.root && (
          <p role="alert" className="text-bad type-label">
            {errors.root.message}
          </p>
        )}
        {editable && (
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              loading={update.isPending}
              disabled={!isDirty}
            >
              Lưu thông tin liên hệ
            </Button>
          </div>
        )}
      </form>
    </section>
  )
}

// BR-DATA-03
function DangerZone({ candidate }: { candidate: CandidateDetail }) {
  const [open, setOpen] = useState(false)
  const anonymize = useAnonymizeCandidate(candidate.id)

  return (
    <section aria-labelledby="danger-title" className="border-bad/30 rounded-md border px-5 py-4">
      <h2 id="danger-title" className="type-subheading text-bad">
        Vùng nguy hiểm
      </h2>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <p className="type-body max-w-2xl">
          Khi ứng viên yêu cầu xoá dữ liệu: xoá tệp CV, nội dung CV, bằng chứng và thông tin liên
          hệ. Trạng thái và điểm của các hồ sơ được giữ để số liệu không lệch.
        </p>
        <Button variant="danger-quiet" onClick={() => setOpen(true)}>
          Ẩn danh ứng viên
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Ẩn danh ${candidate.fullName}?`}
        description={
          <>
            Thao tác này <strong>không hoàn tác được</strong>. Tệp CV, nội dung CV, bằng chứng và
            thông tin liên hệ của {candidate.applications.length} lần nộp sẽ bị xoá vĩnh viễn.
          </>
        }
        confirmLabel="Ẩn danh vĩnh viễn"
        tone="danger"
        loading={anonymize.isPending}
        onConfirm={() => anonymize.mutate(undefined, { onSettled: () => setOpen(false) })}
      />
    </section>
  )
}
