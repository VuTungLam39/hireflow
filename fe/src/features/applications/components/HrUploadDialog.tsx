import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FileUploader } from '@/components/shared'
import { Button, Dialog, FormField, Input } from '@/components/ui'
import { CV_ACCEPT, CV_MAX_SIZE } from '@/features/public-jobs'
import { applyServerErrors, getErrorCode, getErrorMessage } from '@/lib/errors'
import { useUploadForCandidate } from '../hooks/use-applications'
import type { ApplicationDetail } from '../types'

const uploadSchema = z.object({
  fullName: z.string().trim().min(2, 'Nhập họ tên').max(100),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  // Tuỳ chọn khi HR tải hộ; có nhập thì phải đúng định dạng
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^(\+84|0)\d{9,10}$/.test(v), 'Số điện thoại không hợp lệ'),
  cv: z.instanceof(File, { message: 'Vui lòng chọn file CV' }).nullable().refine(Boolean, {
    message: 'Vui lòng chọn file CV',
  }),
  consentConfirmed: z.boolean().refine((v) => v, 'Cần xác nhận ứng viên đã đồng ý'),
})
type UploadForm = z.input<typeof uploadSchema>

const EMPTY: UploadForm = { fullName: '', email: '', phone: '', cv: null, consentConfirmed: false }

interface HrUploadDialogProps {
  jobId: string
  jobTitle: string
  open: boolean
  onClose: () => void
  onUploaded?: (application: ApplicationDetail) => void
}

/**
 * HR tải CV hộ ứng viên gửi qua email, Zalo (US-15, BR-APP-10).
 * Kiểm file và chống trùng giống trang nộp công khai; hồ sơ có nguồn HR_UPLOAD.
 */
export function HrUploadDialog({
  jobId,
  jobTitle,
  open,
  onClose,
  onUploaded,
}: HrUploadDialogProps) {
  const upload = useUploadForCandidate(jobId)
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<UploadForm>({ resolver: zodResolver(uploadSchema), defaultValues: EMPTY })

  const close = () => {
    reset(EMPTY)
    onClose()
  }

  const onSubmit = handleSubmit((values) =>
    upload.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        consentConfirmed: values.consentConfirmed,
        cv: values.cv!,
      },
      {
        onSuccess: (application) => {
          toast.success('Đã tạo hồ sơ, hệ thống đang chấm điểm CV')
          close()
          onUploaded?.(application)
        },
        onError: (error) => {
          if (applyServerErrors(error, setError)) return
          const code = getErrorCode(error)
          if (code?.startsWith('FILE_')) return setError('cv', { message: getErrorMessage(error) })
          setError('root', {
            message:
              code === 'APPLICATION_DUPLICATED'
                ? 'Ứng viên này đã có hồ sơ cho vị trí này'
                : getErrorMessage(error),
          })
        },
      },
    ),
  )

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Tải CV hộ ứng viên"
      description={`Vị trí: ${jobTitle}`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Họ tên" htmlFor="upload-name" error={errors.fullName?.message}>
          <Input id="upload-name" invalid={!!errors.fullName} {...register('fullName')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" htmlFor="upload-email" error={errors.email?.message}>
            <Input id="upload-email" type="email" invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField
            label="Số điện thoại (tuỳ chọn)"
            htmlFor="upload-phone"
            error={errors.phone?.message}
          >
            <Input id="upload-phone" type="tel" invalid={!!errors.phone} {...register('phone')} />
          </FormField>
        </div>
        <p className="text-xs text-slate-500">
          Email đã có trong hệ thống thì hồ sơ gắn vào ứng viên đó; họ tên và số điện thoại cũ được
          giữ nguyên.
        </p>

        <FormField label="CV" htmlFor="upload-cv">
          <Controller
            control={control}
            name="cv"
            render={({ field }) => (
              <FileUploader
                id="upload-cv"
                value={field.value ?? null}
                onChange={field.onChange}
                accept={CV_ACCEPT}
                maxSize={CV_MAX_SIZE}
                error={errors.cv?.message}
                progress={upload.progress}
                disabled={upload.isPending}
              />
            )}
          />
        </FormField>

        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="accent-primary mt-0.5 size-4"
              {...register('consentConfirmed')}
            />
            <span>
              Tôi xác nhận ứng viên đã đồng ý cho công ty lưu trữ và xử lý dữ liệu cá nhân trong CV
              cho mục đích tuyển dụng (Nghị định 13/2023/NĐ-CP).
            </span>
          </label>
          {errors.consentConfirmed && (
            <p role="alert" className="text-sm text-red-600">
              {errors.consentConfirmed.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" loading={upload.isPending}>
            Tạo hồ sơ
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
