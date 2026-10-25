import { http } from 'msw'
import { Permission } from '@/lib/permissions'
import { db } from '../data'
import { api, authorize, candidateOf, jobOf, notFound, ok, paginate, searchParams } from '../http'

const STUCK_MS = 5 * 60_000

const isIssue = (app: (typeof db.applications)[number]) =>
  app.aiStatus === 'FAILED' ||
  (app.aiStatus === 'PENDING' && Date.now() - new Date(app.createdAt).getTime() > STUCK_MS)

const toIssue = (app: (typeof db.applications)[number]) => ({
  id: app.id,
  aiStatus: app.aiStatus,
  aiError: app.aiError,
  stuck: app.aiStatus === 'PENDING',
  createdAt: app.createdAt,
  updatedAt: app.createdAt,
  candidate: { id: app.candidateId, fullName: candidateOf(app).fullName },
  job: { id: app.jobId, title: jobOf(app).title },
})

// API Contract 4.10
export const operationHandlers = [
  http.get(api('/admin/jobs/failed'), ({ request }) => {
    const user = authorize(request, Permission.OpsManage)
    if (user instanceof Response) return user
    const { items, meta } = paginate(
      db.applications.filter(isIssue).map(toIssue),
      searchParams(request),
    )
    return ok(items, { meta })
  }),

  http.get(api('/admin/queues'), ({ request }) => {
    const user = authorize(request, Permission.OpsManage)
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

  http.post(api('/admin/jobs/retry-all'), ({ request }) => {
    const user = authorize(request, Permission.OpsManage)
    if (user instanceof Response) return user
    const issues = db.applications.filter(isIssue)
    for (const app of issues) {
      app.aiStatus = 'PROCESSING'
      app.aiError = null
    }
    return ok({ queued: issues.length, failed: 0 }, { status: 202 })
  }),

  http.post(api('/admin/jobs/:id/retry'), ({ request, params }) => {
    const user = authorize(request, Permission.OpsManage)
    if (user instanceof Response) return user
    const app = db.applications.find((a) => a.id === params.id)
    if (!app || !isIssue(app)) return notFound('AI job')
    app.aiStatus = 'PROCESSING'
    app.aiError = null
    return ok(null, { status: 202 })
  }),
]
