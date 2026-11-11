import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { DetailDialog, ErrorState } from '@/components/shared'
import { Avatar, Skeleton, buttonVariants } from '@/components/ui'
import { REQUIREMENT_TYPE } from '@/features/jobs'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { links } from '@/routes/paths'
import { APPLICATION_SOURCE } from '../constants'
import { applicationQueries } from '../hooks/use-applications'
import type { CompareApplication, CompareCriterion, CompareView } from '../types'
import { MatchIndicator } from './Score'
import { ScoreBadge, StatusPill } from './StatusBadges'

interface CompareDialogProps {
  jobId: string
  ids: string[]
  open: boolean
  onClose: () => void
}

const score5 = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })

// F3 · BR-APP-13 · Design Spec 6.2: đặt 2–3 ứng viên cùng tin cạnh nhau theo từng tiêu chí
export function CompareDialog({ jobId, ids, open, onClose }: CompareDialogProps) {
  const query = useQuery({
    ...applicationQueries.compare(jobId, ids),
    enabled: open && ids.length >= 2,
  })
  const wide = useMediaQuery('(min-width: 48rem)')
  const [tab, setTab] = useState<string>(ids[0] ?? '')
  const data = query.data
  const current = data?.applications.find((a) => a.id === tab) ?? data?.applications[0]

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      label="So sánh ứng viên"
      size="lg"
      title={`So sánh ${ids.length} ứng viên`}
      subtitle={data?.job.title}
      tabs={
        !wide && data
          ? data.applications.map((a) => ({ id: a.id, label: a.candidate.fullName }))
          : undefined
      }
      tab={current?.id}
      onTab={setTab}
    >
      {query.isPending ? (
        <div aria-busy aria-label="Đang tải bảng so sánh" className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : query.isError && getErrorCode(query.error) === 'COMPARE_INVALID_SELECTION' ? (
        <p role="alert" className="type-body py-6">
          {getErrorMessage(query.error)}. Đóng hộp thoại và chọn lại hồ sơ.
        </p>
      ) : query.isError ? (
        <ErrorState title="Chưa mở được bảng so sánh" error={query.error} onRetry={query.refetch} />
      ) : wide ? (
        <CompareTable data={data!} />
      ) : (
        current && <CandidateColumn data={data!} app={current} />
      )}
      {data && (
        <p className="type-caption mt-4">
          Tính tự động từ CV theo tiêu chí của tin – bạn là người quyết định.
        </p>
      )}
    </DetailDialog>
  )
}

function CompareTable({ data }: { data: CompareView }) {
  const cols = data.applications
  return (
    <div className="relative -mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
        <caption className="sr-only">
          Mức khớp từng tiêu chí của {cols.map((a) => a.candidate.fullName).join(', ')}
        </caption>
        <colgroup>
          <col className="w-[30%]" />
          {cols.map((a) => (
            <col key={a.id} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-line border-b align-top">
            <th scope="col" className="type-overline pb-3 text-left font-semibold">
              Tiêu chí
            </th>
            {cols.map((a) => (
              <th key={a.id} scope="col" className="px-3 pb-3 text-left font-normal">
                <CandidateHead app={a} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-line-soft divide-y">
          {data.requirements.map((req) => (
            <tr key={req.id} className="align-top">
              <th scope="row" className="py-3 pr-3 text-left font-normal">
                <span className="type-subheading block">
                  {req.label}
                  {req.minYears != null && (
                    <span className="text-ink-muted font-normal"> · từ {req.minYears} năm</span>
                  )}
                </span>
                <span className="type-overline">
                  {REQUIREMENT_TYPE[req.type].label} · trọng số {req.weight}
                </span>
              </th>
              {cols.map((a) => (
                <td key={a.id} className="px-3 py-3">
                  <CriterionCell item={a.criteria.find((c) => c.requirementId === req.id)} />
                </td>
              ))}
            </tr>
          ))}
          <tr className="align-top">
            <th scope="row" className="type-subheading py-3 pr-3 text-left">
              Phỏng vấn
            </th>
            {cols.map((a) => (
              <td key={a.id} className="type-body px-3 py-3">
                <InterviewSummary app={a} />
              </td>
            ))}
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-line border-t">
            <td />
            {cols.map((a) => (
              <td key={a.id} className="px-3 pt-3">
                <OpenReview app={a} />
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function CandidateColumn({ data, app }: { data: CompareView; app: CompareApplication }) {
  return (
    <div className="space-y-4">
      <CandidateHead app={app} />
      <ul className="divide-line-soft border-line divide-y border-y">
        {data.requirements.map((req) => (
          <li key={req.id} className="py-3">
            <p className="type-subheading">
              {req.label}
              <span className="type-overline ml-2">{REQUIREMENT_TYPE[req.type].label}</span>
            </p>
            <CriterionCell item={app.criteria.find((c) => c.requirementId === req.id)} />
          </li>
        ))}
      </ul>
      <p className="type-body">
        <span className="text-ink font-medium">Phỏng vấn: </span>
        <InterviewSummary app={app} />
      </p>
      <OpenReview app={app} />
    </div>
  )
}

function CandidateHead({ app }: { app: CompareApplication }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <Avatar name={app.candidate.fullName} size="sm" />
        <span className="type-subheading min-w-0 truncate">{app.candidate.fullName}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusPill status={app.status} />
        <ScoreBadge score={app.score} stale={app.stale} />
      </div>
      <p className="type-caption">{APPLICATION_SOURCE[app.source].label}</p>
      {app.stale && (
        <p className="bg-warn-soft text-warn rounded-xs px-2 py-1 text-[13px]">
          Chấm theo tiêu chí cũ – chấm lại để so sánh công bằng
        </p>
      )}
    </div>
  )
}

function CriterionCell({ item }: { item: CompareCriterion | undefined }) {
  if (!item || item.match === null)
    return <p className="text-ink-muted text-[13px]">Chưa chấm theo tiêu chí này</p>
  return (
    <div className="space-y-1">
      <MatchIndicator level={item.match} />
      {item.evidence && (
        <p className="type-body line-clamp-2 text-[13px] italic" title={item.evidence}>
          “<span className="mark-evidence not-italic">{item.evidence}</span>”
        </p>
      )}
      {item.interviewAvg !== null && (
        <p className="type-caption">Phỏng vấn {score5(item.interviewAvg)}/5</p>
      )}
    </div>
  )
}

function InterviewSummary({ app }: { app: CompareApplication }) {
  const { feedbackCount, avgOverall } = app.interviews
  if (feedbackCount === 0) return <span className="text-ink-muted">Chưa có phiếu</span>
  return (
    <span className="num">
      {feedbackCount} phiếu
      {avgOverall !== null && ` · trung bình ${score5(avgOverall)}/5`}
    </span>
  )
}

function OpenReview({ app }: { app: CompareApplication }) {
  return (
    <Link
      to={links.applicationDetail(app.id)}
      className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-full')}
    >
      Mở bàn duyệt CV
    </Link>
  )
}
