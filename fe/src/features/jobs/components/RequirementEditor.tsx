import { Info, ListChecks, Plus, Trash2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Input, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import { REQUIREMENT_TYPE, WEIGHT_MAX, WEIGHT_MIN } from '../constants'
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
  /** Gọi AI tách JD thành tiêu chí; kết quả chỉ điền vào form, HR sửa rồi mới lưu */
  onSuggest: () => Promise<RequirementInput[]>
  suggesting: boolean
  readOnly?: boolean
}

const EMPTY_ROW = { label: '', type: 'NICE', weight: 1, minYears: null, keywords: '' } as const

const weights = Array.from({ length: WEIGHT_MAX - WEIGHT_MIN + 1 }, (_, i) => WEIGHT_MIN + i)

/** Trình chỉnh tiêu chí của job (US-02): AI gợi ý, người quyết định */
export function RequirementEditor({
  initial,
  onSave,
  saving,
  onSuggest,
  suggesting,
  readOnly,
}: RequirementEditorProps) {
  const values = useMemo(() => ({ requirements: initial.map(toRequirementRow) }), [initial])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RequirementsForm>({ resolver: zodResolver(requirementsFormSchema), values })
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'requirements' })
  const [fromAi, setFromAi] = useState(false)
  // Hết đánh dấu khi đã lưu (form được nạp lại giá trị mới nên không còn dirty)
  const showAi = fromAi && isDirty

  const suggest = async () => {
    const suggestions = await onSuggest()
    replace(suggestions.map(toRequirementRow))
    setFromAi(true)
    toast.info(`AI gợi ý ${suggestions.length} tiêu chí. Hãy kiểm tra lại trước khi lưu.`)
  }

  const submit = handleSubmit(({ requirements }) => onSave(requirements.map(toRequirementInput)))
  const rowErrors = errors.requirements

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted text-sm">
          Điểm = 100 × Σ(trọng số × mức khớp) / Σ trọng số. Thiếu tiêu chí bắt buộc chỉ gắn cờ,
          không loại ứng viên.
        </p>
        {!readOnly && (
          <Button variant="secondary" size="sm" loading={suggesting} onClick={suggest}>
            {!suggesting && <ListChecks className="text-brand" />}
            AI gợi ý từ JD
          </Button>
        )}
      </div>

      {/* Tiêu đề cột – chỉ hiện từ md */}
      <div className="text-ink-muted hidden grid-cols-[2fr_1fr_80px_90px_2fr_40px] gap-2 px-1 text-xs font-medium md:grid">
        <span>Tiêu chí</span>
        <span>Loại</span>
        <span>Trọng số</span>
        <span>Số năm tối thiểu</span>
        <span>Từ khoá (phân cách bằng dấu phẩy)</span>
        <span />
      </div>

      {showAi && (
        <div className="border-brand/20 bg-brand-soft/60 text-ink-2 flex items-start gap-2 rounded-sm border px-3 py-2.5 text-sm">
          <Info className="text-brand mt-0.5 size-4 shrink-0" />
          <span>
            Các tiêu chí dưới đây do AI tách từ JD. Hãy sửa nhãn, loại, trọng số và từ khoá cho đúng
            ý bạn rồi bấm <strong>Lưu tiêu chí</strong>.
          </span>
        </div>
      )}

      <ul className="space-y-3">
        {fields.map((field, index) => {
          const err = rowErrors?.[index]
          return (
            <li
              key={field.id}
              className={cn(
                'border-line grid gap-2 rounded-sm border p-3 md:grid-cols-[2fr_1fr_80px_90px_2fr_40px] md:border-0 md:p-0',
                showAi && 'md:border-l-primary/40 md:border-l-2 md:pl-2',
              )}
            >
              <Input
                aria-label="Tên tiêu chí"
                placeholder="VD: NestJS"
                disabled={readOnly}
                invalid={!!err?.label}
                {...register(`requirements.${index}.label`)}
              />
              <Select
                aria-label="Loại"
                disabled={readOnly}
                {...register(`requirements.${index}.type`)}
              >
                {Object.entries(REQUIREMENT_TYPE).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Trọng số"
                disabled={readOnly}
                {...register(`requirements.${index}.weight`, { valueAsNumber: true })}
              >
                {weights.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
              <Input
                aria-label="Số năm tối thiểu"
                type="number"
                min={0}
                step={0.5}
                placeholder="—"
                disabled={readOnly}
                invalid={!!err?.minYears}
                {...register(`requirements.${index}.minYears`, {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
              />
              <Input
                aria-label="Từ khoá"
                placeholder="nestjs, nest.js"
                disabled={readOnly}
                invalid={!!err?.keywords}
                {...register(`requirements.${index}.keywords`)}
              />
              {!readOnly && (
                <Button
                  variant="quiet"
                  size="sm"
                  aria-label="Xoá tiêu chí"
                  className="text-bad"
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              )}
              {err && (
                <p role="alert" className="text-bad text-sm md:col-span-6">
                  {err.label?.message ?? err.keywords?.message ?? err.minYears?.message}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {rowErrors?.root?.message && <p className="text-bad text-sm">{rowErrors.root.message}</p>}
      {rowErrors?.message && <p className="text-bad text-sm">{rowErrors.message}</p>}

      {!readOnly && (
        <div className="border-line-soft flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button variant="quiet" size="sm" onClick={() => append({ ...EMPTY_ROW })}>
            <Plus />
            Thêm tiêu chí
          </Button>
          <div className="flex items-center gap-3">
            <span className={cn('text-warn text-sm', !isDirty && 'invisible')}>
              Có thay đổi chưa lưu
            </span>
            <Button type="submit" loading={saving} disabled={!isDirty}>
              Lưu tiêu chí
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
