import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button, Dialog, FormField, Input, Select, Spinner } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import {
  useInterviewers,
  useInterviews,
  useScheduleInterview,
  useUpdateInterview,
} from '../hooks/use-interviews'
import { formatTime, toLocalInput } from '../lib/format'
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

  const at = useWatch({ control, name: 'scheduledAt' })
  const duration = Number(useWatch({ control, name: 'durationMinutes' }) ?? 60)
  const start = at ? new Date(at).getTime() : NaN
  const valid = Number.isFinite(start)
  const around = useInterviews(
    valid
      ? {
          from: new Date(start - 12 * 3_600_000).toISOString(),
          to: new Date(start + 12 * 3_600_000).toISOString(),
        }
      : {},
    { enabled: open && valid },
  )
  const busyAt = (userId: string) => {
    if (!valid) return null
    const end = start + duration * 60_000
    const hit = around.data?.find((iv) => {
      if (iv.id === interview?.id || iv.status === 'CANCELLED') return false
      if (!iv.interviewers.some((p) => p.id === userId)) return false
      const s = new Date(iv.scheduledAt).getTime()
      return s < end && start < s + iv.durationMinutes * 60_000
    })
    return hit ? formatTime(hit.scheduledAt) : null
  }

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
          <legend className="type-label">Người phỏng vấn</legend>
          {interviewers.isPending ? (
            <Spinner />
          ) : !interviewers.data?.length ? (
            <p className="text-ink-muted text-sm">
              Chưa có tài khoản vai trò Interviewer. Nhờ Admin tạo ở trang Người dùng.
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
                        className="border-line hover:bg-canvas flex cursor-pointer items-start gap-2 rounded-sm border p-2.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="accent-brand mt-0.5 size-4"
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
                          <span className="text-ink block font-medium">{u.fullName}</span>
                          <span className="type-caption block truncate">{u.email}</span>
                          {busyAt(u.id) && (
                            <span className="text-warn block text-[13px] font-medium">
                              Đã có buổi khác lúc {busyAt(u.id)}
                            </span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            />
          )}
          {errors.interviewerIds && (
            <p role="alert" className="text-bad text-sm">
              {errors.interviewerIds.message}
            </p>
          )}
        </fieldset>

        {errors.root && (
          <p role="alert" className="text-bad text-sm">
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
