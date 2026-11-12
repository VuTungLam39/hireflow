import { ArrowLeft, MoreHorizontal, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog, ErrorState, PageHeader, Summary } from '@/components/shared'
import { Button, Popover, Skeleton, buttonVariants, menuItemClass } from '@/components/ui'
import { HrUploadDialog } from '@/features/applications'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { JobStatusBadge } from '../components/JobStatusBadge'
import { JobInfoSection, JobRequirementsSection } from '../components/JobSections'
import { JOB_CONFIRM } from '../constants'
import { useCloseJob, useDeleteJob, useJob, usePublishJob } from '../hooks/use-jobs'
import type { Job } from '../types'
import { useCrumb } from '@/hooks/use-crumb'

// F-JOB-02 → 09 · BR-JOB-04 · Design Spec 6.5
export default function JobFormPage() {
  const { id } = useParams()
  const job = useJob(id)
  useCrumb(id ? job.data?.title : 'Tạo tin')

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
  if (id && job.isError && !job.data)
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
  const publish = usePublishJob()
  const close = useCloseJob()
  const remove = useDeleteJob()
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [menu, setMenu] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const action = confirm === 'publish' ? publish : confirm === 'delete' ? remove : close
  const deletable = job?.status === 'DRAFT' && job.applicationCount === 0 && hasEditPermission
  const canPublishNow = !!job && job.status === 'DRAFT' && canPublish
  const noRequirements = !!job && job.requirements.length === 0

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

      <div className={job ? 'grid gap-10 lg:grid-cols-2' : undefined}>
        <JobInfoSection
          job={job}
          split={!job}
          onCreated={(id) => void navigate(links.jobEdit(id), { replace: true })}
        />
        {job && <JobRequirementsSection job={job} />}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? JOB_CONFIRM[confirm].title : ''}
        description={confirm ? JOB_CONFIRM[confirm].description : undefined}
        confirmLabel={confirm ? JOB_CONFIRM[confirm].label : undefined}
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
