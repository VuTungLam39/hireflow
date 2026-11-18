import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { z } from 'zod'
import { ConfirmDialog, DataTable, PageHeader, Summary, type Column } from '@/components/shared'
import { Button } from '@/components/ui'
import { AiStatusBadge } from '@/features/applications'
import { pageFields, useListParams } from '@/hooks/use-list-params'
import { formatDateTime } from '@/lib/utils'
import type { AiIssue } from '../types'
import { useAiIssues, useRetryAll, useRetryIssue } from '../hooks/use-operations'
import { useDetailLink, useOpenDetail } from '@/hooks/use-detail'

const listSchema = z.object({ ...pageFields })

// F-OPS-01 · Design Spec 6.13
export default function AiQueuePage() {
  const [params, setParams] = useListParams(listSchema)
  const [confirmAll, setConfirmAll] = useState(false)
  const issues = useAiIssues(params)
  const retry = useRetryIssue()
  const detailLink = useDetailLink()
  const openDetail = useOpenDetail()
  const retryAll = useRetryAll()
  const total = issues.data?.meta.totalItems ?? 0
  const pendingIssues = issues.data ? total > 0 : false

  const columns: Column<AiIssue>[] = [
    {
      key: 'candidate',
      header: 'Ứng viên',
      cell: (i) => (
        <div className="min-w-0">
          <Link
            to={detailLink('application', i.id)}
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
        description={
          pendingIssues ? (
            <Summary
              items={[
                <span key="n" className="text-bad font-medium">
                  {total.toLocaleString('vi-VN')} hồ sơ cần xử lý
                </span>,
                'không đọc được hoặc kẹt quá 5 phút',
                'chạy lại khi dịch vụ đọc CV đã ổn định',
              ]}
            />
          ) : (
            'Hồ sơ không đọc được hoặc kẹt quá 5 phút sẽ hiện ở đây để chạy lại.'
          )
        }
        actions={
          pendingIssues && (
            <Button disabled={retryAll.isPending} onClick={() => setConfirmAll(true)}>
              <RotateCcw />
              Chạy lại {total.toLocaleString('vi-VN')} hồ sơ
            </Button>
          )
        }
      />

      <section aria-labelledby="issues-title" className="space-y-3">
        <h2 id="issues-title" className="type-heading">
          Hồ sơ cần xử lý
        </h2>
        <DataTable
          caption="Hồ sơ không đọc được hoặc đang kẹt"
          columns={columns}
          data={issues.data?.items}
          rowKey={(i) => i.id}
          rowLabel={(i) => i.candidate.fullName}
          onRowClick={(i) => openDetail('application', i.id)}
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
