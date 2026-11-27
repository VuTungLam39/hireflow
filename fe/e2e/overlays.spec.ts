/// <reference types="node" />
import { expect, test, type Locator, type Page } from '@playwright/test'
import { login, VIEWPORTS } from './support'

async function centred(page: Page, layer: Locator) {
  const { width, height } = page.viewportSize()!
  await expect(layer).toHaveCSS('opacity', '1')
  await expect(async () => {
    const box = (await layer.boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(height)
    expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThanOrEqual(1)
  }).toPass()
}

test('Ctrl K: mở trên popup, Enter mở ngay kết quả đầu', async ({ page }) => {
  const api = await login(page, 'hr@hireflow.dev')
  const [job] = await api('/jobs?status=OPEN&limit=1')
  const [candidate] = await api('/candidates?limit=1')
  const word: string = candidate.fullName.split(' ').at(-1)
  await page.goto(`/manage/jobs?xem=job:${job.id}`)
  await expect(page.locator('dialog[open] h2').first()).toBeVisible()
  await page.keyboard.press('Control+k')
  const search = page.getByRole('combobox', { name: 'Tìm nhanh' })
  await expect(search).toBeFocused()
  await page.keyboard.type(word, { delay: 30 })
  const first = page.getByRole('option').first()
  await expect(first).toContainText(word)
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Enter')
  await expect(search).toHaveCount(0)
  await expect(page).toHaveURL(/xem=(candidate|application)/)
})

for (const viewport of VIEWPORTS) {
  test.describe(`lớp nổi mở từ popup chi tiết · ${viewport.width}px`, () => {
    test.use({ viewport })

    test('hộp xác nhận nằm trên popup và bấm được', async ({ page }) => {
      const api = await login(page, 'hr@hireflow.dev')
      const [job] = await api('/jobs?status=OPEN&limit=1')
      await page.goto(`/manage/jobs?xem=job:${job.id}`)
      const popup = page.locator('dialog[open]')
      await popup.getByRole('button', { name: 'Đóng tin' }).click()
      const confirm = page.getByRole('alertdialog')
      await centred(page, confirm)
      await confirm.getByRole('button', { name: 'Huỷ' }).click()
      await expect(confirm).toHaveCount(0)
      await expect(popup).toBeVisible()
    })

    test('hộp thoại nhập liệu dùng được; Esc chỉ đóng lớp trên cùng', async ({ page }) => {
      const api = await login(page, 'hr@hireflow.dev')
      const [application] = await api('/applications?status=INTERVIEW&limit=1')
      await page.goto(`/applications?xem=application:${application.id}`)
      const popup = page.locator('dialog[open]')
      await popup.getByRole('tab', { name: /Phỏng vấn/ }).click()
      await popup.getByRole('button', { name: 'Đặt lịch phỏng vấn' }).click()
      const inner = page.getByRole('dialog', { name: 'Đặt lịch phỏng vấn' })
      await centred(page, inner)
      await inner.getByLabel('Địa điểm').click()
      await page.keyboard.type('Phòng họp 1')
      await expect(inner.getByLabel('Địa điểm')).toHaveValue('Phòng họp 1')
      await page.keyboard.press('Escape')
      await expect(inner).toHaveCount(0)
      await expect(popup).toBeVisible()
    })
  })
}
