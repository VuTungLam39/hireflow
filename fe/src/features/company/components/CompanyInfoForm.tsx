import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, FormField, Input, Select, Textarea } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useSaveCompany } from '../hooks/use-company'
import { companyInfoSchema, toInfoForm, toInfoInput, type CompanyInfoForm } from '../schemas'
import { COMPANY_SIZE, type Company } from '../types'

const SOCIALS = [
  ['linkedin', 'LinkedIn'],
  ['facebook', 'Facebook'],
  ['youtube', 'YouTube'],
  ['tiktok', 'TikTok'],
] as const

// F-ORG-01
export function CompanyInfoForm({ company }: { company: Company }) {
  const save = useSaveCompany()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    values: toInfoForm(company),
  })

  const onSubmit = handleSubmit((form) =>
    save.mutate(toInfoInput(form), {
      onError: (error) => {
        if (!applyServerErrors(error, (field, e) => setError(serverField(field), e))) {
          setError('root', { message: getErrorMessage(error) })
        }
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên công ty" htmlFor="co-name" error={errors.name?.message}>
          <Input id="co-name" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField
          label="Khẩu hiệu"
          htmlFor="co-tagline"
          error={errors.tagline?.message}
          hint="Một câu ngắn hiện dưới tên công ty"
        >
          <Input id="co-tagline" invalid={!!errors.tagline} {...register('tagline')} />
        </FormField>
      </div>
      <FormField
        label="Giới thiệu"
        htmlFor="co-about"
        error={errors.about?.message}
        hint="Công ty làm gì, đội ngũ ra sao, vì sao nên làm ở đây. Văn bản thuần, mỗi đoạn một dòng trống."
      >
        <Textarea
          id="co-about"
          rows={8}
          className="type-read max-w-none"
          invalid={!!errors.about}
          {...register('about')}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Quy mô" htmlFor="co-size">
          <Select id="co-size" className="w-full" {...register('sizeRange')}>
            <option value="">Không ghi</option>
            {Object.entries(COMPANY_SIZE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Năm thành lập" htmlFor="co-founded" error={errors.foundedYear?.message}>
          <Input
            id="co-founded"
            inputMode="numeric"
            placeholder="2016"
            invalid={!!errors.foundedYear}
            {...register('foundedYear')}
          />
        </FormField>
        <FormField
          label="Lĩnh vực"
          htmlFor="co-industries"
          error={errors.industries?.message}
          hint="Ngăn cách bằng dấu phẩy, tối đa 5"
        >
          <Input
            id="co-industries"
            placeholder="Phần mềm, Nhân sự"
            invalid={!!errors.industries}
            {...register('industries')}
          />
        </FormField>
      </div>
      <FormField label="Website" htmlFor="co-website" error={errors.website?.message}>
        <Input
          id="co-website"
          type="url"
          placeholder="https://"
          invalid={!!errors.website}
          {...register('website')}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIALS.map(([key, label]) => (
          <FormField key={key} label={label} htmlFor={`co-${key}`} error={errors[key]?.message}>
            <Input
              id={`co-${key}`}
              type="url"
              placeholder="https://"
              invalid={!!errors[key]}
              {...register(key)}
            />
          </FormField>
        ))}
      </div>
      {errors.root && (
        <p role="alert" className="text-bad type-label">
          {errors.root.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending} disabled={!isDirty}>
          Lưu thông tin chung
        </Button>
      </div>
    </form>
  )
}

/** Lỗi server "socials.facebook" gắn vào ô "facebook" của form */
const serverField = (field: string) =>
  (field.startsWith('socials.') ? field.slice('socials.'.length) : field) as keyof CompanyInfoForm
