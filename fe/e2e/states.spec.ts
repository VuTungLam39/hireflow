/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test, type Page, type Route } from '@playwright/test'
import { login, publicIds } from './support'

// P8 · 8c · ma trận C
const ADMIN = 'admin@example.com'
const DATA = (url: URL) => url.pathname.startsWith('/api/v1/') && !url.pathname.includes('/auth/')
const SKELETON = '[aria-busy="true"], .animate-skeleton, .animate-spin'

type Result = Record<string, string>

async function paths(page: Page): Promise<[string, string, boolean][]> {
  const pub = await publicIds(page)
  const api = await login(page, ADMIN)
  const [application] = await api('/applications?limit=1')
  const [job] = await api('/jobs?status=OPEN&limit=1')
  const [candidate] = await api('/candidates?limit=1')
  return [
    ['Trang công khai: việc làm', '/jobs', false],
    ['Trang công khai: chi tiết tin', `/jobs/${pub.jobId}`, false],
    ['Trang công khai: công ty', '/companies', false],
    ['Dashboard', '/', true],
    ['Tin tuyển dụng', '/manage/jobs', true],
    ['Hộp thoại tin', `/manage/jobs?xem=job:${job.id}`, true],
    ['Hồ sơ ứng tuyển', '/applications', true],
    ['Duyệt CV', `/applications/${application.id}`, true],
    ['Hồ sơ ứng viên', `/candidates/${candidate.id}`, true],
    ['Kho ứng viên', '/candidates', true],
    ['Xếp hạng', `/manage/jobs/${job.id}/ranking`, true],
    ['Phỏng vấn', '/interviews', true],
    ['Quản trị: người dùng', '/users', true],
    ['Quản trị: phòng ban', '/departments', true],
    ['Quản trị: công ty', '/admin/company', true],
    ['Quản trị: hàng đợi', '/admin/ai-queue', true],
    ['Quản trị: nhật ký', '/admin/audit-logs', true],
  ]
}

const save = (name: string, rows: Result[]) => {
  mkdirSync('test-results-8c', { recursive: true })
  writeFileSync(`test-results-8c/${name}.json`, JSON.stringify(rows, null, 1))
  console.table(rows)
}

test('đang tải: có khung chờ', async ({ page }) => {
  test.setTimeout(300_000)
  const rows: Result[] = []
  for (const [area, path] of await paths(page)) {
    const held: Route[] = []
    await page.route(DATA, (route) => void held.push(route))
    await page.goto(path)
    const busy = await page
      .locator(SKELETON)
      .first()
      .waitFor({ timeout: 8000 })
      .then(() => 'PASS')
      .catch(() => 'FAIL')
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await Promise.all(held.map((r) => r.abort().catch(() => {})))
    rows.push({ area, loading: busy })
  }
  save('states-loading', rows)
})

test('lỗi 500: có thông báo và Thử lại phục hồi', async ({ page }) => {
  test.setTimeout(600_000)
  const rows: Result[] = []
  for (const [area, path] of await paths(page)) {
    await page.route(DATA, (route) =>
      route.fulfill({ status: 500, json: { message: 'lỗi giả lập' } }),
    )
    await page.goto(path)
    const scope = path.includes('?xem=') ? page.getByRole('dialog') : page
    const retry = scope.getByRole('button', { name: 'Thử lại' })
    const shown = await retry
      .first()
      .waitFor({ timeout: 25_000 })
      .then(() => true)
      .catch(() => false)
    const text = shown
      ? ''
      : (await page.locator('main, [role=dialog]').last().innerText()).slice(0, 80)
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    let recovered = '—'
    if (shown) {
      for (let i = 0; i < 6 && (await retry.count()) > 0; i++) {
        await retry
          .first()
          .click({ timeout: 3000 })
          .catch(() => {})
        await page.waitForTimeout(800)
      }
      recovered = (await retry.count()) === 0 ? 'PASS' : 'FAIL'
    }
    rows.push({
      area,
      error: shown ? 'PASS' : `FAIL: ${text.replace(/\s+/g, ' ')}`,
      retry: recovered,
    })
  }
  save('states-error', rows)
})

test('rỗng: tìm không ra kết quả', async ({ page }) => {
  await login(page, ADMIN)
  const rows: Result[] = []
  for (const path of [
    '/jobs?search=zzzzqqqq',
    '/manage/jobs?search=zzzzqqqq',
    '/applications?search=zzzzqqqq',
    '/candidates?search=zzzzqqqq',
    '/users?search=zzzzqqqq',
  ]) {
    await page.goto(path)
    const message = page.getByText(/^(Không có|Không thấy|Chưa có)/).first()
    const empty = await message
      .waitFor({ timeout: 15_000 })
      .then(async () => `PASS: ${await message.innerText()}`)
      .catch(() => 'FAIL')
    rows.push({ area: path, empty })
  }
  save('states-empty', rows)
})

test('bàn phím', async ({ page }) => {
  const rows: Result[] = []
  const check = async (name: string, run: () => Promise<void>) =>
    rows.push({
      name,
      result: await run()
        .then(() => 'PASS')
        .catch((e: Error) => `FAIL: ${e.message.split('\n')[0]}`),
    })
  const focused = () => page.locator(':focus')

  await page.goto('/login')
  await check('đăng nhập chỉ bằng bàn phím', async () => {
    await page.getByLabel('Email').focus()
    await page.keyboard.type(ADMIN)
    await page.keyboard.press('Tab')
    for (let i = 0; i < 3; i++) {
      if ((await focused().getAttribute('type')) === 'password') break
      await page.keyboard.press('Tab')
    }
    await page.keyboard.type(process.env.E2E_PASSWORD ?? 'Admin@123')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/localhost:5173\/$/)
  })
  // Tab đầu tiên chỉ đúng trên bản build (StrictMode của dev chuyển focus vào main)
  await check('"Bỏ qua tới nội dung" đưa focus vào main', async () => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await page.getByRole('link', { name: 'Bỏ qua tới nội dung' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused({ timeout: 3000 })
  })
  await check('Ctrl+K mở bảng lệnh, Esc đóng', async () => {
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
  await check('mở hộp thoại tin bằng Enter, Esc đóng, focus quay lại', async () => {
    await page.goto('/manage/jobs')
    const link = page.locator('main table tbody tr a').first()
    const name = await link.innerText()
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(focused()).toContainText(name, { timeout: 3000 })
  })
  await check('hộp thoại giữ focus bên trong (30 lần Tab)', async () => {
    await page.locator('main table tbody tr a').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      const outside = await page.evaluate(() => {
        const e = document.activeElement
        return e !== document.body && !e?.closest('dialog,[role=dialog]')
      })
      expect(outside, `lần ${i + 1}`).toBe(false)
    }
  })
  await check('menu di động: mở bằng Enter, Esc đóng', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const menu = page.getByRole('button', { name: /menu|điều hướng/i }).first()
    await menu.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(menu).toBeFocused()
  })
  save('keyboard', rows)
})
