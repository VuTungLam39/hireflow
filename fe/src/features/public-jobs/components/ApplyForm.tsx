import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FileUploader } from '@/components/shared'
import { Button, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorCode, getErrorMessage } from '@/lib/errors'
import { CV_ACCEPT, CV_MAX_SIZE } from '../constants'
import { useApply } from '../hooks/use-public-jobs'

const applySchema = z.object({
  fullName: z.string().trim().min(2, 'Nhập họ tên').max(100),
  email: z.string().trim().min(1, 'Nhập email').toLowerCase().email('Email không hợp lệ'),
  phone: z
    .string()
    .trim()
    .min(1, 'Nhập số điện thoại')
    .regex(/^(\+84|0)\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  cv: z.instanceof(File, { message: 'Vui lòng chọn file CV' }).nullable().refine(Boolean, {
    message: 'Vui lòng chọn file CV',
  }),
  consent: z.boolean().refine((v) => v, 'Bạn cần đồng ý để chúng tôi xử lý hồ sơ'),
  website: z.string(),
})
type ApplyForm = z.input<typeof applySchema>

interface ApplyFormProps {
  jobId: string
  onSuccess: () => void
}

/** Form nộp CV công khai (US-03): kiểm file ở client, ô đồng ý bắt buộc, honeypot chống bot */
export function ApplyForm({ jobId, onSuccess }: ApplyFormProps) {
  const apply = useApply(jobId)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { fullName: '', email: '', phone: '', cv: null, consent: false, website: '' },
  })

  const onSubmit = handleSubmit((values) =>
    apply.mutate(
      { ...values, cv: values.cv! },
      {
        onSuccess,
        onError: (error) => {
          if (applyServerErrors(error, setError)) return
          const code = getErrorCode(error)
          const field = code?.startsWith('FILE_') ? 'cv' : 'root'
          setError(field, { message: getErrorMessage(error) })
        },
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField label="Họ tên" htmlFor="apply-name" error={errors.fullName?.message}>
        <Input
          id="apply-name"
          autoComplete="name"
          invalid={!!errors.fullName}
          {...register('fullName')}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <FormField label="Email" htmlFor="apply-email" error={errors.email?.message}>
          <Input
            id="apply-email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>
        <FormField label="Số điện thoại" htmlFor="apply-phone" error={errors.phone?.message}>
          <Input
            id="apply-phone"
            type="tel"
            autoComplete="tel"
            invalid={!!errors.phone}
            {...register('phone')}
          />
        </FormField>
      </div>

      <FormField label="CV" htmlFor="apply-cv">
        <Controller
          control={control}
          name="cv"
          render={({ field }) => (
            <FileUploader
              id="apply-cv"
              value={field.value ?? null}
              onChange={field.onChange}
              accept={CV_ACCEPT}
              maxSize={CV_MAX_SIZE}
              error={errors.cv?.message}
              progress={apply.progress}
              disabled={apply.isPending}
            />
          )}
        />
      </FormField>

      {/* Honeypot: ẩn với người dùng, bot hay điền vào */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        {...register('website')}
      />

      <div className="space-y-1">
        <label className="type-body flex items-start gap-2.5">
          <input
            type="checkbox"
            className="accent-brand mt-[3px] size-4 shrink-0"
            {...register('consent')}
          />
          <span>
            Tôi đồng ý để công ty lưu trữ và xử lý dữ liệu cá nhân trong CV cho mục đích tuyển dụng,
            tối đa 12 tháng, theo Nghị định 13/2023/NĐ-CP.
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="text-bad type-label">
            {errors.consent.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="bg-bad-soft text-bad type-label rounded-sm px-3 py-2">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={apply.isPending}>
        Nộp hồ sơ
      </Button>
    </form>
  )
}
