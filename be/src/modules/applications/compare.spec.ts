import { compareCriteria, interviewSummary, type FeedbackRow } from './compare.js';

const reqs = [
  { id: 'r1', label: 'NestJS' },
  { id: 'r2', label: 'React' },
];
const fb = (applicationId: string, overall: number, r1: number): FeedbackRow => ({
  applicationId,
  overall,
  ratings: [{ requirementId: 'r1', score: r1 }],
});

describe('compareCriteria (F3, BR-APP-13)', () => {
  it('joins breakdown and interview scores per requirement of the current JD', () => {
    const rows = compareCriteria(
      reqs,
      [{ requirementId: 'r1', match: 1, evidence: '3 năm NestJS', rejectedEvidence: null }],
      [fb('a', 4, 4), fb('a', 5, 5)],
    );
    expect(rows).toEqual([
      { requirementId: 'r1', match: 1, evidence: '3 năm NestJS', interviewAvg: 4.5 },
      // r2 thêm sau khi chấm: chưa chấm, chưa có phiếu
      { requirementId: 'r2', match: null, evidence: null, interviewAvg: null },
    ]);
  });

  it('handles an unscored application without feedback', () => {
    expect(compareCriteria(reqs, null, [])[0]).toEqual({
      requirementId: 'r1',
      match: null,
      evidence: null,
      interviewAvg: null,
    });
    expect(interviewSummary([])).toEqual({ feedbackCount: 0, avgOverall: null });
    expect(interviewSummary([fb('a', 3, 3), fb('a', 4, 4)])).toEqual({
      feedbackCount: 2,
      avgOverall: 3.5,
    });
  });
});
