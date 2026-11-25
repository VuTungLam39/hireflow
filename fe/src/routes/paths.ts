/** Công ty mặc định của bản demo (migration 022) */
export const DEMO_COMPANY_SLUG = 'hireflow-demo'

/** Tập trung đường dẫn route – tránh gõ chuỗi rải rác trong code */
export const paths = {
  // Nội bộ (cần đăng nhập)
  home: '/',
  users: '/users',
  departments: '/departments',
  jobs: '/manage/jobs',
  jobNew: '/manage/jobs/new',
  jobEdit: '/manage/jobs/:id/edit',
  jobRanking: '/manage/jobs/:id/ranking',
  jobMatches: '/manage/jobs/:id/matches',
  applications: '/applications',
  applicationDetail: '/applications/:id',
  candidates: '/candidates',
  candidateDetail: '/candidates/:id',
  aiChat: '/ai-chat',
  aiQueue: '/admin/ai-queue',
  auditLogs: '/admin/audit-logs',
  company: '/admin/company',
  interviews: '/interviews',
  // Quản trị sàn (MVP 3)
  platformCompanies: '/platform/companies',
  platformCompany: '/platform/companies/:id',
  platformQueues: '/platform/queues',

  // Khách
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Công khai cho ứng viên (FE Architecture mục 8.2)
  publicJobs: '/jobs',
  publicJobDetail: '/jobs/:id',
  /** Chỉ còn để chuyển hướng sang trang công ty demo (KH MVP 3 mục 9.6) */
  careers: '/careers',
  publicCompanies: '/companies',
  publicCompany: '/companies/:slug',
  privacy: '/chinh-sach-du-lieu',
  // Nhà tuyển dụng tự đăng ký (MVP 3 · US-19)
  employerRegister: '/employers/register',
  employerCheckEmail: '/employers/check-email',
  verifyEmail: '/verify-email',
  // MVP 3 · US-26: link trong email xác nhận nộp hồ sơ
  applicationTrack: '/applications/track',
} as const

const withQuery = (path: string, query?: Record<string, string | undefined>) => {
  const search = new URLSearchParams(
    Object.entries(query ?? {}).filter((e): e is [string, string] => !!e[1]),
  ).toString()
  return search ? `${path}?${search}` : path
}

/** Tạo URL có tham số, ví dụ links.jobEdit(id) */
export const links = {
  jobEdit: (id: string) => `/manage/jobs/${id}/edit`,
  jobRanking: (id: string) => `/manage/jobs/${id}/ranking`,
  jobMatches: (id: string) => `/manage/jobs/${id}/matches`,
  applicationDetail: (id: string) => `/applications/${id}`,
  candidateDetail: (id: string) => `/candidates/${id}`,
  applications: (query?: { jobId?: string; status?: string; createdFrom?: string }) =>
    withQuery(paths.applications, query),
  publicJobDetail: (id: string) => `/jobs/${id}`,
  publicCompany: (slug: string) => `/companies/${slug}`,
  publicJobs: (query?: { company?: string }) => withQuery(paths.publicJobs, query),
  platformCompany: (id: string) => `/platform/companies/${id}`,
}
