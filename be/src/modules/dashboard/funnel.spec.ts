import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { buildFunnel, type TransitionRow } from './funnel.js';

const S = ApplicationStatus;
const P = ApplicationSource.PublicForm;
const H = ApplicationSource.HrUpload;
const DAY = 86_400;
const range = { from: '2026-08-01', to: '2026-10-30' };
const row = (
  source: ApplicationSource,
  fromStatus: ApplicationStatus | null,
  toStatus: ApplicationStatus,
  n: number,
  p50: number | null = null,
): TransitionRow => ({ source, fromStatus, toStatus, n, p50 });

describe('buildFunnel (F1, BR-REP-01)', () => {
  it('returns zeros, not NaN, for an empty cohort', () => {
    const f = buildFunnel([], range);
    expect(f.cohort).toBe(0);
    expect(f.stages.map((s) => s.reached)).toEqual([0, 0, 0, 0, 0]);
    expect(f.stages.every((s) => s.conversionFromStart === 0)).toBe(true);
    expect(f.stages[1].medianDaysInStage).toBeNull();
    expect(f.bySource).toEqual([]);
  });

  it('derives reach, conversion, drop-off and median days from the transition matrix', () => {
    const f = buildFunnel(
      [
        row(P, null, S.New, 8),
        row(H, null, S.New, 2),
        row(P, S.New, S.Screening, 5, 2 * DAY),
        row(H, S.New, S.Screening, 1, 4 * DAY),
        row(P, S.New, S.Rejected, 3, 1 * DAY),
        row(P, S.Screening, S.Interview, 2, 3 * DAY),
        row(P, S.Screening, S.Withdrawn, 1, 3 * DAY),
        row(P, S.Interview, S.Offer, 1, DAY),
        row(P, S.Offer, S.Hired, 1, DAY),
      ],
      range,
    );
    expect(f.cohort).toBe(10);
    expect(f.stages.map((s) => s.reached)).toEqual([10, 6, 2, 1, 1]);
    expect(f.stages[1]).toMatchObject({ conversionFromPrev: 0.6, conversionFromStart: 0.6 });
    expect(f.stages[2].conversionFromPrev).toBe(0.333);
    expect(f.stages[0]).toMatchObject({ rejected: 3, withdrawn: 0, conversionFromPrev: null });
    expect(f.stages[1].withdrawn).toBe(1);
    // NEW: (5×2 + 1×4 + 3×1) / 9 ngày
    expect(f.stages[0].medianDaysInStage).toBe(1.9);
    expect(f.stages[4].medianDaysInStage).toBeNull();
    expect(f.bySource).toEqual([
      { source: H, cohort: 2, reachedInterview: 0, hired: 0 },
      { source: P, cohort: 8, reachedInterview: 2, hired: 1 },
    ]);
  });

  it('does not count a reopened application as reaching screening twice', () => {
    const f = buildFunnel(
      [
        row(P, null, S.New, 1),
        row(P, S.New, S.Screening, 1),
        row(P, S.Screening, S.Rejected, 1),
        row(P, S.Rejected, S.Screening, 1),
      ],
      range,
    );
    expect(f.stages[1].reached).toBe(1);
    expect(f.stages[1].conversionFromStart).toBeLessThanOrEqual(1);
    expect(f.reopened).toBe(1);
  });

  it('never reports more applications at a stage than at the previous one', () => {
    // hồ sơ tới INTERVIEW, bị từ chối, mở lại rồi tới INTERVIEW lần nữa
    const f = buildFunnel(
      [
        row(P, null, S.New, 1),
        row(P, S.New, S.Screening, 1),
        row(P, S.Screening, S.Interview, 2),
        row(P, S.Interview, S.Rejected, 1),
        row(P, S.Rejected, S.Screening, 1),
      ],
      range,
    );
    expect(f.stages[2].reached).toBe(1);
    expect(f.stages[2].conversionFromPrev).toBe(1);
    expect(f.bySource[0].reachedInterview).toBe(1);
  });
});
