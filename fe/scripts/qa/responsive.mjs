import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
const base = process.env.BASE_URL ?? 'http://localhost:8080'
const out = process.argv[2]
const roles = [
  {
    role: 'admin',
    email: 'admin@example.com',
    pages: [
      '/',
      '/manage/jobs',
      'ranking',
      '/applications',
      'appDetail',
      '/candidates',
      'candDetail',
      '/ai-chat',
      '/users',
      '/departments',
      '/admin/ai-queue',
      '/jobs',
      'pubDetail',
    ],
  },
  {
    role: 'hr',
    email: 'hr@hireflow.dev',
    pages: [
      '/',
      '/manage/jobs',
      'ranking',
      '/applications',
      'appDetail',
      '/candidates',
      'candDetail',
      '/ai-chat',
      '/manage/jobs/new',
      '/users',
    ],
  },
  {
    role: 'hm',
    email: 'hm.eng@hireflow.dev',
    pages: [
      '/',
      '/manage/jobs',
      'ranking',
      '/applications',
      'appDetail',
      '/candidates',
      'candDetail',
      '/ai-chat',
      '/users',
    ],
  },
]
const widths = [360, 768, 1280]
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const report = []
for (const r of roles) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${base}/login`, { waitUntil: 'networkidle0' })
  await page.type('input[name=email]', r.email)
  await page.type('input[name=password]', 'Admin@123')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type=submit]'),
  ])
  const ids = await page.evaluate(async () => {
    const pick = async (path, sel) => {
      history.pushState(null, '', path)
      dispatchEvent(new PopStateEvent('popstate'))
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 100))
        const a = document.querySelector(sel)
        if (a) return a.getAttribute('href')
      }
      return null
    }
    return {
      ranking: await pick('/manage/jobs', 'main a[href$="/ranking"]'),
      appDetail: await pick('/applications', 'main a[href^="/applications/"]'),
      candDetail: await pick('/candidates', 'main a[href^="/candidates/"]'),
      pubDetail: await pick('/jobs', 'main a[href^="/jobs/"]'),
    }
  })
  for (const w of widths) {
    await page.setViewport({ width: w, height: 800 })
    for (const p of r.pages) {
      const path = ids[p] ?? (p.startsWith('/') ? p : null)
      if (!path) {
        report.push({ role: r.role, w, page: p, issue: 'không tìm thấy link để mở' })
        continue
      }
      const errors = []
      const onConsole = (m) =>
        m.type() === 'error' &&
        !/401|Failed to load resource/.test(m.text()) &&
        errors.push(`console: ${m.text().slice(0, 160)}`)
      const onPageErr = (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`)
      const onResp = (res) =>
        res.url().includes('/api/') &&
        res.status() >= 400 &&
        !(res.status() === 401 && res.url().includes('/auth/refresh')) &&
        errors.push(`HTTP ${res.status()} ${res.request().method()} ${res.url().replace(base, '')}`)
      page.on('console', onConsole)
      page.on('pageerror', onPageErr)
      page.on('response', onResp)
      await page.goto(base + path, { waitUntil: 'networkidle0' })
      await new Promise((res) => setTimeout(res, 300))
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const over = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const b = el.getBoundingClientRect()
            return (
              b.width > 0 &&
              b.right > vw + 1 &&
              !el.closest(
                '.overflow-x-auto, [class*="overflow-x"], [class*="overflow-hidden"], [class*="overflow-auto"]',
              )
            )
          })
          .slice(0, 3)
          .map(
            (el) =>
              `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}`,
          )
        return {
          scrollW: document.documentElement.scrollWidth,
          vw,
          over,
          h1: document.querySelector('h1')?.textContent?.slice(0, 40),
          forbidden: /không có quyền|403/i.test(document.querySelector('main')?.textContent ?? ''),
        }
      })
      page.off('console', onConsole)
      page.off('pageerror', onPageErr)
      page.off('response', onResp)
      const name = `${r.role}-${w}-${p.replace(/\//g, '_') || 'home'}.png`
      await page.screenshot({ path: `${out}/${name}`, fullPage: false })
      report.push({
        role: r.role,
        w,
        page: p,
        path,
        h1: m.h1,
        forbidden: m.forbidden,
        overflowX: m.scrollW > m.vw + 1 ? `${m.scrollW}>${m.vw} ${m.over.join(', ')}` : '',
        errors,
      })
    }
  }
  await ctx.close()
}
await browser.close()
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
for (const x of report)
  if (x.overflowX || x.errors?.length || x.issue) console.log(JSON.stringify(x))
console.log(
  'tổng',
  report.length,
  'lượt; có vấn đề:',
  report.filter((x) => x.overflowX || x.errors?.length || x.issue).length,
)
