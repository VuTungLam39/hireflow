import { delay, http } from 'msw'
import type { JobInput, RequirementInput } from '@/features/jobs'
import type { RankingData } from '@/features/ranking'
import { Permission } from '@/lib/permissions'
import { applyScore, db, settleProcessing, SKILLS, uid, type JobRow, type UserRow } from '../data'
import {
  api,
  latency,
  authorize,
  candidateOf,
  fail,
  includesText,
  inScope,
  notFound,
  ok,
  paginate,
  searchParams,
  sortBy,
  toJob,
  toJobSummary,
} from '../http'

/** Tìm job trong scope; ngoài scope coi như không tồn tại (404) */
function findJob(user: UserRow, id: unknown): JobRow | Response {
  const job = db.jobs.find((j) => j.id === id)
  return job && inScope(user, job.departmentId) ? job : notFound('Job')
}

/** BR-JOB-04: job CLOSED không sửa JD, tiêu chí */
const notEditable = () => fail(409, 'JOB_NOT_EDITABLE', 'Closed jobs cannot be edited')

export const jobHandlers = [
  http.get(api('/jobs'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.JobRead)
    if (user instanceof Response) return user
    const params = searchParams(request)
    const status = params.get('status')
    const departmentId = params.get('departmentId')
    const rows = db.jobs.filter(
      (j) =>
        inScope(user, j.departmentId) &&
        (!status || j.status === status) &&
        (!departmentId || j.departmentId === departmentId) &&
        includesText(j.title, params.get('search')),
    )
    const sorted = sortBy(
      rows,
      params,
      { createdAt: (j) => j.createdAt, title: (j) => j.title, publishedAt: (j) => j.publishedAt },
      'createdAt',
    )
    const { items, meta } = paginate(sorted, params)
    return ok(items.map(toJobSummary), { meta })
  }),

  http.get(api('/jobs/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobRead)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    return job instanceof Response ? job : ok(toJob(job))
  }),

  http.post(api('/jobs'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.JobCreate)
    if (user instanceof Response) return user
    const input = (await request.json()) as JobInput
    const now = new Date().toISOString()
    const job: JobRow = {
      id: uid('job'),
      ...input,
      status: 'DRAFT',
      jdVersion: 1,
      requirements: [],
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    db.jobs.push(job)
    return ok(toJob(job), { status: 201, message: 'Job created' })
  }),

  http.patch(api('/jobs/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobUpdate)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    if (job.status === 'CLOSED') return notEditable()
    Object.assign(job, (await request.json()) as JobInput, { updatedAt: new Date().toISOString() })
    return ok(toJob(job))
  }),

  // BR-JOB-04: chỉ xoá job DRAFT chưa có hồ sơ; job khác chỉ đóng
  http.delete(api('/jobs/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobUpdate)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    if (job.status !== 'DRAFT' || db.applications.some((a) => a.jobId === job.id)) {
      return fail(409, 'JOB_NOT_DELETABLE', 'Only DRAFT jobs without applications can be deleted')
    }
    db.jobs.splice(db.jobs.indexOf(job), 1)
    return ok(null, { message: 'Job deleted' })
  }),

  // LLM giả: tìm từ khoá kỹ năng xuất hiện trong JD
  http.post(api('/jobs/:id/requirements/suggest'), async ({ request, params }) => {
    await latency(1500)
    const user = authorize(request, Permission.JobUpdate)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    const jd = job.jdText.toLowerCase()
    const found = Object.entries(SKILLS).filter(([key, s]) =>
      [key, s.label.toLowerCase()].some((k) => jd.includes(k)),
    )
    const suggestions: RequirementInput[] = found.map(([key, s], i) => ({
      label: s.label,
      type: i < 2 ? 'MUST' : 'NICE',
      weight: i < 2 ? 3 - i : 1,
      minYears: i === 0 ? 2 : null,
      keywords: [...new Set([key, s.label.toLowerCase()])],
    }))
    return ok(suggestions)
  }),

  // Thay tiêu chí → tăng jdVersion → tính lại điểm (BE làm trong queue, ở đây làm luôn) → 202
  http.put(api('/jobs/:id/requirements'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobUpdate)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    if (job.status === 'CLOSED') return notEditable()
    const { requirements } = (await request.json()) as { requirements: RequirementInput[] }
    job.requirements = requirements.map((r) => ({ ...r, id: uid('req') }))
    job.jdVersion += 1
    job.updatedAt = new Date().toISOString()
    // Ứng viên đã ẩn danh không còn CV để chấm lại: giữ nguyên điểm cũ (BR-DATA-03)
    db.applications
      .filter((a) => a.jobId === job.id && a.aiStatus === 'DONE' && !candidateOf(a).anonymizedAt)
      .forEach(applyScore)
    return ok({ jdVersion: job.jdVersion }, { status: 202, message: 'Rescoring scheduled' })
  }),

  http.patch(api('/jobs/:id/publish'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobPublish)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    if (job.status !== 'DRAFT' || job.requirements.length === 0) {
      return fail(409, 'JOB_NOT_PUBLISHABLE', 'Job must be DRAFT with at least one requirement')
    }
    Object.assign(job, { status: 'OPEN', publishedAt: new Date().toISOString() })
    return ok(toJob(job))
  }),

  http.patch(api('/jobs/:id/close'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobPublish)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    if (job.status !== 'OPEN') return fail(409, 'JOB_NOT_CLOSABLE', 'Only OPEN jobs can be closed')
    job.status = 'CLOSED'
    return ok(toJob(job))
  }),

  // Đề xuất bổ sung kickoff 10.2: dữ liệu cho bảng xếp hạng + thanh trọng số
  http.get(api('/jobs/:id/ranking'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.JobRead)
    if (user instanceof Response) return user
    const job = findJob(user, params.id)
    if (job instanceof Response) return job
    settleProcessing()
    const data: RankingData = {
      job: { id: job.id, title: job.title, status: job.status, jdVersion: job.jdVersion },
      requirements: job.requirements,
      items: db.applications
        .filter((a) => a.jobId === job.id)
        .map((a) => ({
          applicationId: a.id,
          candidateName: candidateOf(a).fullName,
          status: a.status,
          aiStatus: a.aiStatus,
          flags: a.flags,
          matches: a.breakdown.map((b) => ({ requirementId: b.requirementId, match: b.match })),
        })),
    }
    return ok(data)
  }),
]
