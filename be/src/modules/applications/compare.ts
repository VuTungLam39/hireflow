import type { BreakdownItem } from './entities/application.entity.js';

export interface CompareRequirement {
  id: string;
  label: string;
}

export interface FeedbackRow {
  applicationId: string;
  overall: number;
  ratings: { requirementId: string; score: number }[];
}

export interface CompareCriterion {
  requirementId: string;
  match: 0 | 0.5 | 1 | null;
  evidence: string | null;
  interviewAvg: number | null;
}

const avg = (values: number[]) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

// F3 · BR-APP-13: ghép breakdown đã chấm với điểm phiếu theo từng tiêu chí của phiên bản JD hiện tại.
// Tiêu chí không có trong breakdown (JD sửa sau khi chấm) trả match null = chưa chấm.
export function compareCriteria(
  requirements: CompareRequirement[],
  breakdown: BreakdownItem[] | null,
  feedbacks: FeedbackRow[],
): CompareCriterion[] {
  return requirements.map((r) => {
    const item = breakdown?.find((b) => b.requirementId === r.id);
    const scores = feedbacks.flatMap((f) =>
      f.ratings.filter((x) => x.requirementId === r.id).map((x) => x.score),
    );
    return {
      requirementId: r.id,
      match: item ? item.match : null,
      evidence: item?.evidence ?? null,
      interviewAvg: avg(scores),
    };
  });
}

export const interviewSummary = (feedbacks: FeedbackRow[]) => ({
  feedbackCount: feedbacks.length,
  avgOverall: avg(feedbacks.map((f) => f.overall)),
});
