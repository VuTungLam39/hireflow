import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ConfirmDialog } from '@/components/shared'
import { Button, FormField, Input, Select, Textarea } from '@/components/ui'
import { useDepartmentOptions } from '@/features/departments'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useCanEditJob } from '../hooks/use-can-edit-job'
import { withDaySlashes } from '@/lib/vn-day'
import {
  EMPLOYMENT_TYPE,
  HEADCOUNT_MAX,
  JOB_CONFIRM,
  JOB_LEVEL,
  REQUIREMENT_TYPE,
  SALARY_VISIBILITY,
  WORK_MODE,
} from '../constants'
import { salaryOf } from '../lib/job-details'
import { JobFacts } from './JobFacts'
import {
  useCloneJob,
  useCloseJob,
  useDeleteJob,
  usePublishJob,
  useSaveJob,
  useSaveRequirements,
  useSuggestRequirements,
} from '../hooks/use-jobs'
import { jobInfoSchema, toJobInfoForm, toJobInput, type JobInfoForm } from '../schemas/job.schema'
import type { Job } from '../types'
import { RequirementEditor } from './RequirementEditor'

// F-JOB-02, 03
export function JobInfoSection({
  job,
  heading = true,
  split,
  onCreated,
}: {
  job: Job | undefined
  heading?: boolean
  split?: boolean
  onCreated?: (id: string) => void
}) {
  const canEdit = useCanEditJob(job)
  const departments = useDepartmentOptions()
  const saveJob = useSaveJob()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<JobInfoForm>({
    resolver: zodResolver(jobInfoSchema),
    values: toJobInfoForm(job),
  })
  const draft = useWatch({ control })
  const deptName = departments.data?.find((d) => d.id === draft.departmentId)?.name
  const parsedDraft = jobInfoSchema.safeParse(draft)
  const draftFacts = parsedDraft.success
    ? (() => {
        const input = toJobInput(parsedDraft.data)
        return {
          salary: salaryOf({
            salaryVisibility: parsedDraft.data.salaryVisibility,
            salaryMin: input.salaryMin ?? null,
            salaryMax: input.salaryMax ?? null,
          }),
          level: input.level ?? null,
          employmentType: parsedDraft.data.employmentType,
          workMode: parsedDraft.data.workMode,
          headcount: parsedDraft.data.headcount,
          deadline: input.deadline ?? null,
        }
      })()
    : null

  const preview = (
    <>
      <p className="text-ink font-display text-2xl font-semibold">{draft.title || 'Tên vị trí'}</p>
      <p className="text-ink-2 mt-1 text-sm">
        {deptName ?? 'Phòng ban'} · {draft.location || 'Địa điểm'}
      </p>
      {draftFacts && <JobFacts job={draftFacts} columns={2} className="mt-4" />}
      <p className="type-read mt-3 line-clamp-6 whitespace-pre-line">
        {draft.jdText || 'Mô tả công việc sẽ hiện ở đây.'}
      </p>
      {job && job.requirements.length > 0 && (
        <ul className="mt-4 space-y-1">
          {job.requirements.map((r) => (
            <li key={r.id} className="type-body">
              {r.label}
              <span className="text-ink-muted">
                {' '}
                · {REQUIREMENT_TYPE[r.type].label.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="type-caption mt-4">Không hiện trọng số và từ khoá cho ứng viên.</p>
    </>
  )

  const onSubmit = handleSubmit((form) =>
    saveJob.mutate(
      { id: job?.id, input: toJobInput(form) },
      {
        onSuccess: (saved) => !job && onCreated?.(saved.id),
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    ),
  )

  return (
    <section
      aria-labelledby={heading ? 'job-info' : undefined}
      className={cn(
        'min-w-0 gap-6',
        split ? 'grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start' : 'space-y-6',
      )}
    >
      {heading && (
        <h2 id="job-info" className={cn('type-heading', split && 'lg:col-span-2')}>
          Nội dung tin
        </h2>
      )}
      <div className="min-w-0 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Tên vị trí" htmlFor="job-title" error={errors.title?.message}>
            <Input
              id="job-title"
              placeholder="Ví dụ: Backend Developer (NestJS)"
              disabled={!canEdit}
              invalid={!!errors.title}
              {...register('title')}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phòng ban" htmlFor="job-dept" error={errors.departmentId?.message}>
              <Select
                id="job-dept"
                className="w-full"
                disabled={!canEdit}
                {...register('departmentId')}
              >
                <option value="">Chọn phòng ban</option>
                {job && !departments.data?.some((d) => d.id === job.department.id) && (
                  <option value={job.department.id}>{job.department.name}</option>
                )}
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Địa điểm" htmlFor="job-location" error={errors.location?.message}>
              <Input
                id="job-location"
                placeholder="Hà Nội · Remote"
                disabled={!canEdit}
                invalid={!!errors.location}
                {...register('location')}
              />
            </FormField>
          </div>
          <FormField
            label="Mô tả công việc"
            htmlFor="job-jd"
            error={errors.jdText?.message}
            hint="Gồm mô tả, yêu cầu, quyền lợi. Bạn có thể gợi ý tiêu chí từ mô tả này ở phần tiêu chí chấm."
          >
            <Textarea
              id="job-jd"
              rows={14}
              className="type-read max-w-none"
              placeholder="Dán mô tả công việc vào đây"
              disabled={!canEdit}
              invalid={!!errors.jdText}
              {...register('jdText')}
            />
          </FormField>

          <fieldset className="border-line space-y-4 border-t pt-5">
            <legend className="type-subheading pr-2">Thông tin hiển thị cho ứng viên</legend>
            <p className="type-caption -mt-2">
              Không ảnh hưởng điểm chấm và không tạo phiên bản tiêu chí mới.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Lương từ (triệu/tháng)"
                htmlFor="job-salary-min"
                error={errors.salaryMin?.message}
              >
                <Input
                  id="job-salary-min"
                  inputMode="decimal"
                  placeholder="20"
                  disabled={!canEdit}
                  invalid={!!errors.salaryMin}
                  {...register('salaryMin')}
                />
              </FormField>
              <FormField
                label="Lương đến (triệu/tháng)"
                htmlFor="job-salary-max"
                error={errors.salaryMax?.message}
              >
                <Input
                  id="job-salary-max"
                  inputMode="decimal"
                  placeholder="35"
                  disabled={!canEdit}
                  invalid={!!errors.salaryMax}
                  {...register('salaryMax')}
                />
              </FormField>
              <FormField label="Hiển thị lương" htmlFor="job-salary-visibility">
                <Select
                  id="job-salary-visibility"
                  className="w-full"
                  disabled={!canEdit}
                  {...register('salaryVisibility')}
                >
                  {Object.entries(SALARY_VISIBILITY).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Cấp bậc" htmlFor="job-level">
                <Select
                  id="job-level"
                  className="w-full"
                  disabled={!canEdit}
                  {...register('level')}
                >
                  <option value="">Không ghi</option>
                  {Object.entries(JOB_LEVEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Hình thức" htmlFor="job-employment-type">
                <Select
                  id="job-employment-type"
                  className="w-full"
                  disabled={!canEdit}
                  {...register('employmentType')}
                >
                  {Object.entries(EMPLOYMENT_TYPE).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Làm việc" htmlFor="job-work-mode">
                <Select
                  id="job-work-mode"
                  className="w-full"
                  disabled={!canEdit}
                  {...register('workMode')}
                >
                  {Object.entries(WORK_MODE).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Số lượng cần tuyển"
                htmlFor="job-headcount"
                error={errors.headcount?.message}
              >
                <Input
                  id="job-headcount"
                  type="number"
                  min={1}
                  max={HEADCOUNT_MAX}
                  disabled={!canEdit}
                  invalid={!!errors.headcount}
                  {...register('headcount', { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Hạn nộp hồ sơ"
                htmlFor="job-deadline"
                error={errors.deadline?.message}
                hint="Để trống nếu không giới hạn. Quá hạn thì tin ẩn khỏi trang tuyển dụng."
              >
                <Input
                  id="job-deadline"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  disabled={!canEdit}
                  invalid={!!errors.deadline}
                  {...register('deadline', {
                    onChange: (e) => {
                      e.target.value = withDaySlashes(e.target.value)
                    },
                  })}
                />
              </FormField>
            </div>
            <FormField
              label="Quyền lợi"
              htmlFor="job-benefits"
              error={errors.benefits?.message}
              hint="Mỗi dòng một ý. Không dùng để gợi ý tiêu chí hay chấm điểm."
            >
              <Textarea
                id="job-benefits"
                rows={5}
                className="type-read max-w-none"
                placeholder={'Lương tháng 13\nBảo hiểm sức khoẻ cho bản thân và gia đình'}
                disabled={!canEdit}
                invalid={!!errors.benefits}
                {...register('benefits')}
              />
            </FormField>
          </fieldset>

          {errors.root && (
            <p role="alert" className="text-bad type-label">
              {errors.root.message}
            </p>
          )}
          {canEdit && (
            <div className="flex justify-end">
              <Button
                type="submit"
                variant={job ? 'secondary' : 'primary'}
                loading={saveJob.isPending}
                disabled={!!job && !isDirty}
              >
                {job ? 'Lưu nội dung tin' : 'Lưu nháp'}
              </Button>
            </div>
          )}
        </form>
      </div>

      {split ? (
        <aside
          aria-label="Ứng viên sẽ thấy"
          className="border-line bg-canvas/50 rounded-md border px-5 py-5 lg:sticky lg:top-0"
        >
          <p className="type-caption mb-3">Ứng viên sẽ thấy</p>
          {preview}
        </aside>
      ) : (
        <details className="border-line group rounded-md border">
          <summary className="type-subheading flex cursor-pointer items-center justify-between px-4 py-3">
            Ứng viên sẽ thấy
            <span className="type-caption group-open:hidden">Mở xem trước</span>
          </summary>
          <div className="border-line bg-surface border-t px-5 py-5">{preview}</div>
        </details>
      )}
    </section>
  )
}

// F-JOB-04 → 06
export function JobRequirementsSection({
  job,
  heading = true,
}: {
  job: Job | undefined
  heading?: boolean
}) {
  const canEdit = useCanEditJob(job)
  const suggest = useSuggestRequirements()
  const saveRequirements = useSaveRequirements()

  return (
    <section aria-labelledby={heading ? 'job-req' : undefined} className="min-w-0 space-y-4">
      {heading && (
        <h2 id="job-req" className="type-heading">
          Tiêu chí chấm
        </h2>
      )}
      {job ? (
        <RequirementEditor
          initial={job.requirements}
          readOnly={!canEdit}
          saving={saveRequirements.isPending}
          recalcCount={job.status === 'OPEN' ? job.applicationCount : undefined}
          onSave={(requirements) => saveRequirements.mutate({ id: job.id, requirements })}
          suggesting={suggest.isPending}
          onSuggest={() => suggest.mutateAsync(job.id)}
        />
      ) : (
        <p className="border-line type-body rounded-md border border-dashed px-4 py-5">
          Lưu nháp nội dung tin trước. Sau đó bạn đặt tiêu chí ở đây, hoặc gợi ý tiêu chí từ mô tả
          công việc đã lưu.
        </p>
      )}
    </section>
  )
}

type Confirm = 'publish' | 'close' | 'delete'

// F-JOB-07 → 09
export function JobActionBar({
  job,
  onDeleted,
  onUpload,
}: {
  job: Job
  onDeleted?: () => void
  onUpload?: () => void
}) {
  const canEdit = useCanEditJob(job)
  const canPublish = usePermission(Permission.JobPublish)
  const canUpload = usePermission(Permission.ApplicationCreate)
  const canCreate = usePermission(Permission.JobCreate)
  const clone = useCloneJob()
  const publish = usePublishJob()
  const close = useCloseJob()
  const remove = useDeleteJob()
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const action = confirm === 'publish' ? publish : confirm === 'delete' ? remove : close
  const deletable = job.status === 'DRAFT' && job.applicationCount === 0 && canEdit
  const noRequirements = job.requirements.length === 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canCreate && (
        <Button
          variant="quiet"
          size="sm"
          loading={clone.isPending}
          onClick={() => clone.mutate(job.id)}
        >
          <Copy />
          Nhân bản
        </Button>
      )}
      {deletable && (
        <Button variant="danger-quiet" size="sm" onClick={() => setConfirm('delete')}>
          <Trash2 />
          Xoá tin nháp
        </Button>
      )}
      {canPublish && job.status === 'OPEN' && (
        <Button variant="danger-quiet" size="sm" onClick={() => setConfirm('close')}>
          Đóng tin
        </Button>
      )}
      {canUpload && onUpload && job.status === 'OPEN' && (
        <Button variant="secondary" size="sm" onClick={onUpload}>
          <Upload />
          Tải CV hộ ứng viên
        </Button>
      )}
      {canPublish && job.status === 'DRAFT' && (
        <Button
          size="sm"
          onClick={() => setConfirm('publish')}
          disabled={noRequirements}
          title={noRequirements ? 'Cần ít nhất một tiêu chí để đăng tin' : undefined}
        >
          Đăng tin
        </Button>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? JOB_CONFIRM[confirm].title : ''}
        description={confirm ? JOB_CONFIRM[confirm].description : undefined}
        confirmLabel={confirm ? JOB_CONFIRM[confirm].label : undefined}
        tone={confirm === 'publish' ? 'primary' : 'danger'}
        loading={action.isPending}
        onConfirm={() =>
          action.mutate(job.id, {
            onSuccess: () => confirm === 'delete' && onDeleted?.(),
            onSettled: () => setConfirm(null),
          })
        }
      />
    </div>
  )
}
