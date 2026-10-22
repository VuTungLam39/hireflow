import type { ApplicationStatus } from '@/features/applications'

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
