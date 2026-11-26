import { expect, test, type Page } from '@playwright/test'
import { login, open, overflowX, publicIds, VIEWPORTS } from './support'

// Route trọng yếu CR-01…CR-13 (phase-00 file 03 §5) · ảnh baseline 390 và 1440
const NOW = new Date('2026-11-26T10:00:00+07:00')

type Routes = [string, string][]

async function capture(page: Page, routes: Routes) {
  for (const [name, path] of routes)
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      await open(page, path)
      expect.soft(await overflowX(page), `${name} ${viewport.width}: tràn ngang`).toBe(0)
      await expect.soft(page).toHaveScreenshot(`${name}-${viewport.width}.png`)
    }
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

test('khách: CR-01…05, CR-13', async ({ page }) => {
  const { jobId, slug } = await publicIds(page)
  await capture(page, [
    ['CR-01-jobs', '/jobs'],
    ['CR-02-job-detail', `/jobs/${jobId}`],
    ['CR-03-companies', '/companies'],
    ['CR-04-company', `/companies/${slug}`],
    ['CR-05-login', '/login'],
    ['CR-13-track-no-token', '/applications/track'],
  ])
})

test('Admin công ty: CR-06…11', async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  const api = await login(page, 'admin@example.com')
  const [job] = await api('/jobs?status=OPEN&limit=1')
  const [application] = await api('/applications?limit=1')
  await capture(page, [
    ['CR-06-home', '/'],
    ['CR-07-jobs', '/manage/jobs'],
    ['CR-08-applications', '/applications'],
    ['CR-09-application-detail', `/applications/${application.id}`],
    ['CR-10-ranking', `/manage/jobs/${job.id}/ranking`],
    ['CR-11-candidates', '/candidates'],
  ])
})

test('Quản trị sàn: CR-12', async ({ page }) => {
  await login(page, 'platform@example.com')
  await capture(page, [['CR-12-platform-companies', '/platform/companies']])
})
