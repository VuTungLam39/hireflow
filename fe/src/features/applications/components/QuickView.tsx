import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorState, SidePanel } from '@/components/shared'
import { Skeleton, buttonVariants } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import { APPLICATION_SOURCE, type MatchLevel } from '../constants'
import { applicationQueries } from '../hooks/use-applications'
import type { ReviewState } from '../hooks/use-review-navigation'
import { MatchIndicator, ScoreMeter } from './Score'
import { AiStatusBadge, ScoreFlags, StatusPill } from './StatusBadges'

interface QuickViewProps {
  id: string | null
  listQuery: string
  hideScore?: boolean
  onClose: () => void
}

export function QuickView({ id, listQuery, hideScore, onClose }: QuickViewProps) {
  const query = useQuery({ ...applicationQueries.detail(id ?? ''), enabled: !!id })
  const app = query.data

  return (
    <SidePanel
      open={!!id}
      onClose={onClose}
      title={app?.candidate.fullName ?? 'Hồ sơ'}
      subtitle={app && `${app.job.title} · nộp ${formatDate(app.createdAt)}`}
      footer={
        id && (
          <Link
            to={links.applicationDetail(id)}
            state={{ listQuery } satisfies ReviewState}
            className={buttonVariants()}
          >
            Mở bàn duyệt CV
            <ArrowRight />
          </Link>
        )
      }
    >
      {query.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : query.isError && !query.data ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        app && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusPill status={app.status} />
              <AiStatusBadge status={app.aiStatus} />
              {app.source && (
                <span className="type-caption">{APPLICATION_SOURCE[app.source].phrase}</span>
              )}
            </div>
            <p className="type-caption">
              {app.candidate.email}
              {app.candidate.phone && ` · ${app.candidate.phone}`}
            </p>

            {!hideScore && app.aiStatus === 'DONE' && app.score !== null && (
              <section>
                <h3 className="type-heading mb-2">Mức phù hợp</h3>
                <ScoreMeter
                  compact
                  score={app.score}
                  requirements={app.requirements}
                  matches={Object.fromEntries(app.breakdown.map((b) => [b.requirementId, b.match]))}
                />
                <div className="mt-2">
                  <ScoreFlags flags={app.flags} />
                </div>
                <ul className="divide-line-soft mt-4 divide-y">
                  {app.requirements.map((r, i) => {
                    const b = app.breakdown.find((x) => x.requirementId === r.id)
                    return (
                      <li key={r.id} className="py-2.5">
                        <p className="type-subheading">
                          <span className="text-ink-muted num mr-1.5 font-normal">{i + 1}</span>
                          {r.label}
                        </p>
                        <MatchIndicator
                          level={(b?.match ?? 0) as MatchLevel}
                          rejected={!!b?.rejectedEvidence}
                        />
                        {b?.evidence && (
                          <p className="type-body mt-0.5 text-[13px]">
                            “<span className="mark-evidence">{b.evidence}</span>”
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </div>
        )
      )}
    </SidePanel>
  )
}
