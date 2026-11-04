import { PencilLine } from 'lucide-react'
import { useState } from 'react'
import { Can } from '@/components/shared'
import { Button, Skeleton } from '@/components/ui'
import { Permission } from '@/lib/permissions'
import type { EvidenceMarkInput } from '../lib/evidence'
import type { ApplicationDetail } from '../types'
import { CvSheet } from './CvSheet'
import { CvTextDialog } from './CvTextDialog'
import { RequirementList } from './RequirementList'
import { ScoreMeter } from './Score'
import { ScoreFlags } from './StatusBadges'

export function ScorePanel({
  app,
  activeId,
  locatable,
  onSelect,
  heading = true,
}: {
  heading?: boolean
  app: ApplicationDetail
  activeId: string | null
  locatable: ReadonlySet<string>
  onSelect: (id: string) => void
}) {
  const [cvTextOpen, setCvTextOpen] = useState(false)
  const matches = Object.fromEntries(app.breakdown.map((b) => [b.requirementId, b.match]))
  const outdated = app.scoredJdVersion !== null && app.scoredJdVersion !== app.job.jdVersion
  const busy = app.aiStatus === 'PENDING' || app.aiStatus === 'PROCESSING'

  return (
    <div>
      {heading && <h2 className="type-heading mb-3">Mức phù hợp</h2>}

      {busy && (
        <div aria-live="polite">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-3 h-2 w-full" />
          <p className="type-body mt-3">
            <span className="text-ink font-medium">Đang đọc CV</span> · thường mất dưới 1 phút.
            Trang tự cập nhật khi xong.
          </p>
        </div>
      )}

      {app.aiStatus === 'FAILED' && (
        <div role="alert" className="bg-bad-soft rounded-sm px-4 py-3">
          <p className="text-bad type-subheading">Không đọc được CV</p>
          <p className="type-body mt-0.5">
            {app.aiError ?? 'Tệp có thể là ảnh scan nên không lấy được chữ.'}
          </p>
          {app.cv?.parseStatus === 'FAILED' && (
            <Can permission={Permission.AiRescore}>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setCvTextOpen(true)}
              >
                <PencilLine />
                Nhập nội dung CV
              </Button>
              <CvTextDialog
                applicationId={app.id}
                open={cvTextOpen}
                onClose={() => setCvTextOpen(false)}
              />
            </Can>
          )}
        </div>
      )}

      {app.aiStatus === 'DONE' && app.score !== null && (
        <>
          <ScoreMeter score={app.score} requirements={app.requirements} matches={matches} />
          <p className="type-caption mt-3">
            Tính tự động từ CV theo {app.requirements.length} tiêu chí của tin – bạn là người quyết
            định.
          </p>
          {(app.flags.length > 0 || outdated) && (
            <div className="mt-3 space-y-1">
              <ScoreFlags flags={app.flags} />
              {outdated && (
                <p className="text-warn text-[13px]">
                  Điểm theo tiêu chí phiên bản {app.scoredJdVersion}; tin đang ở phiên bản{' '}
                  {app.job.jdVersion}.
                </p>
              )}
            </div>
          )}
          <div className="mt-5">
            <RequirementList
              requirements={app.requirements}
              breakdown={app.breakdown}
              activeId={activeId}
              locatable={locatable}
              onSelect={onSelect}
            />
          </div>
        </>
      )}
    </div>
  )
}

export function CvPanel({
  app,
  marks,
  activeId,
  onMarkClick,
  className,
}: {
  app: ApplicationDetail
  marks: EvidenceMarkInput[]
  activeId: string | null
  onMarkClick: (id: string) => void
  className?: string
}) {
  if (!app.cv)
    return (
      <div className="border-line bg-surface h-full rounded-md border p-8">
        <p className="type-heading">CV đã được xoá</p>
        <p className="type-body mt-1">
          Ứng viên đã yêu cầu ẩn danh nên tệp và nội dung CV không còn.
        </p>
      </div>
    )
  if (!app.cv.text)
    return (
      <div className="border-line bg-surface h-full rounded-md border p-8">
        <p className="type-heading">Chưa có nội dung CV</p>
        <p className="type-body mt-1">
          {app.cv.parseStatus === 'FAILED'
            ? 'Không lấy được chữ từ tệp. Bạn có thể nhập nội dung CV ở cột bên trái.'
            : 'Hệ thống đang đọc tệp CV.'}
        </p>
      </div>
    )
  return (
    <CvSheet
      text={app.cv.text}
      marks={marks}
      activeId={activeId}
      onMarkClick={onMarkClick}
      className={className}
      header={
        <p className="type-caption mb-6 flex flex-wrap items-center justify-between gap-2">
          <span>
            Tờ CV · {app.cv.fileName}
            {app.cv.textEnteredAt && ' · Nội dung nhập tay'}
          </span>
          {marks.length > 0 && (
            <span>
              <span className="mark-evidence">dạ quang</span> = căn cứ cho tiêu chí
            </span>
          )}
        </p>
      }
    />
  )
}
