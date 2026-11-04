import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFieldArray, useForm, type FieldValues, type UseFormSetError } from 'react-hook-form'
import { Button, FormField, Input, Textarea } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useSaveCompany } from '../hooks/use-company'
import { benefitsSchema, milestonesSchema, officesSchema } from '../schemas'
import type { Company } from '../types'

/** Lỗi server "benefits.0.title" gắn vào ô "items.0.title" của form */
function onSaveError<T extends FieldValues>(block: string, setError: UseFormSetError<T>) {
  return (error: unknown) => {
    const mapped: UseFormSetError<T> = (field, e) =>
      setError(String(field).replace(new RegExp(`^${block}`), 'items') as never, e)
    if (!applyServerErrors(error, mapped)) {
      setError('root' as never, { message: getErrorMessage(error) })
    }
  }
}

function Frame({
  children,
  count,
  max,
  addLabel,
  onAdd,
  saving,
  dirty,
  saveLabel,
  rootError,
  empty,
}: {
  children: ReactNode
  count: number
  max: number
  addLabel: string
  onAdd: () => void
  saving: boolean
  dirty: boolean
  saveLabel: string
  rootError?: string
  empty: string
}) {
  return (
    <div className="space-y-3">
      {count === 0 ? (
        <p className="type-body">{empty}</p>
      ) : (
        <ol className="space-y-3">{children}</ol>
      )}
      {rootError && (
        <p role="alert" className="text-bad type-label">
          {rootError}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={count >= max} onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
        <Button type="submit" loading={saving} disabled={!dirty}>
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}

function Row({
  children,
  onRemove,
  label,
}: {
  children: ReactNode
  onRemove: () => void
  label: string
}) {
  return (
    <li className="border-line bg-surface flex items-start gap-3 rounded-md border p-3">
      <div className="grid min-w-0 flex-1 gap-3">{children}</div>
      <Button type="button" variant="quiet" size="icon-sm" aria-label={label} onClick={onRemove}>
        <Trash2 />
      </Button>
    </li>
  )
}

// F-ORG-01: phúc lợi
export function BenefitsForm({ company }: { company: Company }) {
  const save = useSaveCompany()
  const form = useForm({
    resolver: zodResolver(benefitsSchema),
    values: { items: company.benefits },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const errors = form.formState.errors.items
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(({ items }) =>
        save.mutate({ benefits: items }, { onError: onSaveError('benefits', form.setError) }),
      )}
    >
      <Frame
        count={fields.length}
        max={12}
        addLabel="Thêm phúc lợi"
        onAdd={() => append({ title: '', description: '' })}
        saving={save.isPending}
        dirty={form.formState.isDirty}
        saveLabel="Lưu phúc lợi"
        rootError={form.formState.errors.root?.message ?? errors?.root?.message}
        empty="Chưa có phúc lợi. Ví dụ: bảo hiểm sức khoẻ, review lương 2 lần mỗi năm."
      >
        {fields.map((f, i) => (
          <Row key={f.id} onRemove={() => remove(i)} label={`Xoá phúc lợi ${i + 1}`}>
            <FormField
              label="Phúc lợi"
              htmlFor={`benefit-${i}-title`}
              error={errors?.[i]?.title?.message}
            >
              <Input id={`benefit-${i}-title`} {...form.register(`items.${i}.title`)} />
            </FormField>
            <FormField
              label="Chi tiết"
              htmlFor={`benefit-${i}-desc`}
              error={errors?.[i]?.description?.message}
            >
              <Input id={`benefit-${i}-desc`} {...form.register(`items.${i}.description`)} />
            </FormField>
          </Row>
        ))}
      </Frame>
    </form>
  )
}

// F-ORG-01: văn phòng
export function OfficesForm({ company }: { company: Company }) {
  const save = useSaveCompany()
  const form = useForm({
    resolver: zodResolver(officesSchema),
    values: { items: company.offices.map((o) => ({ ...o, mapUrl: o.mapUrl ?? '' })) },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const errors = form.formState.errors.items
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(({ items }) =>
        save.mutate(
          { offices: items.map((o) => ({ ...o, mapUrl: o.mapUrl.trim() || null })) },
          { onError: onSaveError('offices', form.setError) },
        ),
      )}
    >
      <Frame
        count={fields.length}
        max={10}
        addLabel="Thêm văn phòng"
        onAdd={() => append({ name: '', address: '', mapUrl: '' })}
        saving={save.isPending}
        dirty={form.formState.isDirty}
        saveLabel="Lưu văn phòng"
        rootError={form.formState.errors.root?.message ?? errors?.root?.message}
        empty="Chưa có văn phòng."
      >
        {fields.map((f, i) => (
          <Row key={f.id} onRemove={() => remove(i)} label={`Xoá văn phòng ${i + 1}`}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <FormField
                label="Tên"
                htmlFor={`office-${i}-name`}
                error={errors?.[i]?.name?.message}
              >
                <Input
                  id={`office-${i}-name`}
                  placeholder="Văn phòng Hà Nội"
                  {...form.register(`items.${i}.name`)}
                />
              </FormField>
              <FormField
                label="Địa chỉ"
                htmlFor={`office-${i}-address`}
                error={errors?.[i]?.address?.message}
              >
                <Input id={`office-${i}-address`} {...form.register(`items.${i}.address`)} />
              </FormField>
            </div>
            <FormField
              label="Link bản đồ"
              htmlFor={`office-${i}-map`}
              error={errors?.[i]?.mapUrl?.message}
              hint="Tuỳ chọn, ví dụ link Google Maps (https://)"
            >
              <Input
                id={`office-${i}-map`}
                type="url"
                placeholder="https://"
                {...form.register(`items.${i}.mapUrl`)}
              />
            </FormField>
          </Row>
        ))}
      </Frame>
    </form>
  )
}

// F-ORG-01: lịch sử phát triển
export function MilestonesForm({ company }: { company: Company }) {
  const save = useSaveCompany()
  const form = useForm({
    resolver: zodResolver(milestonesSchema),
    values: { items: company.milestones.map((m) => ({ ...m, year: String(m.year) })) },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const errors = form.formState.errors.items
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(({ items }) =>
        save.mutate(
          { milestones: items.map((m) => ({ ...m, year: Number(m.year) })) },
          { onError: onSaveError('milestones', form.setError) },
        ),
      )}
    >
      <Frame
        count={fields.length}
        max={20}
        addLabel="Thêm mốc"
        onAdd={() => append({ year: '', title: '', description: '' })}
        saving={save.isPending}
        dirty={form.formState.isDirty}
        saveLabel="Lưu lịch sử"
        rootError={form.formState.errors.root?.message ?? errors?.root?.message}
        empty="Chưa có mốc nào. Các mốc tự xếp theo năm khi hiển thị."
      >
        {fields.map((f, i) => (
          <Row key={f.id} onRemove={() => remove(i)} label={`Xoá mốc ${i + 1}`}>
            <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
              <FormField label="Năm" htmlFor={`ms-${i}-year`} error={errors?.[i]?.year?.message}>
                <Input
                  id={`ms-${i}-year`}
                  inputMode="numeric"
                  placeholder="2016"
                  {...form.register(`items.${i}.year`)}
                />
              </FormField>
              <FormField label="Mốc" htmlFor={`ms-${i}-title`} error={errors?.[i]?.title?.message}>
                <Input
                  id={`ms-${i}-title`}
                  placeholder="Thành lập công ty"
                  {...form.register(`items.${i}.title`)}
                />
              </FormField>
            </div>
            <FormField
              label="Mô tả"
              htmlFor={`ms-${i}-desc`}
              error={errors?.[i]?.description?.message}
            >
              <Textarea id={`ms-${i}-desc`} rows={2} {...form.register(`items.${i}.description`)} />
            </FormField>
          </Row>
        ))}
      </Frame>
    </form>
  )
}
