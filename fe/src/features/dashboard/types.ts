import type { ApplicationSource, ApplicationStatus } from '@/features/applications'

/** GET /dashboard/summary – đã lọc theo scope của người xem (kickoff FR-DASH) */
export interface DashboardSummary {
  totals: {
    applications: number
    openJobs: number
    processing: number
    /** Điểm trung bình của hồ sơ đã chấm; null khi chưa có */
    avgScore: number | null
  }
  byStatus: Record<ApplicationStatus, number>
  byJob: {
    jobId: string
    title: string
    total: number
    avgScore: number | null
    hired: number
  }[]
}

/** F1 · BR-REP-01: GET /dashboard/funnel – cohort theo ngày nộp, đã lọc theo phạm vi */
export interface FunnelParams {
  from?: string
  to?: string
  jobId?: string
}

export interface FunnelStage {
  status: 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED'
  reached: number
  /** 0..1, null ở bước đầu */
  conversionFromPrev: number | null
  conversionFromStart: number
  medianDaysInStage: number | null
  rejected: number
  withdrawn: number
}

export interface FunnelView {
  range: { from: string; to: string }
  generatedAt: string
  cohort: number
  stages: FunnelStage[]
  bySource: { source: ApplicationSource; cohort: number; reachedInterview: number; hired: number }[]
  reopened: number
}
