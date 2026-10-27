import { ApplicationStatus as S } from '../../common/enums/application-status.enum.js';
import { BusinessException } from '../../common/exceptions/index.js';
import {
  assertReopenable,
  assertTransition,
  canTransition,
  REOPEN_TO,
} from './application-status.js';

const ALL = Object.values(S);
const ALLOWED: [S, S][] = [
  [S.New, S.Screening],
  [S.Screening, S.Interview],
  [S.Interview, S.Offer],
  [S.Offer, S.Hired],
  ...[S.New, S.Screening, S.Interview, S.Offer].flatMap((from) => [
    [from, S.Rejected] as [S, S],
    [from, S.Withdrawn] as [S, S],
  ]),
];

describe('application status flow (Kickoff 5.2)', () => {
  it.each(ALL.flatMap((from) => ALL.map((to) => [from, to] as const)))('%s → %s', (from, to) => {
    const allowed = ALLOWED.some(([f, t]) => f === from && t === to);
    expect(canTransition(from, to)).toBe(allowed);
  });

  it('terminal statuses cannot change (BR-STS-03)', () => {
    for (const terminal of [S.Hired, S.Rejected, S.Withdrawn]) {
      expect(ALL.some((to) => canTransition(terminal, to))).toBe(false);
    }
  });

  const errorOf = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      return e as BusinessException;
    }
    throw new Error('expected an error');
  };

  it('rejects skipping a step with INVALID_STATUS_TRANSITION (BR-STS-01)', () => {
    const error = errorOf(() => assertTransition(S.New, S.Offer));
    expect(error.getStatus()).toBe(409);
    expect(error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it.each([undefined, null, '', '   '])(
    'requires a reason to reject (%s) (BR-STS-02)',
    (reason) => {
      const error = errorOf(() => assertTransition(S.Screening, S.Rejected, reason));
      expect(error.getStatus()).toBe(400);
      expect(error.code).toBe('REJECT_REASON_REQUIRED');
    },
  );

  it('withdrawing does not need a reason', () => {
    expect(() => assertTransition(S.Interview, S.Withdrawn)).not.toThrow();
  });
});

describe('assertReopenable (F-APP-10)', () => {
  it.each([S.Rejected, S.Withdrawn])('BR-APP-05: %s can be reopened to SCREENING', (from) => {
    expect(() => assertReopenable(from)).not.toThrow();
    expect(REOPEN_TO).toBe(S.Screening);
  });

  it.each([S.New, S.Screening, S.Interview, S.Offer, S.Hired])(
    'BR-APP-05: %s cannot be reopened (INVALID_STATUS_TRANSITION)',
    (from) => {
      let error: BusinessException | undefined;
      try {
        assertReopenable(from);
      } catch (e) {
        error = e as BusinessException;
      }
      expect(error?.getStatus()).toBe(409);
      expect(error?.code).toBe('INVALID_STATUS_TRANSITION');
    },
  );
});
