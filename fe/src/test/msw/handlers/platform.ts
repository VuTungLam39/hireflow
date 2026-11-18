import { http } from 'msw'
import { Permission } from '@/lib/permissions'
import type { OrganizationStatus } from '@/types/user'
import { db, type OrganizationRow } from '../data'
import { api, authorize, fail, includesFolded, notFound, ok, paginate, searchParams } from '../http'

type Kind = 'approve' | 'reject' | 'suspend' | 'reactivate'

// BR-ORG-04
const TRANSITIONS: Record<Kind, { from: OrganizationStatus; to: OrganizationStatus }> = {
  approve: { from: 'PENDING', to: 'ACTIVE' },
  reject: { from: 'PENDING', to: 'REJECTED' },
  suspend: { from: 'ACTIVE', to: 'SUSPENDED' },
  reactivate: { from: 'SUSPENDED', to: 'ACTIVE' },
}

// BR-AI-11: hôm nay trước, 6 ngày trước đó
const usageOf = (o: OrganizationRow) =>
  Array.from({ length: 7 }, (_, i) => ({
    day: new Date(Date.now() + 7 * 3_600_000 - i * 86_400_000).toISOString().slice(0, 10),
    cv: i === 0 ? Math.min(o.aiDailyScoreLimit, o.applications30d) : 0,
    chat: i === 0 && o.status === 'ACTIVE' ? 3 : 0,
  }))
const detail = (o: OrganizationRow) => ({ ...o, aiUsage: usageOf(o) })

// KH MVP 3 mục 8.2
export const platformHandlers = [
  http.get(api('/platform/organizations'), ({ request }) => {
    const user = authorize(request, Permission.PlatformManage)
    if (user instanceof Response) return user
    const params = searchParams(request)
    const status = params.get('status')
    const search = params.get('search')
    const rows = db.organizations
      .filter(
        (o) =>
          (!status || o.status === status) &&
          includesFolded(`${o.name} ${o.slug} ${o.taxCode ?? ''}`, search),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const { items, meta } = paginate(rows, params)
    return ok(items, { meta })
  }),

  http.get(api('/platform/organizations/:id'), ({ request, params }) => {
    const user = authorize(request, Permission.PlatformManage)
    if (user instanceof Response) return user
    const org = db.organizations.find((o) => o.id === params.id)
    return org ? ok(detail(org)) : notFound('Organization')
  }),

  http.patch(api('/platform/organizations/:id/ai-limits'), async ({ request, params }) => {
    const user = authorize(request, Permission.PlatformManage)
    if (user instanceof Response) return user
    const org = db.organizations.find((o) => o.id === params.id)
    if (!org) return notFound('Organization')
    const body = (await request.json()) as { aiDailyScoreLimit: number; aiDailyChatLimit: number }
    const bad = (['aiDailyScoreLimit', 'aiDailyChatLimit'] as const).filter(
      (k) => !Number.isInteger(body[k]) || body[k] < 0 || body[k] > 100_000,
    )
    if (bad.length) {
      return fail(
        400,
        'VALIDATION_FAILED',
        'Validation failed',
        bad.map((field) => ({ field, messages: [`${field} must not be greater than 100000`] })),
      )
    }
    Object.assign(org, body)
    return ok(detail(org))
  }),

  http.patch(api('/platform/organizations/:id/:kind'), async ({ request, params }) => {
    const user = authorize(request, Permission.PlatformManage)
    if (user instanceof Response) return user
    const t = TRANSITIONS[params.kind as Kind]
    const org = db.organizations.find((o) => o.id === params.id)
    if (!t || !org) return notFound('Organization')
    const { reason } = (await request.json().catch(() => ({}))) as { reason?: string }
    const needsReason = params.kind === 'reject' || params.kind === 'suspend'
    if (needsReason && (!reason || reason.trim().length < 5)) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'reason', messages: ['reason must be longer than or equal to 5 characters'] },
      ])
    }
    if (org.status !== t.from) {
      return fail(409, 'INVALID_ORG_TRANSITION', `Cannot ${String(params.kind)}`)
    }
    org.status = t.to
    org.statusReason = needsReason ? reason!.trim() : null
    if (params.kind === 'approve') org.approvedAt = new Date().toISOString()
    return ok(detail(org))
  }),

  http.get(api('/platform/queues'), ({ request }) => {
    const user = authorize(request, Permission.PlatformManage)
    if (user instanceof Response) return user
    const failed = db.applications.filter((a) => a.aiStatus === 'FAILED').length
    return ok(
      ['parse-cv', 'extract-cv', 'score', 'embed-cv'].map((name, i) => ({
        name,
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: i === 1 ? failed : 0,
      })),
    )
  }),
]

const VERIFY_TOKEN = 'valid-token-1234567890'

// KH MVP 3 mục 8.1 · US-19
export const employerHandlers = [
  http.post(api('/public/employers/register'), async ({ request }) => {
    const body = (await request.json()) as { taxCode: string; companyName: string }
    if (db.organizations.some((o) => o.taxCode === body.taxCode)) {
      return fail(409, 'ORGANIZATION_EXISTS', 'Organization already registered', [
        { field: 'taxCode', messages: ['Mã số thuế đã được đăng ký trên sàn'] },
      ])
    }
    return ok(null, { status: 202 })
  }),

  http.post(api('/public/employers/verify-email'), async ({ request }) => {
    const { token } = (await request.json()) as { token: string }
    return token === VERIFY_TOKEN
      ? ok(null)
      : fail(400, 'TOKEN_INVALID', 'Token is invalid or expired')
  }),

  http.post(api('/public/employers/resend-verification'), () => ok(null, { status: 202 })),
]

export { VERIFY_TOKEN }
