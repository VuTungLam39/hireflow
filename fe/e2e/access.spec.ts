/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { login, overflowX, publicIds } from './support'

// P8 · 8c · ma trận A, D
type Actor = 'G' | 'AD' | 'HR' | 'HM' | 'IV' | 'PF'
const EMAIL: Record<Exclude<Actor, 'G'>, string> = {
  AD: 'admin@example.com',
  HR: 'hr@hireflow.dev',
  HM: 'hm.eng@hireflow.dev',
  IV: 'interviewer@hireflow.dev',
  PF: 'platform@example.com',
}
const WIDTHS = [1440, 1024, 768, 390]
const AXE_WIDTHS = [1440, 390]

type Ids = Record<'job' | 'application' | 'candidate' | 'org' | 'publicJob' | 'slug', string>
type Row = [id: string, path: (i: Ids) => string, allowed: Actor[]]

const ALL: Actor[] = ['G', 'AD', 'HR', 'HM', 'IV', 'PF']
const STAFF: Actor[] = ['AD', 'HR', 'HM', 'IV']

const ROUTES: Row[] = [
  ['R01', () => '/jobs', ALL],
  ['R01', (i) => `/jobs/${i.publicJob}`, ALL],
  ['R01', () => '/companies', ALL],
  ['R01', (i) => `/companies/${i.slug}`, ALL],
  ['R02', () => '/careers', ALL],
  ['R02', () => '/chinh-sach-du-lieu', ALL],
  ['R03', () => '/employers/register', ALL],
  ['R03', () => '/employers/check-email', ALL],
  ['R03', () => '/verify-email', ALL],
  ['R04', () => '/applications/track', ALL],
  ['R05', () => '/login', ['G']],
  ['R05', () => '/forgot-password', ['G']],
  ['R05', () => '/reset-password', ['G']],
  ['R06', () => '/', ['AD', 'HR', 'HM']],
  ['R07', () => '/interviews', STAFF],
  ['R08', () => '/manage/jobs', STAFF],
  ['R09', () => '/manage/jobs/new', ['AD', 'HR']],
  ['R10', (i) => `/manage/jobs/${i.job}/edit`, STAFF],
  ['R11', (i) => `/manage/jobs/${i.job}/ranking`, ['AD', 'HR', 'HM']],
  ['R12', (i) => `/manage/jobs/${i.job}/matches`, ['AD', 'HR']],
  ['R13', () => '/applications', STAFF],
  ['R13', (i) => `/applications/${i.application}`, STAFF],
  ['R14', () => '/candidates', ['AD', 'HR', 'HM']],
  ['R14', (i) => `/candidates/${i.candidate}`, ['AD', 'HR', 'HM']],
  ['R15', () => '/ai-chat', ['AD', 'HR', 'HM']],
  ['R16', () => '/users', ['AD']],
  ['R16', () => '/departments', ['AD']],
  ['R16', () => '/admin/ai-queue', ['AD']],
  ['R16', () => '/admin/audit-logs', ['AD']],
  ['R17', () => '/admin/company', ['AD', 'HR']],
  ['R18', () => '/platform/companies', ['PF']],
  ['R18', (i) => `/platform/companies/${i.org}`, ['PF']],
  ['R18', () => '/platform/queues', ['PF']],
  ['R19', () => '/khong-co-trang-nay', []],
]

const NOT_FOUND = /Không có trang này|Không tìm thấy trang này/
const FORBIDDEN = /Trang này (dành cho|không thuộc quyền)/

async function settle(page: Page) {
  await page.waitForLoadState('load')
  await expect(page.locator('h1, h2, [role=alert]').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.animate-skeleton, .animate-spin')).toHaveCount(0)
}

async function outcome(page: Page, path: string) {
  const at = new URL(page.url()).pathname
  const heading = (await page.locator('h1, h2').allInnerTexts()).join(' | ')
  if (FORBIDDEN.test(heading)) return 'forbidden'
  if (NOT_FOUND.test(heading)) return '404'
  const alerts = (await page.locator('main [role=alert]').allInnerTexts()).join(' ')
  if (alerts) return `error: ${alerts.split(/\r?\n/)[0]}`
  if (path !== '/careers' && at !== path) return `→ ${at}`
  return 'ok'
}

async function axe(page: Page) {
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' })
  return page.evaluate(async () => {
    const run = (window as unknown as { axe: { run: (c: Document) => Promise<unknown> } }).axe.run
    const result = (await run(document)) as {
      violations: { id: string; impact: string; nodes: { target: string[] }[] }[]
    }
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      first: v.nodes[0].target.join(' '),
    }))
  })
}

async function ids(page: Page): Promise<Ids> {
  const pub = await publicIds(page)
  const admin = await login(page, EMAIL.AD)
  const [job] = await admin('/jobs?status=OPEN&limit=1')
  const [application] = await admin('/applications?limit=1')
  const [candidate] = await admin('/candidates?limit=1')
  const platform = await login(page, EMAIL.PF)
  const orgs: { id: string; slug: string }[] = await platform(
    '/platform/organizations?limit=100&status=ACTIVE',
  )
  await page.context().clearCookies()
  return {
    job: job.id,
    application: application.id,
    candidate: candidate.id,
    org: orgs.find((o) => o.slug === 'vi-may')!.id,
    publicJob: pub.jobId,
    slug: pub.slug,
  }
}

for (const actor of ALL) {
  test(`truy cập theo vai: ${actor}`, async ({ page }) => {
    test.setTimeout(600_000)
    const known = await ids(page)
    const own = { ...known }
    if (actor !== 'G') {
      const api = await login(page, EMAIL[actor])
      // phạm vi theo vai: lấy hồ sơ, tin, ứng viên mà chính vai đó được thấy
      if (actor === 'HM' || actor === 'IV') {
        const [application] = await api('/applications?limit=1')
        const [job] = await api('/jobs?limit=1')
        own.application = application?.id ?? known.application
        own.job = job?.id ?? known.job
        if (actor === 'HM') own.candidate = (await api('/candidates?limit=1'))[0]?.id
      }
    }
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(`${page.url()}: ${e.message}`))
    const results = []
    for (const [id, build, allowed] of ROUTES) {
      const path = build(own)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(path)
      await settle(page)
      const got = await outcome(page, path)
      const pass = allowed.includes(actor)
        ? got === 'ok'
        : got !== 'ok' || (actor === 'G' && path === '/khong-co-trang-nay')
      const row = {
        id,
        path: path.replace(/[0-9a-f-]{36}/, ':id'),
        expected: allowed.includes(actor) ? '✔' : '✖',
        got,
        pass,
        h1: await page.locator('h1').count(),
        overflow: [] as string[],
        axe: [] as object[],
      }
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        const extra = await overflowX(page)
        if (extra > 0) row.overflow.push(`${width}: +${extra}px`)
        if (AXE_WIDTHS.includes(width))
          row.axe.push(...(await axe(page)).map((v) => ({ width, ...v })))
      }
      results.push(row)
      expect.soft(pass, `${actor} ${row.path}: nhận ${got}`).toBe(true)
    }
    mkdirSync('test-results-8c', { recursive: true })
    writeFileSync(
      `test-results-8c/access-${actor}.json`,
      JSON.stringify({ results, pageErrors }, null, 1),
    )
  })
}
