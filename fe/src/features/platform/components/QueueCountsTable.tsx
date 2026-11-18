import { Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { QueueCounts } from '../types'

// Kickoff 8.1
const QUEUE_LABEL: Record<string, string> = {
  'parse-cv': 'Đọc CV',
  'extract-cv': 'Trích xuất',
  score: 'Chấm điểm',
  'embed-cv': 'Lập chỉ mục tìm kiếm',
}

// Chuyển từ màn Xử lý CV (chốt 17/11/2026 theo BR-PROC-01): số đếm là của toàn hệ thống
export function QueueCountsTable({ queues }: { queues: QueueCounts[] | undefined }) {
  const sum = (pick: (q: QueueCounts) => number) => queues?.reduce((s, q) => s + pick(q), 0)
  const failed = sum((q) => q.failed)
  return (
    <section aria-label="Số việc trong hàng đợi">
      <div className="border-line bg-surface overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line border-b">
              {['Bước', 'Chờ', 'Đang chạy', 'Lỗi đã lưu'].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={cn('type-overline h-10 px-4', i === 0 ? 'text-left' : 'text-right')}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queues
              ? queues.map((q) => (
                  <tr key={q.name} className="border-line-soft border-b last:border-b-0">
                    <th scope="row" className="text-ink h-10 px-4 text-left font-medium">
                      {QUEUE_LABEL[q.name] ?? q.name}
                    </th>
                    <td className="num px-4 text-right">{q.waiting + q.delayed}</td>
                    <td className="num px-4 text-right">{q.active}</td>
                    <td
                      className={cn(
                        'num px-4 text-right',
                        q.failed > 0 ? 'text-bad font-semibold' : 'text-ink-2',
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
          {queues && (
            <tfoot>
              <tr className="border-line border-t">
                <th scope="row" className="text-ink-2 h-10 px-4 text-left font-medium">
                  Tổng
                </th>
                <td className="num text-ink px-4 text-right font-semibold">
                  {sum((q) => q.waiting + q.delayed)}
                </td>
                <td className="num text-ink px-4 text-right font-semibold">
                  {sum((q) => q.active)}
                </td>
                <td
                  className={cn(
                    'num px-4 text-right font-semibold',
                    failed ? 'text-bad' : 'text-ink',
                  )}
                >
                  {failed}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {!!failed && (
        <p className="type-caption mt-2">
          Lỗi đã lưu là các lần chạy lỗi gần đây, kể cả lần đã được thử lại thành công. Công ty xử
          lý hồ sơ lỗi ở màn Xử lý CV của mình.
        </p>
      )}
    </section>
  )
}
