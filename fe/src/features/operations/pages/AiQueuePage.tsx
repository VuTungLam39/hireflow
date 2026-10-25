import { Activity, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { z } from 'zod'
import { ConfirmDialog, DataTable, PageHeader, type Column } from '@/components/shared'
import { Badge, Button, Card, CardTitle, Skeleton, TONE_DOT } from '@/components/ui'
import { AiStatusBadge } from '@/features/applications'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { cn, formatDateTime } from '@/lib/utils'
import { links } from '@/routes/paths'
import type { AiIssue, QueueCounts } from '../types'
import { useAiIssues, useQueueCounts, useRetryAll, useRetryIssue } from '../hooks/use-operations'

const listSchema = z.object({ ...pageFields })

// Kickoff 8.1
const QUEUE_LABEL: Record<string, string> = {
  'parse-cv': 'Đọc CV',
  'extract-cv': 'Trích xuất',
  score: 'Chấm điểm',
  'embed-cv': 'Embedding',
}

function QueueCard({ queue }: { queue: QueueCounts }) {
  const stats = [
    { label: 'Chờ', value: queue.waiting + queue.delayed },
    { label: 'Đang chạy', value: queue.active },
    { label: 'Lỗi', value: queue.failed, danger: true },
  ]
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-900">{QUEUE_LABEL[queue.name] ?? queue.name}</p>
        <code className="text-xs text-slate-400">{queue.name}</code>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-slate-500">{s.label}</dt>
            <dd className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 tabular-nums">
              {s.danger && s.value > 0 && (
                <span aria-hidden className={cn('size-2 rounded-full', TONE_DOT.danger)} />
              )}
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

// F-OPS-01
export default function AiQueuePage() {
  const [params, setParams] = useListParams(listSchema)
  const [confirmAll, setConfirmAll] = useState(false)
  const issues = useAiIssues(params)
  const queues = useQueueCounts()
  const retry = useRetryIssue()
  const retryAll = useRetryAll()
  const total = issues.data?.meta.totalItems ?? 0

  const columns: Column<AiIssue>[] = [
    {
      key: 'candidate',
      header: 'Ứng viên',
      cell: (i) => (
        <Link to={links.applicationDetail(i.id)} className="hover:text-primary font-medium">
          {i.candidate.fullName}
        </Link>
      ),
    },
    { key: 'job', header: 'Vị trí', cell: (i) => i.job.title },
    {
      key: 'status',
      header: 'Trạng thái AI',
      cell: (i) => (
        <div className="flex flex-wrap gap-1.5">
          <AiStatusBadge status={i.aiStatus} />
          {i.stuck && <Badge tone="warning">Kẹt quá 5 phút</Badge>}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Lý do',
      cell: (i) => (
        <span className="text-slate-600">
          {i.aiError ?? (i.stuck ? 'Chưa vào được hàng đợi xử lý' : '—')}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      cell: (i) => <span className="text-slate-500">{formatDateTime(i.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      isAction: true,
      className: 'text-right whitespace-nowrap',
      cell: (i) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={retry.isPending && retry.variables === i.id}
          onClick={() => retry.mutate(i.id)}
        >
          <RotateCcw />
          Chạy lại
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hàng đợi AI"
        description="Hồ sơ chấm AI bị lỗi hoặc kẹt ở trạng thái chờ quá 5 phút. Chạy lại khi dịch vụ AI đã ổn định."
        actions={
          <Button disabled={!total || retryAll.isPending} onClick={() => setConfirmAll(true)}>
            <RotateCcw />
            Chạy lại tất cả
          </Button>
        }
      />

      <section
        aria-label="Số việc trong hàng đợi"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {queues.data
          ? queues.data.map((q) => <QueueCard key={q.name} queue={q} />)
          : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </section>

      <Card className="space-y-4">
        <CardTitle
          icon={<Activity />}
          aside={<span className="text-sm text-slate-500 tabular-nums">{total} hồ sơ</span>}
        >
          Hồ sơ cần xử lý
        </CardTitle>
        <DataTable
          columns={columns}
          data={issues.data?.items}
          rowKey={(i) => i.id}
          isPending={issues.isPending}
          isError={issues.isError}
          error={issues.error}
          onRetry={issues.refetch}
          isFetching={issues.isFetching && !issues.isPending}
          emptyTitle="Không có hồ sơ lỗi"
          meta={issues.data?.meta}
          onPageChange={(page) => setParams({ page })}
        />
      </Card>

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Chạy lại tất cả?"
        description={`${total} hồ sơ sẽ được đưa lại vào pipeline AI (tối đa 500 mỗi lần). Hồ sơ lỗi chạy lại từ bước bị lỗi, không gọi lại LLM nếu đã trích xuất xong.`}
        confirmLabel="Chạy lại"
        loading={retryAll.isPending}
        onConfirm={() => retryAll.mutate(undefined, { onSettled: () => setConfirmAll(false) })}
      />
    </div>
  )
}
