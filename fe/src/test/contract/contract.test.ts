/**
 * Contract FE ↔ BE: gọi cùng các hàm API của feature vào mock (MSW) và BE thật,
 * so cấu trúc dữ liệu trả về. Chạy: npm run test:contract (cần BE ở CONTRACT_API_URL).
 */
import { setupServer } from 'msw/node'
import { applicationsApi } from '@/features/applications/api/applications.api'
import { authApi } from '@/features/auth/api/auth.api'
import { candidatesApi } from '@/features/candidates/api/candidates.api'
import { departmentsApi } from '@/features/departments/api/departments.api'
import { jobsApi } from '@/features/jobs/api/jobs.api'
import { rankingApi } from '@/features/ranking/api/ranking.api'
import { usersApi } from '@/features/users/api/users.api'
import { MOCK_PASSWORD } from '@/mocks/data'
import { allHandlers } from '@/mocks/handlers'
import { useAuthStore } from '@/stores/auth.store'
import { diffShape, type ShapeDiff } from './shape'

const ACCOUNTS = {
  mock: { email: 'admin@hireflow.dev', password: MOCK_PASSWORD },
  real: {
    email: import.meta.env.CONTRACT_EMAIL as string,
    password: import.meta.env.CONTRACT_PASSWORD as string,
  },
}

const page = { page: 1, limit: 20, sortBy: 'createdAt', order: 'DESC' } as const

type Samples = Record<string, unknown>

async function collect(source: keyof typeof ACCOUNTS): Promise<Samples> {
  const out: Samples = {}
  const take = async <T>(name: string, call: () => Promise<T>) => {
    const data = await call().catch((error: unknown) => {
      const res = (error as { response?: { status: number; data: unknown } }).response
      throw new Error(
        `${source} ${name} → ${res?.status ?? 'network'} ${JSON.stringify(res?.data ?? error)}`,
      )
    })
    out[name] = data
    return data
  }

  const session = await take('POST /auth/login', () => authApi.login(ACCOUNTS[source]))
  useAuthStore.getState().setSession(session.user, session.tokens)
  await take('GET /auth/me', () => authApi.me())

  const users = await take('GET /users', () => usersApi.list({ page: 1, limit: 20 }))
  await take('GET /users/:id', () => usersApi.get(users.items[0].id))
  await take('GET /departments', () => departmentsApi.list({ page: 1, limit: 20 }))

  const jobs = await take('GET /jobs', () => jobsApi.list(page))
  await take('GET /jobs/:id', () => jobsApi.get(jobs.items[0].id))
  const open = await jobsApi.list({ ...page, status: 'OPEN' })
  if (open.items[0]) {
    await take('GET /jobs/:id/ranking', () => rankingApi.get(open.items[0].id))
  }

  const apps = await take('GET /applications', () => applicationsApi.list(page))
  const appId = apps.items[0].id
  await take('GET /applications/:id', () => applicationsApi.get(appId))
  await take('GET /applications/:id/history', () => applicationsApi.history(appId))
  await take('GET /applications/:id/notes', () => applicationsApi.notes(appId))

  const candidates = await take('GET /candidates', () => candidatesApi.list({ limit: 20 }))
  await take('GET /candidates/:id', () => candidatesApi.get(candidates.items[0].id))

  const departmentId = jobs.items[0].department.id
  const draft = await take('POST /jobs', () =>
    jobsApi.create({
      title: `Contract test ${Date.now()}`,
      departmentId,
      location: 'Hà Nội',
      jdText:
        'Job nháp do contract test tạo để kiểm tra API, sẽ bị xoá ngay sau khi kiểm tra xong.',
    }),
  )
  try {
    await take('PUT /jobs/:id/requirements', () =>
      jobsApi.saveRequirements(draft.id, [
        { label: 'NestJS', type: 'MUST', weight: 3, minYears: 2, keywords: ['nestjs'] },
        { label: 'Docker', type: 'NICE', weight: 1, minYears: null, keywords: ['docker'] },
      ]),
    )
    await take('PATCH /jobs/:id', () =>
      jobsApi.update(draft.id, {
        title: `${draft.title} (sửa)`,
        departmentId,
        location: draft.location,
        jdText: draft.jdText,
      }),
    )
  } finally {
    await jobsApi.remove(draft.id)
  }

  useAuthStore.getState().clear()
  return out
}

describe('contract FE ↔ BE', () => {
  let mock: Samples
  let real: Samples

  beforeAll(async () => {
    const server = setupServer(...allHandlers)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      mock = await collect('mock')
    } finally {
      server.close()
    }
    real = await collect('real')
  }, 60_000)

  it('BE trả đủ field FE dùng, đúng kiểu', () => {
    const diffs: ShapeDiff[] = Object.keys(mock).flatMap((endpoint) =>
      diffShape(mock[endpoint], real[endpoint], endpoint),
    )
    const missing = diffs.filter((d) => d.kind !== 'extra')
    const extra = diffs.filter((d) => d.kind === 'extra')
    if (extra.length) console.info(`BE trả thêm (FE chưa dùng):\n${extra.map(String).join('\n')}`)
    expect(missing.map(String)).toEqual([])
  })

  it('gọi được mọi endpoint mock đã có trên BE', () => {
    expect(Object.keys(real).sort()).toEqual(Object.keys(mock).sort())
  })
})
