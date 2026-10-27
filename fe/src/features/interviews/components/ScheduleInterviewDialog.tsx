import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Dialog, FormField, Input, Select, Spinner } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useInterviewers, useScheduleInterview, useUpdateInterview } from '../hooks/use-interviews'
import { toLocalInput } from '../lib/format'
import type { Interview } from '../types'

export const MAX_INTERVIEWERS = 5
const DURATIONS = [30, 45, 60, 90, 120]

const scheduleSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, 'Chọn ngày giờ phỏng vấn')
    .refine((v) => new Date(v).getTime() > Date.now(), 'Thời gian phải ở tương lai'),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  location: z.string().trim().min(1, 'Nhập phòng họp hoặc link họp').max(500),
  interviewerIds: z
    .array(z.string())
    .min(1, 'Chọn ít nhất một người phỏng vấn')
    .max(MAX_INTERVIEWERS, `Tối đa ${MAX_INTERVIEWERS} người`),
})
type ScheduleForm = z.input<typeof scheduleSchema>

interface ScheduleInterviewDialogProps {
  applicationId: string
  /** Có giá trị: đổi lịch buổi này */
  interview?: Interview
  open: boolean
  onClose: () => void
}

// F-INT-01, BR-INT-01
export function ScheduleInterviewDialog({
  applicationId,
  interview,
  open,
  onClose,
}: ScheduleInterviewDialogProps) {
  const interviewers = useInterviewers(open)
  const schedule = useScheduleInterview(applicationId)
  const update = useUpdateInterview()
  const pending = schedule.isPending || update.isPending
  const defaults: ScheduleForm = interview
    ? {
        scheduledAt: toLocalInput(interview.scheduledAt),
        durationMinutes: interview.durationMinutes,
        location: interview.location,
        interviewerIds: interview.interviewers.map((i) => i.id),
      }
    : { scheduledAt: '', durationMinutes: 60, location: '', interviewerIds: [] }

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ScheduleForm>({ resolver: zodResolver(scheduleSchema), values: defaults })

  const close = () => {
    reset(defaults)
    onClose()
  }

  const onSubmit = handleSubmit((values) => {
    const input = {
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      durationMinutes: Number(values.durationMinutes),
      location: values.location.trim(),
      interviewerIds: values.interviewerIds,
    }
    const handlers = {
      onSuccess: close,
      onError: (error: unknown) => {
        if (applyServerErrors(error, setError)) return
        setError('root', { message: getErrorMessage(error) })
      },
    }
    if (interview) update.mutate({ id: interview.id, input }, handlers)
    else schedule.mutate(input, handlers)
  })

  return (
    <Dialog
      open={open}
      onClose={close}
      title={interview ? `Đổi lịch vòng ${interview.round}` : 'Đặt lịch phỏng vấn'}
      description="Người phỏng vấn nhận thông báo ngay và chỉ thấy hồ sơ này."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <FormField label="Ngày giờ" htmlFor="iv-at" error={errors.scheduledAt?.message}>
            <Input
              id="iv-at"
              type="datetime-local"
              invalid={!!errors.scheduledAt}
              {...register('scheduledAt')}
            />
          </FormField>
          <FormField label="Thời lượng" htmlFor="iv-duration">
            <Select id="iv-duration" className="w-full" {...register('durationMinutes')}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} phút
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Địa điểm" htmlFor="iv-location" error={errors.location?.message}>
          <Input
            id="iv-location"
            placeholder="Phòng họp tầng 5 hoặc https://meet.google.com/…"
            invalid={!!errors.location}
            {...register('location')}
          />
        </FormField>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Người phỏng vấn</legend>
          {interviewers.isPending ? (
            <Spinner />
          ) : !interviewers.data?.length ? (
            <p className="text-sm text-slate-500">
              Chưa có tài khoản vai trò Người phỏng vấn. Nhờ Admin tạo ở trang Người dùng.
            </p>
          ) : (
            <Controller
              control={control}
              name="interviewerIds"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {interviewers.data.map((u) => {
                    const checked = field.value.includes(u.id)
                    return (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2.5 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          className="accent-primary mt-0.5 size-4"
                          checked={checked}
                          onChange={() =>
                            field.onChange(
                              checked
                                ? field.value.filter((id) => id !== u.id)
                                : [...field.value, u.id],
                            )
                          }
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-800">{u.fullName}</span>
                          <span className="block truncate text-xs text-slate-500">{u.email}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            />
          )}
          {errors.interviewerIds && (
            <p role="alert" className="text-sm text-red-600">
              {errors.interviewerIds.message}
            </p>
          )}
        </fieldset>

        {errors.root && (
          <p role="alert" className="text-sm text-red-600">
            {errors.root.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close} disabled={pending}>
            Huỷ
          </Button>
          <Button type="submit" loading={pending}>
            {interview ? 'Lưu thay đổi' : 'Đặt lịch'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
