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

  // Khách
  login: '/login',

  // Công khai cho ứng viên (FE Architecture mục 8.2)
  publicJobs: '/jobs',
  publicJobDetail: '/jobs/:id',
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
  applications: (query?: { jobId?: string; status?: string }) =>
    withQuery(paths.applications, query),
  publicJobDetail: (id: string) => `/jobs/${id}`,
}
