import { HttpStatus } from '@nestjs/common';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';

const S = ApplicationStatus;

// Kickoff 5.2, BR-STS-01 → 03
const NEXT: Record<ApplicationStatus, ApplicationStatus[]> = {
  [S.New]: [S.Screening, S.Rejected, S.Withdrawn],
  [S.Screening]: [S.Interview, S.Rejected, S.Withdrawn],
  [S.Interview]: [S.Offer, S.Rejected, S.Withdrawn],
  [S.Offer]: [S.Hired, S.Rejected, S.Withdrawn],
  [S.Hired]: [],
  [S.Rejected]: [],
  [S.Withdrawn]: [],
};

export const canTransition = (from: ApplicationStatus, to: ApplicationStatus) =>
  NEXT[from].includes(to);

// BR-APP-05, F-APP-10
export const REOPENABLE: readonly ApplicationStatus[] = [S.Rejected, S.Withdrawn];
export const REOPEN_TO = S.Screening;

export function assertReopenable(from: ApplicationStatus): void {
  if (REOPENABLE.includes(from)) return;
  throw new BusinessException(
    ErrorCode.InvalidStatusTransition,
    `Only REJECTED or WITHDRAWN applications can be reopened (current: ${from})`,
    HttpStatus.CONFLICT,
  );
}

export function assertTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  reason?: string | null,
): void {
  if (!canTransition(from, to)) {
    throw new BusinessException(
      ErrorCode.InvalidStatusTransition,
      `Cannot move application from ${from} to ${to}`,
      HttpStatus.CONFLICT,
    );
  }
  // BR-STS-02
  if (to === S.Rejected && !reason?.trim()) {
    throw new BusinessException(
      ErrorCode.RejectReasonRequired,
      'Reason is required',
      HttpStatus.BAD_REQUEST,
      [{ field: 'reason', messages: ['Vui lòng nhập lý do từ chối'] }],
    );
  }
}
