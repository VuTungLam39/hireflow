import { cn } from '@/lib/utils'
import { PIPELINE_STAGES } from '../constants'
import type { JobPipeline } from '../types'

interface PipelineBarProps {
  pipeline: JobPipeline
  total: number
  className?: string
}

/**
 * Thanh phân bố hồ sơ của một job theo 4 nhóm (Mới · Đang xử lý · Đã nhận · Đã loại).
 * Cho biết ngay job nào đang ùn hồ sơ chưa xem mà không cần mở từng job.
 */
export function PipelineBar({ pipeline, total, className }: PipelineBarProps) {
  if (total === 0) {
    return <span className="text-xs text-slate-400">Chưa có hồ sơ</span>
  }
  const summary = PIPELINE_STAGES.map((s) => `${s.label}: ${pipeline[s.key]}`).join(' · ')

  return (
    <div className={cn('w-56 space-y-1.5', className)} title={summary}>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        {PIPELINE_STAGES.map((s) =>
          pipeline[s.key] > 0 ? (
            <span
              key={s.key}
              className={cn('animate-grow-x h-full origin-left', s.bar)}
              style={{ width: `${(pipeline[s.key] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <p className="flex gap-2.5 text-xs whitespace-nowrap text-slate-500 tabular-nums">
        <span>
          <span className="font-semibold text-slate-800">{pipeline.new}</span> mới
        </span>
        <span>
          <span className="font-semibold text-slate-800">{pipeline.inProgress}</span> đang xử lý
        </span>
        {pipeline.hired > 0 && (
          <span className="text-emerald-700">
            <span className="font-semibold">{pipeline.hired}</span> nhận
          </span>
        )}
      </p>
      <span className="sr-only">{summary}</span>
    </div>
  )
}
