import { FeedbackRecommendation } from '../../common/enums/feedback-recommendation.enum.js';

export interface DebriefFeedbackInput {
  authorId: string;
  authorName: string;
  overall: number;
  ratings: { requirementId: string; label: string; score: number }[];
  recommendation: FeedbackRecommendation | null;
  comment: string | null;
  submittedAt: Date;
}

export interface DebriefInterviewInput {
  id: string;
  round: number;
  scheduledAt: Date;
  stage: { id: string; name: string } | null;
  interviewerCount: number;
  feedbacks: DebriefFeedbackInput[];
}

type Tally = Record<FeedbackRecommendation | 'NONE', number>;

export interface DebriefGroup {
  /** null: buổi không theo vòng, gom theo số vòng */
  stage: { id: string; name: string } | null;
  round: number;
  interviews: number;
  expectedFeedbacks: number;
  feedbackCount: number;
  overallAvg: number | null;
  criteria: { requirementId: string; label: string; avg: number; n: number }[];
  recommendations: Tally;
  feedbacks: {
    interviewId: string;
    author: { id: string; fullName: string };
    overall: number;
    recommendation: FeedbackRecommendation | null;
    comment: string | null;
    submittedAt: Date;
  }[];
}

export interface DebriefView {
  feedbackCount: number;
  overallAvg: number | null;
  recommendations: Tally;
  groups: DebriefGroup[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (values: number[]) =>
  values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null;
const emptyTally = (): Tally => ({
  [FeedbackRecommendation.StrongNo]: 0,
  [FeedbackRecommendation.No]: 0,
  [FeedbackRecommendation.Yes]: 0,
  [FeedbackRecommendation.StrongYes]: 0,
  NONE: 0,
});

// MVP 3.1 · F-INT-05, BR-INT-07: tổng hợp theo vòng; không đổi trạng thái hồ sơ
export function buildDebrief(interviews: DebriefInterviewInput[]): DebriefView {
  const groups = new Map<string, DebriefGroup>();
  const sorted = [...interviews].sort(
    (a, b) => a.round - b.round || a.scheduledAt.getTime() - b.scheduledAt.getTime(),
  );
  const all: DebriefFeedbackInput[] = [];
  const scores = new Map<string, Map<string, { label: string; values: number[] }>>();

  for (const iv of sorted) {
    const key = iv.stage ? `stage:${iv.stage.id}` : `round:${iv.round}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        stage: iv.stage,
        round: iv.round,
        interviews: 0,
        expectedFeedbacks: 0,
        feedbackCount: 0,
        overallAvg: null,
        criteria: [],
        recommendations: emptyTally(),
        feedbacks: [],
      };
      groups.set(key, g);
      scores.set(key, new Map());
    }
    g.interviews += 1;
    g.expectedFeedbacks += iv.interviewerCount;
    const byCriterion = scores.get(key)!;
    for (const f of iv.feedbacks) {
      all.push(f);
      g.feedbackCount += 1;
      g.recommendations[f.recommendation ?? 'NONE'] += 1;
      g.feedbacks.push({
        interviewId: iv.id,
        author: { id: f.authorId, fullName: f.authorName },
        overall: f.overall,
        recommendation: f.recommendation,
        comment: f.comment,
        submittedAt: f.submittedAt,
      });
      for (const r of f.ratings) {
        const entry = byCriterion.get(r.requirementId) ?? { label: r.label, values: [] };
        entry.values.push(r.score);
        byCriterion.set(r.requirementId, entry);
      }
    }
  }

  for (const [key, g] of groups) {
    const fs = g.feedbacks;
    g.overallAvg = avg(fs.map((f) => f.overall));
    g.criteria = [...scores.get(key)!].map(([requirementId, e]) => ({
      requirementId,
      label: e.label,
      avg: avg(e.values)!,
      n: e.values.length,
    }));
  }

  const recommendations = emptyTally();
  for (const f of all) recommendations[f.recommendation ?? 'NONE'] += 1;
  return {
    feedbackCount: all.length,
    overallAvg: avg(all.map((f) => f.overall)),
    recommendations,
    groups: [...groups.values()],
  };
}
