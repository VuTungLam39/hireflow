/**
 * Smoke test cho API giả: gọi qua đúng các hàm API của feature (axios → MSW),
 * để chắc dữ liệu giả khớp type và các luật (quyền, scope, luồng trạng thái) chạy đúng.
 */
import { setupServer } from 'msw/node'
import { applicationsApi } from '@/features/applications/api/applications.api'
import { authApi } from '@/features/auth/api/auth.api'
import type { CandidateListItem } from '@/features/candidates'
import { candidatesApi } from '@/features/candidates/api/candidates.api'
import { jobsApi } from '@/features/jobs/api/jobs.api'
import { rankingApi } from '@/features/ranking/api/ranking.api'
import { usersApi } from '@/features/users/api/users.api'
import type { UpdateUserInput } from '@/features/users'
import { getErrorCode } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { MOCK_PASSWORD } from './data'
import { adminHandlers } from './handlers/admin'
import { applicationHandlers } from './handlers/applications'
import { authHandlers } from './handlers/auth'
import { candidateHandlers } from './handlers/candidates'
import { jobHandlers } from './handlers/jobs'
import { publicHandlers } from './handlers/public'

const server = setupServer(
  ...authHandlers,
  ...adminHandlers,
  ...jobHandlers,
  ...applicationHandlers,
  ...candidateHandlers,
  ...publicHandlers,
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

async function loginAs(email: string) {
  const { user, tokens } = await authApi.login({ email, password: MOCK_PASSWORD })
  useAuthStore.getState().setSession(user, tokens)
  return user
}

const listAll = { page: 1, limit: 100, sortBy: 'createdAt', order: 'DESC' } as const

describe('mock API', () => {
  it('rejects a wrong password', async () => {
    await expect(authApi.login({ email: 'admin@hireflow.dev', password: 'x' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'UNAUTHORIZED',
    )
  })

  it('scopes jobs and applications to the hiring manager department', async () => {
    const hm = await loginAs('hm.eng@hireflow.dev')
    const jobs = await jobsApi.list(listAll)
    expect(jobs.items.length).toBeGreaterThan(0)
    expect(jobs.items.every((j) => j.department.id === hm.departmentId)).toBe(true)

    const apps = await applicationsApi.list(listAll)
    const allowed = new Set(jobs.items.map((j) => j.id))
    expect(apps.items.every((a) => allowed.has(a.job.id))).toBe(true)

    await loginAs('admin@hireflow.dev')
    const salesJob = (await jobsApi.list({ ...listAll, departmentId: 'dep-sales' })).items[0]
    await loginAs('hm.eng@hireflow.dev')
    await expect(jobsApi.get(salesJob.id)).rejects.toSatisfy((e) => getErrorCode(e) === 'NOT_FOUND')
  })

  it('returns evidence that really exists in the CV', async () => {
    await loginAs('hr@hireflow.dev')
    const { items } = await applicationsApi.list({ ...listAll, sortBy: 'score' })
    const detail = await applicationsApi.get(items[0].id)
    expect(detail.aiStatus).toBe('DONE')
    for (const b of detail.breakdown) {
      if (b.evidence) expect(detail.cv!.text).toContain(b.evidence)
      if (b.rejectedEvidence) expect(detail.cv!.text).not.toContain(b.rejectedEvidence)
    }
  })

  it('enforces the status flow and the hire permission', async () => {
    await loginAs('hr@hireflow.dev')
    const app = (await applicationsApi.list({ ...listAll, status: 'NEW' })).items[0]

    await expect(applicationsApi.changeStatus(app.id, { status: 'OFFER' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'INVALID_STATUS_TRANSITION',
    )
    await expect(applicationsApi.changeStatus(app.id, { status: 'REJECTED' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'REJECT_REASON_REQUIRED',
    )
    const moved = await applicationsApi.changeStatus(app.id, { status: 'SCREENING' })
    expect(moved.status).toBe('SCREENING')
    const history = await applicationsApi.history(app.id)
    expect(history[0]).toMatchObject({ fromStatus: 'NEW', toStatus: 'SCREENING' })

    const offer = (await applicationsApi.list({ ...listAll, status: 'OFFER' })).items[0]
    await expect(applicationsApi.hire(offer.id)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'FORBIDDEN',
    )
  })

  it('rescores the job when requirements are saved', async () => {
    await loginAs('hr@hireflow.dev')
    const job = (await jobsApi.list({ ...listAll, status: 'OPEN' })).items[0]
    const before = await rankingApi.get(job.id)
    const { jdVersion } = await jobsApi.saveRequirements(
      job.id,
      before.requirements.map(({ id: _id, ...r }) => ({ ...r, weight: 1 })),
    )
    expect(jdVersion).toBe(before.job.jdVersion + 1)
    const after = await rankingApi.get(job.id)
    expect(after.requirements.every((r) => r.weight === 1)).toBe(true)
  })

  it('locks an account through /users/:id/status (API contract 4.2)', async () => {
    await loginAs('admin@hireflow.dev')
    const { items } = await usersApi.list({ page: 1, limit: 100, search: 'hm.mkt' })
    const locked = await usersApi.setStatus(items[0].id, false)
    expect(locked.isActive).toBe(false)

    await expect(
      authApi.login({ email: 'hm.mkt@hireflow.dev', password: MOCK_PASSWORD }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'ACCOUNT_DISABLED')

    await usersApi.setStatus(items[0].id, true)
  })

  it('returns a job pipeline that adds up to applicationCount (API contract v1.1)', async () => {
    await loginAs('hr@hireflow.dev')
    const { items } = await jobsApi.list(listAll)
    for (const job of items) {
      const { new: n, inProgress, hired, closed } = job.pipeline
      expect(n + inProgress + hired + closed).toBe(job.applicationCount)
    }
  })

  it('filters applications by submission date range (US-06)', async () => {
    await loginAs('hr@hireflow.dev')
    const all = await applicationsApi.list(listAll)
    const day = all.items[0].createdAt.slice(0, 10)
    const filtered = await applicationsApi.list({ ...listAll, createdFrom: day, createdTo: day })
    expect(filtered.items.length).toBeGreaterThan(0)
    expect(filtered.meta.totalItems).toBeLessThan(all.meta.totalItems)
  })

  it('only closes OPEN jobs (JOB_NOT_CLOSABLE)', async () => {
    await loginAs('hr@hireflow.dev')
    const draft = (await jobsApi.list({ ...listAll, status: 'DRAFT' })).items[0]
    await expect(jobsApi.close(draft.id)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'JOB_NOT_CLOSABLE',
    )
  })

  // ---------- Quy tắc nghiệp vụ mentor duyệt 21/10 (Kickoff 5.3, API Contract v1.3) ----------

  it('pages candidates by cursor without gaps or duplicates (API 4.11)', async () => {
    await loginAs('hr@hireflow.dev')
    const seen: CandidateListItem[] = []
    let cursor: string | undefined
    do {
      const page = await candidatesApi.list({ limit: 7, cursor })
      seen.push(...page.items)
      cursor = page.meta.nextCursor ?? undefined
      expect(page.meta.hasNextPage).toBe(!!page.meta.nextCursor)
    } while (cursor)

    const ids = seen.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const oneShot = await candidatesApi.list({ limit: 100 })
    expect(ids.slice(0, oneShot.items.length)).toEqual(oneShot.items.map((c) => c.id))
    // Ứng viên mới tạo trước
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i - 1].createdAt >= seen[i].createdAt).toBe(true)
    }
    await expect(candidatesApi.list({ cursor: 'not-a-cursor' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'VALIDATION_FAILED',
    )
  })

  it('searches candidates without diacritics', async () => {
    await loginAs('hr@hireflow.dev')
    const { items } = await candidatesApi.list({ limit: 100 })
    const target = items.find((c) => c.fullName.normalize('NFD') !== c.fullName)!
    const folded = target.fullName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
    const found = await candidatesApi.list({ search: folded, limit: 100 })
    expect(found.items.map((c) => c.id)).toContain(target.id)
  })

  it('shows hiring managers only candidates who applied to their department (BR-CAND-03)', async () => {
    await loginAs('admin@hireflow.dev')
    const all = (await candidatesApi.list({ limit: 100 })).items
    await loginAs('hm.eng@hireflow.dev')
    const mine = (await candidatesApi.list({ limit: 100 })).items
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.length).toBeLessThan(all.length)

    const engJobs = new Set((await jobsApi.list(listAll)).items.map((j) => j.id))
    const detail = await candidatesApi.get(mine[0].id)
    expect(detail.applications.every((a) => engJobs.has(a.job.id))).toBe(true)

    const mineIds = new Set(mine.map((c) => c.id))
    const outside = all.find((c) => !mineIds.has(c.id))!
    await expect(candidatesApi.get(outside.id)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'NOT_FOUND',
    )
    await expect(candidatesApi.update(mine[0].id, { fullName: 'X Y' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'FORBIDDEN',
    )
  })

  it('edits contact details but never the email (BR-CAND-01)', async () => {
    await loginAs('hr@hireflow.dev')
    const target = (await candidatesApi.list({ limit: 5 })).items[0]
    const updated = await candidatesApi.update(target.id, { phone: '0912345678' })
    expect(updated.phone).toBe('0912345678')
    expect(updated.email).toBe(target.email)
    await expect(
      candidatesApi.update(target.id, { email: 'x@example.com' } as never),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'VALIDATION_FAILED')
  })

  it('lets HR upload a CV on behalf of a candidate (BR-APP-10, BR-CAND-02)', async () => {
    await loginAs('hr@hireflow.dev')
    const jobs = (await jobsApi.list({ ...listAll, status: 'OPEN' })).items
    const cv = () => new File(['%PDF-1.4 cv'], 'cv.pdf', { type: 'application/pdf' })
    const input = {
      fullName: 'Đỗ Thanh Tùng',
      email: 'tung.hr-upload@example.com',
      consentConfirmed: true,
      cv: cv(),
    }

    const created = await applicationsApi.uploadForCandidate(jobs[0].id, input)
    expect(created.candidate.email).toBe(input.email)
    expect(created.status).toBe('NEW')
    const candidate = await candidatesApi.get(created.candidate.id)
    expect(candidate.applications[0]).toMatchObject({ id: created.id, source: 'HR_UPLOAD' })
    const history = await applicationsApi.history(created.id)
    expect(history[0].changedBy?.fullName).toBe('Nguyễn Thu Hà')

    await expect(
      applicationsApi.uploadForCandidate(jobs[0].id, { ...input, cv: cv() }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'APPLICATION_DUPLICATED')

    // Cùng email, tên khác, job khác: gắn vào ứng viên cũ, không ghi đè họ tên
    const second = await applicationsApi.uploadForCandidate(jobs[1].id, {
      ...input,
      fullName: 'Người Khác',
      cv: cv(),
    })
    expect(second.candidate).toMatchObject({ id: created.candidate.id, fullName: input.fullName })

    await expect(
      applicationsApi.uploadForCandidate(jobs[2].id, {
        ...input,
        consentConfirmed: false,
        cv: cv(),
      }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'VALIDATION_FAILED')

    const closed = (await jobsApi.list({ ...listAll, status: 'CLOSED' })).items[0]
    await expect(
      applicationsApi.uploadForCandidate(closed.id, { ...input, cv: cv() }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'JOB_NOT_OPEN')

    await loginAs('hm.eng@hireflow.dev')
    await expect(
      applicationsApi.uploadForCandidate(jobs[0].id, { ...input, cv: cv() }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'FORBIDDEN')
  })

  it('only deletes draft jobs without applications (BR-JOB-04)', async () => {
    await loginAs('hr@hireflow.dev')
    const draft = await jobsApi.create({
      title: 'Tin nháp để xoá',
      departmentId: 'dep-eng',
      location: 'Hà Nội',
      jdText: 'x'.repeat(60),
    })
    await jobsApi.remove(draft.id)
    await expect(jobsApi.get(draft.id)).rejects.toSatisfy((e) => getErrorCode(e) === 'NOT_FOUND')

    const open = (await jobsApi.list({ ...listAll, status: 'OPEN' })).items[0]
    await expect(jobsApi.remove(open.id)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'JOB_NOT_DELETABLE',
    )
  })

  it('locks closed jobs against edits (BR-JOB-04)', async () => {
    await loginAs('hr@hireflow.dev')
    const summary = (await jobsApi.list({ ...listAll, status: 'CLOSED' })).items[0]
    const closed = await jobsApi.get(summary.id)
    await expect(
      jobsApi.update(closed.id, {
        title: closed.title,
        departmentId: closed.department.id,
        location: closed.location,
        jdText: closed.jdText,
      }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'JOB_NOT_EDITABLE')
    await expect(jobsApi.saveRequirements(closed.id, [])).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'JOB_NOT_EDITABLE',
    )
  })

  it('lets the hiring manager decline at OFFER with a reason (BR-STS-05)', async () => {
    await loginAs('hm.eng@hireflow.dev')
    const offer = (await applicationsApi.list({ ...listAll, status: 'OFFER' })).items[0]
    expect(offer).toBeDefined()
    await expect(applicationsApi.declineOffer(offer.id, ' ')).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'REJECT_REASON_REQUIRED',
    )
    const declined = await applicationsApi.declineOffer(offer.id, 'Không thống nhất được lương')
    expect(declined.status).toBe('REJECTED')
    const history = await applicationsApi.history(offer.id)
    expect(history[0]).toMatchObject({
      fromStatus: 'OFFER',
      toStatus: 'REJECTED',
      reason: 'Không thống nhất được lương',
    })

    await loginAs('hr@hireflow.dev')
    const other = (await applicationsApi.list({ ...listAll, status: 'OFFER' })).items[0]
    await expect(applicationsApi.declineOffer(other.id, 'x')).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'FORBIDDEN',
    )
  })

  it('rescores a scored application without leaving DONE (BR-AI-08)', async () => {
    await loginAs('hr@hireflow.dev')
    const app = (await applicationsApi.list({ ...listAll, sortBy: 'score' })).items[0]
    await applicationsApi.rescore(app.id)
    const after = await applicationsApi.get(app.id)
    expect(after.aiStatus).toBe('DONE')
    expect(after.score).toBe(app.score)
  })

  it('anonymizes a candidate but keeps status and score (BR-DATA-03)', async () => {
    await loginAs('hr@hireflow.dev')
    const target = (await candidatesApi.list({ limit: 100 })).items.find(
      (c) => c.applicationCount > 0 && !c.anonymizedAt,
    )!
    await expect(candidatesApi.anonymize(target.id)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'FORBIDDEN',
    )

    await loginAs('admin@hireflow.dev')
    const before = await candidatesApi.get(target.id)
    const done = await candidatesApi.anonymize(target.id)
    expect(done).toMatchObject({ fullName: 'Ứng viên đã ẩn danh', phone: null })
    expect(done.anonymizedAt).not.toBeNull()
    expect(done.applications.map((a) => [a.status, a.score])).toEqual(
      before.applications.map((a) => [a.status, a.score]),
    )

    const app = await applicationsApi.get(before.applications[0].id)
    expect(app.breakdown).toEqual([])
    expect(app.cv).toBeNull()
    await expect(applicationsApi.cvUrl(`file-${app.id}`)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'NOT_FOUND',
    )
    await expect(candidatesApi.anonymize(target.id)).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'CANDIDATE_ANONYMIZED',
    )
    await expect(candidatesApi.update(target.id, { fullName: 'Tên mới' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'CANDIDATE_ANONYMIZED',
    )
  })
  it('changes own password and rejects a wrong current one (BR-ACC-06)', async () => {
    // Dùng tài khoản mới để không đổi mật khẩu của tài khoản mẫu mà các test khác dùng
    await loginAs('admin@hireflow.dev')
    const email = 'pw.test@hireflow.dev'
    await usersApi.create({
      email,
      password: MOCK_PASSWORD,
      fullName: 'Người thử mật khẩu',
      role: Role.Hr,
      departmentId: null,
    })
    await loginAs(email)

    await expect(
      authApi.changePassword({ currentPassword: 'Sai@1234', newPassword: 'Moi@12345' }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'WRONG_PASSWORD')
    await expect(
      authApi.changePassword({ currentPassword: MOCK_PASSWORD, newPassword: 'yeu' }),
    ).rejects.toSatisfy((e) => getErrorCode(e) === 'VALIDATION_FAILED')

    await authApi.changePassword({ currentPassword: MOCK_PASSWORD, newPassword: 'Moi@12345' })
    await expect(authApi.login({ email, password: MOCK_PASSWORD })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'UNAUTHORIZED',
    )
    expect((await authApi.login({ email, password: 'Moi@12345' })).user.email).toBe(email)
  })

  it('updates role and department by the rules (BR-ACC-03)', async () => {
    await loginAs('admin@hireflow.dev')
    const hm = (await usersApi.list({ page: 1, limit: 100, role: Role.HiringManager })).items[0]

    // Hiring Manager không được bỏ trống phòng ban
    await expect(usersApi.update(hm.id, { departmentId: null })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'VALIDATION_FAILED',
    )

    // Sang HR thì tự bỏ phòng ban; email không đổi dù có gửi lên
    const asHr = await usersApi.update(hm.id, {
      role: Role.Hr,
      email: 'khac@hireflow.dev',
    } as UpdateUserInput)
    expect(asHr).toMatchObject({ role: Role.Hr, department: null, email: hm.email })

    // Trả lại như cũ cho các test khác
    const back = await usersApi.update(hm.id, {
      role: Role.HiringManager,
      departmentId: hm.department!.id,
    })
    expect(back.department?.id).toBe(hm.department!.id)
  })

  it('rejects a weak password when admin resets it', async () => {
    await loginAs('admin@hireflow.dev')
    const hr = (await usersApi.list({ page: 1, limit: 100, role: Role.Hr })).items[0]
    await expect(usersApi.update(hr.id, { password: '123' })).rejects.toSatisfy(
      (e) => getErrorCode(e) === 'VALIDATION_FAILED',
    )
  })
})
