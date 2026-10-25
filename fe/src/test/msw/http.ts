import { delay, HttpResponse } from 'msw'
import { env } from '@/config/env'
import type { ApplicationDetail, ApplicationListItem } from '@/features/applications'
import type { Job, JobSummary } from '@/features/jobs'
import { hasPermission, ROLE_PERMISSIONS, type Permission } from '@/lib/permissions'
import type { CursorMeta, PaginationMeta } from '@/types/api'
import { Role, type User } from '@/types/user'
import { db, type ApplicationRow, type JobRow, type UserRow } from './data'

/** Đường dẫn đầy đủ của API, ví dụ api('/jobs') → '/api/v1/jobs' */
export const api = (path: string) => `${env.apiUrl}${path}`

/**
 * Giả lập độ trễ cố định (upload, gọi AI) để thấy trạng thái đang tải trên trình duyệt.
 * Khi chạy test thì bỏ qua, để test không chậm theo số lần gọi.
 */
export const latency = (ms: number) =>
  import.meta.env.MODE === 'test' ? Promise.resolve() : delay(ms)

// ---------- response theo đúng envelope của BE ----------
export function ok<T>(
  data: T,
  init: { status?: number; message?: string; meta?: PaginationMeta | CursorMeta } = {},
) {
  const status = init.status ?? 200
  return HttpResponse.json(
    {
      success: true,
      statusCode: status,
      message: init.message ?? 'Success',
      data,
      ...(init.meta && { meta: init.meta }),
      timestamp: new Date().toISOString(),
    },
    { status },
  )
}

export function fail(status: number, code: string, message: string, errors?: unknown) {
  return HttpResponse.json(
    {
      success: false,
      statusCode: status,
      code,
      message,
      ...(errors !== undefined && { errors }),
      path: '',
      timestamp: new Date().toISOString(),
    },
    { status },
  )
}

export const notFound = (what = 'Resource') => fail(404, 'NOT_FOUND', `${what} not found`)

// ---------- query string, phân trang, sort ----------
export const searchParams = (request: Request) => new URL(request.url).searchParams

export function paginate<T>(items: T[], params: URLSearchParams) {
  const limit = Math.min(Math.max(Number(params.get('limit')) || 20, 1), 100)
  const totalItems = items.length
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1)
  const page = Math.min(Math.max(Number(params.get('page')) || 1, 1), totalPages)
  const meta: PaginationMeta = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
  return { items: items.slice((page - 1) * limit, page * limit), meta }
}

/** Sort theo whitelist; giá trị null luôn xếp cuối */
export function sortBy<T>(
  items: T[],
  params: URLSearchParams,
  columns: Record<string, (item: T) => string | number | null>,
  fallback: string,
) {
  const key = params.get('sortBy') ?? fallback
  const get = columns[key] ?? columns[fallback]
  const dir = params.get('order') === 'ASC' ? 1 : -1
  return [...items].sort((a, b) => {
    const x = get(a)
    const y = get(b)
    if (x === y) return 0
    if (x === null) return 1
    if (y === null) return -1
    return (x < y ? -1 : 1) * dir
  })
}

export const includesText = (value: string, search: string | null) =>
  !search || value.toLowerCase().includes(search.toLowerCase())

/**
 * File trong multipart. Không dùng `instanceof File`: trong test (jsdom + Node) form data
 * được parse bằng lớp File của Node, khác lớp File của jsdom.
 */
export const isUploadedFile = (value: unknown): value is File =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as File).name === 'string' &&
  typeof (value as File).size === 'number'

const CV_MAX_SIZE = 5 * 1024 * 1024
const CV_EXTENSIONS = ['.pdf', '.docx']
const CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

/**
 * Kiểm file CV (BR-FILE-01): PDF/DOCX, tối đa 5MB. BE kiểm mime + magic bytes; ở đây nhận
 * theo mime hoặc đuôi file (jsdom làm mất tên file khi gửi multipart).
 * Trả về File hợp lệ, hoặc Response lỗi để handler return luôn (giống authorize).
 */
export function checkCvFile(file: unknown): File | Response {
  if (!isUploadedFile(file)) return fail(400, 'FILE_TYPE_NOT_ALLOWED', 'CV file is required')
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!CV_MIME_TYPES.includes(file.type) && !CV_EXTENSIONS.includes(ext)) {
    return fail(400, 'FILE_TYPE_NOT_ALLOWED', 'Only PDF or DOCX')
  }
  if (file.size > CV_MAX_SIZE) return fail(413, 'FILE_TOO_LARGE', 'File exceeds 5MB')
  return file
}

/** Bỏ dấu tiếng Việt + chữ thường – giống f_unaccent(lower(...)) ở BE */
export const foldText = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** Tìm gần đúng không dấu: "nguyen" khớp "Nguyễn" */
export const includesFolded = (value: string, search: string | null) =>
  !search || foldText(value).includes(foldText(search.trim()))

/** Mật khẩu 8–72 ký tự, có chữ hoa, chữ thường và số (BR-ACC-06, giống CreateUserDto) */
export const isStrongPassword = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 72 &&
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)

// ---------- xác thực + phân quyền + scope ----------
const TOKEN_PREFIX = 'mock.'
export const SESSION_KEY = 'hireflow.mock.session'

export const tokenFor = (user: UserRow) => ({
  accessToken: `${TOKEN_PREFIX}${user.id}`,
  tokenType: 'Bearer' as const,
  expiresIn: 900,
})

/** Lấy user từ header Authorization; lỗi thì trả Response để handler return luôn */
export function authorize(request: Request, permission?: Permission): UserRow | Response {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const user = token?.startsWith(TOKEN_PREFIX)
    ? db.users.find((u) => u.id === token.slice(TOKEN_PREFIX.length))
    : undefined
  if (!user || !user.isActive) return fail(401, 'UNAUTHORIZED', 'Unauthorized')
  if (permission && !hasPermission(user, permission)) {
    return fail(403, 'FORBIDDEN', 'Forbidden resource')
  }
  return user
}

/** Scope phòng ban: Hiring Manager chỉ thấy dữ liệu phòng mình (Backend Architecture mục 10.4) */
export const inScope = (user: UserRow, departmentId: string) =>
  user.role !== Role.HiringManager || user.departmentId === departmentId

export const jobOf = (app: ApplicationRow) => db.jobs.find((j) => j.id === app.jobId)!
export const candidateOf = (app: ApplicationRow) =>
  db.candidates.find((c) => c.id === app.candidateId)!

// ---------- chuyển bảng → DTO giống BE ----------
const deptRef = (id: string | null) => {
  const d = db.departments.find((x) => x.id === id)
  return d ? { id: d.id, name: d.name } : null
}

export function toUser(row: UserRow): User {
  const { password: _password, ...rest } = row
  return {
    ...rest,
    department: deptRef(row.departmentId),
  }
}

// GET /auth/me
export const toMe = (row: UserRow): User => ({
  ...toUser(row),
  permissions: [...ROLE_PERMISSIONS[row.role]],
})

export function toJobSummary(job: JobRow): JobSummary {
  const apps = db.applications.filter((a) => a.jobId === job.id)
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    location: job.location,
    department: deptRef(job.departmentId)!,
    applicationCount: apps.length,
    pipeline: {
      new: apps.filter((a) => a.status === 'NEW').length,
      inProgress: apps.filter((a) => ['SCREENING', 'INTERVIEW', 'OFFER'].includes(a.status)).length,
      hired: apps.filter((a) => a.status === 'HIRED').length,
      closed: apps.filter((a) => a.status === 'REJECTED' || a.status === 'WITHDRAWN').length,
    },
    publishedAt: job.publishedAt,
    createdAt: job.createdAt,
  }
}

export function toJob(job: JobRow): Job {
  return {
    ...toJobSummary(job),
    jdText: job.jdText,
    jdVersion: job.jdVersion,
    requirements: job.requirements,
    updatedAt: job.updatedAt,
  }
}

export function toApplicationItem(app: ApplicationRow): ApplicationListItem {
  const c = candidateOf(app)
  const job = jobOf(app)
  return {
    id: app.id,
    status: app.status,
    aiStatus: app.aiStatus,
    score: app.score,
    flags: app.flags,
    createdAt: app.createdAt,
    candidate: { id: c.id, fullName: c.fullName, email: c.email },
    job: { id: job.id, title: job.title },
  }
}

export function toApplicationDetail(app: ApplicationRow): ApplicationDetail {
  const c = candidateOf(app)
  const job = jobOf(app)
  return {
    ...toApplicationItem(app),
    candidate: { id: c.id, fullName: c.fullName, email: c.email, phone: c.phone },
    job: { id: job.id, title: job.title, jdVersion: job.jdVersion, departmentId: job.departmentId },
    requirements: job.requirements,
    breakdown: app.breakdown,
    scoredJdVersion: app.scoredJdVersion,
    aiError: app.aiError,
    cv: c.anonymizedAt
      ? null
      : {
          fileId: `file-${app.id}`,
          fileName: app.cvFileName,
          text: app.aiStatus === 'FAILED' ? null : c.cvText,
        },
  }
}
