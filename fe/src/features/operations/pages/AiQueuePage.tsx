import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { z } from 'zod'
import { ConfirmDialog, DataTable, KpiStrip, PageHeader, type Column } from '@/components/shared'
import { Button, Skeleton } from '@/components/ui'
import { AiStatusBadge } from '@/features/applications'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { cn, formatDateTime } from '@/lib/utils'
import { links } from '@/routes/paths'
import type { AiIssue } from '../types'
import { useAiIssues, useQueueCounts, useRetryAll, useRetryIssue } from '../hooks/use-operations'

const listSchema = z.object({ ...pageFields })

// Kickoff 8.1
const QUEUE_LABEL: Record<string, string> = {
  'parse-cv': 'Đọc CV',
  'extract-cv': 'Trích xuất',
  score: 'Chấm điểm',
  'embed-cv': 'Embedding',
}

// F-OPS-01 · Design Spec 6.13
export default function AiQueuePage() {
  const [params, setParams] = useListParams(listSchema)
  const [confirmAll, setConfirmAll] = useState(false)
  const issues = useAiIssues(params)
  const queues = useQueueCounts()
  const retry = useRetryIssue()
  const retryAll = useRetryAll()
  const total = issues.data?.meta.totalItems ?? 0

  const sum = (pick: (q: NonNullable<typeof queues.data>[number]) => number) =>
    queues.data?.reduce((s, q) => s + pick(q), 0)

  const columns: Column<AiIssue>[] = [
    {
      key: 'candidate',
      header: 'Ứng viên',
      cell: (i) => (
        <div className="min-w-0">
          <Link
            to={links.applicationDetail(i.id)}
            className="text-ink hover:text-brand font-medium transition-colors"
          >
            {i.candidate.fullName}
          </Link>
          <p className="type-caption truncate">{i.job.title}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tình trạng',
      cell: (i) => (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <AiStatusBadge status={i.aiStatus} />
          {i.stuck && <span className="text-warn text-[13px] font-medium">Kẹt quá 5 phút</span>}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Lý do',
      cell: (i) => (
        <span className="text-ink-2">
          {i.aiError ?? (i.stuck ? 'Chưa vào được hàng đợi xử lý' : '—')}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      align: 'right',
      cell: (i) => (
        <span className="type-caption whitespace-nowrap">{formatDateTime(i.updatedAt)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Xử lý CV"
        description="Hồ sơ không đọc được hoặc kẹt ở bước chờ quá 5 phút. Chạy lại khi dịch vụ đọc CV đã ổn định."
        actions={
          <Button disabled={!total || retryAll.isPending} onClick={() => setConfirmAll(true)}>
            <RotateCcw />
            Chạy lại tất cả
          </Button>
        }
      />

      <KpiStrip
        loading={!queues.data}
        items={[
          { label: 'Đang chờ', value: sum((q) => q.waiting + q.delayed) },
          { label: 'Đang chạy', value: sum((q) => q.active) },
          {
            label: 'Lỗi trong hàng đợi',
            value: sum((q) => q.failed),
            compareTone: 'bad',
          },
          { label: 'Hồ sơ cần xử lý', value: issues.data ? total : undefined },
        ]}
      />

      <section aria-label="Số việc trong hàng đợi">
        <h2 className="type-overline mb-2">Theo bước</h2>
        <div className="border-line bg-surface overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sunken border-line border-b">
                {['Bước', 'Chờ', 'Đang chạy', 'Lỗi'].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn('type-overline h-9 px-4', i === 0 ? 'text-left' : 'text-right')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queues.data
                ? queues.data.map((q) => (
                    <tr key={q.name} className="border-line-soft border-b last:border-b-0">
                      <th scope="row" className="text-ink h-10 px-4 text-left font-medium">
                        {QUEUE_LABEL[q.name] ?? q.name}
                      </th>
                      <td className="num px-4 text-right">{q.waiting + q.delayed}</td>
                      <td className="num px-4 text-right">{q.active}</td>
                      <td
                        className={cn(
                          'num px-4 text-right',
                          q.failed > 0 && 'text-bad font-semibold',
                        )}
                      >
                        {q.failed}
                      </td>
                    </tr>
                  ))
                : Array.from({ length: 4 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="issues-title" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="issues-title" className="type-heading">
            Hồ sơ cần xử lý
          </h2>
          <span className="type-caption num">{total} hồ sơ</span>
        </div>
        <DataTable
          caption="Hồ sơ không đọc được hoặc đang kẹt"
          columns={columns}
          data={issues.data?.items}
          rowKey={(i) => i.id}
          rowLabel={(i) => i.candidate.fullName}
          isPending={issues.isPending}
          isError={issues.isError}
          error={issues.error}
          onRetry={issues.refetch}
          isFetching={issues.isFetching && !issues.isPending}
          emptyTitle="Không có hồ sơ nào cần xử lý"
          emptyDescription="Mọi CV đã được đọc và chấm. Hồ sơ lỗi mới sẽ hiện ở đây."
          meta={issues.data?.meta}
          onPageChange={(page) => setParams({ page })}
          rowActions={(i) => (
            <Button
              variant="quiet"
              size="sm"
              loading={retry.isPending && retry.variables === i.id}
              onClick={() => retry.mutate(i.id)}
            >
              <RotateCcw />
              Chạy lại
            </Button>
          )}
        />
      </section>

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Chạy lại tất cả?"
        description={`${total} hồ sơ sẽ được đưa lại vào hàng đợi (tối đa 500 mỗi lần). Hồ sơ lỗi chạy lại từ bước bị lỗi, không đọc lại CV nếu đã trích xuất xong.`}
        confirmLabel="Chạy lại"
        loading={retryAll.isPending}
        onConfirm={() => retryAll.mutate(undefined, { onSettled: () => setConfirmAll(false) })}
      />
    </div>
  )
}
