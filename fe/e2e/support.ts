/// <reference types="node" />
import { expect, type Page } from '@playwright/test'

export const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]

export async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' })
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('[aria-busy="true"], .animate-skeleton, .animate-spin')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}

export const overflowX = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

export async function login(page: Page, email: string) {
  const res = await page.request.post('/api/v1/auth/login', {
    data: { email, password: process.env.E2E_PASSWORD ?? 'Admin@123' },
  })
  expect(res.ok(), `đăng nhập ${email}: ${res.status()}`).toBe(true)
  const token: string = (await res.json()).data.tokens.accessToken
  return async (path: string) => {
    const r = await page.request.get(`/api/v1${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(r.ok(), `${path}: ${r.status()}`).toBe(true)
    return (await r.json()).data
  }
}

export async function publicIds(page: Page) {
  const res = await page.request.get('/api/v1/public/jobs?limit=1')
  expect(res.ok(), `public/jobs: ${res.status()}`).toBe(true)
  const [job] = (await res.json()).data
  expect(job, 'seed không có tin đang mở').toBeTruthy()
  return {
    jobId: job.id as string,
    jobTitle: job.title as string,
    slug: job.company.slug as string,
    company: job.company.name as string,
  }
}
