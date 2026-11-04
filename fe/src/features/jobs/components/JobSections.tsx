import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ConfirmDialog } from '@/components/shared'
import { Button, FormField, Input, Select, Textarea } from '@/components/ui'
import { HrUploadDialog } from '@/features/applications'
import { useDepartmentOptions } from '@/features/departments'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useCanEditJob } from '../hooks/use-can-edit-job'
import { JOB_CONFIRM, REQUIREMENT_TYPE } from '../constants'
import {
  useCloseJob,
  useDeleteJob,
  usePublishJob,
  useSaveJob,
  useSaveRequirements,
  useSuggestRequirements,
} from '../hooks/use-jobs'
import { jobInfoSchema, type JobInfoForm } from '../schemas/job.schema'
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
    values: {
      title: job?.title ?? '',
      departmentId: job?.department.id ?? '',
      location: job?.location ?? '',
      jdText: job?.jdText ?? '',
    },
  })
  const draft = useWatch({ control })
  const deptName = departments.data?.find((d) => d.id === draft.departmentId)?.name

  const preview = (
    <>
      <p className="text-ink font-display text-2xl font-semibold">{draft.title || 'Tên vị trí'}</p>
      <p className="text-ink-2 mt-1 text-sm">
        {deptName ?? 'Phòng ban'} · {draft.location || 'Địa điểm'}
      </p>
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

  const onSubmit = handleSubmit((input) =>
    saveJob.mutate(
      { id: job?.id, input },
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
  onUploaded,
}: {
  job: Job
  onDeleted?: () => void
  onUploaded?: (applicationId: string) => void
}) {
  const canEdit = useCanEditJob(job)
  const canPublish = usePermission(Permission.JobPublish)
  const canUpload = usePermission(Permission.ApplicationCreate)
  const publish = usePublishJob()
  const close = useCloseJob()
  const remove = useDeleteJob()
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const action = confirm === 'publish' ? publish : confirm === 'delete' ? remove : close
  const deletable = job.status === 'DRAFT' && job.applicationCount === 0 && canEdit
  const noRequirements = job.requirements.length === 0

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      {canUpload && job.status === 'OPEN' && (
        <Button variant="secondary" size="sm" onClick={() => setUploadOpen(true)}>
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
      <HrUploadDialog
        jobId={job.id}
        jobTitle={job.title}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(application) => onUploaded?.(application.id)}
      />
    </div>
  )
}
