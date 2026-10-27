import { delay, http } from 'msw'
import { Permission } from '@/lib/permissions'
import type { NotificationItem } from '@/features/notifications'
import type { CursorMeta } from '@/types/api'
import { db, type NotificationRow } from '../data'
import { api, authorize, candidateOf, fail, jobOf, notFound, ok, searchParams } from '../http'

const mine = (userId: string) =>
  db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))

const unread = (userId: string) => mine(userId).filter((n) => !n.readAt).length

export function toNotification(n: NotificationRow): NotificationItem {
  const app = db.applications.find((a) => a.id === n.applicationId)
  return {
    id: n.id,
    type: n.type,
    readAt: n.readAt,
    createdAt: n.createdAt,
    application: app
      ? {
          id: app.id,
          candidateName: candidateOf(app).fullName,
          jobId: app.jobId,
          jobTitle: jobOf(app).title,
          score: app.score,
          aiError: app.aiError,
        }
      : null,
    interview: null,
  }
}

// F-NOTI-01 · API Contract 4.12
export const notificationHandlers = [
  http.get(api('/notifications'), async ({ request }) => {
    await delay()
    const user = authorize(request)
    if (user instanceof Response) return user
    const p = searchParams(request)
    const limit = Math.min(Number(p.get('limit') ?? 20), 50)
    const start = Number(p.get('cursor') ?? 0)
    if (!Number.isInteger(start) || start < 0) {
      return fail(400, 'VALIDATION_FAILED', 'Invalid cursor')
    }
    const rows = mine(user.id)
    const items = rows.slice(start, start + limit)
    const hasNextPage = rows.length > start + limit
    const meta: CursorMeta = {
      limit,
      nextCursor: hasNextPage ? String(start + limit) : null,
      hasNextPage,
    }
    return ok(items.map(toNotification), { meta })
  }),

  http.get(api('/notifications/unread-count'), ({ request }) => {
    const user = authorize(request)
    if (user instanceof Response) return user
    return ok({ unreadCount: unread(user.id) })
  }),

  http.patch(api('/notifications/read-all'), ({ request }) => {
    const user = authorize(request)
    if (user instanceof Response) return user
    const now = new Date().toISOString()
    for (const n of mine(user.id)) n.readAt ??= now
    return ok({ unreadCount: 0 })
  }),

  http.patch(api('/notifications/:id/read'), ({ request, params }) => {
    const user = authorize(request)
    if (user instanceof Response) return user
    const n = db.notifications.find((x) => x.id === params.id && x.userId === user.id)
    if (!n) return notFound('Notification')
    n.readAt ??= new Date().toISOString()
    return ok({ unreadCount: unread(user.id) })
  }),

  http.get(api('/notifications/stream'), ({ request }) => {
    const user = authorize(request)
    if (user instanceof Response) return user
    const body = `event: ready\ndata: ${JSON.stringify({ unreadCount: unread(user.id) })}\n\n`
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
  }),
]

// F-AUDIT-01 · API Contract 4.13
export const auditHandlers = [
  http.get(api('/audit-logs'), async ({ request }) => {
    await delay()
    const user = authorize(request, Permission.AuditRead)
    if (user instanceof Response) return user
    const p = searchParams(request)
    const limit = Math.min(Number(p.get('limit') ?? 50), 100)
    const start = Number(p.get('cursor') ?? 0)
    const from = p.get('from')
    const to = p.get('to')
    const rows = db.auditLogs
      .filter(
        (l) =>
          (!p.get('action') || l.action === p.get('action')) &&
          (!p.get('entity') || l.entity === p.get('entity')) &&
          (!p.get('entityId') || l.entityId === p.get('entityId')) &&
          (!p.get('actorId') || l.actorId === p.get('actorId')) &&
          (!from || new Date(l.createdAt) >= new Date(from)) &&
          (!to || new Date(l.createdAt) < new Date(to)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    const items = rows.slice(start, start + limit)
    const hasNextPage = rows.length > start + limit
    const meta: CursorMeta = {
      limit,
      nextCursor: hasNextPage ? String(start + limit) : null,
      hasNextPage,
    }
    return ok(
      items.map((l) => {
        const actor = db.users.find((u) => u.id === l.actorId)
        return {
          ...l,
          actor: actor ? { id: actor.id, fullName: actor.fullName, email: actor.email } : null,
        }
      }),
      { meta },
    )
  }),
]
