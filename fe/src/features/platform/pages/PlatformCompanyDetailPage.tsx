import { ArrowLeft, Ban, Check, LockOpen, X, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState, PageHeader, Summary } from '@/components/shared'
import { AlertDialog, Button, Skeleton } from '@/components/ui'
import { useCrumb } from '@/hooks/use-crumb'
import { formatDate } from '@/lib/utils'
import { paths } from '@/routes/paths'
import type { OrganizationStatus } from '@/types/user'
import { AiQuotaSection } from '../components/AiQuotaSection'
import { OrgStatusBadge } from '../components/OrgStatusBadge'
import { useOrganization, useOrgTransition } from '../hooks/use-platform'
import type { OrgTransition } from '../types'

interface ActionSpec {
  kind: OrgTransition
  label: string
  icon: LucideIcon
  variant: 'primary' | 'secondary' | 'danger'
  title: string
  description: string
  reason?: boolean
}

// BR-ORG-04
const ACTIONS: Record<OrganizationStatus, ActionSpec[]> = {
  PENDING: [
    {
      kind: 'approve',
      label: 'Duyệt',
      icon: Check,
      variant: 'primary',
      title: 'Duyệt công ty này?',
      description:
        'Tin đang mở của công ty hiện trên trang công khai và ứng viên nộp CV được. Admin công ty nhận email báo duyệt.',
    },
    {
      kind: 'reject',
      label: 'Từ chối',
      icon: X,
      variant: 'secondary',
      title: 'Từ chối công ty này?',
      description: 'Tài khoản của công ty không đăng nhập được nữa. Lý do được gửi qua email.',
      reason: true,
    },
  ],
  ACTIVE: [
    {
      kind: 'suspend',
      label: 'Khoá công ty',
      icon: Ban,
      variant: 'danger',
      title: 'Khoá công ty này?',
      description:
        'Mọi phiên đăng nhập của công ty bị từ chối từ thao tác kế tiếp, tin ẩn khỏi trang công khai. Lý do được gửi qua email.',
      reason: true,
    },
  ],
  SUSPENDED: [
    {
      kind: 'reactivate',
      label: 'Mở khoá',
      icon: LockOpen,
      variant: 'primary',
      title: 'Mở khoá công ty này?',
      description: 'Công ty đăng nhập lại được và tin đang mở hiện lại trên trang công khai.',
    },
  ],
  REJECTED: [],
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="type-caption">{label}</dt>
      <dd className="text-ink mt-0.5 break-words">{children}</dd>
    </div>
  )
}

// RR-13
const count = (n: number, zero: string) =>
  n === 0 ? (
    <span className="text-ink-muted">
      <span className="num">0</span> · {zero}
    </span>
  ) : (
    <span className="num">{n.toLocaleString('vi-VN')}</span>
  )

// MVP 3 · US-20, F-PLAT-01, F-PLAT-03
export default function PlatformCompanyDetailPage() {
  const { id = '' } = useParams()
  const { data: org, isPending, isError, error, refetch } = useOrganization(id)
  const transition = useOrgTransition()
  const [acting, setActing] = useState<ActionSpec | null>(null)
  useCrumb(org?.name)

  if (isPending)
    return (
      <div role="status" aria-busy aria-label="Đang tải công ty" className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  if (isError && !org)
    return <ErrorState title="Chưa mở được công ty" error={error} onRetry={refetch} />

  const actions = ACTIONS[org.status]

  return (
    <div className="space-y-10">
      <PageHeader
        breadcrumb={
          <Link to={paths.platformCompanies}>
            <ArrowLeft className="size-4" />
            Công ty trên sàn
          </Link>
        }
        title={org.name}
        description={
          <Summary
            items={[
              <OrgStatusBadge key="status" status={org.status} />,
              `đăng ký ${formatDate(org.createdAt)}`,
              org.approvedAt && `duyệt ${formatDate(org.approvedAt)}`,
            ]}
          />
        }
        actions={
          actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button key={a.kind} variant={a.variant} onClick={() => setActing(a)}>
                  <a.icon />
                  {a.label}
                </Button>
              ))}
            </div>
          )
        }
      />

      {org.statusReason && (
        <p className="border-line bg-sunken text-ink-2 rounded-md border px-4 py-3">
          <span className="text-ink font-medium">Lý do: </span>
          {org.statusReason}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="org-info" className="space-y-4">
          <h2 id="org-info" className="type-heading">
            Thông tin công ty
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Mã số thuế">{org.taxCode ?? '—'}</Fact>
            <Fact label="Slug">{org.slug}</Fact>
            <Fact label="Website">
              {org.website ? (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-brand underline"
                >
                  {org.website}
                </a>
              ) : (
                '—'
              )}
            </Fact>
            <Fact label="Email Admin">{org.adminEmail ?? '—'}</Fact>
          </dl>
        </section>

        <section aria-labelledby="org-usage" className="space-y-4">
          <h2 id="org-usage" className="type-heading">
            Số liệu tổng
          </h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Fact label="Người dùng">{count(org.userCount, 'chưa có tài khoản nào')}</Fact>
            <Fact label="Tin đang tuyển">{count(org.openJobs, 'chưa đăng tin nào')}</Fact>
            <Fact label="Hồ sơ 30 ngày">
              {count(org.applications30d, 'không có hồ sơ trong 30 ngày qua')}
            </Fact>
          </dl>
          <p className="type-caption">
            Quản trị sàn chỉ thấy số đếm, không xem tin, hồ sơ hay CV của công ty.
          </p>
        </section>
      </div>

      <AiQuotaSection org={org} />

      <AlertDialog
        open={!!acting}
        onClose={() => setActing(null)}
        title={acting?.title ?? ''}
        description={acting?.description}
        confirmLabel={acting?.label}
        confirmVariant={acting && acting.variant !== 'primary' ? 'danger' : 'primary'}
        loading={transition.isPending}
        requireReason={
          acting?.reason
            ? {
                label: 'Lý do (gửi cho công ty, 5–500 ký tự)',
                placeholder: 'Ví dụ: Mã số thuế không khớp tên công ty',
              }
            : undefined
        }
        onConfirm={(reason) => {
          if (!acting) return
          transition.mutate(
            { id: org.id, kind: acting.kind, reason },
            { onSettled: () => setActing(null) },
          )
        }}
      />
    </div>
  )
}
