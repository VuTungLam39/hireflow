import { lazy, Suspense, useEffect } from 'react'
import { DetailDialog } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { useDetailParam, type DetailKind } from '@/hooks/use-detail'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'

const loaders = {
  application: () =>
    import('@/features/applications').then((m) => ({ default: m.ApplicationDialog })),
  candidate: () => import('@/features/candidates').then((m) => ({ default: m.CandidateDialog })),
  job: () => import('./JobWorkspaceDialog').then((m) => ({ default: m.JobWorkspaceDialog })),
} satisfies Record<DetailKind, unknown>

const NEW_JOB = 'new'
const loadJobCreate = () =>
  import('./JobCreateDialog').then((m) => ({ default: m.JobCreateDialog }))
const JobCreate = lazy(loadJobCreate)

const dialogs = {
  application: lazy(loaders.application),
  candidate: lazy(loaders.candidate),
  job: lazy(loaders.job),
}

const PERMISSION: Record<DetailKind, Permission> = {
  application: Permission.ApplicationRead,
  candidate: Permission.CandidateRead,
  job: Permission.JobRead,
}

export function DetailHost() {
  const { detail, close } = useDetailParam()
  const creating = detail?.kind === 'job' && detail.id === NEW_JOB
  const allowed = usePermission(creating ? Permission.JobCreate : PERMISSION[detail?.kind ?? 'job'])

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
    idle(() => [...Object.values(loaders), loadJobCreate].forEach((load) => void load()))
  }, [])

  if (!detail || !allowed) return null
  const Dialog = creating ? JobCreate : dialogs[detail.kind]
  return (
    <Suspense fallback={<LoadingDialog onClose={close} />}>
      <Dialog
        key={`${detail.kind}:${detail.id}:${detail.tab ?? ''}`}
        id={detail.id}
        tab={detail.tab}
        onClose={close}
      />
    </Suspense>
  )
}

function LoadingDialog({ onClose }: { onClose: () => void }) {
  return (
    <DetailDialog open fit onClose={onClose} label="Đang mở" title="Đang mở…">
      <div aria-busy className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </DetailDialog>
  )
}
