// Rà soát production Phase 2: kỹ thuật FE (phiên, cache, điều hướng, mạng, 4 trạng thái màn hình)
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL ?? 'http://localhost:5173'
const password = process.env.LOGIN_PASSWORD ?? 'Admin@123'
const only = process.env.TESTS?.split(',')
const out = process.env.OUT ?? 'phase2.json'
const EMAIL = {
  admin: 'admin@example.com',
  hr: 'hr@hireflow.dev',
  hm: 'hm.eng@hireflow.dev',
  interviewer: 'interviewer@hireflow.dev',
}
const sql = (q) =>
  execFileSync('docker', ['exec', 'hireflow-postgres', 'psql', '-U', 'postgres', '-d', 'ncc_intern', '-tAc', q])
    .toString()
    .trim()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
})
const consoleLog = []
const results = []

async function fresh() {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (['error', 'warn'].includes(m.type()))
      consoleLog.push(`${m.type()} ${page.url().replace(base, '')}: ${m.text().slice(0, 200)}`)
  })
  page.on('pageerror', (e) => consoleLog.push(`pageerror ${page.url().replace(base, '')}: ${e.message.slice(0, 200)}`))
  return { ctx, page }
}
const text = (p) => p.evaluate(() => document.body.innerText)
const settle = async (p) => {
  await wait(300)
  await p
    .waitForFunction(() => !document.querySelector('[aria-busy=true], .animate-pulse'), { timeout: 8000 })
    .catch(() => {})
}
// Đăng nhập giới hạn 5 lần/phút mỗi IP: gặp 429 thì chờ rồi gửi lại
async function submitLogin(p, who) {
  for (let i = 0; i < 6; i++) {
    await p.waitForSelector('input[type=email]')
    await p.$eval('input[type=email]', (e) => (e.value = ''))
    await p.$eval('input[type=password]', (e) => (e.value = ''))
    await p.type('input[type=email]', EMAIL[who])
    await p.type('input[type=password]', password)
    await p.keyboard.press('Enter')
    const ok = await p
      .waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 8000 })
      .then(() => true)
      .catch(() => false)
    if (ok) return
    await wait(15000)
  }
  throw new Error(`không đăng nhập được ${who}`)
}
async function login(p, who) {
  await p.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await submitLogin(p, who)
  await settle(p)
}
const clickText = (p, rx) =>
  p.evaluate((src) => {
    const re = new RegExp(src)
    const el = [...document.querySelectorAll('button, a, [role=menuitem], [role=tab]')].find(
      (x) => x.getClientRects().length && re.test((x.getAttribute('aria-label') || x.textContent || '').trim()),
    )
    el?.click()
    return !!el
  }, rx.source)
async function test(id, name, fn) {
  if (only && !only.includes(id)) return
  const t = Date.now()
  try {
    const detail = await fn()
    results.push({ id, name, result: 'đạt', detail: detail ?? '', ms: Date.now() - t })
    console.log(`✓ ${id} ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (e) {
    results.push({ id, name, result: 'LỖI', detail: e.message.slice(0, 300), ms: Date.now() - t })
    console.log(`✗ ${id} ${name} — ${e.message.slice(0, 300)}`)
  }
  writeFileSync(out, JSON.stringify({ results, consoleLog }, null, 2))
}
const assert = (c, m) => {
  if (!c) throw new Error(m)
}

const appId = sql("select id from applications where status='SCREENING' order by created_at desc limit 1")
const jobId = sql("select id from jobs where status='OPEN' order by created_at desc limit 1")
const candId = sql('select id from candidates where anonymized_at is null order by created_at desc limit 1')

// ===== S1b: đổi người dùng trên cùng tab sau khi phiên mất → không thấy dữ liệu người trước =====
await test('S1b', 'Phiên mất giữa chừng (không F5) rồi người khác đăng nhập: cache cũ có hiện không', async () => {
  const { ctx, page } = await fresh()
  await login(page, 'hr')
  await clickText(page, /^Thông báo/)
  await settle(page)
  const hrBell = await text(page)
  await page.keyboard.press('Escape')
  // Thu hồi phiên ở server, rồi ép 401 cho request kế tiếp mà không tải lại trang
  await page.evaluate(async () => {
    const t = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' }).then((x) => x.json())
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${t.data.accessToken}` } })
  })
  await page.setRequestInterception(true)
  let forced = false
  let blockNotif = false
  page.on('request', (r) => {
    const u = r.url()
    if (!forced && u.includes('/api/v1/') && !u.includes('/auth/')) {
      forced = true
      return r.respond({ status: 401, contentType: 'application/json', body: '{"code":"UNAUTHORIZED"}' })
    }
    if (blockNotif && u.includes('/api/v1/notifications') && r.method() === 'GET') return // treo: chỉ cache trả lời
    r.continue()
  })
  await clickText(page, /^Hồ sơ ứng tuyển$|^Ứng viên$/)
  await page.waitForFunction(() => location.pathname.startsWith('/login'), { timeout: 15000 })
  blockNotif = true
  await submitLogin(page, 'interviewer')
  await wait(800)
  await clickText(page, /^Thông báo/)
  await wait(1200)
  const ivBell = await page.evaluate(
    () => document.querySelector('dialog[open], [role=dialog], [data-radix-popper-content-wrapper], [role=menu]')?.innerText ?? document.body.innerText,
  )
  // Dòng thông báo của HR (lấy 3 dòng đầu có nội dung dài)
  const hrLines = hrBell.split('\n').filter((l) => l.length > 25).slice(0, 8)
  const leaked = hrLines.filter((l) => ivBell.includes(l) && !/Thông báo|Đánh dấu|Xem thêm/.test(l))
  await ctx.close()
  assert(leaked.length === 0, `Interviewer thấy thông báo của HR từ cache: ${leaked.slice(0, 2).join(' | ')}`)
  return 'không lộ'
})

// ===== S2: deep link khi chưa đăng nhập → quay về đúng trang =====
await test('S2', 'Mở deep link khi chưa đăng nhập → đăng nhập xong quay lại đúng trang + dialog', async () => {
  const { ctx, page } = await fresh()
  const target = `/applications?xem=application:${appId}`
  await page.goto(`${base}${target}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => location.pathname.startsWith('/login'), { timeout: 15000 })
  await submitLogin(page, 'hr')
  await settle(page)
  const url = page.url().replace(base, '')
  const dialog = !!(await page.$('dialog[open], [role=dialog]'))
  await ctx.close()
  assert(decodeURIComponent(url) === decodeURIComponent(target), `về ${url}`)
  assert(dialog, 'không mở dialog')
})

// ===== S3: access token hết hạn giữa chừng → refresh 1 lần, gửi lại, không văng =====
await test('S3', 'Access token hết hạn: nhiều request 401 cùng lúc dùng chung 1 lần refresh', async () => {
  const { ctx, page } = await fresh()
  await login(page, 'hr')
  await page.setRequestInterception(true)
  let n401 = 0
  let refresh = 0
  page.on('request', (r) => {
    const u = r.url()
    if (u.includes('/auth/refresh')) refresh++
    if (n401 < 3 && u.includes('/api/v1/') && !u.includes('/auth/') && r.method() === 'GET' && !r.headers()['x-retried']) {
      n401++
      return r.respond({ status: 401, contentType: 'application/json', body: '{"code":"TOKEN_EXPIRED"}' })
    }
    r.continue()
  })
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  await clickText(page, /^Hồ sơ ứng tuyển$/)
  await settle(page)
  await wait(1500)
  const url = page.url()
  const err = /Chưa tải được|trục trặc/.test(await text(page))
  await ctx.close()
  assert(!url.includes('/login'), 'bị văng về trang đăng nhập')
  assert(!err, 'màn hình báo lỗi tải')
  return `${n401} request 401, ${refresh} lần gọi refresh`
})

// ===== S4: user bị khoá giữa phiên → đăng xuất, có thông báo =====
await test('S4', 'Bị đổi vai giữa phiên: menu theo quyền mới sau khi tải lại', async () => {
  const { ctx, page } = await fresh()
  const uid = sql("select id from users where email='interviewer@hireflow.dev'")
  await login(page, 'interviewer')
  const before = await text(page)
  sql(`update users set role='hr' where id='${uid}'`)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await settle(page)
    await wait(800)
    const after = await text(page)
    return `trước có "Hồ sơ ứng tuyển": ${/Hồ sơ ứng tuyển/.test(before)}, sau: ${/Hồ sơ ứng tuyển/.test(after)}`
  } finally {
    sql(`update users set role='interviewer' where id='${uid}'`)
    await ctx.close()
  }
})

// ===== S5: F5 / back / forward với dialog ?xem= =====
await test('S5', 'F5 trong dialog giữ dialog; Back đóng dialog; Forward mở lại', async () => {
  const { ctx, page } = await fresh()
  await login(page, 'hr')
  await page.goto(`${base}/manage/jobs`, { waitUntil: 'domcontentloaded' })
  await settle(page)
  await page.click('tbody tr td:nth-child(2)')
  await page.waitForSelector('dialog[open], [role=dialog]', { timeout: 8000 })
  const withDialog = page.url()
  assert(withDialog.includes('xem='), `URL không có xem=: ${withDialog}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('dialog[open], [role=dialog]', { timeout: 15000 })
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await wait(800)
  const closed = !(await page.$('dialog[open], [role=dialog]')) && !page.url().includes('xem=')
  await page.goForward({ waitUntil: 'domcontentloaded' })
  await wait(1000)
  const reopened = !!(await page.$('dialog[open], [role=dialog]'))
  await ctx.close()
  assert(closed, `Back không đóng dialog (${page.url()})`)
  assert(reopened, 'Forward không mở lại dialog')
})

// ===== S6: mất mạng =====
await test('S6', 'Mất mạng: chuyển trang chưa tải và gửi ghi chú báo lỗi rõ, có mạng lại thì Thử lại được', async () => {
  const { ctx, page } = await fresh()
  await login(page, 'hr')
  await page.goto(`${base}/applications/${appId}`, { waitUntil: 'domcontentloaded' })
  await settle(page)
  await clickText(page, /^Ghi chú/)
  await wait(500)
  await page.setOfflineMode(true)
  const box = await page.$('textarea')
  let noteMsg = 'không có ô ghi chú'
  if (box) {
    await box.type('ghi chú khi mất mạng')
    const ok = await clickText(page, /Thêm ghi chú/)
    await wait(1500)
    noteMsg = `bấm=${ok} `
    noteMsg += (await page.evaluate(() => [...document.querySelectorAll('[data-sonner-toast], [role=alert]')].map((x) => x.innerText).join(' | '))) || '(không có thông báo)'
  }
  await clickText(page, /^Lịch phỏng vấn$/)
  await wait(3000)
  const navMsg = (await text(page)).match(/Chưa kết nối[^\n]*|trục trặc[^\n]*|Chưa tải được[^\n]*|Không có kết nối[^\n]*/)?.[0] ?? '(không có thông điệp)'
  await page.setOfflineMode(false)
  const retried = await clickText(page, /Thử lại|Tải lại/)
  await wait(2500)
  await settle(page)
  const recovered = !/Chưa kết nối|trục trặc|Chưa tải được/.test(await text(page))
  await ctx.close()
  return `ghi chú: ${noteMsg.slice(0, 80)} · chuyển trang: ${navMsg.slice(0, 60)} · bấm thử lại: ${retried} · hồi phục: ${recovered}`
})

// ===== S7: bấm đúp nút gửi =====
await test('S7', 'Bấm đúp "Thêm ghi chú" chỉ tạo 1 ghi chú', async () => {
  const { ctx, page } = await fresh()
  await login(page, 'hr')
  await page.goto(`${base}/applications/${appId}`, { waitUntil: 'domcontentloaded' })
  await settle(page)
  await clickText(page, /^Ghi chú/)
  await wait(500)
  const before = Number(sql(`select count(*) from application_notes where application_id='${appId}'`))
  const box = await page.$('textarea')
  assert(box, 'không có ô ghi chú')
  await box.type(`bấm đúp ${Date.now()}`)
  const btn = await page.$('::-p-aria(Thêm ghi chú)')
  await btn.click({ count: 2, delay: 0 })
  await wait(60)
  await btn.click().catch(() => {})
  await wait(2500)
  const after = Number(sql(`select count(*) from application_notes where application_id='${appId}'`))
  await ctx.close()
  assert(after - before === 1, `tạo ${after - before} ghi chú`)
})

// ===== S8: hai tab, tab A đổi trạng thái → tab B cập nhật qua SSE =====
await test('S8', 'Hai tab: tab A thêm ghi chú/đổi trạng thái → tab B (bảng hồ sơ) cập nhật không cần F5', async () => {
  const { ctx, page: a } = await fresh()
  await login(a, 'hr')
  const b = await ctx.newPage()
  await b.goto(`${base}/applications?status=NEW`, { waitUntil: 'domcontentloaded' })
  await settle(b)
  await wait(1500)
  const target = sql("select a.id from applications a where a.status='NEW' order by a.created_at desc limit 1")
  const name = sql(`select c.full_name from applications a join candidates c on c.id=a.candidate_id where a.id='${target}'`)
  const count = async () => (await text(b)).split(name).length - 1
  const c0 = await count()
  assert(c0 > 0, `tab B không thấy ${name} lúc đầu`)
  // Tab A đổi trạng thái qua API cùng phiên (giống bấm nút)
  const r = await a.evaluate(async (id) => {
    const t = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' }).then((x) => x.json())
    const res = await fetch(`/api/v1/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t.data.accessToken}` },
      body: JSON.stringify({ status: 'SCREENING' }),
    })
    return res.status
  }, target)
  assert(r < 300, `đổi trạng thái HTTP ${r}`)
  const seen = []
  b.on('request', (x) => x.url().includes('/api/v1/') && seen.push(x.url().replace(base, '').split('?')[0]))
  let gone = false
  for (let i = 0; i < 16 && !gone; i++) {
    await wait(500)
    gone = (await count()) < c0
  }
  await ctx.close()
  assert(gone, `tab B vẫn hiện hồ sơ sau 8 giây; request của tab B: ${[...new Set(seen)].join(', ') || 'không có'}`)
  return 'tab B tự bỏ hồ sơ khỏi bộ lọc Mới'
})

// ===== S9: 4 trạng thái mọi màn (lỗi / rỗng / đang tải) =====
const PAGES = {
  hr: ['/', '/manage/jobs', '/applications', '/candidates', '/interviews', '/ai-chat', `/applications/${appId}`, `/manage/jobs/${jobId}/ranking`, `/manage/jobs?xem=job:${jobId}`, `/candidates?xem=candidate:${candId}`],
  admin: ['/users', '/departments', '/admin/ai-queue', '/admin/audit-logs', '/admin/company'],
  interviewer: ['/', '/interviews'],
  hm: ['/'],
}
const SKIP_API = /\/auth\/|\/stream|\/events|\/notifications\/unread/
async function stateRun(who, mode) {
  const { ctx, page } = await fresh()
  await login(page, who)
  const rows = []
  await page.setRequestInterception(true)
  let on = false
  page.on('request', (r) => {
    const u = r.url()
    if (!on || !u.includes('/api/v1/') || SKIP_API.test(u) || r.method() !== 'GET') return r.continue()
    if (mode === 'error')
      return r.respond({ status: 500, contentType: 'application/json', headers: { 'x-request-id': 'qa-phase2-500' }, body: '{"code":"INTERNAL_ERROR","message":"boom"}' })
    if (mode === 'empty') {
      // Lấy phản hồi thật; chỉ làm rỗng các danh sách (data là mảng), giữ nguyên đối tượng
      return void fetch(u, { headers: r.headers() })
        .then(async (res) => {
          const body = await res.json()
          if (Array.isArray(body.data)) {
            body.data = []
            body.meta = { ...(body.meta ?? {}), total: 0, totalPages: 0, nextCursor: null }
          } else if (body.data && typeof body.data === 'object') {
            for (const k of Object.keys(body.data)) if (Array.isArray(body.data[k])) body.data[k] = []
          }
          return r.respond({ status: res.status, contentType: 'application/json', body: JSON.stringify(body) })
        })
        .catch(() => r.continue().catch(() => {}))
    }
    if (mode === 'slow') return void setTimeout(() => r.continue().catch(() => {}), 4000)
    r.continue()
  })
  for (const path of PAGES[who]) {
    on = true
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' }).catch(() => {})
    if (mode === 'slow') {
      await wait(1500)
      const probe = () =>
        page.evaluate(() => ({
          skeleton: !!document.querySelector('[aria-busy=true], .animate-pulse, .animate-skeleton, [role=progressbar], .animate-spin'),
          blank: document.body.innerText.trim().length < 20,
        }))
      const s = await probe().catch(() => wait(500).then(probe))
      rows.push({ who, mode, path, ...s, ok: s.skeleton && !s.blank })
      await wait(3500)
      continue
    }
    await wait(mode === 'error' ? 7000 : 2500) // lỗi 5xx được thử lại 2 lần
    const grab = () => page.evaluate(() => {
      const t = document.body.innerText
      const busy = [...document.querySelectorAll('[aria-busy=true], .animate-pulse')].map((e) => (e.closest('section,[role=tabpanel],dialog,main')?.querySelector('h2,h3,[role=tab][aria-selected=true]')?.textContent ?? e.className).slice(0, 40))
      return {
        errorState: /Chưa tải được|Chưa mở được|trục trặc|Không tải được/.test(t),
        retry: [...document.querySelectorAll('button')].some((b) => /Thử lại|Tải lại/.test(b.textContent)),
        ref: /Mã tham chiếu/.test(t),
        crash: /Có trục trặc khi tải trang/.test(t),
        stillLoading: busy.length > 0,
        busy: [...new Set(busy)].slice(0, 4),
        snippet: t.replace(/\s+/g, ' ').slice(0, 0),
        emptyText: [...document.querySelectorAll('main p.type-heading, dialog p.type-heading')].map((x) => x.innerText).slice(0, 3).join(' | '),
      }
    })
    const s = await grab().catch(() => wait(1000).then(grab))
    if (mode === 'error') {
      on = false
      const retried = await clickText(page, /^Thử lại$/)
      await wait(2500)
      s.recovered = retried ? !/Chưa tải được/.test(await text(page)) : null
    }
    rows.push({ who, mode, path, ...s })
  }
  await ctx.close()
  return rows
}
const stateRows = []
for (const mode of ['error', 'empty', 'slow'])
  await test(`S9-${mode}`, `Trạng thái ${mode} trên mọi màn`, async () => {
    for (const who of Object.keys(PAGES)) stateRows.push(...(await stateRun(who, mode)))
    const mine = stateRows.filter((r) => r.mode === mode)
    const bad =
      mode === 'error'
        ? mine.filter((r) => !r.errorState || r.stillLoading)
        : mode === 'slow'
          ? mine.filter((r) => !r.ok)
          : mine.filter((r) => r.stillLoading || r.crash)
    writeFileSync(out.replace('.json', '-states.json'), JSON.stringify(stateRows, null, 2))
    assert(bad.length === 0, `${bad.length}/${mine.length} màn không đạt: ${bad.map((r) => `${r.who}${r.path}`).join(', ')}`)
    return `${mine.length} màn`
  })

await browser.close()
writeFileSync(out, JSON.stringify({ results, consoleLog: [...new Set(consoleLog)] }, null, 2))
console.log(`${results.filter((r) => r.result === 'đạt').length}/${results.length} đạt; console: ${new Set(consoleLog).size} dòng → ${out}`)
