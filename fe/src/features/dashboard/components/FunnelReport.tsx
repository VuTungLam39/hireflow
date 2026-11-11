import { useId, useState } from 'react'
import { EmptyState, ErrorState } from '@/components/shared'
import { SegmentedControl, Skeleton } from '@/components/ui'
import { APPLICATION_SOURCE, APPLICATION_STATUS } from '@/features/applications'
import { formatTime } from '@/lib/utils'
import { isoDayToVnText, shiftIsoDay, todayIsoDay } from '@/lib/vn-day'
import { useFunnel } from '../hooks/use-dashboard'
import type { FunnelStage } from '../types'

const RANGES = [
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: '365', label: '12 tháng' },
] as const
type Range = (typeof RANGES)[number]['value']

const n = (v: number) => v.toLocaleString('vi-VN')
const pct = (v: number) => v.toLocaleString('vi-VN', { style: 'percent', maximumFractionDigits: 0 })
const days = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })

interface FunnelReportProps {
  /** Phễu của một tin; bỏ trống là toàn bộ phạm vi người xem */
  jobId?: string
  /** Ngày bắt đầu cố định (YYYY-MM-DD giờ VN) cho phễu của tin; khi có thì ẩn bộ chọn khoảng */
  since?: string
  /** Trong popup tin tiêu đề khối là h3 */
  headingLevel?: 'h2' | 'h3'
}

// F1 · BR-REP-01 · Design Spec 6.3: số và chữ trước, thanh mảnh chỉ để so mắt
export function FunnelReport({ jobId, since, headingLevel: Heading = 'h2' }: FunnelReportProps) {
  const titleId = useId()
  const [range, setRange] = useState<Range>('90')
  const to = todayIsoDay()
  const from = since ?? shiftIsoDay(to, -(Number(range) - 1))
  const query = useFunnel({ from, to, jobId })
  const data = query.data

  return (
    <section aria-labelledby={titleId}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <Heading id={titleId} className="type-heading">
            Phễu tuyển dụng
          </Heading>
          <p className="type-caption mt-0.5">
            Hồ sơ nộp từ {isoDayToVnText(from)} đến {isoDayToVnText(to)}
            {data && ` · cập nhật lúc ${formatTime(data.generatedAt)}`}
          </p>
        </div>
        {!since && (
          <SegmentedControl
            label="Khoảng thời gian"
            size="sm"
            options={[...RANGES]}
            value={range}
            onChange={setRange}
          />
        )}
      </div>

      <div className="border-line bg-surface -mx-4 border-y md:mx-0 md:rounded-md md:border">
        {query.isPending ? (
          <div aria-busy aria-label="Đang tải phễu" className="space-y-4 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            className="p-5"
            title="Chưa tải được phễu tuyển dụng"
            error={query.error}
            onRetry={query.refetch}
          />
        ) : data!.cohort === 0 ? (
          <EmptyState
            compact
            className="px-5 py-4"
            title={since ? 'Tin chưa có hồ sơ nào' : 'Chưa có hồ sơ nộp trong khoảng này'}
            description={
              since
                ? 'Phễu sẽ hiện khi tin nhận hồ sơ đầu tiên.'
                : 'Chọn khoảng dài hơn để xem hồ sơ đi qua từng bước ra sao.'
            }
          />
        ) : (
          <>
            <ol className="divide-line-soft divide-y">
              {data!.stages.map((stage) => (
                <StageRow key={stage.status} stage={stage} />
              ))}
            </ol>
            {data!.bySource.length > 1 && (
              <div className="border-line border-t px-5 py-4">
                <table className="w-full text-sm">
                  <caption className="type-overline mb-2 text-left">Theo nguồn hồ sơ</caption>
                  <thead>
                    <tr className="type-caption text-left">
                      <th scope="col" className="pb-1 font-medium">
                        Nguồn
                      </th>
                      <th scope="col" className="pb-1 text-right font-medium">
                        Hồ sơ
                      </th>
                      <th scope="col" className="pb-1 text-right font-medium">
                        Tới phỏng vấn
                      </th>
                      <th scope="col" className="pb-1 text-right font-medium">
                        Đã nhận
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.bySource.map((s) => (
                      <tr key={s.source} className="border-line-soft border-t">
                        <th scope="row" className="text-ink-2 py-2 text-left font-normal">
                          {APPLICATION_SOURCE[s.source].label}
                        </th>
                        <td className="num text-ink py-2 text-right font-semibold">
                          {n(s.cohort)}
                        </td>
                        <td className="num py-2 text-right">
                          {n(s.reachedInterview)}
                          <span className="text-ink-muted ml-1 text-[13px]">
                            {s.cohort ? pct(s.reachedInterview / s.cohort) : ''}
                          </span>
                        </td>
                        <td className="num py-2 text-right">{n(s.hired)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data!.reopened > 0 && (
              <p className="type-caption border-line-soft border-t px-5 py-2.5">
                {n(data!.reopened)} lần mở lại hồ sơ đã kết thúc trong khoảng này
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function StageRow({ stage }: { stage: FunnelStage }) {
  const label = APPLICATION_STATUS[stage.status].label
  const notes = [
    stage.status === 'NEW' && 'Mọi hồ sơ đã nộp',
    stage.conversionFromPrev !== null && `${pct(stage.conversionFromPrev)} từ bước trước`,
    stage.medianDaysInStage !== null && `thường ${days(stage.medianDaysInStage)} ngày ở bước`,
  ].filter(Boolean)
  const dropped = [
    stage.rejected > 0 && `${n(stage.rejected)} từ chối`,
    stage.withdrawn > 0 && `${n(stage.withdrawn)} rút`,
  ].filter(Boolean)

  return (
    <li className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 md:grid-cols-[8rem_minmax(0,1fr)_4.5rem_15rem]">
      <span className="type-body-strong">{label}</span>
      <span className="num text-ink text-right font-semibold md:order-3">
        {n(stage.reached)}
        <span className="sr-only"> hồ sơ, {pct(stage.conversionFromStart)} số hồ sơ đã nộp</span>
      </span>
      <span
        aria-hidden
        className="bg-sunken col-span-2 h-1.5 overflow-hidden rounded-full md:order-2 md:col-span-1"
      >
        <span
          className="bg-brand block h-full rounded-full"
          style={{ width: `${Math.max(stage.conversionFromStart * 100, stage.reached ? 1 : 0)}%` }}
        />
      </span>
      <span className="type-caption col-span-2 md:order-4 md:col-span-1">
        {/* mobile nối một dòng; từ md cột hẹp nên mỗi ý một dòng */}
        {notes.map((note, i) => (
          <span key={i} className="md:block">
            {i > 0 && <span className="md:hidden"> · </span>}
            {note}
          </span>
        ))}
        {dropped.length > 0 && <span className="block">Rơi ở đây: {dropped.join(' · ')}</span>}
      </span>
    </li>
  )
}
