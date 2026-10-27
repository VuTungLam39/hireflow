import type { MatchLevel, ScoreFlag } from '@/features/applications'
import type { JobStatus, RequirementType } from '@/features/jobs'

// BR-MATCH-02
export interface MatchReason {
  requirementId: string
  label: string
  type: RequirementType
  match: MatchLevel
  evidence: string | null
}

export interface JobMatch {
  candidate: { id: string; fullName: string; email: string }
  score: number
  flags: ScoreFlag[]
  reasons: MatchReason[]
  lastAppliedAt: string
  invitedAt: string | null
  applicationId: string | null
}

// API Contract 4.4
export interface JobMatchesData {
  job: { id: string; title: string; status: JobStatus; jdVersion: number }
  computedAt: string | null
  computedJdVersion: number | null
  pending: boolean
  items: JobMatch[]
}
