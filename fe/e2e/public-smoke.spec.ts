import { expect, test } from '@playwright/test'
import { open, overflowX, publicIds, VIEWPORTS } from './support'

// Ma trận §3: Chromium, Firefox, WebKit cho trang công khai
test('trang công khai: 1 h1, không tràn ngang, không lỗi JS', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const { jobId, slug } = await publicIds(page)
  const paths = [
    '/jobs',
    `/jobs/${jobId}`,
    '/companies',
    `/companies/${slug}`,
    '/login',
    '/applications/track',
    '/khong-co-trang-nay',
  ]
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    for (const path of paths) {
      await open(page, path)
      expect.soft(await page.locator('h1').count(), `${path} ${viewport.width}: số h1`).toBe(1)
      expect
        .soft(await overflowX(page), `${path} ${viewport.width}: tràn ngang`)
        .toBeLessThanOrEqual(0)
    }
  }
  expect(errors).toEqual([])
})
