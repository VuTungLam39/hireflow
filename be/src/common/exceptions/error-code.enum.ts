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
  JobExpired = 'JOB_EXPIRED',

  // Hồ sơ công ty, ảnh công khai (Mở rộng MVP 2 – E3)
  MediaTypeNotAllowed = 'MEDIA_TYPE_NOT_ALLOWED',
  MediaTooLarge = 'MEDIA_TOO_LARGE',
  GalleryFull = 'GALLERY_FULL',
  CompanyProfileIncomplete = 'COMPANY_PROFILE_INCOMPLETE',

  // Hồ sơ, ứng viên, file
  ApplicationDuplicated = 'APPLICATION_DUPLICATED',
  CandidateAnonymized = 'CANDIDATE_ANONYMIZED',
  InvalidStatusTransition = 'INVALID_STATUS_TRANSITION',
  RejectReasonRequired = 'REJECT_REASON_REQUIRED',
  FileTypeNotAllowed = 'FILE_TYPE_NOT_ALLOWED',
  FileTooLarge = 'FILE_TOO_LARGE',
  CvTextNotEditable = 'CV_TEXT_NOT_EDITABLE',
  ExportTooLarge = 'EXPORT_TOO_LARGE',

  // Interviews
  InterviewNotAllowed = 'INTERVIEW_NOT_ALLOWED',
  InterviewConflict = 'INTERVIEW_CONFLICT',
  InterviewNotEditable = 'INTERVIEW_NOT_EDITABLE',
  InterviewNotStarted = 'INTERVIEW_NOT_STARTED',
  FeedbackLocked = 'FEEDBACK_LOCKED',

  // AI
  AiUnavailable = 'AI_UNAVAILABLE',
}
