import { FeedbackRecommendation as R } from '../../common/enums/feedback-recommendation.enum.js';
import { buildDebrief, type DebriefFeedbackInput, type DebriefInterviewInput } from './debrief.js';

const fb = (
  authorId: string,
  overall: number,
  recommendation: R | null,
  ratings: [string, string, number][],
): DebriefFeedbackInput => ({
  authorId,
  authorName: authorId.toUpperCase(),
  overall,
  recommendation,
  comment: null,
  submittedAt: new Date('2026-11-19T03:00:00Z'),
  ratings: ratings.map(([requirementId, label, score]) => ({ requirementId, label, score })),
});
const iv = (
  id: string,
  round: number,
  stage: DebriefInterviewInput['stage'],
  feedbacks: DebriefFeedbackInput[],
  interviewerCount = 2,
): DebriefInterviewInput => ({
  id,
  round,
  scheduledAt: new Date(`2026-11-1${round}T03:00:00Z`),
  stage,
  interviewerCount,
  feedbacks,
});

// MVP 3.1 · F-INT-05, BR-INT-07
describe('buildDebrief', () => {
  it('returns zeros, not NaN, when nothing was submitted', () => {
    const d = buildDebrief([iv('i1', 1, null, [])]);
    expect(d).toMatchObject({ feedbackCount: 0, overallAvg: null });
    expect(d.groups[0]).toMatchObject({ expectedFeedbacks: 2, feedbackCount: 0, criteria: [] });
  });

  it('groups by stage, averages each criterion and tallies recommendations', () => {
    const tech = { id: 's1', name: 'Kỹ thuật' };
    const d = buildDebrief([
      iv('i2', 2, null, [fb('c', 2, R.No, [['r1', 'NestJS', 2]])], 1),
      iv('i1', 1, tech, [
        fb('a', 4, R.Yes, [
          ['k1', 'API', 4],
          ['k2', 'SQL', 3],
        ]),
        fb('b', 5, R.StrongYes, [
          ['k1', 'API', 5],
          ['k2', 'SQL', 4],
        ]),
      ]),
      iv('i3', 1, tech, [fb('d', 3, null, [['k1', 'API', 3]])], 1),
    ]);
    expect(d.feedbackCount).toBe(4);
    expect(d.overallAvg).toBe(3.5);
    expect(d.recommendations).toEqual({ STRONG_NO: 0, NO: 1, YES: 1, STRONG_YES: 1, NONE: 1 });
    expect(d.groups.map((g) => [g.stage?.name ?? null, g.round, g.interviews])).toEqual([
      ['Kỹ thuật', 1, 2],
      [null, 2, 1],
    ]);
    expect(d.groups[0]).toMatchObject({
      expectedFeedbacks: 3,
      feedbackCount: 3,
      overallAvg: 4,
      criteria: [
        { requirementId: 'k1', label: 'API', avg: 4, n: 3 },
        { requirementId: 'k2', label: 'SQL', avg: 3.5, n: 2 },
      ],
    });
  });
});
