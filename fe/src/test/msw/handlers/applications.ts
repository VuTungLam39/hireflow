import { delay, http } from 'msw'
import {
  APPLICATION_STATUS,
  NEXT_STATUS,
  REASON_REQUIRED,
  SCORE_GOOD,
  type ApplicationStatus,
} from '@/features/applications'
import type { DashboardSummary, FunnelView } from '@/features/dashboard'
import { Permission } from '@/lib/permissions'
import { Role } from '@/types/user'
import {
  addApplication,
  applyScore,
  createCandidate,
  db,
  settleProcessing,
  uid,
  type ApplicationRow,
  type UserRow,
} from '../data'
import {
  api,
  latency,
  authorize,
  candidateOf,
  fail,
  includesText,
  canSeeApplication,
  inScope,
  checkCvFile,
  notFound,
  ok,
  paginate,
  searchParams,
  sortBy,
  toApplicationDetail,
  toApplicationItem,
} from '../http'
import { guessTrack } from './public'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^(\+84|0)\d{9,10}$/

const visible = (user: UserRow) => db.applications.filter((a) => canSeeApplication(user, a))

function findApplication(user: UserRow, id: unknown): ApplicationRow | Response {
  settleProcessing()
  const app = db.applications.find((a) => a.id === id)
  return app && canSeeApplication(user, app) ? app : notFound('Application')
}

function moveStatus(app: ApplicationRow, to: ApplicationStatus, user: UserRow, reason?: string) {
  db.history.push({
    id: uid('his'),
    applicationId: app.id,
    fromStatus: app.status,
    toStatus: to,
    reason: reason ?? null,
    changedById: user.id,
    changedAt: new Date().toISOString(),
  })
  app.status = to
}

// US-06: cùng bộ lọc cho danh sách và xuất CSV
function filterRows(user: UserRow, p: URLSearchParams) {
  const scoreMin = p.get('scoreMin')
  const scoreMax = p.get('scoreMax')
  // Ngày theo giờ Việt Nam (UTC+7), tính cả hai đầu
  const from = p.get('createdFrom') && new Date(`${p.get('createdFrom')}T00:00:00+07:00`)
  const to = p.get('createdTo') && new Date(`${p.get('createdTo')}T23:59:59.999+07:00`)
  return visible(user).filter((a) => {
    const c = candidateOf(a)
    return (
      (!p.get('jobId') || a.jobId === p.get('jobId')) &&
      (!p.get('status') || a.status === p.get('status')) &&
      (!p.get('aiStatus') || a.aiStatus === p.get('aiStatus')) &&
      (!scoreMin || (a.score ?? -1) >= Number(scoreMin)) &&
      (!scoreMax || (a.score !== null && a.score <= Number(scoreMax))) &&
      (!p.get('missingMust') || a.flags.includes('MISSING_MUST')) &&
      (p.get('bucket') !== 'other' ||
        ((a.score === null || a.score < SCORE_GOOD) && !a.flags.includes('MISSING_MUST'))) &&
      (!from || new Date(a.createdAt) >= from) &&
      (!to || new Date(a.createdAt) <= to) &&
      includesText(`${c.fullName} ${c.email}`, p.get('search'))
    )
  })
}

const userRef = (id: string | null) => {
  const u = db.users.find((x) => x.id === id)
  return u ? { id: u.id, fullName: u.fullName } : null
}

export const applicationHandlers = [
  http.get(api('/applications'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    settleProcessing()
    const p = searchParams(request)
    const rows = filterRows(user, p)
    const sorted = sortBy(
      rows,
      p,
      { createdAt: (a) => a.createdAt, score: (a) => a.score },
      'createdAt',
    )
    const { items, meta } = paginate(sorted, p)
    return ok(items.map(toApplicationItem), { meta })
  }),

  // E6 · BR-APP-11: đặt trước '/applications/:id'
  http.get(api('/applications/export'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    if (user.role === Role.Interviewer) {
      return fail(403, 'FORBIDDEN', 'Interviewers cannot export applications')
    }
    const p = searchParams(request)
    settleProcessing()
    const rows = filterRows(user, p)
    if (rows.length > 5000) return fail(400, 'EXPORT_TOO_LARGE', 'Too many rows')
    const lines = rows.map((a) => {
      const c = candidateOf(a)
      return `"${c.fullName}","${c.email}","${APPLICATION_STATUS[a.status].label}"`
    })
    const CRLF = String.fromCharCode(13, 10)
    const body = [String.fromCharCode(0xfeff) + '"Họ tên","Email","Trạng thái"', ...lines, ''].join(
      CRLF,
    )
    return new Response(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ho-so-ung-tuyen-2026-11-05.csv"',
        'X-Total-Count': String(rows.length),
      },
    })
  }),

  http.get(api('/applications/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    return app instanceof Response ? app : ok(toApplicationDetail(app))
  }),

  http.get(api('/applications/:id/history'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    const rows = db.history
      .filter((h) => h.applicationId === app.id)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
      .map(({ changedById, applicationId: _id, ...h }) => ({
        ...h,
        changedBy: userRef(changedById),
      }))
    return ok(rows)
  }),

  http.get(api('/applications/:id/notes'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    const rows = db.notes
      .filter((n) => n.applicationId === app.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((n) => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt,
        author: userRef(n.authorId)!,
      }))
    return ok(rows)
  }),

  http.post(api('/applications/:id/notes'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    const { content } = (await request.json()) as { content: string }
    const note = {
      id: uid('note'),
      applicationId: app.id,
      authorId: user.id,
      content,
      createdAt: new Date().toISOString(),
    }
    db.notes.push(note)
    return ok({ ...note, author: userRef(user.id)! }, { status: 201 })
  }),

  // F2 · BR-APP-12: giống BE – mỗi hồ sơ xét riêng, OFFER không từ chối theo lô
  http.post(api('/applications/bulk-status'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationUpdateStatus)
    if (user instanceof Response) return user
    const { ids, status, reason } = (await request.json()) as {
      ids: string[]
      status: ApplicationStatus
      reason?: string
    }
    if (
      !Array.isArray(ids) ||
      ids.length < 1 ||
      ids.length > 100 ||
      new Set(ids).size !== ids.length
    ) {
      return fail(400, 'VALIDATION_FAILED', 'ids must be 1-100 unique ids')
    }
    if (!['SCREENING', 'INTERVIEW', 'REJECTED'].includes(status)) {
      return fail(
        400,
        'BULK_STATUS_NOT_ALLOWED',
        'Bulk change only allows SCREENING, INTERVIEW, REJECTED',
      )
    }
    if (status === 'REJECTED' && !reason?.trim()) {
      return fail(400, 'REJECT_REASON_REQUIRED', 'Reason is required')
    }
    const result = {
      succeeded: [] as string[],
      unchanged: [] as string[],
      failed: [] as { id: string; code: string }[],
    }
    for (const id of [...ids].sort()) {
      const app = db.applications.find((a) => a.id === id)
      if (!app || !canSeeApplication(user, app)) result.failed.push({ id, code: 'NOT_FOUND' })
      else if (app.status === status) result.unchanged.push(id)
      else if (app.status === 'OFFER' || !NEXT_STATUS[app.status].includes(status))
        result.failed.push({ id, code: 'INVALID_STATUS_TRANSITION' })
      else {
        moveStatus(app, status, user, reason)
        result.succeeded.push(id)
      }
    }
    return ok(result)
  }),

  http.patch(api('/applications/:id/status'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationUpdateStatus)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    const { status, reason } = (await request.json()) as {
      status: ApplicationStatus
      reason?: string
    }
    // HIRED chỉ đi qua /hire (quyền approve-offer)
    if (status === 'HIRED' || !NEXT_STATUS[app.status].includes(status)) {
      return fail(
        409,
        'INVALID_STATUS_TRANSITION',
        `Cannot move application from ${app.status} to ${status}`,
      )
    }
    if (REASON_REQUIRED.includes(status) && !reason?.trim()) {
      return fail(400, 'REJECT_REASON_REQUIRED', 'Reason is required')
    }
    moveStatus(app, status, user, reason)
    return ok(toApplicationDetail(app), { message: `Moved to ${APPLICATION_STATUS[status].label}` })
  }),

  http.patch(api('/applications/:id/hire'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationApproveOffer)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    if (app.status !== 'OFFER') {
      return fail(409, 'INVALID_STATUS_TRANSITION', 'Only OFFER can move to HIRED')
    }
    moveStatus(app, 'HIRED', user)
    return ok(toApplicationDetail(app))
  }),

  // BR-STS-05: Hiring Manager từ chối ở bước OFFER (cùng quyền duyệt offer), bắt buộc lý do
  http.patch(api('/applications/:id/decline-offer'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationApproveOffer)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    if (app.status !== 'OFFER') {
      return fail(409, 'INVALID_STATUS_TRANSITION', 'Only OFFER can be declined')
    }
    const { reason } = (await request.json()) as { reason?: string }
    if (!reason?.trim()) return fail(400, 'REJECT_REASON_REQUIRED', 'Reason is required')
    moveStatus(app, 'REJECTED', user, reason.trim())
    return ok(toApplicationDetail(app))
  }),

  // BR-APP-10: HR tải CV hộ ứng viên vào job OPEN. Kiểm như nộp công khai, nguồn HR_UPLOAD.
  http.post(api('/jobs/:id/applications'), async ({ request, params }) => {
    await latency(800)
    const user = authorize(request, Permission.ApplicationCreate)
    if (user instanceof Response) return user
    const job = db.jobs.find((j) => j.id === params.id && inScope(user, j.departmentId))
    if (!job) return notFound('Job')
    if (job.status !== 'OPEN') return fail(409, 'JOB_NOT_OPEN', 'Job is not open')

    const form = await request.formData()
    const get = (key: string) => String(form.get(key) ?? '').trim()
    const errors = []
    if (get('fullName').length < 2 || get('fullName').length > 100) {
      errors.push({ field: 'fullName', messages: ['Họ tên 2–100 ký tự'] })
    }
    if (!EMAIL.test(get('email'))) errors.push({ field: 'email', messages: ['Email không hợp lệ'] })
    if (get('phone') && !PHONE.test(get('phone'))) {
      errors.push({ field: 'phone', messages: ['Số điện thoại không hợp lệ'] })
    }
    if (get('consentConfirmed') !== 'true') {
      errors.push({ field: 'consentConfirmed', messages: ['Cần xác nhận ứng viên đã đồng ý'] })
    }
    if (errors.length) return fail(400, 'VALIDATION_FAILED', 'Validation failed', errors)

    const file = checkCvFile(form.get('cv'))
    if (file instanceof Response) return file

    const email = get('email').toLowerCase()
    const phone = get('phone') || null
    let candidate = db.candidates.find((c) => c.email === email)
    if (
      candidate &&
      db.applications.some((a) => a.jobId === job.id && a.candidateId === candidate!.id)
    ) {
      return fail(409, 'APPLICATION_DUPLICATED', 'Candidate already applied to this job')
    }
    if (candidate) {
      // BR-CAND-02: không ghi đè, chỉ điền trường đang trống
      if (!candidate.phone && phone) candidate.phone = phone
    } else {
      candidate = createCandidate(guessTrack(job), get('fullName'), email, phone)
      db.candidates.push(candidate)
    }

    const app = addApplication(job, candidate, {
      source: 'HR_UPLOAD',
      aiStatus: 'PROCESSING',
      processingUntil: Date.now() + 12_000,
      cvFileName: file.name,
    })
    // Dòng lịch sử đầu ghi HR thực hiện (Database Design mục 6)
    db.history.push({
      id: uid('his'),
      applicationId: app.id,
      fromStatus: null,
      toStatus: 'NEW',
      reason: null,
      changedById: user.id,
      changedAt: app.createdAt,
    })
    return ok(toApplicationDetail(app), { status: 201, message: 'Application created' })
  }),

  // BR-AI-08: hồ sơ DONE chỉ tính lại điểm theo tiêu chí hiện hành (không gọi LLM);
  // hồ sơ FAILED chạy lại từ bước lỗi: chuyển PROCESSING, tự xong sau 6 giây → 202
  http.post(api('/applications/:id/rescore'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.AiRescore)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    if (app.aiStatus === 'DONE') {
      if (!candidateOf(app).anonymizedAt) applyScore(app)
      return ok(null, { status: 202, message: 'Rescore scheduled' })
    }
    Object.assign(app, {
      aiStatus: 'PROCESSING',
      aiError: null,
      processingUntil: Date.now() + 6000,
    })
    return ok(null, { status: 202, message: 'Rescore scheduled' })
  }),

  // F-APP-10, BR-APP-05
  http.patch(api('/applications/:id/reopen'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationUpdateStatus)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    if (app.status !== 'REJECTED' && app.status !== 'WITHDRAWN') {
      return fail(409, 'INVALID_STATUS_TRANSITION', 'Only REJECTED or WITHDRAWN can be reopened')
    }
    if (candidateOf(app).anonymizedAt) {
      return fail(409, 'CANDIDATE_ANONYMIZED', 'Candidate has been anonymized')
    }
    const { reason } = (await request.json()) as { reason?: string }
    if (!reason?.trim()) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'reason', messages: ['reason should not be empty'] },
      ])
    }
    moveStatus(app, 'SCREENING', user, reason.trim())
    return ok(toApplicationDetail(app), { message: 'Application reopened' })
  }),

  // F-FILE-02, BR-FILE-04
  http.put(api('/applications/:id/cv-text'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.AiRescore)
    if (user instanceof Response) return user
    const app = findApplication(user, params.id)
    if (app instanceof Response) return app
    if (candidateOf(app).anonymizedAt) {
      return fail(409, 'CANDIDATE_ANONYMIZED', 'Candidate has been anonymized')
    }
    if (app.aiStatus !== 'FAILED' || app.enteredCvText) {
      return fail(
        409,
        'CV_TEXT_NOT_EDITABLE',
        'CV text can only be entered when the CV file could not be read',
      )
    }
    const text = String(((await request.json()) as { text?: string }).text ?? '').trim()
    if (text.length < 100 || text.length > 50_000) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'text', messages: ['text must be between 100 and 50000 characters'] },
      ])
    }
    Object.assign(app, {
      enteredCvText: text,
      cvTextEnteredAt: new Date().toISOString(),
      aiStatus: 'PROCESSING',
      aiError: null,
      processingUntil: Date.now() + 6000,
    })
    return ok(toApplicationDetail(app), { message: 'CV text saved' })
  }),

  // Presigned URL giả: tạo blob chứa text CV ngay trên trình duyệt
  http.get(api('/files/:fileId/url'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.CvRead)
    if (user instanceof Response) return user
    const app = findApplication(user, String(params.fileId).replace(/^file-/, ''))
    if (app instanceof Response) return app
    // Ẩn danh đã xoá file CV (BR-DATA-03)
    if (candidateOf(app).anonymizedAt) return notFound('File')
    const blob = new Blob([candidateOf(app).cvText], { type: 'text/plain;charset=utf-8' })
    return ok({
      url: URL.createObjectURL(blob),
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    })
  }),

  // F1 · BR-REP-01: cùng định nghĩa với BE – cohort theo ngày nộp (giờ VN), tới bước k chặn bởi bước k-1
  http.get(api('/dashboard/funnel'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.DashboardRead)
    if (user instanceof Response) return user
    const p = new URL(request.url).searchParams
    const to = p.get('to') ?? new Date().toISOString().slice(0, 10)
    const from = p.get('from') ?? to
    const jobId = p.get('jobId')
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1
    if (!(span >= 1 && span <= 366))
      return fail(400, 'VALIDATION_FAILED', 'from..to must be 1-366 days')
    if (jobId && !db.jobs.some((j) => j.id === jobId && inScope(user, j.departmentId))) {
      return notFound('Job')
    }
    const start = Date.parse(`${from}T00:00:00+07:00`)
    const end = Date.parse(`${to}T00:00:00+07:00`) + 86_400_000
    const apps = visible(user).filter((a) => {
      const at = Date.parse(a.createdAt)
      return at >= start && at < end && (!jobId || a.jobId === jobId)
    })
    const ids = new Set(apps.map((a) => a.id))
    const rows = db.history.filter((h) => ids.has(h.applicationId))
    const sourceOf = new Map(apps.map((a) => [a.id, a.source]))
    const STAGES = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'] as const
    const reached = (i: number, source?: string): number => {
      const raw = rows.filter(
        (h) =>
          h.toStatus === STAGES[i] &&
          h.fromStatus === (i ? STAGES[i - 1] : null) &&
          (!source || sourceOf.get(h.applicationId) === source),
      ).length
      return i ? Math.min(raw, reached(i - 1, source)) : raw
    }
    const ratio = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 1000 : 0)
    const medianDays = (status: string) => {
      const spans = rows
        .filter((h) => h.fromStatus === status)
        .map((h) => {
          const prev = rows
            .filter((x) => x.applicationId === h.applicationId && x.changedAt < h.changedAt)
            .sort((x, y) => y.changedAt.localeCompare(x.changedAt))[0]
          return prev ? (Date.parse(h.changedAt) - Date.parse(prev.changedAt)) / 86_400_000 : null
        })
        .filter((d): d is number => d !== null)
        .sort((x, y) => x - y)
      return spans.length ? Math.round(spans[Math.floor((spans.length - 1) / 2)] * 10) / 10 : null
    }
    const cohort = reached(0)
    const view: FunnelView = {
      range: { from, to },
      generatedAt: new Date().toISOString(),
      cohort,
      stages: STAGES.map((status, i) => ({
        status,
        reached: reached(i),
        conversionFromPrev: i ? ratio(reached(i), reached(i - 1)) : null,
        conversionFromStart: ratio(reached(i), cohort),
        medianDaysInStage: status === 'HIRED' ? null : medianDays(status),
        rejected: rows.filter((h) => h.fromStatus === status && h.toStatus === 'REJECTED').length,
        withdrawn: rows.filter((h) => h.fromStatus === status && h.toStatus === 'WITHDRAWN').length,
      })),
      bySource: [...new Set(apps.map((a) => a.source))].sort().map((source) => ({
        source,
        cohort: reached(0, source),
        reachedInterview: reached(2, source),
        hired: reached(4, source),
      })),
      reopened: rows.filter((h) => h.fromStatus === 'REJECTED' || h.fromStatus === 'WITHDRAWN')
        .length,
    }
    return ok(view)
  }),

  http.get(api('/dashboard/summary'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.DashboardRead)
    if (user instanceof Response) return user
    settleProcessing()
    const apps = visible(user)
    const scored = apps.filter((a) => a.score !== null)
    const avg = (list: ApplicationRow[]) =>
      list.length ? Math.round(list.reduce((s, a) => s + (a.score ?? 0), 0) / list.length) : null

    const byStatus = Object.fromEntries(
      Object.keys(APPLICATION_STATUS).map((s) => [s, apps.filter((a) => a.status === s).length]),
    ) as DashboardSummary['byStatus']

    const byJob = db.jobs
      .filter((j) => inScope(user, j.departmentId))
      .map((job) => {
        const list = apps.filter((a) => a.jobId === job.id)
        return {
          jobId: job.id,
          title: job.title,
          total: list.length,
          avgScore: avg(list.filter((a) => a.score !== null)),
          hired: list.filter((a) => a.status === 'HIRED').length,
        }
      })
      .filter((j) => j.total > 0)
      .sort((a, b) => b.total - a.total)

    const summary: DashboardSummary = {
      totals: {
        applications: apps.length,
        openJobs: db.jobs.filter((j) => j.status === 'OPEN' && inScope(user, j.departmentId))
          .length,
        processing: apps.filter((a) => a.aiStatus === 'PROCESSING').length,
        avgScore: avg(scored),
      },
      byStatus,
      byJob,
    }
    return ok(summary)
  }),
]
