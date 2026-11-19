import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState } from '@/components/shared'
import { Button, Input, Skeleton, chipClass } from '@/components/ui'
import { useInterviewStages, useSaveInterviewStages } from '../hooks/use-jobs'
import type { InterviewStage, InterviewStageInput, Job } from '../types'

export const MAX_STAGES = 10
export const MAX_STAGE_CRITERIA = 12

type Draft = InterviewStageInput & { key: string; locked: boolean }

let seq = 0
const draftOf = (stages: InterviewStage[]): Draft[] =>
  stages.map((s) => ({
    key: s.id,
    id: s.id,
    name: s.name,
    locked: s.locked,
    criteria: s.criteria.map((c) => ({ id: c.id, label: c.label })),
  }))
const fold = (s: string) => s.trim().toLocaleLowerCase('vi')
const hasDuplicate = (values: string[]) => new Set(values.map(fold)).size !== values.length

// BR-INT-05: kiểm trước khi gửi; BE kiểm lại và chặn vòng đã có phiếu
function problemOf(draft: Draft[]): { key?: string; message: string } | null {
  if (hasDuplicate(draft.map((s) => s.name))) return { message: 'Tên vòng phải khác nhau' }
  for (const s of draft) {
    if (s.name.trim().length < 2) return { key: s.key, message: 'Tên vòng cần ít nhất 2 ký tự' }
    if (!s.criteria.length) return { key: s.key, message: 'Mỗi vòng cần ít nhất 1 tiêu chí' }
    if (s.criteria.some((c) => c.label.trim().length < 2)) {
      return { key: s.key, message: 'Tên tiêu chí cần ít nhất 2 ký tự' }
    }
    if (hasDuplicate(s.criteria.map((c) => c.label))) {
      return { key: s.key, message: 'Tiêu chí trong một vòng phải khác nhau' }
    }
  }
  return null
}

interface InterviewStagesEditorProps {
  job: Job
  canEdit: boolean
}

// MVP 3.1 · F-INT-04
export function InterviewStagesEditor({ job, canEdit }: InterviewStagesEditorProps) {
  const query = useInterviewStages(job.id)
  if (query.isPending)
    return (
      <div role="status" aria-busy aria-label="Đang tải vòng phỏng vấn" className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />
  return (
    <StagesForm
      key={query.dataUpdatedAt}
      job={job}
      stages={query.data}
      canEdit={canEdit && job.status !== 'CLOSED'}
    />
  )
}

function StagesForm({
  job,
  stages,
  canEdit,
}: {
  job: Job
  stages: InterviewStage[]
  canEdit: boolean
}) {
  const save = useSaveInterviewStages()
  const [draft, setDraft] = useState<Draft[]>(() => draftOf(stages))
  const [problem, setProblem] = useState<ReturnType<typeof problemOf>>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(stages))

  const patch = (key: string, change: (s: Draft) => Draft) =>
    setDraft((all) => all.map((s) => (s.key === key ? change(s) : s)))
  const move = (index: number, to: number) =>
    setDraft((all) => {
      const next = [...all]
      const [item] = next.splice(index, 1)
      next.splice(to, 0, item)
      return next
    })
  const addStage = () =>
    setDraft((all) => [
      ...all,
      { key: `new-${++seq}`, name: '', locked: false, criteria: [{ label: '' }] },
    ])

  const submit = () => {
    const found = problemOf(draft)
    setProblem(found)
    if (found) return
    save.mutate({
      id: job.id,
      stages: draft.map((s) => ({
        id: s.id,
        name: s.name.trim(),
        criteria: s.criteria.map((c) => ({ id: c.id, label: c.label.trim() })),
      })),
    })
  }

  if (!draft.length && !canEdit)
    return (
      <EmptyState
        title="Tin chưa chia vòng phỏng vấn"
        description="Mỗi buổi phỏng vấn sẽ chấm theo tiêu chí của tin."
      />
    )

  return (
    <div className="space-y-4">
      <p className="type-body text-ink-2">
        Mỗi vòng có tên và bộ tiêu chí chấm riêng. Khi đặt lịch, chọn vòng để phiếu đánh giá chấm
        theo tiêu chí của vòng đó. Buổi không chọn vòng chấm theo tiêu chí của tin.
      </p>
      {!draft.length && (
        <p className="border-line text-ink-2 rounded-md border border-dashed px-4 py-6 text-center">
          Chưa có vòng nào.
        </p>
      )}
      <ol className="space-y-3">
        {draft.map((stage, index) => {
          const used = new Set(stage.criteria.map((c) => fold(c.label)))
          const suggestions = job.requirements.filter((r) => !used.has(fold(r.label)))
          const editable = canEdit && !stage.locked
          return (
            <li
              key={stage.key}
              aria-label={`Vòng ${index + 1}`}
              className="border-line bg-surface space-y-3 rounded-md border p-4"
            >
              <div className="flex items-center gap-2">
                <span className="type-caption num shrink-0">Vòng {index + 1}</span>
                <Input
                  aria-label={`Tên vòng ${index + 1}`}
                  placeholder="Ví dụ: Vòng kỹ thuật"
                  maxLength={80}
                  disabled={!canEdit}
                  invalid={problem?.key === stage.key && stage.name.trim().length < 2}
                  value={stage.name}
                  onChange={(e) => patch(stage.key, (s) => ({ ...s, name: e.target.value }))}
                />
                {canEdit && (
                  <div className="flex shrink-0">
                    <Button
                      variant="quiet"
                      size="icon-sm"
                      aria-label={`Đưa vòng ${index + 1} lên`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="quiet"
                      size="icon-sm"
                      aria-label={`Đưa vòng ${index + 1} xuống`}
                      disabled={index === draft.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="danger-quiet"
                      size="icon-sm"
                      aria-label={`Xoá vòng ${index + 1}`}
                      disabled={stage.locked}
                      onClick={() => setDraft((all) => all.filter((s) => s.key !== stage.key))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
              {stage.locked && (
                <p className="text-ink-2 flex items-center gap-1.5 text-[13px]">
                  <Lock aria-hidden className="size-3.5" />
                  Đã có phiếu đánh giá: chỉ đổi được tên vòng và tên tiêu chí.
                </p>
              )}
              <ul className="space-y-2" aria-label={`Tiêu chí vòng ${index + 1}`}>
                {stage.criteria.map((c, ci) => (
                  <li key={c.id ?? `n${ci}`} className="flex items-center gap-2">
                    <Input
                      aria-label={`Tiêu chí ${ci + 1} của vòng ${index + 1}`}
                      placeholder="Ví dụ: Thiết kế API"
                      maxLength={100}
                      disabled={!canEdit}
                      value={c.label}
                      onChange={(e) =>
                        patch(stage.key, (s) => ({
                          ...s,
                          criteria: s.criteria.map((x, xi) =>
                            xi === ci ? { ...x, label: e.target.value } : x,
                          ),
                        }))
                      }
                    />
                    {editable && (
                      <Button
                        variant="danger-quiet"
                        size="icon-sm"
                        aria-label={`Xoá tiêu chí ${ci + 1} của vòng ${index + 1}`}
                        disabled={stage.criteria.length === 1}
                        onClick={() =>
                          patch(stage.key, (s) => ({
                            ...s,
                            criteria: s.criteria.filter((_, xi) => xi !== ci),
                          }))
                        }
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {editable && stage.criteria.length < MAX_STAGE_CRITERIA && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() =>
                      patch(stage.key, (s) => ({ ...s, criteria: [...s.criteria, { label: '' }] }))
                    }
                  >
                    <Plus />
                    Thêm tiêu chí
                  </Button>
                  {suggestions.length > 0 && (
                    <span className="type-caption ml-1">Lấy từ tiêu chí của tin:</span>
                  )}
                  {suggestions.slice(0, 6).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={chipClass(false)}
                      onClick={() =>
                        patch(stage.key, (s) => ({
                          ...s,
                          criteria: [
                            ...s.criteria.filter((x) => x.label.trim()),
                            { label: r.label },
                          ],
                        }))
                      }
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {problem?.key === stage.key && (
                <p role="alert" className="text-bad text-[13px]">
                  {problem.message}
                </p>
              )}
            </li>
          )
        })}
      </ol>
      {problem && !problem.key && (
        <p role="alert" className="text-bad text-[13px]">
          {problem.message}
        </p>
      )}
      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" disabled={draft.length >= MAX_STAGES} onClick={addStage}>
            <Plus />
            Thêm vòng
          </Button>
          <Button loading={save.isPending} disabled={!dirty} onClick={submit}>
            Lưu vòng phỏng vấn
          </Button>
        </div>
      )}
    </div>
  )
}
