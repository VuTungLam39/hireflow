import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useUpdateAiLimits } from '../hooks/use-platform'
import type { PlatformOrganizationDetail } from '../types'

// MVP 3 · US-25, F-PLAT-02, BR-AI-11: màn lượt mỗi ngày của Quản trị sàn

const limit = z.coerce
  .number({ message: 'Nhập một số' })
  .int('Nhập số nguyên')
  .min(0, 'Tối thiểu 0')
  .max(100_000, 'Tối đa 100.000')

const limitsSchema = z.object({ aiDailyScoreLimit: limit, aiDailyChatLimit: limit })
type LimitsForm = z.input<typeof limitsSchema>
type LimitsValues = z.output<typeof limitsSchema>

const dayLabel = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`

function Today({ label, used, cap }: { label: string; used: number; cap: number }) {
  const full = used >= cap
  return (
    <div>
      <dt className="type-caption">{label}</dt>
      <dd className={cn('mt-0.5 font-medium', full ? 'text-bad' : 'text-ink')}>
        <span className="num">{used.toLocaleString('vi-VN')}</span>
        <span className="text-ink-muted font-normal">
          {' '}
          / <span className="num">{cap.toLocaleString('vi-VN')}</span>
        </span>
        {full && <span className="text-[13px]"> · đã hết lượt</span>}
      </dd>
    </div>
  )
}

export function AiQuotaSection({ org }: { org: PlatformOrganizationDetail }) {
  const update = useUpdateAiLimits()
  const today = org.aiUsage[0] ?? { day: '', cv: 0, chat: 0 }
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<LimitsForm, unknown, LimitsValues>({
    resolver: zodResolver(limitsSchema),
    values: { aiDailyScoreLimit: org.aiDailyScoreLimit, aiDailyChatLimit: org.aiDailyChatLimit },
  })

  const onSubmit = (values: LimitsValues) =>
    update.mutate(
      { id: org.id, ...values },
      {
        onSuccess: (saved) =>
          reset({
            aiDailyScoreLimit: saved.aiDailyScoreLimit,
            aiDailyChatLimit: saved.aiDailyChatLimit,
          }),
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    )

  return (
    <section aria-labelledby="org-quota" className="space-y-6">
      <div>
        <h2 id="org-quota" className="type-heading">
          Lượt mỗi ngày
        </h2>
        <p className="type-caption mt-1">
          Tính theo giờ Việt Nam. Hết lượt đọc CV thì hồ sơ mới chờ tới 0 giờ; hết lượt hỏi thì Hỏi
          kho CV và các gợi ý tạm khoá tới 0 giờ.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Today label="Đọc CV hôm nay" used={today.cv} cap={org.aiDailyScoreLimit} />
        <Today label="Hỏi kho CV, gợi ý hôm nay" used={today.chat} cap={org.aiDailyChatLimit} />
      </dl>

      <div className="border-line overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <caption className="sr-only">Lượt đã dùng 7 ngày gần nhất</caption>
          <thead>
            <tr className="border-line border-b">
              {['Ngày', 'Đọc CV', 'Hỏi kho CV, gợi ý'].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={cn('type-overline h-10 px-4', i === 0 ? 'text-left' : 'text-right')}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {org.aiUsage.map((d, i) => (
              <tr key={d.day} className="border-line-soft border-b last:border-b-0">
                <th scope="row" className="text-ink h-10 px-4 text-left font-medium">
                  {i === 0 ? `Hôm nay · ${dayLabel(d.day)}` : dayLabel(d.day)}
                </th>
                <td className="num px-4 text-right">{d.cv.toLocaleString('vi-VN')}</td>
                <td className="num px-4 text-right">{d.chat.toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Hạn mức đọc CV mỗi ngày"
            htmlFor="aiDailyScoreLimit"
            error={errors.aiDailyScoreLimit?.message}
          >
            <Input
              id="aiDailyScoreLimit"
              type="number"
              inputMode="numeric"
              min={0}
              max={100_000}
              invalid={!!errors.aiDailyScoreLimit}
              {...register('aiDailyScoreLimit')}
            />
          </FormField>
          <FormField
            label="Hạn mức hỏi kho CV, gợi ý mỗi ngày"
            htmlFor="aiDailyChatLimit"
            error={errors.aiDailyChatLimit?.message}
          >
            <Input
              id="aiDailyChatLimit"
              type="number"
              inputMode="numeric"
              min={0}
              max={100_000}
              invalid={!!errors.aiDailyChatLimit}
              {...register('aiDailyChatLimit')}
            />
          </FormField>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="secondary" disabled={!isDirty} loading={update.isPending}>
            Lưu hạn mức
          </Button>
          {errors.root && (
            <p role="alert" className="text-bad type-label">
              {errors.root.message}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
