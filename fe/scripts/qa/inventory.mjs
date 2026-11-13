// Rà soát production Phase 0: kiểm kê mọi phần tử tương tác theo vai × màn × trạng thái
import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL ?? 'http://localhost:5173'
const password = process.env.LOGIN_PASSWORD ?? 'Admin@123'
const out = process.env.OUT ?? 'inventory.csv'
const allRoles = {
  admin: process.env.ADMIN_EMAIL ?? 'admin@example.com',
  hr: 'hr@hireflow.dev',
  hm: 'hm.eng@hireflow.dev',
  interviewer: 'interviewer@hireflow.dev',
  guest: null,
}
const roles = Object.fromEntries(
  Object.entries(allRoles).filter(
    ([r]) => !process.env.ROLES || process.env.ROLES.split(',').includes(r),
  ),
)

const api = async (path, token) => {
  const res = await fetch(`${base}/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return (await res.json()).data
}
const login = async (email) => {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return (await res.json()).data.tokens.accessToken
}

const ids = process.env.IDS
  ? JSON.parse(process.env.IDS)
  : await (async () => {
      const hrToken = await login(allRoles.hr)
      const jobs = await api('/jobs?limit=100', hrToken)
      const open = jobs.find((j) => j.status === 'OPEN' && j.applicationCount > 0) ?? jobs[0]
      const apps = await api('/applications?limit=100', hrToken)
      return {
        job: open.id,
        closed: jobs.find((j) => j.status === 'CLOSED')?.id,
        draft: jobs.find((j) => j.status === 'DRAFT')?.id,
        app: (apps.find((a) => a.jobId === open.id) ?? apps[0]).id,
        cand: (await api('/candidates?limit=5', hrToken))[0].id,
      }
    })()
if (process.env.PRINT_IDS) {
  console.log(JSON.stringify(ids))
  process.exit(0)
}
const job = { id: ids.job }
const closed = ids.closed && { id: ids.closed }
const draft = ids.draft && { id: ids.draft }
const app = { id: ids.app }
const cand = { id: ids.cand }

const internal = [
  '/',
  '/manage/jobs',
  '/applications',
  `/applications/${app.id}`,
  '/candidates',
  `/candidates/${cand.id}`,
  `/manage/jobs/${job.id}/ranking`,
  `/manage/jobs/${job.id}/matches`,
  `/manage/jobs/${job.id}/edit`,
  '/manage/jobs/new',
  '/interviews',
  '/ai-chat',
  '/users',
  '/departments',
  '/admin/ai-queue',
  '/admin/audit-logs',
  '/admin/company',
  '/khong-ton-tai',
]
const dialogs = [
  `/manage/jobs?xem=job:${job.id}`,
  closed && `/manage/jobs?xem=job:${closed.id}`,
  draft && `/manage/jobs?xem=job:${draft.id}`,
  '/manage/jobs?xem=job:new',
  `/applications?xem=application:${app.id}`,
  `/candidates?xem=candidate:${cand.id}`,
].filter(Boolean)
const publicPages = ['/careers', '/jobs', `/jobs/${job.id}`, '/login', '/khong-ton-tai']

const collect = (state) =>
  // eslint-disable-next-line no-undef
  page.evaluate((state) => {
    const sel =
      'button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=menuitem], [role=menuitemradio], [role=checkbox], [role=switch], [role=combobox], [role=radio], [role=option], [contenteditable=true]'
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
    }
    const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
    const nameOf = (el) => {
      const by = el.getAttribute('aria-labelledby')
      const label =
        el.getAttribute('aria-label') ||
        (by &&
          by
            .split(' ')
            .map((id) => text(document.getElementById(id)))
            .join(' ')) ||
        (el.id && text(document.querySelector(`label[for="${CSS.escape(el.id)}"]`))) ||
        text(el.closest('label')) ||
        text(el) ||
        el.getAttribute('placeholder') ||
        el.getAttribute('title') ||
        el.getAttribute('name') ||
        ''
      return label.slice(0, 80)
    }
    const dialogs = [...document.querySelectorAll('[role=dialog],[role=alertdialog]')]
    const top = dialogs.at(-1)
    return [...document.querySelectorAll(sel)].filter(visible).map((el) => {
      const row = el.closest('tbody tr, [role=row]')
      let name = nameOf(el)
      if (row) {
        const key = text(row.querySelector('td, [role=cell], [role=gridcell]'))
        if (key && key.length > 2) name = name.split(key).join('{dòng}')
        name = name.replace(/\d+/g, '#')
      }
      return {
        state,
        scope: top?.contains(el)
          ? `dialog:${text(top.querySelector('h1,h2,[id$=title]')).slice(0, 40)}`
          : 'page',
        type:
          el.getAttribute('role') ||
          (el.tagName === 'INPUT' ? `input:${el.type}` : el.tagName.toLowerCase()),
        name,
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true' ? 'khoá' : '',
        row: row ? 'dòng' : '',
      }
    })
  }, state)

const rows = []
const seen = new Map()
const add = (role, items) => {
  for (const i of items) {
    const key = [
      role,
      i.scope.startsWith('dialog') ? i.state.split(' › ')[0] : '',
      i.scope,
      i.type,
      i.name,
      i.disabled,
      i.row,
    ].join('|')
    if (seen.has(key)) seen.get(key).seen++
    else {
      const r = { role, ...i, seen: 1 }
      seen.set(key, r)
      rows.push(r)
    }
  }
}

const settle = async () => {
  // SSE giữ kết nối mở nên không chờ network idle được
  await new Promise((r) => setTimeout(r, 250))
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-busy=true], [data-slot=skeleton], .animate-pulse'),
      {
        timeout: 5000,
      },
    )
    .catch(() => {})
  await new Promise((r) => setTimeout(r, 150))
}

const visitTabs = async (role, state) => {
  const tabs = await page.$$('[role=tab]')
  for (let i = 0; i < tabs.length; i++) {
    const all = await page.$$('[role=tab]')
    if (!all[i]) break
    const label = await all[i].evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim())
    await all[i].click().catch(() => {})
    await settle()
    add(role, await collect(`${state} › tab ${label.replace(/\d+/g, '#')}`))
    await visitMenus(role, `${state} › tab ${label.replace(/\d+/g, '#')}`)
  }
}

const visitMenus = async (role, state) => {
  const triggers = await page.$$(
    '[aria-haspopup=menu], [aria-haspopup=true], [aria-haspopup=listbox]',
  )
  const done = new Set()
  for (const t of triggers) {
    const info = await t
      .evaluate((el) => {
        const row = el.closest('tbody tr, [role=row]')
        const name = (el.getAttribute('aria-label') || el.textContent || '')
          .trim()
          .replace(/\d+/g, '#')
        const index = row ? [...row.parentElement.children].indexOf(row) : -1
        return { name, key: row ? `row:${name.split(' ').slice(0, 2).join(' ')}` : name, index }
      })
      .catch(() => null)
    if (!info || !info.name || done.has(info.key) || info.index > 0) continue
    done.add(info.key)
    const name = info.name
    const ok = await t
      .click()
      .then(() => true)
      .catch(() => false)
    if (!ok) continue
    await settle()
    add(
      role,
      (await collect(`${state} › menu ${name.slice(0, 40)}`)).filter((i) =>
        /menuitem|option/.test(i.type),
      ),
    )
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 200))
  }
}

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
})
let page
const errors = []
for (const [role, email] of Object.entries(roles)) {
  const ctx = await browser.createBrowserContext()
  page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push({ role, url: page.url(), error: e.message }))
  page.on(
    'console',
    (m) => m.type() === 'error' && errors.push({ role, url: page.url(), error: m.text() }),
  )
  if (email) {
    await page.goto(`${base}/login`)
  await page.waitForSelector('input[type=email], input[name=email]')
    await page.type('input[type=email], input[name=email]', email)
    await page.type('input[type=password]', password)
    await Promise.all([page.waitForNavigation().catch(() => {}), page.keyboard.press('Enter')])
    await settle()
  }
  for (const path of email ? [...internal, ...dialogs, ...publicPages] : publicPages) {
    await page.goto(`${base}${path}`)
    await settle()
    const state = path
      .replace(job.id, '{job}')
      .replace(closed?.id, '{job-closed}')
      .replace(draft?.id, '{job-draft}')
      .replace(app.id, '{app}')
      .replace(cand.id, '{cand}')
    const landed = new URL(page.url()).pathname
    add(role, await collect(landed === path.split('?')[0] ? state : `${state} → ${landed}`))
    await visitMenus(role, state)
    await visitTabs(role, state)
    console.log(role, state, rows.length)
  }
  await ctx.close()
}
await browser.close()

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
const cols = ['role', 'state', 'scope', 'type', 'name', 'disabled', 'row', 'seen']
writeFileSync(
  out,
  '\ufeff' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n'),
)
writeFileSync(out.replace(/\.csv$/, '-errors.json'), JSON.stringify(errors, null, 2))
console.log(`${rows.length} dòng → ${out}; ${errors.length} lỗi console`)
