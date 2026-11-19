import { Select } from '@/components/ui'
import { useAssignHiringManager, useHiringManagers } from '../hooks/use-jobs'
import type { Job } from '../types'

// MVP 3.1 · F-JOB-12, BR-JOB-12: HM phụ trách thấy tin, hồ sơ, debrief và duyệt offer dù khác phòng
export function HiringManagerField({ job, canEdit }: { job: Job; canEdit: boolean }) {
  const options = useHiringManagers(canEdit)
  const assign = useAssignHiringManager(job.id)
  return (
    <section aria-labelledby="job-hm" className="space-y-1.5">
      <h3 id="job-hm" className="type-heading">
        Hiring Manager phụ trách
      </h3>
      {canEdit ? (
        <Select
          aria-labelledby="job-hm"
          className="w-full max-w-sm"
          value={job.hiringManager?.id ?? ''}
          disabled={assign.isPending || options.isPending}
          onChange={(e) => assign.mutate(e.target.value || null)}
        >
          <option value="">Chưa gán (Hiring Manager của phòng ban)</option>
          {job.hiringManager && !options.data?.some((u) => u.id === job.hiringManager!.id) && (
            <option value={job.hiringManager.id}>{job.hiringManager.fullName}</option>
          )}
          {options.data?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
              {u.department ? ` · ${u.department.name}` : ''}
            </option>
          ))}
        </Select>
      ) : (
        <p className="type-body">{job.hiringManager?.fullName ?? 'Chưa gán'}</p>
      )}
      <p className="type-caption">
        Người được gán xem được tin, hồ sơ và tổng hợp phỏng vấn của tin này dù khác phòng ban.
      </p>
    </section>
  )
}
