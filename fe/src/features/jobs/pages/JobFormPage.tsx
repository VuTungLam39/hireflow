import { ArrowLeft, MoreHorizontal, Trash2, Upload } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog, ErrorState, PageHeader, Summary } from '@/components/shared'
import {
  Button,
  FormField,
  Input,
  Popover,
  Select,
  Skeleton,
  Textarea,
  buttonVariants,
  menuItemClass,
} from '@/components/ui'
import { HrUploadDialog } from '@/features/applications'
import { useDepartmentOptions } from '@/features/departments'
import { usePermission } from '@/hooks/use-permission'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { JobStatusBadge } from '../components/JobStatusBadge'
import { RequirementEditor } from '../components/RequirementEditor'
import { REQUIREMENT_TYPE } from '../constants'
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

// F-JOB-02 → 09 · BR-JOB-04 · Design Spec 6.5
export default function JobFormPage() {
  const { id } = useParams()
  const job = useJob(id)

  if (id && job.isPending)
    return (
      <div aria-busy aria-label="Đang tải tin" className="space-y-6">
        <Skeleton className="h-10 w-96 max-w-full" />
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  if (id && job.isError)
    return <ErrorState title="Chưa mở được tin" error={job.error} onRetry={job.refetch} />

  return <JobFormContent job={job.data} />
}

type Confirm = 'publish' | 'close' | 'delete'

function JobFormContent({ job }: { job: Job | undefined }) {
  const navigate = useNavigate()
  const hasEditPermission = usePermission(job ? Permission.JobUpdate : Permission.JobCreate)
  const canPublish = usePermission(Permission.JobPublish)
  const canUpload = usePermission(Permission.ApplicationCreate)
  const closed = job?.status === 'CLOSED'
  const canEdit = hasEditPermission && !closed
  const departments = useDepartmentOptions()
  const saveJob = useSaveJob()
  const suggest = useSuggestRequirements()
  const saveRequirements = useSaveRequirements()
  const publish = usePublishJob()
  const close = useCloseJob()
  const remove = useDeleteJob()
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [menu, setMenu] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

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

  const onSubmit = handleSubmit((input) =>
    saveJob.mutate(
      { id: job?.id, input },
      {
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
  const deletable = job?.status === 'DRAFT' && job.applicationCount === 0 && hasEditPermission
  const canPublishNow = !!job && job.status === 'DRAFT' && canPublish
  const noRequirements = !!job && job.requirements.length === 0
  const deptName = departments.data?.find((d) => d.id === draft.departmentId)?.name

  const hasMenu =
    !!job &&
    ((canUpload && job.status === 'OPEN') ||
      (canUpload && job.status !== 'DRAFT') ||
      deletable ||
      (canPublish && job.status === 'OPEN'))

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={
          <Link to={paths.jobs}>
            <ArrowLeft className="size-4" />
            Tin tuyển dụng
          </Link>
        }
        title={job ? job.title : 'Tạo tin tuyển dụng'}
        description={
          job ? (
            <Summary
              items={[
                <JobStatusBadge key="s" status={job.status} />,
                job.publishedAt && `đăng ${formatDate(job.publishedAt)}`,
                `tiêu chí phiên bản ${job.jdVersion}`,
                closed && 'tin đã đóng: chỉ xem',
              ]}
            />
          ) : (
            'Bước 1: điền nội dung tin và lưu nháp. Bước 2: đặt tiêu chí chấm, rồi đăng.'
          )
        }
        actions={
          job && (
            <>
              <Link
                to={links.applications({ jobId: job.id })}
                className={buttonVariants({ variant: 'quiet' })}
              >
                {job.applicationCount.toLocaleString('vi-VN')} hồ sơ
              </Link>
              <Link
                to={links.jobRanking(job.id)}
                className={buttonVariants({ variant: 'secondary' })}
              >
                Xếp hạng
              </Link>
              {hasMenu && (
                <Popover
                  open={menu}
                  onOpenChange={setMenu}
                  align="end"
                  role="menu"
                  label="Thao tác khác"
                  className="w-60"
                  trigger={(props) => (
                    <Button variant="secondary" size="icon" aria-label="Thao tác khác" {...props}>
                      <MoreHorizontal />
                    </Button>
                  )}
                >
                  {canUpload && job.status === 'OPEN' && (
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => {
                        setMenu(false)
                        setUploadOpen(true)
                      }}
                    >
                      <Upload />
                      Tải CV hộ ứng viên
                    </button>
                  )}
                  {canUpload && job.status !== 'DRAFT' && (
                    <Link role="menuitem" to={links.jobMatches(job.id)} className={menuItemClass}>
                      Ứng viên cũ phù hợp
                    </Link>
                  )}
                  {deletable && (
                    <button
                      type="button"
                      role="menuitem"
                      className={`${menuItemClass} text-bad hover:text-bad`}
                      onClick={() => {
                        setMenu(false)
                        setConfirm('delete')
                      }}
                    >
                      <Trash2 />
                      Xoá tin nháp
                    </button>
                  )}
                  {canPublish && job.status === 'OPEN' && (
                    <button
                      type="button"
                      role="menuitem"
                      className={`${menuItemClass} text-bad hover:text-bad`}
                      onClick={() => {
                        setMenu(false)
                        setConfirm('close')
                      }}
                    >
                      Đóng tin
                    </button>
                  )}
                </Popover>
              )}
              {canPublishNow && (
                <Button
                  onClick={() => setConfirm('publish')}
                  disabled={noRequirements}
                  title={noRequirements ? 'Cần ít nhất một tiêu chí để đăng tin' : undefined}
                >
                  Đăng tin
                </Button>
              )}
            </>
          )
        }
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="job-info" className="min-w-0 space-y-6">
          <h2 id="job-info" className="type-heading">
            Nội dung tin
          </h2>
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
              hint="Gồm mô tả, yêu cầu, quyền lợi. Bạn có thể gợi ý tiêu chí từ mô tả này ở cột bên phải."
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

          <details className="border-line group rounded-md border">
            <summary className="type-subheading flex cursor-pointer items-center justify-between px-4 py-3">
              Ứng viên sẽ thấy
              <span className="type-caption group-open:hidden">Mở xem trước</span>
            </summary>
            <div className="border-line bg-surface border-t px-5 py-5">
              <p className="type-overline">
                {deptName ?? 'Phòng ban'} · {draft.location || 'Địa điểm'}
              </p>
              <p className="text-ink mt-1 font-serif text-2xl font-semibold">
                {draft.title || 'Tên vị trí'}
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
            </div>
          </details>
        </section>

        <section aria-labelledby="job-req" className="min-w-0 space-y-4">
          <h2 id="job-req" className="type-heading">
            Tiêu chí chấm
          </h2>
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
              Lưu nháp nội dung tin trước. Sau đó bạn đặt tiêu chí ở đây, hoặc gợi ý tiêu chí từ mô
              tả công việc đã lưu.
            </p>
          )}
        </section>
      </div>

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
    description: 'Tin sẽ hiện ngay trên trang tuyển dụng công khai và bắt đầu nhận hồ sơ.',
    label: 'Đăng tin',
  },
  close: {
    title: 'Đóng tin tuyển dụng?',
    description:
      'Tin ngừng nhận hồ sơ mới và không mở lại được; hồ sơ đã có vẫn xử lý bình thường. Cần tuyển tiếp thì tạo tin mới.',
    label: 'Đóng tin',
  },
  delete: {
    title: 'Xoá tin nháp?',
    description: 'Tin chưa có hồ sơ nào nên xoá được. Tin sẽ biến mất khỏi danh sách.',
    label: 'Xoá tin nháp',
  },
} as const
