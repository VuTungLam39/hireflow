import { ArrowLeft, Lock, Sparkles, Trash2, Upload } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { Can, ConfirmDialog, ErrorState, PageHeader } from '@/components/shared'
import {
  Button,
  buttonVariants,
  Card,
  FormField,
  Input,
  PageLoader,
  Select,
  Textarea,
} from '@/components/ui'
import { HrUploadDialog } from '@/features/applications'
import { useDepartmentOptions } from '@/features/departments'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { JobStatusBadge } from '../components/JobStatusBadge'
import { RequirementEditor } from '../components/RequirementEditor'
import {
  useCloseJob,
  useDeleteJob,
  useJob,
  usePublishJob,
  useSaveJob,
  useSaveRequirements,
  useSuggestRequirements,
} from '../hooks/use-jobs'
import { jobInfoSchema, type JobInfoForm } from '../schemas/job.schema'
import type { Job } from '../types'

/**
 * Tạo và sửa job. Luồng 2 bước theo kickoff mục 10.2:
 * 1. Tạo job nháp (title, phòng ban, JD) – POST /jobs
 * 2. Ở trang sửa: AI gợi ý tiêu chí từ JD đã lưu, HR chỉnh rồi lưu – PUT /jobs/:id/requirements
 * Vòng đời job (BR-JOB-04): job CLOSED chỉ xem; chỉ xoá được job DRAFT chưa có hồ sơ.
 */
export default function JobFormPage() {
  const { id } = useParams()
  const job = useJob(id)

  if (id && job.isPending) return <PageLoader />
  if (id && job.isError) return <ErrorState error={job.error} onRetry={job.refetch} />

  return <JobFormContent job={job.data} />
}

function JobFormContent({ job }: { job: Job | undefined }) {
  const navigate = useNavigate()
  const hasEditPermission = usePermission(job ? Permission.JobUpdate : Permission.JobCreate)
  // Job đã đóng không sửa JD, tiêu chí và không mở lại (BR-JOB-04)
  const closed = job?.status === 'CLOSED'
  const canEdit = hasEditPermission && !closed
  const departments = useDepartmentOptions()
  const saveJob = useSaveJob()
  const suggest = useSuggestRequirements()
  const saveRequirements = useSaveRequirements()
  const publish = usePublishJob()
  const close = useCloseJob()
  const remove = useDeleteJob()
  const [confirm, setConfirm] = useState<'publish' | 'close' | 'delete' | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const {
    register,
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

  const onSubmit = handleSubmit((input) =>
    saveJob.mutate(
      { id: job?.id, input },
      {
        // Tạo xong chuyển sang trang sửa để làm bước 2 (tiêu chí)
        onSuccess: (saved) => !job && navigate(links.jobEdit(saved.id), { replace: true }),
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    ),
  )

  const action = confirm === 'publish' ? publish : confirm === 'delete' ? remove : close
  const deletable = job?.status === 'DRAFT' && job.applicationCount === 0

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to={paths.jobs}>
            <ArrowLeft className="size-4" />
            Tin tuyển dụng
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {job ? job.title : 'Tạo job mới'}
            {job && <JobStatusBadge status={job.status} />}
          </span>
        }
        description={
          job &&
          (closed ? (
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" />
              Tin đã đóng: chỉ xem, không sửa JD và tiêu chí. Phiên bản tiêu chí: {job.jdVersion}
            </span>
          ) : (
            `Phiên bản tiêu chí: ${job.jdVersion}`
          ))
        }
        actions={
          job && (
            <>
              <Link
                to={links.applications({ jobId: job.id })}
                className={buttonVariants({ variant: 'secondary' })}
              >
                Hồ sơ ({job.applicationCount})
              </Link>
              <Link
                to={links.jobRanking(job.id)}
                className={buttonVariants({ variant: 'secondary' })}
              >
                Bảng xếp hạng
              </Link>
              <Can permission={Permission.ApplicationCreate}>
                {job.status !== 'DRAFT' && (
                  <Link
                    to={links.jobMatches(job.id)}
                    className={buttonVariants({ variant: 'secondary' })}
                  >
                    <Sparkles />
                    Ứng viên cũ phù hợp
                  </Link>
                )}
              </Can>
              <Can permission={Permission.ApplicationCreate}>
                {job.status === 'OPEN' && (
                  <Button variant="secondary" onClick={() => setUploadOpen(true)}>
                    <Upload />
                    Tải CV hộ
                  </Button>
                )}
              </Can>
              <Can permission={Permission.JobUpdate}>
                {deletable && (
                  <Button variant="danger-outline" onClick={() => setConfirm('delete')}>
                    <Trash2 />
                    Xoá tin nháp
                  </Button>
                )}
              </Can>
              <Can permission={Permission.JobPublish}>
                {job.status === 'DRAFT' && (
                  <Button onClick={() => setConfirm('publish')}>Đăng tin</Button>
                )}
                {job.status === 'OPEN' && (
                  <Button variant="danger-outline" onClick={() => setConfirm('close')}>
                    Đóng tin
                  </Button>
                )}
              </Can>
            </>
          )
        }
      />

      <Card className="space-y-5">
        <StepTitle step={1}>Thông tin job</StepTitle>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Tiêu đề" htmlFor="job-title" error={errors.title?.message}>
              <Input
                id="job-title"
                disabled={!canEdit}
                invalid={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label="Phòng ban" htmlFor="job-dept" error={errors.departmentId?.message}>
              <Select
                id="job-dept"
                className="w-full"
                disabled={!canEdit}
                {...register('departmentId')}
              >
                <option value="">— Chọn phòng ban —</option>
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
                placeholder="Hà Nội / Remote"
                disabled={!canEdit}
                invalid={!!errors.location}
                {...register('location')}
              />
            </FormField>
          </div>
          <FormField label="Mô tả công việc (JD)" htmlFor="job-jd" error={errors.jdText?.message}>
            <Textarea
              id="job-jd"
              rows={8}
              placeholder="Dán JD vào đây. AI sẽ tách JD thành danh sách tiêu chí ở bước 2."
              disabled={!canEdit}
              invalid={!!errors.jdText}
              {...register('jdText')}
            />
          </FormField>
          {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
          {canEdit && (
            <div className="flex justify-end">
              <Button type="submit" loading={saveJob.isPending} disabled={!!job && !isDirty}>
                {job ? 'Lưu thông tin' : 'Tạo job nháp'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      <Card className="space-y-5">
        <StepTitle step={2} muted={!job}>
          Tiêu chí đánh giá
        </StepTitle>
        {job ? (
          <RequirementEditor
            initial={job.requirements}
            readOnly={!canEdit}
            saving={saveRequirements.isPending}
            onSave={(requirements) => saveRequirements.mutate({ id: job.id, requirements })}
            suggesting={suggest.isPending}
            onSuggest={() => suggest.mutateAsync(job.id)}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Tạo job nháp trước, sau đó AI sẽ gợi ý tiêu chí từ JD đã lưu.
          </p>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? CONFIRM_TEXT[confirm].title : ''}
        description={confirm ? CONFIRM_TEXT[confirm].description : undefined}
        confirmLabel={confirm ? CONFIRM_TEXT[confirm].label : undefined}
        tone={confirm === 'publish' ? 'primary' : 'danger'}
        loading={action.isPending}
        onConfirm={() =>
          job &&
          action.mutate(job.id, {
            onSuccess: () => confirm === 'delete' && navigate(paths.jobs, { replace: true }),
            onSettled: () => setConfirm(null),
          })
        }
      />

      {job && (
        <HrUploadDialog
          jobId={job.id}
          jobTitle={job.title}
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={(application) => navigate(links.applicationDetail(application.id))}
        />
      )}
    </div>
  )
}

const CONFIRM_TEXT = {
  publish: {
    title: 'Đăng tin tuyển dụng?',
    description: 'Tin sẽ hiện ngay trên trang tuyển dụng công khai.',
    label: 'Đăng tin',
  },
  close: {
    title: 'Đóng tin tuyển dụng?',
    description:
      'Tin sẽ không nhận thêm hồ sơ và không mở lại được. Cần tuyển tiếp thì tạo tin mới.',
    label: 'Đóng tin',
  },
  delete: {
    title: 'Xoá tin nháp?',
    description: 'Tin chưa có hồ sơ nào nên xoá được. Tin sẽ biến mất khỏi danh sách.',
    label: 'Xoá tin',
  },
} as const

/** Tiêu đề bước có số thứ tự trong vòng tròn */
function StepTitle({
  step,
  muted,
  children,
}: {
  step: number
  muted?: boolean
  children: ReactNode
}) {
  return (
    <h2 className="flex items-center gap-3 font-semibold text-slate-900">
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-full text-sm font-semibold',
          muted ? 'bg-slate-100 text-slate-400' : 'bg-primary-soft text-primary',
        )}
      >
        {step}
      </span>
      {children}
    </h2>
  )
}
