import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';

const S = ApplicationStatus;
const STAGES = [S.New, S.Screening, S.Interview, S.Offer, S.Hired] as const;
const CLOSED: readonly ApplicationStatus[] = [S.Rejected, S.Withdrawn];
const DAY_SECONDS = 86_400;

/** Một ô của ma trận chuyển trạng thái trong cohort (một nguồn, một cặp from → to) */
export interface TransitionRow {
  source: ApplicationSource;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  n: number;
  p50: number | null;
}

export interface FunnelStage {
  status: (typeof STAGES)[number];
  reached: number;
  conversionFromPrev: number | null;
  conversionFromStart: number;
  medianDaysInStage: number | null;
  rejected: number;
  withdrawn: number;
}

export interface FunnelView {
  range: { from: string; to: string };
  generatedAt: string;
  cohort: number;
  stages: FunnelStage[];
  bySource: {
    source: ApplicationSource;
    cohort: number;
    reachedInterview: number;
    hired: number;
  }[];
  reopened: number;
}

const ratio = (part: number, whole: number) =>
  whole ? Math.round((part / whole) * 1000) / 1000 : 0;

// F1 · BR-REP-01: pipeline tuyến tính nên "tới bước k" = số dòng chuyển từ bước k-1 sang k.
// Dòng đi ra từ REJECTED/WITHDRAWN là mở lại hồ sơ, đếm riêng để không tính trùng.
export function buildFunnel(
  rows: TransitionRow[],
  range: FunnelView['range'],
  now: Date = new Date(),
): FunnelView {
  const count = (pred: (r: TransitionRow) => boolean) =>
    rows.filter(pred).reduce((sum, r) => sum + r.n, 0);
  const reachedOf = (stage: ApplicationStatus, source?: ApplicationSource) => {
    const i = STAGES.indexOf(stage as (typeof STAGES)[number]);
    const from = i === 0 ? null : STAGES[i - 1];
    return count(
      (r) => r.toStatus === stage && r.fromStatus === from && (!source || r.source === source),
    );
  };
  // shortcut: SQL trả p50 theo từng nguồn, gộp bằng trung bình có trọng số nên chỉ xấp xỉ trung vị chung; tính GROUPING SETS trong SQL nếu cần số chính xác
  const medianDays = (stage: ApplicationStatus) => {
    const leaving = rows.filter((r) => r.fromStatus === stage && r.p50 !== null);
    const total = leaving.reduce((sum, r) => sum + r.n, 0);
    if (!total) return null;
    const seconds = leaving.reduce((sum, r) => sum + r.p50! * r.n, 0) / total;
    return Math.round((seconds / DAY_SECONDS) * 10) / 10;
  };

  const cohort = reachedOf(S.New);
  const stages = STAGES.map((status, i): FunnelStage => {
    const reached = reachedOf(status);
    return {
      status,
      reached,
      conversionFromPrev: i === 0 ? null : ratio(reached, reachedOf(STAGES[i - 1])),
      conversionFromStart: ratio(reached, cohort),
      medianDaysInStage: status === S.Hired ? null : medianDays(status),
      rejected: count((r) => r.fromStatus === status && r.toStatus === S.Rejected),
      withdrawn: count((r) => r.fromStatus === status && r.toStatus === S.Withdrawn),
    };
  });
  const sources = [...new Set(rows.map((r) => r.source))].sort();

  return {
    range,
    generatedAt: now.toISOString(),
    cohort,
    stages,
    bySource: sources.map((source) => ({
      source,
      cohort: reachedOf(S.New, source),
      reachedInterview: reachedOf(S.Interview, source),
      hired: reachedOf(S.Hired, source),
    })),
    reopened: count((r) => r.fromStatus !== null && CLOSED.includes(r.fromStatus)),
  };
}
