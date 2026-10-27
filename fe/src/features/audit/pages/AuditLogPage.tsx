import { ScrollText } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader } from '@/components/shared'
import { Badge, Button, Card, FormField, Input, Select, Skeleton } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuditLogs } from '../hooks/use-audit-logs'
import { AUDIT_ACTION_LABEL, AUDIT_ACTIONS, describeAudit } from '../audit-format'
import type { AuditLogItem, AuditLogParams } from '../types'

const DAY = /^\d{4}-\d{2}-\d{2}$/

function Target({ log }: { log: AuditLogItem }) {
  if (!log.entityId) return <span className="text-slate-400">–</span>
  const short = log.entityId.slice(0, 8)
  if (log.entity === 'application') {
    return (
      <Link className="text-primary hover:underline" to={links.applicationDetail(log.entityId)}>
        Hồ sơ {short}
      </Link>
    )
  }
  if (log.entity === 'candidate') {
    return (
      <Link className="text-primary hover:underline" to={links.candidateDetail(log.entityId)}>
        Ứng viên {short}
      </Link>
    )
  }
  return (
    <span className="text-slate-600">
      {log.entity === 'user' ? 'Người dùng' : 'File CV'} {short}
    </span>
  )
}

// F-AUDIT-01, FR-AUDIT
export default function AuditLogPage() {
  const [search, setSearch] = useSearchParams()
  const action = AUDIT_ACTIONS.find((a) => a === search.get('action'))
  const from = DAY.test(search.get('from') ?? '') ? search.get('from')! : ''
  const to = DAY.test(search.get('to') ?? '') ? search.get('to')! : ''
  const params: AuditLogParams = {
    action,
    from: from ? `${from}T00:00:00+07:00` : undefined,
    to: to
      ? new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86_400_000).toISOString()
      : undefined,
  }
  const query = useAuditLogs(params)
  const logs = query.data?.pages.flatMap((p) => p.items) ?? []

  const setFilter = (key: string, value: string) =>
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký kiểm toán"
        description="Ai đã xem CV, đổi trạng thái hồ sơ, ẩn danh ứng viên hay đổi quyền người dùng. Nhật ký chỉ ghi thêm, không sửa được."
      />

      <Card className="grid gap-4 p-4 sm:grid-cols-3">
        <FormField label="Hành động" htmlFor="audit-action">
          <Select
            id="audit-action"
            className="w-full"
            value={action ?? ''}
            onChange={(e) => setFilter('action', e.target.value)}
          >
            <option value="">Tất cả</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {AUDIT_ACTION_LABEL[a]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Từ ngày" htmlFor="audit-from">
          <Input
            id="audit-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFilter('from', e.target.value)}
          />
        </FormField>
        <FormField label="Đến ngày" htmlFor="audit-to">
          <Input
            id="audit-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setFilter('to', e.target.value)}
          />
        </FormField>
      </Card>

      {query.isPending ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState
            icon={ScrollText}
            title="Chưa có hành động nào"
            description="Thử bỏ bớt bộ lọc hoặc chọn khoảng ngày khác."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li
                key={log.id}
                className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[10rem_12rem_1fr_9rem] md:items-start md:gap-4"
              >
                <span className="text-xs text-slate-500 tabular-nums md:text-sm">
                  {formatDateTime(log.createdAt)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-800">
                    {log.actor?.fullName ?? (log.actorId ? 'Người dùng đã xoá' : 'Hệ thống')}
                  </span>
                  {log.actor && (
                    <span className="block truncate text-xs text-slate-500">{log.actor.email}</span>
                  )}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone={log.action === 'CANDIDATE_ANONYMIZED' ? 'danger' : 'neutral'}>
                      {AUDIT_ACTION_LABEL[log.action] ?? log.action}
                    </Badge>
                    <Target log={log} />
                  </span>
                  <span className="block break-words text-slate-600">{describeAudit(log)}</span>
                </span>
                <span className="text-xs text-slate-400 md:text-right">
                  {log.ip ? `IP ${log.ip}` : '–'}
                </span>
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <div className="border-t border-slate-100 p-3 text-center">
              <Button
                variant="secondary"
                size="sm"
                loading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                Xem thêm
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
