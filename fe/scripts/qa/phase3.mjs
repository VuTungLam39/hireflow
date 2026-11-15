// Rà soát production Phase 3: axe (WCAG 2.2 AA + best-practice) trên mọi màn, tab và dialog ?xem= theo vai;
// tràn ngang và vùng chạm ở 360/768px. ROLE=admin|hr|hm|interviewer|guest
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
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
const out = process.env.OUT ?? `phase3-${role}.json`
const limit = Number(process.env.LIMIT ?? 200)
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')

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
page.setDefaultNavigationTimeout(30000)
// axe đo màu đang fade-in sẽ báo nhầm tương phản
await page.evaluateOnNewDocument(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style')
    s.textContent =
      '*,*::before,*::after{animation:none!important;transition:none!important}'
    document.head.append(s)
  })
})

const settle = async () => {
  await new Promise((r) => setTimeout(r, 250))
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-busy=true], [data-slot=skeleton], .animate-pulse'),
      { timeout: 6000 },
    )
    .catch(() => {})
  await new Promise((r) => setTimeout(r, 200))
}

const axe = async (rules) => {
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ content: axeSource })
  return page.evaluate(async (rules) => {
    const options = rules
      ? { runOnly: { type: 'rule', values: rules } }
      : {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
          },
        }
    const r = await window.axe.run(document, options)
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 160),
        summary: (n.failureSummary ?? '').split('\n').slice(1, 3).join(' ').slice(0, 200),
      })),
      count: v.nodes.length,
    }))
  }, rules)
}

const overflow = () =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth
    const scroll = document.documentElement.scrollWidth
    const offenders = []
    if (scroll > w + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width && r.right > w + 1) {
          let p = el.parentElement
          let clipped = false
          while (p && p !== document.body) {
            const s = getComputedStyle(p)
            if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) {
              clipped = true
              break
            }
            p = p.parentElement
          }
          if (!clipped) {
            const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : ''
            offenders.push(`${el.tagName.toLowerCase()}.${cls} → ${Math.round(r.right)}px`)
          }
        }
        if (offenders.length >= 4) break
      }
    }
    return { scroll, width: w, offenders }
  })

const links = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .map((a) => a.href)
      .filter((h) => h.startsWith(location.origin) && !h.includes('/api/')),
  )

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
      '/account/password',
    ]
  : ['/careers', '/jobs', '/login']
// START=/a,/b CRAWL=0: quét lại đúng các màn bị sót
const queue = (process.env.START?.split(',') ?? start).map((p) => base + p)
const crawl = process.env.CRAWL !== '0'
const visited = new Set()
const results = []
while (queue.length && results.length < limit) {
  const url = queue.shift()
  const key = pattern(url)
  if (visited.has(key)) continue
  visited.add(key)
  try {
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await settle()
    const landed = pattern(page.url())
    if (landed !== key && visited.has(landed)) continue
    const found = await links()
    const states = [{ state: 'mặc định', axe: await axe() }]
    for (let i = 0; i < 12; i++) {
      const all = await page.$$('[role=tab]')
      if (!all[i] || i === 0) continue
      const label = await all[i].evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim())
      await all[i].click().catch(() => {})
      await settle()
      found.push(...(await links()))
      states.push({ state: `tab ${label}`, axe: await axe() })
    }
    const widths = []
    for (const width of [360, 768]) {
      await page.setViewport({ width, height: 800 })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await settle()
      widths.push({ width, ...(await overflow()), axe: await axe(['target-size']) })
    }
    results.push({ key, landed, states, widths })
    if (crawl) for (const l of found) if (!visited.has(pattern(l))) queue.push(l)
    const n = states.reduce((s, x) => s + x.axe.length, 0)
    const o = widths.filter((w) => w.offenders.length).map((w) => w.width)
    console.log(results.length, key, n ? `axe ${n}` : '', o.length ? `tràn ${o.join(',')}` : '')
  } catch (e) {
    results.push({ key, error: e.message.slice(0, 200) })
  }
}
await browser.close()
writeFileSync(out, JSON.stringify(results, null, 2))
console.log(`${results.length} màn → ${out}`)
