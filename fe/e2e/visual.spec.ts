import { expect, test, type Page } from '@playwright/test'
import { login, open, overflowX, publicIds, VIEWPORTS } from './support'

// P8 · D-11 · CR-01…CR-13
const NOW = new Date('2026-11-26T10:00:00+07:00')

type Routes = [string, string][]

async function capture(page: Page, routes: Routes) {
  for (const [name, path] of routes)
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      await open(page, path)
      if (path.includes('?xem=')) await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.locator('.animate-skeleton, .animate-spin')).toHaveCount(0)
      expect
        .soft(await overflowX(page), `${name} ${viewport.width}: tràn ngang`)
        .toBeLessThanOrEqual(0)
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
  const api = await login(page, 'admin@example.com')
  const [job] = await api('/jobs?status=OPEN&limit=1')
  const [application] = await api('/applications?limit=1')
  await capture(page, [
    ['CR-06-home', '/'],
    ['CR-07-jobs', '/manage/jobs'],
    ['CR-07-job-dialog', `/manage/jobs?xem=job:${job.id}`],
    ['CR-07-job-new', '/manage/jobs?xem=job:new'],
    ['CR-08-applications', '/applications'],
    ['CR-09-application-detail', `/applications/${application.id}`],
    ['CR-09-application-dialog', `/applications?xem=application:${application.id}`],
    ['CR-10-ranking', `/manage/jobs/${job.id}/ranking`],
    ['CR-11-candidates', '/candidates'],
  ])
})

test('Quản trị sàn: CR-12', async ({ page }) => {
  const api = await login(page, 'platform@example.com')
  const orgs: { id: string; slug: string }[] = await api(
    '/platform/organizations?limit=100&status=ACTIVE',
  )
  const company = orgs.find((o) => o.slug === 'vi-may')
  expect(company, 'seed thiếu công ty vi-may').toBeTruthy()
  await capture(page, [
    ['CR-12-platform-companies', '/platform/companies'],
    ['CR-12-platform-company', `/platform/companies/${company!.id}`],
  ])
})
