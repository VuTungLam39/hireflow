import { delay, http } from 'msw'
import type { Interview } from '@/features/interviews'
import { Permission } from '@/lib/permissions'
import { Role } from '@/types/user'
import { db, uid, type InterviewRow } from '../data'
import {
  api,
  authorize,
  candidateOf,
  canSeeApplication,
  fail,
  jobOf,
  notFound,
  ok,
  searchParams,
} from '../http'

const DAY_MS = 86_400_000

function toInterview(iv: InterviewRow, viewerId: string, withApplication: boolean): Interview {
  const viewer = db.users.find((u) => u.id === viewerId)!
  const app = db.applications.find((a) => a.id === iv.applicationId)!
  const submitted = new Set(iv.feedbacks.map((f) => f.authorId))
  return {
    id: iv.id,
    applicationId: iv.applicationId,
    round: iv.round,
    scheduledAt: iv.scheduledAt,
    durationMinutes: iv.durationMinutes,
    location: iv.location,
    status: iv.status,
    cancelReason: iv.cancelReason,
    createdAt: iv.createdAt,
    interviewers: iv.interviewerIds.map((id) => {
      const u = db.users.find((x) => x.id === id)!
      return { id, fullName: u.fullName, email: u.email, submitted: submitted.has(id) }
    }),
    feedbacks: iv.feedbacks
      .filter((f) => viewer.role !== Role.Interviewer || f.authorId === viewerId)
      .map((f) => ({
        ...f,
        author: { id: f.authorId, fullName: db.users.find((u) => u.id === f.authorId)!.fullName },
      })),
    ...(withApplication && {
      application: {
        id: app.id,
        status: app.status,
        candidate: { id: app.candidateId, fullName: candidateOf(app).fullName },
        job: { id: app.jobId, title: jobOf(app).title },
      },
    }),
  }
}

const validInterviewers = (ids: unknown) =>
  Array.isArray(ids) &&
  ids.length >= 1 &&
  ids.length <= 5 &&
  ids.every((id) => db.users.some((u) => u.id === id && u.role === Role.Interviewer && u.isActive))

const clashes = (ids: string[], start: Date, minutes: number, exceptId?: string) =>
  db.interviews.some(
    (iv) =>
      iv.id !== exceptId &&
      iv.status === 'SCHEDULED' &&
      iv.interviewerIds.some((id) => ids.includes(id)) &&
      new Date(iv.scheduledAt).getTime() < start.getTime() + minutes * 60_000 &&
      new Date(iv.scheduledAt).getTime() + iv.durationMinutes * 60_000 > start.getTime(),
  )

// F-INT-01 → 03 · API Contract 4.14
export const interviewHandlers = [
  http.get(api('/interviews/interviewers'), ({ request }) => {
    const user = authorize(request, Permission.InterviewManage)
    if (user instanceof Response) return user
    return ok(
      db.users
        .filter((u) => u.role === Role.Interviewer && u.isActive)
        .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })),
    )
  }),

  http.get(api('/interviews'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    const p = searchParams(request)
    const from = new Date(p.get('from') ?? Date.now() - DAY_MS).getTime()
    const to = new Date(p.get('to') ?? Date.now() + 30 * DAY_MS).getTime()
    const rows = db.interviews
      .filter((iv) => {
        const t = new Date(iv.scheduledAt).getTime()
        const app = db.applications.find((a) => a.id === iv.applicationId)!
        return (
          t >= from &&
          t < to &&
          (p.get('includeCancelled') === 'true' || iv.status !== 'CANCELLED') &&
          canSeeApplication(user, app) &&
          (user.role !== Role.Interviewer || iv.interviewerIds.includes(user.id))
        )
      })
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    return ok(rows.map((iv) => toInterview(iv, user.id, true)))
  }),

  http.get(api('/applications/:id/interviews'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationRead)
    if (user instanceof Response) return user
    const app = db.applications.find((a) => a.id === params.id)
    if (!app || !canSeeApplication(user, app)) return notFound('Application')
    return ok(
      db.interviews
        .filter(
          (iv) =>
            iv.applicationId === app.id &&
            (user.role !== Role.Interviewer || iv.interviewerIds.includes(user.id)),
        )
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .map((iv) => toInterview(iv, user.id, false)),
    )
  }),

  http.post(api('/applications/:id/interviews'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.InterviewManage)
    if (user instanceof Response) return user
    const app = db.applications.find((a) => a.id === params.id)
    if (!app) return notFound('Application')
    if (app.status !== 'INTERVIEW') {
      return fail(409, 'INTERVIEW_NOT_ALLOWED', 'Application is not in INTERVIEW')
    }
    const body = (await request.json()) as {
      scheduledAt: string
      durationMinutes: number
      location: string
      interviewerIds: string[]
    }
    const start = new Date(body.scheduledAt)
    if (!(start.getTime() > Date.now())) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'scheduledAt', messages: ['Thời gian phỏng vấn phải ở tương lai'] },
      ])
    }
    if (!validInterviewers(body.interviewerIds)) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'interviewerIds', messages: ['Chỉ phân công người dùng vai trò Interviewer'] },
      ])
    }
    if (clashes(body.interviewerIds, start, body.durationMinutes)) {
      return fail(409, 'INTERVIEW_CONFLICT', 'Conflict', [
        { field: 'interviewerIds', messages: ['Trùng lịch người phỏng vấn'] },
      ])
    }
    const row: InterviewRow = {
      id: uid('iv'),
      applicationId: app.id,
      round:
        db.interviews.filter((i) => i.applicationId === app.id && i.status !== 'CANCELLED').length +
        1,
      scheduledAt: start.toISOString(),
      durationMinutes: body.durationMinutes,
      location: body.location,
      status: 'SCHEDULED',
      cancelReason: null,
      createdAt: new Date().toISOString(),
      interviewerIds: body.interviewerIds,
      feedbacks: [],
    }
    db.interviews.push(row)
    return ok(toInterview(row, user.id, true), { status: 201 })
  }),

  http.patch(api('/interviews/:id/cancel'), async ({ request, params }) => {
    const user = authorize(request, Permission.InterviewManage)
    if (user instanceof Response) return user
    const iv = db.interviews.find((i) => i.id === params.id)
    if (!iv) return notFound('Interview')
    if (iv.status !== 'SCHEDULED') return fail(409, 'INTERVIEW_NOT_EDITABLE', 'Not editable')
    const { reason } = (await request.json()) as { reason?: string }
    if (!reason?.trim()) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'reason', messages: ['reason should not be empty'] },
      ])
    }
    Object.assign(iv, { status: 'CANCELLED', cancelReason: reason.trim() })
    return ok(toInterview(iv, user.id, true))
  }),

  http.patch(api('/interviews/:id'), async ({ request, params }) => {
    const user = authorize(request, Permission.InterviewManage)
    if (user instanceof Response) return user
    const iv = db.interviews.find((i) => i.id === params.id)
    if (!iv) return notFound('Interview')
    if (iv.status !== 'SCHEDULED' || iv.feedbacks.length) {
      return fail(409, 'INTERVIEW_NOT_EDITABLE', 'Not editable')
    }
    const body = (await request.json()) as Partial<InterviewRow>
    const start = new Date(body.scheduledAt ?? iv.scheduledAt)
    const ids = body.interviewerIds ?? iv.interviewerIds
    if (clashes(ids, start, body.durationMinutes ?? iv.durationMinutes, iv.id)) {
      return fail(409, 'INTERVIEW_CONFLICT', 'Conflict', [
        { field: 'interviewerIds', messages: ['Trùng lịch người phỏng vấn'] },
      ])
    }
    Object.assign(iv, {
      scheduledAt: start.toISOString(),
      durationMinutes: body.durationMinutes ?? iv.durationMinutes,
      location: body.location ?? iv.location,
      interviewerIds: ids,
    })
    return ok(toInterview(iv, user.id, true))
  }),

  http.put(api('/interviews/:id/feedback'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.InterviewFeedback)
    if (user instanceof Response) return user
    const iv = db.interviews.find((i) => i.id === params.id && i.interviewerIds.includes(user.id))
    if (!iv) return notFound('Interview')
    if (iv.status === 'CANCELLED') return fail(409, 'INTERVIEW_NOT_EDITABLE', 'Cancelled')
    if (new Date(iv.scheduledAt).getTime() > Date.now()) {
      return fail(409, 'INTERVIEW_NOT_STARTED', 'Not started')
    }
    const body = (await request.json()) as {
      overall: number
      ratings: { requirementId: string; score: number }[]
      comment?: string
    }
    const app = db.applications.find((a) => a.id === iv.applicationId)!
    const reqs = jobOf(app).requirements
    if (
      reqs.length !== body.ratings.length ||
      reqs.some((r) => !body.ratings.some((x) => x.requirementId === r.id))
    ) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'ratings', messages: ['Chấm đủ mỗi tiêu chí của tin đúng một lần'] },
      ])
    }
    const now = new Date()
    const existing = iv.feedbacks.find((f) => f.authorId === user.id)
    if (existing && new Date(existing.editableUntil) < now) {
      return fail(409, 'FEEDBACK_LOCKED', 'Locked')
    }
    const ratings = reqs.map((r) => ({
      requirementId: r.id,
      label: r.label,
      score: body.ratings.find((x) => x.requirementId === r.id)!.score,
    }))
    const row = existing ?? {
      id: uid('fb'),
      authorId: user.id,
      overall: body.overall,
      ratings,
      comment: null,
      submittedAt: now.toISOString(),
      editableUntil: new Date(now.getTime() + DAY_MS).toISOString(),
    }
    Object.assign(row, { overall: body.overall, ratings, comment: body.comment?.trim() || null })
    if (!existing) iv.feedbacks.push(row)
    if (iv.feedbacks.length >= iv.interviewerIds.length) iv.status = 'COMPLETED'
    const author = db.users.find((u) => u.id === user.id)!
    return ok({ ...row, author: { id: author.id, fullName: author.fullName } })
  }),
]
