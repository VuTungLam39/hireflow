import { delay, http } from 'msw'
import type { CandidateDetail, CandidateListItem } from '@/features/candidates'
import { Permission } from '@/lib/permissions'
import type { CursorMeta } from '@/types/api'
import { db, type CandidateRow, type UserRow } from '../data'
import {
  api,
  authorize,
  fail,
  includesFolded,
  inScope,
  jobOf,
  notFound,
  ok,
  searchParams,
} from '../http'

const PHONE = /^(\+84|0)\d{9,10}$/

/** Hồ sơ của ứng viên mà người xem được thấy (Hiring Manager: chỉ job phòng mình) */
const visibleApps = (user: UserRow, candidate: CandidateRow) =>
  db.applications.filter(
    (a) => a.candidateId === candidate.id && inScope(user, jobOf(a).departmentId),
  )

/** BR-CAND-03: Hiring Manager chỉ thấy ứng viên có ít nhất một hồ sơ vào phòng mình */
function findCandidate(user: UserRow, id: unknown): CandidateRow | Response {
  const c = db.candidates.find((x) => x.id === id)
  return c && visibleApps(user, c).length > 0 ? c : notFound('Candidate')
}

function toListItem(user: UserRow, c: CandidateRow): CandidateListItem {
  const apps = visibleApps(user, c)
  return {
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    applicationCount: apps.length,
    lastAppliedAt: apps.reduce<string | null>(
      (max, a) => (max === null || a.createdAt > max ? a.createdAt : max),
      null,
    ),
    anonymizedAt: c.anonymizedAt,
    createdAt: c.createdAt,
  }
}

function toDetail(user: UserRow, c: CandidateRow): CandidateDetail {
  return {
    ...toListItem(user, c),
    applications: visibleApps(user, c)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => ({
        id: a.id,
        job: { id: a.jobId, title: jobOf(a).title },
        status: a.status,
        source: a.source,
        score: a.score,
        createdAt: a.createdAt,
      })),
  }
}

// Cursor mờ: base64 của { createdAt, id } dòng cuối trang trước (Backend Architecture 12.3)
const encodeCursor = (c: CandidateRow) => btoa(JSON.stringify({ createdAt: c.createdAt, id: c.id }))
function decodeCursor(raw: string): { createdAt: string; id: string } | null {
  try {
    const v = JSON.parse(atob(raw)) as { createdAt?: unknown; id?: unknown }
    return typeof v.createdAt === 'string' && typeof v.id === 'string'
      ? { createdAt: v.createdAt, id: v.id }
      : null
  } catch {
    return null
  }
}

/** (createdAt, id) giảm dần – đúng thứ tự index cursor ở BE */
const newestFirst = (a: CandidateRow, b: CandidateRow) =>
  b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)

export const candidateHandlers = [
  http.get(api('/candidates'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.CandidateRead)
    if (user instanceof Response) return user
    const p = searchParams(request)
    const limit = Math.min(Math.max(Number(p.get('limit')) || 20, 1), 100)
    const rawCursor = p.get('cursor')
    const cursor = rawCursor ? decodeCursor(rawCursor) : null
    if (rawCursor && !cursor) {
      return fail(400, 'VALIDATION_FAILED', 'Invalid cursor', [
        { field: 'cursor', messages: ['Cursor không hợp lệ'] },
      ])
    }

    const rows = db.candidates
      .filter(
        (c) =>
          visibleApps(user, c).length > 0 &&
          includesFolded(`${c.fullName} ${c.email}`, p.get('search')),
      )
      .sort(newestFirst)
      .filter(
        (c) =>
          !cursor ||
          c.createdAt < cursor.createdAt ||
          (c.createdAt === cursor.createdAt && c.id < cursor.id),
      )
    // Lấy dư 1 dòng để biết còn trang sau
    const page = rows.slice(0, limit + 1)
    const hasNextPage = page.length > limit
    const items = page.slice(0, limit)
    const meta: CursorMeta = {
      limit,
      nextCursor: hasNextPage ? encodeCursor(items[items.length - 1]) : null,
      hasNextPage,
    }
    return ok(
      items.map((c) => toListItem(user, c)),
      { meta },
    )
  }),

  http.get(api('/candidates/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.CandidateRead)
    if (user instanceof Response) return user
    const c = findCandidate(user, params.id)
    return c instanceof Response ? c : ok(toDetail(user, c))
  }),

  http.patch(api('/candidates/:id'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.CandidateUpdate)
    if (user instanceof Response) return user
    const c = findCandidate(user, params.id)
    if (c instanceof Response) return c
    if (c.anonymizedAt) {
      return fail(409, 'CANDIDATE_ANONYMIZED', 'Candidate has been anonymized')
    }
    const body = (await request.json()) as { fullName?: string; phone?: string | null }
    // Whitelist như ValidationPipe: email không sửa được (BR-CAND-01)
    if ('email' in body) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'email', messages: ['property email should not exist'] },
      ])
    }
    const errors = []
    const fullName = body.fullName?.trim()
    if (fullName !== undefined && (fullName.length < 2 || fullName.length > 100)) {
      errors.push({ field: 'fullName', messages: ['Họ tên 2–100 ký tự'] })
    }
    if (body.phone && !PHONE.test(body.phone)) {
      errors.push({ field: 'phone', messages: ['Số điện thoại không hợp lệ'] })
    }
    if (errors.length) return fail(400, 'VALIDATION_FAILED', 'Validation failed', errors)
    if (fullName !== undefined) c.fullName = fullName
    if (body.phone !== undefined) c.phone = body.phone || null
    return ok(toDetail(user, c))
  }),

  // Ẩn danh (BR-DATA-03): xoá CV, bằng chứng, liên hệ; giữ trạng thái và điểm. Không hoàn tác.
  http.post(api('/candidates/:id/anonymize'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.CandidateAnonymize)
    if (user instanceof Response) return user
    const c = findCandidate(user, params.id)
    if (c instanceof Response) return c
    if (c.anonymizedAt) {
      return fail(409, 'CANDIDATE_ANONYMIZED', 'Candidate has already been anonymized')
    }
    Object.assign(c, {
      fullName: 'Ứng viên đã ẩn danh',
      email: `anon+${c.id}@invalid.local`,
      phone: null,
      skills: [],
      hallucinated: null,
      cvText: '',
      anonymizedAt: new Date().toISOString(),
      anonymizedById: user.id,
    })
    for (const app of db.applications.filter((a) => a.candidateId === c.id)) {
      // score_breakdown chứa trích dẫn CV → xoá; giữ score, status, lịch sử để thống kê
      app.breakdown = []
      app.cvFileName = 'Đã xoá khi ẩn danh'
    }
    return ok(toDetail(user, c))
  }),
]
