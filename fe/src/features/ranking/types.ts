import type { AiStatus, ApplicationStatus, MatchLevel, ScoreFlag } from '@/features/applications'
import type { JobStatus, Requirement } from '@/features/jobs'

export interface RankingItem {
  applicationId: string
  candidateName: string
  status: ApplicationStatus
  aiStatus: AiStatus
  flags: ScoreFlag[]
  /** Mức khớp từng tiêu chí – đủ để FE tự tính lại điểm khi đổi trọng số */
  matches: { requirementId: string; match: MatchLevel }[]
}

export interface RankingInput {
  id: string
  name: string
  matches: Record<string, number>
  item: RankingItem
}

/** GET /jobs/:id/ranking – tải một lần toàn bộ application đã chấm của job */
export interface RankingData {
  job: { id: string; title: string; status: JobStatus; jdVersion: number }
  requirements: Requirement[]
  items: RankingItem[]
}
