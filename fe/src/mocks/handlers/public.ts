import { delay, http } from 'msw'
import type { PublicJob, PublicJobSummary } from '@/features/public-jobs'
import { addApplication, createCandidate, db, uid, type JobRow } from '../data'
import { api, fail, includesText, checkCvFile, notFound, ok, paginate, searchParams } from '../http'

const toPublicSummary = (job: JobRow): PublicJobSummary => ({
  id: job.id,
  title: job.title,
  location: job.location,
  department: { name: db.departments.find((d) => d.id === job.departmentId)?.name ?? '' },
  publishedAt: job.publishedAt!,
})

/** Trang công khai: chỉ job OPEN, không có trọng số/từ khoá nội bộ */
export const publicHandlers = [
  http.get(api('/public/jobs'), async ({ request }) => {
    await delay()
    const params = searchParams(request)
    const rows = db.jobs
      .filter((j) => j.status === 'OPEN' && includesText(j.title, params.get('search')))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    const { items, meta } = paginate(rows, params)
    return ok(items.map(toPublicSummary), { meta })
  }),

  http.get(api('/public/jobs/:id'), async ({ params }) => {
    await delay()
    const job = db.jobs.find((j) => j.id === params.id && j.status === 'OPEN')
    if (!job) return notFound('Job')
    const data: PublicJob = {
      ...toPublicSummary(job),
      jdText: job.jdText,
      requirements: job.requirements.map((r) => ({ label: r.label, type: r.type })),
    }
    return ok(data)
  }),

  http.post(api('/public/jobs/:id/apply'), async ({ request, params }) => {
    await delay(800)
    const job = db.jobs.find((j) => j.id === params.id && j.status === 'OPEN')
    if (!job) return notFound('Job')

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
