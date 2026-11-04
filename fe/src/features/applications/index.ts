// Public API của feature applications
export {
  AI_STATUS,
  APPLICATION_SOURCE,
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  MATCH_LEVEL,
  APPLICATION_VIEWS,
  NEXT_STATUS,
  REASON_REQUIRED,
  REJECT_REASONS,
  SCORE_FAIR,
  SCORE_GOOD,
  SCORE_FLAGS,
} from './constants'
export type {
  AiStatus,
  ApplicationSource,
  ApplicationViewId,
  ApplicationStatus,
  MatchLevel,
  ScoreFlag,
} from './constants'
export { ApplicationDialog } from './components/ApplicationDialog'
export { JobApplicationHighlights } from './components/JobApplicationHighlights'
export { JobApplicationsList } from './components/JobApplicationsList'
export { HrUploadDialog } from './components/HrUploadDialog'
export { applicationKeys, applicationQueries } from './hooks/use-applications'
export { applicationListSchema } from './schemas/application.schema'
export type { ApplicationListParams } from './schemas/application.schema'
export {
  AiStatusBadge,
  ApplicationStatusBadge,
  ProgressDot,
  ScoreBadge,
  ScoreFlags,
  ScoreValue,
  StatusPill,
} from './components/StatusBadges'
export { MatchGlyph, MatchIndicator, RequirementMarks, ScoreMeter } from './components/Score'
export { CvSheet } from './components/CvSheet'
export { findQuote } from './lib/evidence'
export { scoreTone } from './lib/score-tone'
export type {
  ApplicationDetail,
  ApplicationListItem,
  ApplicationNote,
  BreakdownItem,
  HrUploadInput,
  StatusHistoryItem,
} from './types'
