import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, SegmentedControl, Stepper } from '@/components/ui'
import { cn } from '@/lib/utils'
import { REQUIREMENT_TYPE, WEIGHT_MAX, WEIGHT_MIN, type RequirementType } from '../constants'
import {
  requirementsFormSchema,
  toRequirementInput,
  toRequirementRow,
  type RequirementsForm,
} from '../schemas/job.schema'
import type { Requirement, RequirementInput } from '../types'

interface RequirementEditorProps {
  initial: Requirement[]
  onSave: (requirements: RequirementInput[]) => void
  saving: boolean
  onSuggest: () => Promise<RequirementInput[]>
  suggesting: boolean
  readOnly?: boolean
  recalcCount?: number
}

const EMPTY_ROW = { label: '', type: 'NICE', weight: 1, minYears: null, keywords: '' } as const

const TYPE_OPTIONS = (Object.keys(REQUIREMENT_TYPE) as RequirementType[]).map((value) => ({
  value,
  label: REQUIREMENT_TYPE[value].label,
}))

// US-02, BR-JOB-05, BR-JOB-06
export function RequirementEditor({
  initial,
  onSave,
  saving,
  onSuggest,
  suggesting,
  readOnly,
  recalcCount,
}: RequirementEditorProps) {
  const values = useMemo(() => ({ requirements: initial.map(toRequirementRow) }), [initial])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RequirementsForm>({ resolver: zodResolver(requirementsFormSchema), values })
  const { fields, append, remove, replace, move } = useFieldArray({ control, name: 'requirements' })
  const [fromSuggest, setFromSuggest] = useState(false)
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const confirm = (id: string) => setConfirmed((s) => (s.has(id) ? s : new Set(s).add(id)))

  const suggest = async () => {
    const suggestions = await onSuggest()
    replace(suggestions.map(toRequirementRow))
    setConfirmed(new Set())
    setFromSuggest(true)
    toast(`Đã gợi ý ${suggestions.length} tiêu chí từ JD. Kiểm tra từng tiêu chí trước khi lưu.`)
  }

  const submit = handleSubmit(({ requirements }) => {
    setFromSuggest(false)
    onSave(requirements.map(toRequirementInput))
  })
  const rowErrors = errors.requirements

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="type-caption max-w-sm">
          Mức phù hợp tính theo trọng số và mức khớp từng tiêu chí. Thiếu tiêu chí bắt buộc chỉ gắn
          cờ, không tự loại ứng viên.
        </p>
        {!readOnly && (
          <Button variant="quiet" size="sm" loading={suggesting} onClick={suggest}>
            Gợi ý tiêu chí từ JD
          </Button>
        )}
      </div>

      {fields.length === 0 && (
        <p className="border-line type-body rounded-md border border-dashed px-4 py-5">
          Chưa có tiêu chí. Thêm tay hoặc gợi ý từ JD – cần ít nhất một tiêu chí để đăng tin.
        </p>
      )}

      <ol className="divide-line-soft border-line-soft divide-y border-y">
        {fields.map((field, index) => {
          const err = rowErrors?.[index]
          const isSuggested = fromSuggest && !confirmed.has(field.id)
          return (
            <li
              key={field.id}
              onChange={() => confirm(field.id)}
              className={cn('relative space-y-2.5 py-4 pl-8', isSuggested && 'bg-marker/15')}
            >
              <span
                aria-hidden
                className="border-ink-2 text-ink absolute top-[25px] left-0 flex size-[18px] items-center justify-center rounded-full border text-xs font-semibold"
              >
                {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`Tên tiêu chí ${index + 1}`}
                  placeholder="Ví dụ: NestJS"
                  disabled={readOnly}
                  invalid={!!err?.label}
                  className="font-medium"
                  {...register(`requirements.${index}.label`)}
                />
                {!readOnly && (
                  <div className="flex shrink-0">
                    <Button
                      variant="quiet"
                      size="icon-sm"
                      aria-label={`Đưa tiêu chí ${index + 1} lên`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="quiet"
                      size="icon-sm"
                      aria-label={`Đưa tiêu chí ${index + 1} xuống`}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="danger-quiet"
                      size="icon-sm"
                      aria-label={`Xoá tiêu chí ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Controller
                  control={control}
                  name={`requirements.${index}.type`}
                  render={({ field: f }) => (
                    <SegmentedControl
                      size="sm"
                      label={`Loại tiêu chí ${index + 1}`}
                      options={TYPE_OPTIONS}
                      value={f.value as RequirementType}
                      onChange={(v) => {
                        f.onChange(v)
                        confirm(field.id)
                      }}
                    />
                  )}
                />
                <span className="flex items-center gap-2">
                  <span className="type-label">Trọng số</span>
                  <Controller
                    control={control}
                    name={`requirements.${index}.weight`}
                    render={({ field: f }) => (
                      <Stepper
                        label={`trọng số tiêu chí ${index + 1}`}
                        min={WEIGHT_MIN}
                        max={WEIGHT_MAX}
                        value={f.value}
                        disabled={readOnly}
                        onChange={(v) => {
                          f.onChange(v)
                          confirm(field.id)
                        }}
                      />
                    )}
                  />
                </span>
                <label className="flex items-center gap-2">
                  <span className="type-label">Từ</span>
                  <Input
                    aria-label={`Số năm tối thiểu tiêu chí ${index + 1}`}
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="—"
                    disabled={readOnly}
                    invalid={!!err?.minYears}
                    className="num w-16"
                    {...register(`requirements.${index}.minYears`, {
                      setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                    })}
                  />
                  <span className="type-label">năm</span>
                </label>
              </div>

              <Input
                aria-label={`Từ khoá tiêu chí ${index + 1}`}
                placeholder="Từ khoá, cách nhau bằng dấu phẩy: nestjs, nest.js"
                disabled={readOnly}
                invalid={!!err?.keywords}
                {...register(`requirements.${index}.keywords`)}
              />

              {isSuggested && !readOnly && (
                <p className="type-caption flex items-center gap-2">
                  <span className="text-warn font-medium">Gợi ý – hãy kiểm tra</span>
                  <button
                    type="button"
                    onClick={() => confirm(field.id)}
                    className="text-brand font-medium hover:underline"
                  >
                    Giữ nguyên
                  </button>
                </p>
              )}
              {err && (
                <p role="alert" className="text-bad text-[13px]">
                  {err.label?.message ?? err.keywords?.message ?? err.minYears?.message}
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {rowErrors?.root?.message && <p className="text-bad text-[13px]">{rowErrors.root.message}</p>}
      {rowErrors?.message && <p className="text-bad text-[13px]">{rowErrors.message}</p>}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="quiet" size="sm" onClick={() => append({ ...EMPTY_ROW })}>
            <Plus />
            Thêm tiêu chí
          </Button>
          <div className="flex items-center gap-3">
            {saving && recalcCount ? (
              <span className="type-caption" aria-live="polite">
                Đang tính lại mức phù hợp cho {recalcCount.toLocaleString('vi-VN')} hồ sơ…
              </span>
            ) : (
              isDirty && <span className="type-caption text-warn">Có thay đổi chưa lưu</span>
            )}
            <Button type="submit" loading={saving} disabled={!isDirty}>
              Lưu tiêu chí
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
