import { delay, http } from 'msw'
import type { JobMatch, JobMatchesData } from '@/features/matching'
import { Permission } from '@/lib/permissions'
import { addApplication, db, scoreFor, uid, type CandidateRow, type JobRow } from '../data'
import { api, authorize, fail, latency, notFound, ok, toApplicationDetail } from '../http'

const MIN_SCORE = 50
const LIMIT = 10

const invited = new Map<string, { invitedAt: string; applicationId: string }>()
const keyOf = (jobId: string, candidateId: string) => `${jobId}:${candidateId}`

function matchOf(job: JobRow, candidate: CandidateRow): JobMatch {
  const { score, flags, breakdown } = scoreFor(job, candidate)
  const own = db.applications.filter(
    (a) => a.candidateId === candidate.id && a.source !== 'MATCH_INVITE',
  )
  const invite = invited.get(keyOf(job.id, candidate.id))
  return {
    candidate: { id: candidate.id, fullName: candidate.fullName, email: candidate.email },
    score: score ?? 0,
    flags,
    reasons: job.requirements.map((r, i) => ({
      requirementId: r.id,
      label: r.label,
      type: r.type,
      match: breakdown[i].match,
      evidence: breakdown[i].evidence,
    })),
    lastAppliedAt:
      own
        .map((a) => a.createdAt)
        .sort()
        .at(-1) ?? job.createdAt,
    invitedAt: invite?.invitedAt ?? null,
    applicationId: invite?.applicationId ?? null,
  }
}

// BR-MATCH-01 → 03
export function matchesOf(job: JobRow): JobMatch[] {
  const appliedHere = new Set(
    db.applications.filter((a) => a.jobId === job.id).map((a) => a.candidateId),
  )
  const suggested = db.candidates
    .filter((c) => c.phone !== null && !appliedHere.has(c.id))
    .filter((c) => db.applications.some((a) => a.candidateId === c.id))
    .map((c) => matchOf(job, c))
    .filter((m) => m.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || b.lastAppliedAt.localeCompare(a.lastAppliedAt))
    .slice(0, LIMIT)
  const kept = db.candidates
    .filter((c) => invited.has(keyOf(job.id, c.id)))
    .map((c) => matchOf(job, c))
  return [...kept, ...suggested].sort((a, b) => b.score - a.score)
}

export const matchingHandlers = [
  http.get(api('/jobs/:id/matches'), async ({ request, params }) => {
    await delay()
    const user = authorize(request, Permission.ApplicationCreate)
    if (user instanceof Response) return user
    const job = db.jobs.find((j) => j.id === params.id)
    if (!job) return notFound('Job')
    const computed = job.status !== 'DRAFT'
    const data: JobMatchesData = {
      job: { id: job.id, title: job.title, status: job.status, jdVersion: job.jdVersion },
      computedAt: computed ? job.publishedAt : null,
      computedJdVersion: computed ? job.jdVersion : null,
      pending: false,
      items: computed ? matchesOf(job) : [],
    }
    return ok(data)
  }),

  http.post(api('/jobs/:id/matches/:candidateId/invite'), async ({ request, params }) => {
    await latency(400)
    const user = authorize(request, Permission.ApplicationCreate)
    if (user instanceof Response) return user
    const job = db.jobs.find((j) => j.id === params.id)
    if (!job) return notFound('Job')
    if (job.status !== 'OPEN') return fail(409, 'JOB_NOT_OPEN', 'Job is not open')
    const candidate = db.candidates.find((c) => c.id === params.candidateId)
    if (!candidate) return notFound('Match')
    if (db.applications.some((a) => a.jobId === job.id && a.candidateId === candidate.id)) {
      return fail(409, 'APPLICATION_DUPLICATED', 'Candidate already invited to this job')
    }
    const app = addApplication(job, candidate, {
      source: 'MATCH_INVITE',
      aiStatus: 'PROCESSING',
      processingUntil: Date.now() + 3_000,
    })
    db.history.push({
      id: uid('his'),
      applicationId: app.id,
      fromStatus: null,
      toStatus: 'NEW',
      reason: null,
      changedById: user.id,
      changedAt: app.createdAt,
    })
    invited.set(keyOf(job.id, candidate.id), {
      invitedAt: app.createdAt,
      applicationId: app.id,
    })
    return ok(toApplicationDetail(app), { status: 201, message: 'Candidate invited' })
  }),
]
