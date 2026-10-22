import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Mail,
  Phone,
  ShieldAlert,
  ShieldOff,
  UserPen,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import {
  Can,
  ConfirmDialog,
  DataTable,
  ErrorState,
  PageHeader,
  type Column,
} from '@/components/shared'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardTitle,
  FormField,
  Input,
  PageLoader,
} from '@/components/ui'
import { APPLICATION_SOURCE, ApplicationStatusBadge, ScoreValue } from '@/features/applications'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { formatDate, formatDateTime } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { useAnonymizeCandidate, useCandidate, useUpdateCandidate } from '../hooks/use-candidates'
import { candidateContactSchema, type CandidateContactForm } from '../schemas/candidate.schema'
import type { CandidateApplication, CandidateDetail } from '../types'

const columns: Column<CandidateApplication>[] = [
  {
    key: 'job',
    header: 'Vị trí',
    cell: (a) => (
      <Link
        to={links.applicationDetail(a.id)}
        className="hover:text-primary font-medium transition-colors"
      >
        {a.job.title}
      </Link>
    ),
  },
  {
    key: 'status',
    header: 'Trạng thái',
    cell: (a) => <ApplicationStatusBadge status={a.status} />,
  },
  { key: 'score', header: 'Điểm', cell: (a) => <ScoreValue score={a.score} /> },
  {
    key: 'source',
    header: 'Nguồn',
    cell: (a) => (
      <Badge tone={APPLICATION_SOURCE[a.source].tone}>{APPLICATION_SOURCE[a.source].label}</Badge>
    ),
  },
  {
    key: 'createdAt',
    header: 'Ngày nộp',
    cell: (a) => (
      <span className="whitespace-nowrap text-slate-500">{formatDateTime(a.createdAt)}</span>
    ),
  },
]

/** Chi tiết ứng viên: mọi lần nộp, sửa thông tin liên hệ, ẩn danh (US-14, US-16) */
export default function CandidateDetailPage() {
  const { id = '' } = useParams()
  const { data: candidate, isPending, isError, error, refetch } = useCandidate(id)

  if (isPending) return <PageLoader />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  const anonymized = !!candidate.anonymizedAt

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to={paths.candidates}>
            <ArrowLeft className="size-4" />
            Kho ứng viên
          </Link>
        }
        title={
          <span className="flex items-center gap-4">
            <Avatar name={candidate.fullName} size="lg" />
            <span>
              {candidate.fullName}
              <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-normal tracking-normal text-slate-500">
                {!anonymized && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {candidate.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Trong hệ thống từ {formatDate(candidate.createdAt)}
                </span>
              </span>
            </span>
          </span>
        }
        actions={
          anonymized && (
            <Badge tone="neutral">
              <ShieldOff className="size-3" />
              Đã ẩn danh {formatDate(candidate.anonymizedAt)}
            </Badge>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="min-w-0 space-y-4">
          <CardTitle icon={<FileText />}>Các lần nộp ({candidate.applications.length})</CardTitle>
          <DataTable
            columns={columns}
            data={candidate.applications}
            rowKey={(a) => a.id}
            isPending={false}
            isError={false}
            emptyTitle="Không có hồ sơ nào bạn được xem"
          />
        </Card>

        <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <ContactCard candidate={candidate} />
          {!anonymized && (
            <Can permission={Permission.CandidateAnonymize}>
              <AnonymizeCard candidate={candidate} />
            </Can>
          )}
        </div>
      </div>
    </div>
  )
}

/** Sửa họ tên và số điện thoại; email là khoá định danh nên không sửa (BR-CAND-01) */
function ContactCard({ candidate }: { candidate: CandidateDetail }) {
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
    <Card className="space-y-4">
      <CardTitle icon={<UserPen />}>Thông tin liên hệ</CardTitle>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Họ tên" htmlFor="cand-name" error={errors.fullName?.message}>
          <Input
            id="cand-name"
            disabled={!editable}
            invalid={!!errors.fullName}
            {...register('fullName')}
          />
        </FormField>
        <FormField label="Email" htmlFor="cand-email">
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
        <p className="text-xs text-slate-500">
          Email dùng để nhận ra ứng viên giữa các lần nộp nên không sửa được.
        </p>
        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
        {editable && (
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={update.isPending} disabled={!isDirty}>
              Lưu
            </Button>
          </div>
        )}
      </form>
    </Card>
  )
}

/** Ẩn danh theo yêu cầu của ứng viên (Nghị định 13, BR-DATA-03). Không hoàn tác. */
function AnonymizeCard({ candidate }: { candidate: CandidateDetail }) {
  const [open, setOpen] = useState(false)
  const anonymize = useAnonymizeCandidate(candidate.id)

  return (
    <Card className="space-y-3 border-red-200/80">
      <CardTitle icon={<ShieldAlert />}>Yêu cầu xoá dữ liệu</CardTitle>
      <p className="text-sm text-slate-600">
        Khi ứng viên yêu cầu xoá dữ liệu cá nhân: xoá file CV, nội dung CV, bằng chứng và thông tin
        liên hệ. Trạng thái và điểm của các hồ sơ được giữ để số liệu thống kê không lệch.
      </p>
      <Button variant="danger-outline" size="sm" onClick={() => setOpen(true)}>
        <ShieldOff />
        Ẩn danh ứng viên
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Ẩn danh ${candidate.fullName}?`}
        description="Thao tác này không hoàn tác được. CV và thông tin liên hệ sẽ bị xoá vĩnh viễn."
        confirmLabel="Ẩn danh"
        tone="danger"
        loading={anonymize.isPending}
        onConfirm={() => anonymize.mutate(undefined, { onSettled: () => setOpen(false) })}
      />
    </Card>
  )
}
