import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button, Dialog, FormField, Textarea } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useEnterCvText } from '../hooks/use-applications'

export const CV_TEXT_MIN = 100
export const CV_TEXT_MAX = 50_000

const cvTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(CV_TEXT_MIN, `Nhập ít nhất ${CV_TEXT_MIN} ký tự`)
    .max(CV_TEXT_MAX, `Tối đa ${CV_TEXT_MAX.toLocaleString('vi-VN')} ký tự`),
})
type CvTextForm = z.input<typeof cvTextSchema>

interface CvTextDialogProps {
  applicationId: string
  open: boolean
  onClose: () => void
}

// F-FILE-02, BR-FILE-04
export function CvTextDialog({ applicationId, open, onClose }: CvTextDialogProps) {
  const enter = useEnterCvText(applicationId)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<CvTextForm>({ resolver: zodResolver(cvTextSchema), defaultValues: { text: '' } })
  const length = useWatch({ control, name: 'text' }).trim().length

  const close = () => {
    reset({ text: '' })
    onClose()
  }

  const onSubmit = handleSubmit(({ text }) =>
    enter.mutate(text.trim(), {
      onSuccess: close,
      onError: (error) => {
        if (applyServerErrors(error, setError)) return
        setError('root', { message: getErrorMessage(error) })
      },
    }),
  )

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Nhập text CV"
      description="File CV không đọc được chữ (thường là ảnh scan). Dán nội dung CV để hệ thống trích xuất và chấm điểm. Bằng chứng sẽ được kiểm trên đúng đoạn text này."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          label="Nội dung CV"
          htmlFor="cv-text"
          error={errors.text?.message}
          hint={`${length.toLocaleString('vi-VN')} ký tự`}
        >
          <Textarea
            id="cv-text"
            rows={14}
            invalid={!!errors.text}
            placeholder="Họ tên, kinh nghiệm, kỹ năng, dự án, học vấn…"
            {...register('text')}
          />
        </FormField>
        {errors.root && (
          <p role="alert" className="text-sm text-red-600">
            {errors.root.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close} disabled={enter.isPending}>
            Huỷ
          </Button>
          <Button type="submit" loading={enter.isPending}>
            Lưu và chấm điểm
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
