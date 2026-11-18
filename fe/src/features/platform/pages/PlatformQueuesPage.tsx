import { PageHeader } from '@/components/shared'
import { QueueCountsTable } from '../components/QueueCountsTable'
import { usePlatformQueues } from '../hooks/use-platform'

// KH MVP 3 mục 8.2: GET /platform/queues
export default function PlatformQueuesPage() {
  const queues = usePlatformQueues()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hàng đợi hệ thống"
        description="Số việc trong từng bước xử lý CV của mọi công ty, tự cập nhật mỗi 5 giây."
      />
      <QueueCountsTable queues={queues.data} />
    </div>
  )
}
