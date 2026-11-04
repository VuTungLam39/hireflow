import { DetailDialog } from '@/components/shared'
import { JobInfoSection } from '@/features/jobs'
import { useOpenDetail } from '@/hooks/use-detail'

// F-JOB-02
export function JobCreateDialog({ onClose }: { id: string; onClose: () => void }) {
  const openDetail = useOpenDetail()

  return (
    <DetailDialog
      open
      onClose={onClose}
      label="Tạo tin tuyển dụng"
      title="Tạo tin tuyển dụng"
      subtitle={
        <>
          <span className="text-ink-2 font-medium">Bước 1/2 · nội dung tin.</span> Lưu nháp xong,
          bạn đặt tiêu chí chấm rồi đăng.
        </>
      }
    >
      <JobInfoSection
        job={undefined}
        heading={false}
        onCreated={(id) => openDetail('job', id, 'criteria', { replace: true })}
      />
    </DetailDialog>
  )
}
