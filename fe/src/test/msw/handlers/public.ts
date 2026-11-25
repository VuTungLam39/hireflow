import { delay, http } from 'msw'
import type {
  ApplicationTrack,
  PublicCompanyCard,
  PublicCompanyRef,
  PublicJob,
  PublicJobSummary,
  TrackStage,
} from '@/features/public-jobs'
import { salaryOf } from '@/features/jobs'
import { todayIsoDay } from '@/lib/vn-day'
import { addApplication, createCandidate, db, MOCK_ORG_ID, uid, type JobRow } from '../data'
import { toCompany } from './company'
import {
  api,
  latency,
  fail,
  includesFolded,
  checkCvFile,
  notFound,
  ok,
  paginate,
  searchParams,
} from '../http'

// US-26: hai link theo dõi mẫu, trạng thái giữ trong bộ nhớ
export const TRACK_TOKEN = 'track-token-1234567890'
export const DECIDED_TRACK_TOKEN = 'track-decided-1234567890'
const WITHDRAWABLE: TrackStage[] = ['RECEIVED', 'REVIEWING', 'INTERVIEW']
const tracked: Record<string, { stage: TrackStage }> = {
  [TRACK_TOKEN]: { stage: 'REVIEWING' },
  [DECIDED_TRACK_TOKEN]: { stage: 'DECIDED' },
}
const trackedBy = (token: string | null) => (token ? tracked[token] : undefined)
const trackView = ({ stage }: { stage: TrackStage }): ApplicationTrack => ({
  jobTitle: 'Backend Developer (NestJS)',
  companyName: demoOrg().name,
  companySlug: demoOrg().slug,
  appliedAt: '2026-11-10T03:00:00.000Z',
  stage,
  withdrawable: WITHDRAWABLE.includes(stage),
})

// MVP 3: mọi tin mẫu thuộc công ty demo
const demoOrg = () => db.organizations.find((o) => o.id === MOCK_ORG_ID)!
const companyRef = (): PublicCompanyRef => {
  const profile = toCompany()
  return {
    name: profile.name || demoOrg().name,
    slug: demoOrg().slug,
    logoUrl: profile.logo?.url ?? null,
    tagline: profile.tagline,
  }
}

// Công ty mẫu thứ hai trong danh bạ (chưa có tin đang tuyển)
const OTHER_CARD: PublicCompanyCard = {
  slug: 'vi-may',
  name: 'Ví Mây',
  logoUrl: null,
  tagline: 'Ví điện tử cho người Việt',
  industries: ['Fintech'],
  openJobs: 0,
}

const toPublicSummary = (job: JobRow): PublicJobSummary => ({
  id: job.id,
  title: job.title,
  location: job.location,
  department: { name: db.departments.find((d) => d.id === job.departmentId)?.name ?? '' },
  publishedAt: job.publishedAt!,
  salary: salaryOf(job),
  level: job.level,
  employmentType: job.employmentType,
  workMode: job.workMode,
  headcount: job.headcount,
  deadline: job.deadline,
  company: companyRef(),
})

/** BR-JOB-10: quá ngày hạn nộp theo giờ Việt Nam */
const isExpired = (job: JobRow) => !!job.deadline && job.deadline < todayIsoDay()

/** Trang công khai: chỉ job OPEN chưa quá hạn, không có trọng số/từ khoá nội bộ */
// US-22: tìm theo tiêu đề, JD, địa điểm, không phân biệt dấu
const openJobs = (search: string | null) =>
  db.jobs.filter(
    (j) =>
      j.status === 'OPEN' &&
      !isExpired(j) &&
      includesFolded(`${j.title} ${j.jdText} ${j.location}`, search),
  )

const byCompany = (slug: string | null) => !slug || slug === demoOrg().slug

export const publicHandlers = [
  http.get(api('/public/jobs'), async ({ request }) => {
    await delay()
    const params = searchParams(request)
    const rows = openJobs(params.get('search'))
      .filter(() => byCompany(params.get('company')))
      .filter((j) => includesFolded(j.location, params.get('location')))
      .filter((j) => !params.get('departmentId') || j.departmentId === params.get('departmentId'))
      .filter((j) => !params.get('level') || j.level === params.get('level'))
      .filter(
        (j) => !params.get('employmentType') || j.employmentType === params.get('employmentType'),
      )
      .filter((j) => !params.get('workMode') || j.workMode === params.get('workMode'))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    const { items, meta } = paginate(rows, params)
    return ok(items.map(toPublicSummary), { meta })
  }),

  http.get(api('/public/jobs/departments'), async ({ request }) => {
    await delay()
    const params = searchParams(request)
    // KH MVP 3 8.1: phòng ban chỉ liệt kê trong một công ty
    if (!params.get('company') || !byCompany(params.get('company'))) return ok([])
    const counts = new Map<string, number>()
    for (const j of openJobs(params.get('search'))) {
      counts.set(j.departmentId, (counts.get(j.departmentId) ?? 0) + 1)
    }
    const data = [...counts.entries()]
      .map(([id, count]) => ({ id, name: db.departments.find((d) => d.id === id)!.name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'))
    return ok(data)
  }),

  http.get(api('/public/jobs/:id'), async ({ params }) => {
    await delay()
    const job = db.jobs.find((j) => j.id === params.id && j.status === 'OPEN')
    if (!job) return notFound('Job')
    const data: PublicJob = {
      ...toPublicSummary(job),
      expired: isExpired(job),
      benefits: job.benefits,
      jdText: job.jdText,
      requirements: job.requirements.map((r) => ({ label: r.label, type: r.type })),
      otherJobs: openJobs(null)
        .filter((j) => j.id !== job.id)
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
        .slice(0, 4)
        .map(toPublicSummary),
    }
    return ok(data)
  }),

  // MVP 3 · US-23
  http.get(api('/public/companies'), async ({ request }) => {
    await delay()
    const params = searchParams(request)
    const profile = toCompany()
    const demo: PublicCompanyCard[] = profile.complete
      ? [
          {
            slug: demoOrg().slug,
            name: profile.name,
            logoUrl: profile.logo?.url ?? null,
            tagline: profile.tagline,
            industries: profile.industries,
            openJobs: openJobs(null).length,
          },
        ]
      : []
    const rows = [...demo, OTHER_CARD].filter((c) => includesFolded(c.name, params.get('search')))
    const { items, meta } = paginate(rows, params)
    return ok(items, { meta })
  }),

  http.get(api('/public/companies/:slug'), async ({ params }) => {
    await delay()
    if (params.slug !== demoOrg().slug) return notFound('Company')
    const { complete, updatedAt: _u, ...profile } = toCompany()
    if (!complete) {
      return fail(404, 'COMPANY_PROFILE_INCOMPLETE', 'Company profile is not published yet')
    }
    const jobs = openJobs(null)
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .map(toPublicSummary)
    return ok({ ...profile, slug: demoOrg().slug, openJobs: jobs.length, jobs })
  }),

  http.post(api('/public/jobs/:id/apply'), async ({ request, params }) => {
    await latency(800)
    const job = db.jobs.find((j) => j.id === params.id && j.status === 'OPEN')
    if (!job) return notFound('Job')
    if (isExpired(job)) return fail(409, 'JOB_EXPIRED', 'The application deadline has passed')

    const form = await request.formData()
    const get = (key: string) => String(form.get(key) ?? '').trim()
    const file = checkCvFile(form.get('cv'))

    // Honeypot có dữ liệu → bot: giả vờ thành công, không lưu gì
    if (get('website')) return ok(null, { status: 201, message: 'Application submitted' })
    if (get('consent') !== 'true') {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'consent', messages: ['Bạn cần đồng ý xử lý dữ liệu cá nhân'] },
      ])
    }
    if (file instanceof Response) return file

    const email = get('email').toLowerCase()
    let candidate = db.candidates.find((c) => c.email === email)
    if (
      candidate &&
      db.applications.some((a) => a.jobId === job.id && a.candidateId === candidate!.id)
    ) {
      return fail(409, 'APPLICATION_DUPLICATED', 'Already applied to this job')
    }
    // BR-CAND-02: email đã có thì không ghi đè họ tên, số điện thoại – chỉ điền trường đang trống
    if (candidate && !candidate.phone && get('phone')) candidate.phone = get('phone')
    if (!candidate) {
      // CV giả dựa theo kỹ năng của job để hồ sơ có điểm hợp lý
      candidate = createCandidate(guessTrack(job), get('fullName'), email, get('phone'))
      db.candidates.push(candidate)
    }

    const app = addApplication(job, candidate, {
      aiStatus: 'PROCESSING',
      processingUntil: Date.now() + 12_000,
      cvFileName: file.name,
    })
    db.history.push({
      id: uid('his'),
      applicationId: app.id,
      fromStatus: null,
      toStatus: 'NEW',
      reason: null,
      changedById: null,
      changedAt: app.createdAt,
    })
    // Không trả id hay trạng thái cho trang công khai
    return ok(null, { status: 201, message: 'Application submitted' })
  }),

  // US-26 · BR-APP-14
  // SG-05 · R5
  http.post(api('/public/applications/track'), async ({ request }) => {
    await latency(200)
    const { token } = (await request.json()) as { token?: string }
    const tracked = trackedBy(token ?? null)
    return tracked ? ok(trackView(tracked)) : fail(400, 'TOKEN_INVALID', 'Tracking link is invalid')
  }),

  http.post(api('/public/applications/withdraw'), async ({ request }) => {
    await latency(300)
    const { token } = (await request.json()) as { token: string }
    const tracked = trackedBy(token)
    if (!tracked) return fail(400, 'TOKEN_INVALID', 'Tracking link is invalid')
    if (!WITHDRAWABLE.includes(tracked.stage)) {
      return fail(409, 'APPLICATION_NOT_WITHDRAWABLE', 'Cannot withdraw')
    }
    tracked.stage = 'WITHDRAWN'
    return ok(trackView(tracked), { message: 'Application withdrawn' })
  }),
]

/** Đoán chuyên môn từ tên job để CV giả có điểm hợp lý (dùng chung với HR tải hộ) */
export function guessTrack(job: JobRow): string {
  const title = job.title.toLowerCase()
  if (title.includes('frontend')) return 'frontend'
  if (title.includes('qa')) return 'qa'
  if (title.includes('devops')) return 'devops'
  if (title.includes('sales') || title.includes('account')) return 'sales'
  if (title.includes('marketing')) return 'marketing'
  if (title.includes('hr')) return 'hr'
  return 'backend'
}
