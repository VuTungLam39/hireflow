/**
 * Mã lỗi trả về trong trường `code` của mọi response lỗi.
 * Nguồn sự thật: API Contract mục 5. Thêm mã mới thì sửa cùng lúc API Contract
 * và fe/src/lib/error-codes.ts (Backend Architecture mục 11).
 */
export enum ErrorCode {
  // Chung
  ValidationFailed = 'VALIDATION_FAILED',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  ScopeForbidden = 'SCOPE_FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  TooManyRequests = 'TOO_MANY_REQUESTS',
  InternalError = 'INTERNAL_ERROR',

  // Xác thực, người dùng, phòng ban
  RefreshTokenReused = 'REFRESH_TOKEN_REUSED',
  AccountDisabled = 'ACCOUNT_DISABLED',
  WrongPassword = 'WRONG_PASSWORD',
  EmailExists = 'EMAIL_EXISTS',
  DepartmentInUse = 'DEPARTMENT_IN_USE',

  // Tin tuyển dụng
  JobNotPublishable = 'JOB_NOT_PUBLISHABLE',
  JobNotClosable = 'JOB_NOT_CLOSABLE',
  JobNotEditable = 'JOB_NOT_EDITABLE',
  JobNotDeletable = 'JOB_NOT_DELETABLE',
  JobNotOpen = 'JOB_NOT_OPEN',

  // Hồ sơ, ứng viên, file
  ApplicationDuplicated = 'APPLICATION_DUPLICATED',
  CandidateAnonymized = 'CANDIDATE_ANONYMIZED',
  InvalidStatusTransition = 'INVALID_STATUS_TRANSITION',
  RejectReasonRequired = 'REJECT_REASON_REQUIRED',
  FileTypeNotAllowed = 'FILE_TYPE_NOT_ALLOWED',
  FileTooLarge = 'FILE_TOO_LARGE',
  CvTextNotEditable = 'CV_TEXT_NOT_EDITABLE',

  // AI
  AiUnavailable = 'AI_UNAVAILABLE',
}
