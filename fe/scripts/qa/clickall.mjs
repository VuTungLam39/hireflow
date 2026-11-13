// Rà soát production Phase 1C: bấm từng nút không phá huỷ trên mọi màn theo vai, ghi lỗi JS, API 5xx, trang lỗi
import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL ?? 'http://localhost:5173'
const password = process.env.LOGIN_PASSWORD ?? 'Admin@123'
const role = process.env.ROLE ?? 'hr'
const ids = JSON.parse(process.env.IDS ?? '{}')
const out = process.env.OUT ?? `clickall-${role}.json`
const email = {
  admin: 'admin@example.com',
  hr: 'hr@hireflow.dev',
  hm: 'hm.eng@hireflow.dev',
  interviewer: 'interviewer@hireflow.dev',
  guest: null,
}[role]

// Nút ghi dữ liệu thật đã kiểm trong flows.mjs; ở đây chỉ bấm nút đọc, lọc, mở, điều hướng
const SKIP =
  /Xoá ảnh|Gỡ ảnh|Đăng tin|Đóng tin|Xoá tin|Khoá|Mở khoá|Ẩn danh|Từ chối|Ghi nhận|Chạy lại|Lưu|Gửi|^Tạo|Mời vào|Nhân bản|Chuyển|Duyệt|Huỷ buổi|Đăng xuất|Đã đọc hết|Chấm lại|Xoá người|Xoá phòng|Tải CV gốc|Xuất CSV|Tanstack|devtools/i

const pages = email
  ? [
      '/',
      '/manage/jobs',
      '/applications',
      '/candidates',
      '/interviews',
      '/ai-chat',
      '/users',
      '/departments',
      '/admin/ai-queue',
      '/admin/audit-logs',
      '/admin/company',
      ids.app && `/applications/${ids.app}`,
      ids.job && `/manage/jobs/${ids.job}/ranking`,
      ids.job && `/manage/jobs?xem=job:${ids.job}`,
      ids.app && `/applications?xem=application:${ids.app}`,
      ids.cand && `/candidates?xem=candidate:${ids.cand}`,
    ].filter(Boolean)
  : ['/careers', '/jobs', ids.job && `/jobs/${ids.job}`, '/login'].filter(Boolean)

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
})
const page = await browser.newPage()
let events = []
page.on('pageerror', (e) => events.push(`JS: ${e.message.slice(0, 160)}`))
page.on('response', (r) => {
  if (r.url().includes('/api/') && r.status() >= 500)
    events.push(
      `API ${r.status()} ${r.request().method()} ${r.url().replace(base, '').split('?')[0]}`,
    )
})
page.on('dialog', (d) => {
  events.push(`window.${d.type()}: ${d.message().slice(0, 80)}`)
  void d.dismiss()
})
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const settle = async () => {
  await wait(250)
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy=true], .animate-pulse'), {
      timeout: 6000,
    })
    .catch(() => {})
}
const open = async (path) => {
  await wait(600)
  await page
    .goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    .catch(() => {})
  await settle()
}
const names = () =>
  page.evaluate((skip) => {
    const rx = new RegExp(skip, 'i')
    const nameOf = (el) =>
      (el.getAttribute('aria-label') || el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60)
    const seen = new Set()
    return [
      ...document.querySelectorAll('button, [role=menuitem], [role=tab], [role=radio], summary'),
    ]
      .filter((el) => el.getClientRects().length && !el.disabled && !el.closest('[inert]'))
      .map(nameOf)
      .filter((n) => n && !rx.test(n) && !seen.has(n) && seen.add(n))
  }, SKIP.source)
const clickByName = (name) =>
  page.evaluate((name) => {
    const nameOf = (el) =>
      (el.getAttribute('aria-label') || el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60)
    const el = [
      ...document.querySelectorAll('button, [role=menuitem], [role=tab], [role=radio], summary'),
    ].find((x) => x.getClientRects().length && !x.disabled && nameOf(x) === name)
    if (!el) return false
    el.click()
    return true
  }, name)
const marker = () =>
  page.evaluate(
    () =>
      /Không có trang này|trục trặc khi tải|Chưa kết nối/.exec(document.body.innerText)?.[0] ?? '',
  )

if (email) {
  await page.goto(`${base}/login`)
  await page.waitForSelector('input[type=email]')
  await page.type('input[type=email]', email)
  await page.type('input[type=password]', password)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 30000 })
}

const results = []
const only = process.env.PAGES?.split(',')
for (const path of pages.filter((x) => !only || only.some((o) => x.startsWith(o)))) {
  await open(path)
  const list = await names().catch(() => [])
  let clicked = 0
  for (const name of list) {
    try {
      events = []
      const before = page.url()
      const ok = await clickByName(name)
      if (!ok) {
        await open(path)
        if (!(await clickByName(name))) {
          results.push({ path, name, result: 'không còn thấy sau khi tải lại' })
          continue
        }
      }
      clicked++
      await wait(500)
      await settle()
      const m = await marker()
      const after = page.url()
      results.push({
        path,
        name,
        result: m ? `TRANG LỖI: ${m}` : events.length ? 'CÓ LỖI' : 'đạt',
        events: [...new Set(events)],
        navigated: after !== before ? after.replace(base, '') : '',
      })
      await page.keyboard.press('Escape')
      await wait(150)
      if (page.url() !== `${base}${path}` || m) await open(path)
    } catch (e) {
      // bấm làm trang điều hướng giữa chừng
      results.push({ path, name, result: 'đạt (điều hướng)', note: e.message.slice(0, 80) })
      await open(path)
    }
  }
  console.log(`${path}: ${clicked}/${list.length} nút`)
  writeFileSync(out, JSON.stringify(results, null, 2))
}
await browser.close()
writeFileSync(out, JSON.stringify(results, null, 2))
const bad = results.filter((r) => r.result !== 'đạt')
console.log(`${results.length} lượt bấm, ${bad.length} không đạt → ${out}`)
