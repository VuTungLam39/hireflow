import { Check, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Can } from '@/components/shared'
import { Avatar, Button } from '@/components/ui'
import { RequirementMarks, ScoreBadge, ScoreFlags } from '@/features/applications'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import type { JobMatch } from '../types'
import { useDetailLink } from '@/hooks/use-detail'

interface MatchCardProps {
  match: JobMatch
  canInvite: boolean
  inviting: boolean
  onInvite: (candidateId: string) => void
}

// US-10 · Design Spec 6.6
export function MatchCard({ match, canInvite, inviting, onInvite }: MatchCardProps) {
  const { candidate } = match
  const detailLink = useDetailLink()
  const quote =
    match.reasons.find((r) => r.match === 1 && r.evidence) ?? match.reasons.find((r) => r.evidence)
  const matches = Object.fromEntries(match.reasons.map((r) => [r.requirementId, r.match]))

  return (
    <li
      data-match-card
      className="grid gap-x-6 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="flex min-w-0 gap-3">
        <Avatar name={candidate.fullName} size="sm" className="mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link
              to={detailLink('candidate', candidate.id)}
              className="type-subheading hover:text-brand transition-colors"
            >
              {candidate.fullName}
            </Link>
            <span className="type-caption">nộp gần nhất {formatDate(match.lastAppliedAt)}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ScoreBadge score={match.score} />
            <RequirementMarks
              requirements={match.reasons.map((r) => ({ id: r.requirementId, label: r.label }))}
              matches={matches}
            />
            <ScoreFlags flags={match.flags} />
          </div>
          {quote?.evidence && (
            <p className="type-body text-[13px] italic">
              <span className="text-ink-muted not-italic">{quote.label}: </span>“
              <span className="mark-evidence not-italic">{quote.evidence}</span>”
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        {match.applicationId ? (
          <span className="type-caption flex items-center gap-1.5">
            <Check className="text-good size-4" />
            <span className="text-good-ink font-medium">Đã mời</span>·
            <Link
              to={detailLink('application', match.applicationId)}
              className="text-brand font-medium hover:underline"
            >
              Xem hồ sơ →
            </Link>
          </span>
        ) : (
          <Can permission={Permission.ApplicationCreate}>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canInvite}
              loading={inviting}
              onClick={() => onInvite(candidate.id)}
            >
              <UserPlus />
              Mời vào tin
            </Button>
          </Can>
        )}
      </div>
    </li>
  )
}
