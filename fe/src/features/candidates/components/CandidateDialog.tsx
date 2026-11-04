import { useState } from 'react'
import { Can, DetailDialog, ErrorState, Summary } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { useCandidate } from '../hooks/use-candidates'
import { CandidateApplications, ContactForm, DangerZone } from './CandidateSections'

type Tab = 'cand-apps' | 'cand-info'

// US-14, US-16
export function CandidateDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useCandidate(id)
  const candidate = query.data
  const [tab, setTab] = useState<Tab>('cand-apps')
  const anonymized = !!candidate?.anonymizedAt

  return (
    <DetailDialog
      open
      onClose={onClose}
      label="Nội dung ứng viên"
      title={candidate?.fullName ?? 'Ứng viên'}
      subtitle={
        candidate && (
          <Summary
            items={[
              !anonymized && candidate.email,
              candidate.phone,
              `trong kho từ ${formatDate(candidate.createdAt)}`,
              anonymized && `đã ẩn danh ${formatDate(candidate.anonymizedAt)}`,
            ]}
          />
        )
      }
      tabs={
        candidate
          ? [
              { id: 'cand-apps', label: 'Các lần nộp', count: candidate.applications.length },
              { id: 'cand-info', label: 'Thông tin liên hệ' },
            ]
          : undefined
      }
      tab={tab}
      onTab={setTab}
    >
      {query.isPending ? (
        <div aria-busy aria-label="Đang tải ứng viên" className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title="Chưa mở được ứng viên" error={query.error} onRetry={query.refetch} />
      ) : tab === 'cand-apps' ? (
        <CandidateApplications candidate={query.data} />
      ) : (
        <div className="space-y-8">
          <ContactForm candidate={query.data} />
          {!anonymized && (
            <Can permission={Permission.CandidateAnonymize}>
              <DangerZone candidate={query.data} />
            </Can>
          )}
        </div>
      )}
    </DetailDialog>
  )
}
