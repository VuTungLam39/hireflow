// Rà soát production Phase 1A: theo mọi link nội bộ và mọi tab theo từng vai, ghi trang lỗi, lỗi JS, API lỗi
import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL ?? 'http://localhost:5173'
const password = process.env.LOGIN_PASSWORD ?? 'Admin@123'
const role = process.env.ROLE ?? 'hr'
const email = {
  admin: 'admin@example.com',
  hr: 'hr@hireflow.dev',
  hm: 'hm.eng@hireflow.dev',
  interviewer: 'interviewer@hireflow.dev',
  guest: null,
}[role]
const out = process.env.OUT ?? `sweep-${role}.json`
const limit = Number(process.env.LIMIT ?? 400)

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
const pattern = (href) => {
  const u = new URL(href, base)
  const q = [...u.searchParams.entries()]
    .map(([k, v]) => (k === 'xem' ? `xem=${v.replace(UUID, '{id}')}` : k))
    .sort()
    .join('&')
  return u.pathname.replace(UUID, '{id}') + (q ? `?${q}` : '')
}

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
  const u = r.url()
  if (u.includes('/api/') && r.status() >= 400 && !u.includes('/auth/refresh'))
    events.push(`API ${r.status()} ${r.request().method()} ${pattern(u)}`)
})

const settle = async () => {
  await new Promise((r) => setTimeout(r, 250))
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-busy=true], [data-slot=skeleton], .animate-pulse'),
      { timeout: 6000 },
    )
    .catch(() => {})
  await new Promise((r) => setTimeout(r, 150))
}

const inspect = () =>
  page.evaluate(() => {
    const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
    const h = [...document.querySelectorAll('h1,h2')].map(text).join(' | ').slice(0, 120)
    const marker =
      /Không có trang này|không thuộc quyền|Trang này dành cho|trục trặc khi tải|Chưa kết nối/.exec(
        document.body.innerText,
      )?.[0]
    const alerts = [...document.querySelectorAll('[role=alert]')]
      .map(text)
      .filter(Boolean)
      .slice(0, 3)
    const links = [...document.querySelectorAll('a[href]')]
      .map((a) => a.href)
      .filter((h) => h.startsWith(location.origin) && !h.includes('/api/'))
    return { h, marker, alerts, links }
  })

if (email) {
  await page.goto(`${base}/login`)
  await page.waitForSelector('input[type=email], input[name=email]')
  await page.type('input[type=email], input[name=email]', email)
  await page.type('input[type=password]', password)
  await Promise.all([page.waitForNavigation().catch(() => {}), page.keyboard.press('Enter')])
  await settle()
}

const start = email
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
      '/careers',
      '/jobs',
    ]
  : ['/careers', '/jobs', '/login']
const queue = start.map((p) => base + p)
const visited = new Map()
const results = []
while (queue.length && results.length < limit) {
  const url = queue.shift()
  const key = pattern(url)
  if ((visited.get(key) ?? 0) >= 2) continue
  visited.set(key, (visited.get(key) ?? 0) + 1)
  events = []
  await page
    .goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    .catch((e) => events.push(`NAV: ${e.message}`))
  let info
  try {
    await settle()
    info = await inspect()
    const tabs = []
    for (let i = 0; i < 12; i++) {
      const all = await page.$$('[role=tab]')
      if (!all[i]) break
      const label = await all[i].evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim())
      const before = events.length
      await all[i].click().catch(() => {})
      await settle()
      const t = await inspect()
      info.links.push(...t.links)
      if (events.length > before || t.marker || t.alerts.length)
        tabs.push({ tab: label, events: events.slice(before), marker: t.marker, alerts: t.alerts })
    }
    results.push({
      url: url.replace(base, ''),
      key,
      landed: page.url().replace(base, ''),
      heading: info.h,
      marker: info.marker ?? '',
      alerts: info.alerts,
      events: [...new Set(events)],
      tabs,
    })
  } catch (e) {
    results.push({ url: url.replace(base, ''), key, error: e.message.slice(0, 200) })
    continue
  }
  for (const l of info.links) if ((visited.get(pattern(l)) ?? 0) < 2) queue.push(l)
  console.log(results.length, key, info.marker ?? '', events.length ? `⚠ ${events.length}` : '')
}
await browser.close()
writeFileSync(out, JSON.stringify(results, null, 2))
console.log(`${results.length} trang → ${out}`)
