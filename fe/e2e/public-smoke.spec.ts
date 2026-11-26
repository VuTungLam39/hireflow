import { expect, test } from '@playwright/test'
import { open, overflowX, publicIds, VIEWPORTS } from './support'

// P8 · §3
test('trang công khai: 1 h1, không tràn ngang, không lỗi JS', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const { jobId, jobTitle, slug, company } = await publicIds(page)
  const paths: [string, string?][] = [
    ['/jobs'],
    [`/jobs/${jobId}`, jobTitle],
    ['/companies'],
    [`/companies/${slug}`, company],
    ['/careers'],
    ['/chinh-sach-du-lieu'],
    ['/employers/register'],
    ['/employers/check-email'],
    ['/verify-email'],
    ['/applications/track'],
    ['/login'],
    ['/forgot-password'],
    ['/reset-password'],
    ['/khong-co-trang-nay'],
  ]
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    for (const [path, heading] of paths) {
      await open(page, path)
      const at = `${path} ${viewport.width}`
      await expect.soft(page.locator('h1'), `${at}: số h1`).toHaveCount(1)
      if (heading) await expect.soft(page.locator('h1'), at).toContainText(heading)
      expect.soft(await overflowX(page), `${at}: tràn ngang`).toBeLessThanOrEqual(0)
    }
  }
  expect(errors).toEqual([])
})
