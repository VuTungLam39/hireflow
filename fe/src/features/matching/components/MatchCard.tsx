import { Check, CircleCheck, CircleDashed, CircleMinus, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Can } from '@/components/shared'
import { Badge, Button, Card } from '@/components/ui'
import { ScoreFlags, ScoreValue } from '@/features/applications'
import { RequirementTypeBadge } from '@/features/jobs'
import { Permission } from '@/lib/permissions'
import { formatDate, formatRelative } from '@/lib/utils'
import { links } from '@/routes/paths'
import type { JobMatch, MatchReason } from '../types'

const MATCH_ICON = {
  1: { icon: CircleCheck, className: 'text-good', label: 'Khớp' },
  0.5: { icon: CircleDashed, className: 'text-warn', label: 'Khớp một phần' },
  0: { icon: CircleMinus, className: 'text-ink-faint', label: 'Không khớp' },
} as const

function Reason({ reason }: { reason: MatchReason }) {
  const { icon: Icon, className, label } = MATCH_ICON[reason.match]
  return (
    <li className="flex gap-2">
      <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} aria-label={label} />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={reason.match ? 'text-ink font-medium' : 'text-ink-muted'}>
            {reason.label}
          </span>
          <RequirementTypeBadge type={reason.type} />
        </div>
        {reason.evidence && (
          <blockquote className="border-line text-ink-2 border-l-2 pl-2 text-xs italic">
            “{reason.evidence}”
          </blockquote>
        )}
      </div>
    </li>
  )
}

interface MatchCardProps {
  match: JobMatch
  canInvite: boolean
  inviting: boolean
  onInvite: (candidateId: string) => void
}

// US-10
export function MatchCard({ match, canInvite, inviting, onInvite }: MatchCardProps) {
  const { candidate } = match
  return (
    <Card data-match-card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={links.candidateDetail(candidate.id)}
            className="text-ink font-semibold hover:underline"
          >
            {candidate.fullName}
          </Link>
          <p className="text-ink-muted truncate text-sm">{candidate.email}</p>
          <p className="text-ink-muted text-xs" title={formatDate(match.lastAppliedAt)}>
            Nộp gần nhất {formatRelative(match.lastAppliedAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScoreValue score={match.score} />
          <ScoreFlags flags={match.flags} />
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        {match.reasons.map((reason) => (
          <Reason key={reason.requirementId} reason={reason} />
        ))}
      </ul>

      <div className="border-line-soft flex flex-wrap items-center justify-end gap-2 border-t pt-3">
        {match.applicationId ? (
          <>
            <Badge tone="success">
              <Check className="size-3" />
              Đã mời
            </Badge>
            <Link
              to={links.applicationDetail(match.applicationId)}
              className="text-brand text-sm font-medium hover:underline"
            >
              Xem hồ sơ →
            </Link>
          </>
        ) : (
          <Can permission={Permission.ApplicationCreate}>
            <Button
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
    </Card>
  )
}
