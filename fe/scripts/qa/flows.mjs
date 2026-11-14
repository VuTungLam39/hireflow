// Rà soát production Phase 1B: chạy luồng nghiệp vụ qua UI thật, đối chiếu kết quả bằng API
// Chạy trên DB local (tạo tin, hồ sơ, buổi phỏng vấn thật). Cần BE + FE + worker AI đang chạy.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL ?? 'http://localhost:5173'
const password = process.env.LOGIN_PASSWORD ?? 'Admin@123'
const cvPath = process.env.CV_PATH
const out = process.env.OUT ?? 'flows.json'
const only = process.env.FLOWS?.split(',')
const accounts = {
  admin: 'admin@example.com',
  hr: 'hr@hireflow.dev',
  hm: 'hm.eng@hireflow.dev',
  interviewer: 'interviewer@hireflow.dev',
}
const stamp = Date.now().toString(36)
const results = []
const sql = (q) =>
  execFileSync('docker', [
    'exec',
    'hireflow-postgres',
    'psql',
    '-U',
    'postgres',
    '-d',
    'ncc_intern',
    '-tAc',
    q,
  ])
    .toString()
    .trim()

// ---------- API ----------
const tokens = {}
const call = async (who, method, path, body) => {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(who ? { Authorization: `Bearer ${tokens[who]}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, ...json }
}
for (const [who, email] of Object.entries(accounts)) {
  // giới hạn 5 lần đăng nhập/phút/tài khoản: chạy lại script liên tục sẽ gặp 429
  for (let i = 0; ; i++) {
    const r = await call(null, 'POST', '/auth/login', { email, password })
    if (r.data) {
      tokens[who] = r.data.tokens.accessToken
      break
    }
    if (r.status !== 429 || i > 6) throw new Error(`đăng nhập ${who}: HTTP ${r.status}`)
    await new Promise((res) => setTimeout(res, 15000))
  }
}

// ---------- Trình duyệt ----------
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: process.env.HEADFUL ? false : true,
  defaultViewport: { width: 1280, height: 900 },
})
const pages = {}
const issues = []
async function as(who) {
  if (pages[who]) return pages[who]
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.on('pageerror', (e) => issues.push(`${who} JS: ${e.message.slice(0, 160)}`))
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 500)
      issues.push(`${who} API ${r.status()} ${r.request().method()} ${r.url().replace(base, '')}`)
  })
  if (accounts[who]) {
    for (let i = 0; ; i++) {
      await page.goto(`${base}/login`)
      await page.waitForSelector('input[type=email]')
      await page.type('input[type=email]', accounts[who])
      await page.type('input[type=password]', password)
      await page.keyboard.press('Enter')
      const ok = await page
        .waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 15000 })
        .then(() => true)
        .catch(() => false)
      if (ok) break
      if (i > 5) throw new Error(`không đăng nhập được ${who}`)
      await new Promise((res) => setTimeout(res, 15000))
    }
  }
  pages[who] = page
  return page
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const settle = async (page) => {
  await wait(300)
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy=true], .animate-pulse'), {
      timeout: 8000,
    })
    .catch(() => {})
}
const go = async (page, path) => {
  // giữ dưới 100 request/phút/user (THROTTLE_LIMIT)
  await wait(700)
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
  await settle(page)
}
/** Bấm phần tử nhìn thấy có tên khớp (role button/link/menuitem/tab), ưu tiên trong dialog trên cùng */
async function click(
  page,
  name,
  { role = 'button,a,[role=menuitem],[role=tab]', timeout = 8000 } = {},
) {
  const re =
    name instanceof RegExp
      ? name.source
      : // tab có số đếm dính liền tên: "Phỏng vấn1"
        `^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${role === '[role=tab]' ? '\\d*' : ''}\\s*$`
  const flags = name instanceof RegExp ? name.flags : ''
  const handle = await page.waitForFunction(
    (sel, re, flags) => {
      const rx = new RegExp(re, flags)
      const dialogs = [
        ...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]'),
      ]
      const scope = dialogs.at(-1) ?? document
      const nameOf = (el) =>
        (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()
      const visible = (el) => el.getClientRects().length > 0 && !el.closest('[inert]')
      return (
        [...scope.querySelectorAll(sel)].find(
          (el) => visible(el) && rx.test(nameOf(el)) && !el.disabled,
        ) ?? null
      )
    },
    { timeout },
    role,
    re,
    flags,
  )
  const el = handle.asElement()
  await el.click().catch(() => el.evaluate((node) => node.click()))
  await settle(page)
}
async function fill(page, label, value) {
  const el = await page.waitForSelector(`::-p-aria(${label})`, { timeout: 8000 })
  await el.click({ clickCount: 3 })
  await el.type(value)
}
const text = (page) => page.evaluate(() => document.body.innerText)
async function poll(fn, ms = 120000, every = 3000) {
  const end = Date.now() + ms
  for (;;) {
    const v = await fn()
    if (v) return v
    if (Date.now() > end) return null
    await wait(every)
  }
}

// ---------- Bước ----------
async function step(flow, name, fn) {
  if (only && !only.includes(flow)) return
  const started = Date.now()
  const before = issues.length
  try {
    const detail = await fn()
    results.push({
      flow,
      name,
      ok: true,
      ms: Date.now() - started,
      detail: detail ?? '',
      issues: issues.slice(before),
    })
    console.log(`✔ ${flow} ${name}${detail ? ` – ${detail}` : ''}`)
  } catch (e) {
    const shot = `flow-${flow}-${results.length}.png`
    for (const [who, p] of Object.entries(pages))
      await p.screenshot({ path: shot.replace('.png', `-${who}.png`) }).catch(() => {})
    results.push({
      flow,
      name,
      ok: false,
      ms: Date.now() - started,
      detail: e.message.slice(0, 300),
      shot,
      issues: issues.slice(before),
    })
    console.log(`✘ ${flow} ${name} – ${e.message.slice(0, 200)}`)
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

const ctx = {}
const eng = sql("select id from departments where code='ENG'")
const interviewer = sql("select id from users where email='interviewer@hireflow.dev'")

// ===== L1: HR tạo tin → tiêu chí → đăng =====
await step('L1', 'Tạo tin nháp qua dialog', async () => {
  const p = await as('hr')
  await go(p, '/manage/jobs?xem=job:new')
  ctx.title = `QA Phase1 ${stamp}`
  await fill(p, 'Tên vị trí', ctx.title)
  await p.select('#job-dept', eng).catch(async () => {
    const sel = await p.waitForSelector('::-p-aria(Phòng ban)')
    await sel.select(eng)
  })
  await fill(p, 'Địa điểm', 'Hà Nội')
  await fill(
    p,
    'Mô tả công việc',
    'Phát triển API NestJS, PostgreSQL, viết test và review code cho đội sản phẩm tuyển dụng.',
  )
  await click(p, 'Lưu nháp')
  const job = await poll(
    async () =>
      (await call('hr', 'GET', `/jobs?search=${encodeURIComponent(ctx.title)}`)).data?.[0],
    10000,
    1000,
  )
  assert(job, 'không thấy tin mới qua API')
  ctx.job = job.id
  assert(job.status === 'DRAFT', `trạng thái ${job.status}`)
  const url = p.url()
  assert(/criteria/.test(decodeURIComponent(url)), `không chuyển sang tab tiêu chí: ${url}`)
  return job.id
})
await step('L1', 'Thêm tiêu chí và lưu', async () => {
  const p = await as('hr')
  const t = await text(p)
  if (!/Tên tiêu chí 1/.test(await p.content())) await click(p, /Thêm tiêu chí/)
  await fill(p, 'Tên tiêu chí 1', 'NestJS')
  await fill(p, 'Từ khoá tiêu chí 1', 'NestJS')
  await p.keyboard.press('Enter')
  await click(p, 'Lưu tiêu chí')
  const reqs = await poll(
    async () => {
      const r = await call('hr', 'GET', `/jobs/${ctx.job}`)
      const list = r.data?.requirements ?? r.data?.currentRequirements ?? []
      return list.length ? list : null
    },
    10000,
    1000,
  )
  assert(reqs, 'API chưa có tiêu chí sau khi lưu')
  return `${reqs.length} tiêu chí${t.includes('Lưu tiêu chí') ? '' : ''}`
})
await step('L1', 'Đăng tin (xác nhận)', async () => {
  const p = await as('hr')
  await click(p, 'Đăng tin')
  await click(p, 'Đăng tin', { role: 'button' })
  const job = await poll(
    async () => {
      const r = await call('hr', 'GET', `/jobs/${ctx.job}`)
      return r.data?.status === 'OPEN' ? r.data : null
    },
    10000,
    1000,
  )
  assert(job, 'tin chưa OPEN')
  return 'OPEN'
})
await step('L1', 'Tin hiện trên trang công khai', async () => {
  const p = await as('guest')
  await go(p, '/jobs')
  assert((await text(p)).includes(ctx.title), 'không thấy tin trên /jobs')
})

// ===== L2: khách nộp CV =====
await step('L2', 'Nộp thiếu ô đồng ý bị chặn', async () => {
  const p = await as('guest')
  await go(p, `/jobs/${ctx.job}`)
  ctx.email = `qa.${stamp}@example.com`
  await fill(p, 'Họ tên', 'Nguyễn Văn Kiểm Thử')
  await fill(p, 'Email', ctx.email)
  await fill(p, 'Số điện thoại', '0912345678')
  const input = await p.$('form input[type=file]')
  assert(input, 'không có ô chọn tệp')
  assert(cvPath, 'thiếu CV_PATH')
  await input.uploadFile(cvPath)
  await click(p, 'Nộp hồ sơ')
  const t = await text(p)
  assert(/cần đồng ý/i.test(t), 'không báo lỗi khi chưa đồng ý')
})
await step('L2', 'Nộp hợp lệ → màn cảm ơn', async () => {
  const p = await as('guest')
  await p.click('form input[name=consent]')
  await click(p, 'Nộp hồ sơ')
  await wait(1500)
  const app = await poll(
    async () => {
      const r = await call('hr', 'GET', `/applications?jobId=${ctx.job}`)
      return (
        r.data?.find((a) => a.candidate?.email === ctx.email || a.email === ctx.email) ??
        r.data?.[0]
      )
    },
    15000,
    1500,
  )
  assert(app, 'API không có hồ sơ mới')
  ctx.app = app.id
  assert(
    (await text(p)).includes('Chúng tôi đã nhận hồ sơ của bạn'),
    'không có màn xác nhận đã nhận hồ sơ',
  )
  const t = (await text(p)).slice(0, 400)
  return `${app.id} · màn sau khi nộp: ${t.replace(/\s+/g, ' ').slice(0, 120)}`
})
await step('L2', 'Nộp trùng email vào cùng tin bị chặn', async () => {
  const p = await as('guest')
  await go(p, `/jobs/${ctx.job}`)
  await fill(p, 'Họ tên', 'Nguyễn Văn Kiểm Thử')
  await fill(p, 'Email', ctx.email)
  await fill(p, 'Số điện thoại', '0912345678')
  await (await p.$('form input[type=file]')).uploadFile(cvPath)
  await p.click('form input[name=consent]')
  await click(p, 'Nộp hồ sơ')
  await wait(1500)
  const n = Number(sql(`select count(*) from applications where job_id='${ctx.job}'`))
  const alert = await p.$$eval('[role=alert]', (a) => a.map((x) => x.textContent).join(' | '))
  assert(n === 1, `có ${n} hồ sơ trong tin`)
  return alert || '(không có alert)'
})

// ===== L3: AI chấm, thông báo, xếp hạng =====
await step('L3', 'AI chấm xong (PENDING → DONE)', async () => {
  const done = await poll(
    async () => {
      const r = await call('hr', 'GET', `/applications/${ctx.app}`)
      return ['DONE', 'FAILED'].includes(r.data?.aiStatus) ? r.data : null
    },
    180000,
    4000,
  )
  assert(done, 'quá 3 phút chưa chấm xong')
  ctx.ai = done.aiStatus
  assert(done.aiStatus === 'DONE', `aiStatus ${done.aiStatus}: ${done.aiError ?? ''}`)
  return `điểm ${done.matchScore ?? done.score ?? '?'}`
})
await step('L3', 'HR thấy thông báo CV chấm xong', async () => {
  const r = await call('hr', 'GET', '/notifications?limit=10')
  const list = r.data?.items ?? r.data ?? []
  const hit = list.find((n) => JSON.stringify(n).includes(ctx.app))
  assert(hit, 'không có thông báo cho hồ sơ này')
  return hit.type ?? ''
})
await step('L3', 'Dialog hồ sơ hiện mức phù hợp có bằng chứng', async () => {
  const p = await as('hr')
  await go(p, `/applications?xem=application:${ctx.app}`)
  await click(p, 'Mức phù hợp', { role: '[role=tab]' })
  const t = await text(p)
  assert(/NestJS/.test(t), 'không thấy tiêu chí NestJS trong tab Mức phù hợp')
})
await step('L3', 'Xếp hạng của tin có hồ sơ', async () => {
  const p = await as('hr')
  await go(p, `/manage/jobs/${ctx.job}/ranking`)
  assert((await text(p)).includes('Nguyễn Văn Kiểm Thử'), 'không thấy ứng viên trong xếp hạng')
})

// ===== L4: sàng lọc → phỏng vấn → phiếu → offer → HM duyệt =====
const advance = async (who, label) => {
  const p = await as(who)
  await go(p, `/applications/${ctx.app}`)
  await click(p, label)
  await click(p, label, { role: 'button' })
}
const statusOf = async () => (await call('hr', 'GET', `/applications/${ctx.app}`)).data?.status
await step('L4', 'HR chuyển sang Sàng lọc', async () => {
  await advance('hr', 'Chuyển sang Sàng lọc')
  const s = await poll(
    async () => ((await statusOf()) === 'SCREENING' ? 'SCREENING' : null),
    8000,
    800,
  )
  assert(s, `trạng thái ${await statusOf()}`)
})
await step('L4', 'HR chuyển sang Phỏng vấn', async () => {
  await advance('hr', 'Chuyển sang Phỏng vấn')
  const s = await poll(
    async () => ((await statusOf()) === 'INTERVIEW' ? 'INTERVIEW' : null),
    8000,
    800,
  )
  assert(s, `trạng thái ${await statusOf()}`)
})
await step('L4', 'HR đặt lịch, phân công Interviewer', async () => {
  const p = await as('hr')
  await go(p, `/applications/${ctx.app}`)
  await click(p, 'Phỏng vấn', { role: '[role=tab]' })
  await click(p, 'Đặt lịch phỏng vấn')
  const at = new Date(Date.now() + 2 * 86400000)
  at.setHours(9, 30, 0, 0)
  const local = new Date(at.getTime() - at.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  await p.$eval(
    '#iv-at',
    (el, v) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      set.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    local,
  )
  await fill(p, 'Địa điểm', 'Phòng họp tầng 5')
  await p.evaluate((email) => {
    const label = [...document.querySelectorAll('label')].find((l) => l.textContent.includes(email))
    label?.querySelector('input[type=checkbox]')?.click()
  }, accounts.interviewer)
  await click(p, /^Đặt lịch$|Lưu lịch|Tạo lịch/)
  const iv = await poll(
    async () =>
      sql(`select id from interviews where application_id='${ctx.app}' and status='SCHEDULED'`),
    8000,
    800,
  )
  assert(iv, 'không có buổi phỏng vấn trong DB')
  ctx.iv = iv
  const assigned = sql(`select count(*) from interview_assignees where interview_id='${iv}'`)
  assert(assigned === '1', `phân công ${assigned} người`)
  return iv
})
await step('L4', 'Interviewer thấy buổi trong lịch, phiếu chưa mở trước giờ', async () => {
  const p = await as('interviewer')
  await go(p, `/applications/${ctx.app}`)
  await click(p, 'Phỏng vấn', { role: '[role=tab]' }).catch(() => {})
  const t = await text(p)
  assert(
    /Phiếu đánh giá mở khi buổi phỏng vấn bắt đầu/.test(t),
    'không thấy thông báo phiếu chưa mở',
  )
})
await step('L4', 'Interviewer gửi phiếu sau giờ bắt đầu', async () => {
  sql(`update interviews set scheduled_at = now() - interval '30 minutes' where id='${ctx.iv}'`)
  const p = await as('interviewer')
  await go(p, `/applications/${ctx.app}`)
  await click(p, 'Phỏng vấn', { role: '[role=tab]' }).catch(() => {})
  await click(p, 'Gửi phiếu đánh giá')
  await p.evaluate(() => {
    for (const g of document.querySelectorAll('[role=radiogroup]')) {
      const opts = g.querySelectorAll('[role=radio], button')
      opts[3]?.click()
    }
  })
  await click(p, /^Gửi phiếu|^Lưu phiếu|^Gửi$/)
  const n = await poll(
    async () => {
      const v = sql(`select count(*) from interview_feedbacks where interview_id='${ctx.iv}'`)
      return v === '1' ? v : null
    },
    8000,
    800,
  )
  assert(n, 'chưa có phiếu trong DB')
})
await step('L4', 'HR chuyển sang Đề nghị', async () => {
  await advance('hr', 'Chuyển sang Đề nghị')
  const s = await poll(async () => ((await statusOf()) === 'OFFER' ? 'OFFER' : null), 8000, 800)
  assert(s, `trạng thái ${await statusOf()}`)
})
await step('L4', 'HR không có nút Duyệt nhận việc (BR-STS-04)', async () => {
  const p = await as('hr')
  await go(p, `/applications/${ctx.app}`)
  assert(!(await text(p)).includes('Duyệt nhận việc'), 'HR thấy Duyệt nhận việc')
})
await step('L4', 'HM duyệt nhận việc', async () => {
  await advance('hm', 'Duyệt nhận việc')
  const s = await poll(async () => ((await statusOf()) === 'HIRED' ? 'HIRED' : null), 8000, 800)
  assert(s, `trạng thái ${await statusOf()}`)
})

// ===== L5: từ chối có lý do → mở lại có lý do → ghi chú =====
await step('L5', 'Hồ sơ thứ hai qua API công khai', async () => {
  const fd = new FormData()
  const { readFileSync } = await import('node:fs')
  fd.append('fullName', 'Trần Thị Thử Hai')
  fd.append('email', `qa2.${stamp}@example.com`)
  fd.append('phone', '0987654321')
  fd.append('consent', 'true')
  fd.append(
    'cv',
    new Blob([readFileSync(cvPath)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    'cv.docx',
  )
  const res = await fetch(`${base}/api/v1/public/jobs/${ctx.job}/apply`, {
    method: 'POST',
    body: fd,
  })
  assert(res.status < 300, `HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  ctx.app2 = sql(
    `select a.id from applications a join candidates c on c.id=a.candidate_id where c.email='qa2.${stamp}@example.com'`,
  )
  assert(ctx.app2, 'không thấy hồ sơ 2')
})
await step('L5', 'Từ chối bắt buộc lý do', async () => {
  const p = await as('hr')
  await go(p, `/applications/${ctx.app2}`)
  await click(p, 'Từ chối hồ sơ')
  await click(p, 'Từ chối hồ sơ', { role: 'button' })
  assert(/Nhập lý do để tiếp tục/.test(await text(p)), 'không báo thiếu lý do')
  assert(
    sql(`select status from applications where id='${ctx.app2}'`) !== 'REJECTED',
    'đã từ chối khi chưa có lý do',
  )
  await fill(p, 'Lý do', 'Chưa đủ kinh nghiệm NestJS')
  await click(p, 'Từ chối hồ sơ', { role: 'button' })
  const s = await poll(
    async () => sql(`select status from applications where id='${ctx.app2}'`) === 'REJECTED',
    8000,
    800,
  )
  assert(s, 'chưa REJECTED')
})
await step('L5', 'Mở lại bắt buộc lý do → về Sàng lọc', async () => {
  const p = await as('hr')
  await go(p, `/applications/${ctx.app2}`)
  await click(p, 'Mở lại hồ sơ')
  await fill(p, 'Lý do', 'Ứng viên bổ sung kinh nghiệm')
  await click(p, 'Mở lại', { role: 'button' })
  const s = await poll(
    async () => sql(`select status from applications where id='${ctx.app2}'`) === 'SCREENING',
    8000,
    800,
  )
  assert(s, `trạng thái ${sql(`select status from applications where id='${ctx.app2}'`)}`)
})
await step('L5', 'Thêm ghi chú', async () => {
  const p = await as('hr')
  await go(p, `/applications/${ctx.app2}`)
  await click(p, 'Ghi chú', { role: '[role=tab]' })
  await fill(p, 'Ghi chú mới', 'Gọi lại vào thứ Hai')
  await click(p, 'Thêm ghi chú')
  const n = await poll(
    async () =>
      sql(`select count(*) from application_notes where application_id='${ctx.app2}'`) === '1',
    8000,
    800,
  )
  assert(n, 'chưa có ghi chú trong DB')
  assert((await text(p)).includes('Gọi lại vào thứ Hai'), 'ghi chú không hiện ngay')
})
await step('L5', 'Lịch sử trạng thái đủ 3 dòng có lý do', async () => {
  const rows = sql(
    `select count(*) from application_status_history where application_id='${ctx.app2}'`,
  )
  assert(Number(rows) >= 3, `chỉ có ${rows} dòng`)
  const p = await as('hr')
  await go(p, `/applications/${ctx.app2}`)
  await click(p, 'Lịch sử', { role: '[role=tab]' })
  const t = await text(p)
  assert(
    t.includes('Chưa đủ kinh nghiệm NestJS') && t.includes('Ứng viên bổ sung kinh nghiệm'),
    'lịch sử thiếu lý do',
  )
  return `${rows} dòng`
})

// ===== L11: đóng tin =====
await step('L11', 'Đóng tin, trang công khai không còn tin', async () => {
  const p = await as('hr')
  await go(p, `/manage/jobs?xem=job:${ctx.job}`)
  await click(p, 'Đóng tin')
  await click(p, 'Đóng tin', { role: 'button' })
  const s = await poll(
    async () => sql(`select status from jobs where id='${ctx.job}'`) === 'CLOSED',
    8000,
    800,
  )
  assert(s, 'tin chưa CLOSED')
  const g = await as('guest')
  await go(g, '/jobs')
  assert(!(await text(g)).includes(ctx.title), 'tin đã đóng vẫn hiện trên /jobs')
})

// ===== L4b: đổi lịch, gợi ý câu hỏi, huỷ buổi =====
await step('L4b', 'Đặt lịch qua API rồi đổi lịch qua UI', async () => {
  const openJob = sql(
    "select j.id from jobs j join departments d on d.id=j.department_id where j.status='OPEN' and d.code='ENG' and (j.deadline is null or j.deadline >= current_date) limit 1",
  )
  assert(openJob, 'không có tin ENG đang mở')
  const { readFileSync } = await import('node:fs')
  const fd = new FormData()
  fd.append('fullName', 'Lê Văn Phỏng Vấn')
  fd.append('email', `qa3.${stamp}@example.com`)
  fd.append('phone', '0977000111')
  fd.append('consent', 'true')
  fd.append(
    'cv',
    new Blob([readFileSync(cvPath)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    'cv.docx',
  )
  const ap = await fetch(`${base}/api/v1/public/jobs/${openJob}/apply`, {
    method: 'POST',
    body: fd,
  })
  assert(ap.status < 300, `nộp hồ sơ: HTTP ${ap.status}`)
  ctx.ivApp = sql(
    `select a.id from applications a join candidates c on c.id=a.candidate_id where c.email='qa3.${stamp}@example.com'`,
  )
  for (const st of ['SCREENING', 'INTERVIEW']) {
    const r = await call('hr', 'PATCH', `/applications/${ctx.ivApp}/status`, { status: st })
    assert(r.status < 300, `chuyển ${st}: ${r.status} ${r.code ?? ''}`)
  }
  const r = await call('hr', 'POST', `/applications/${ctx.ivApp}/interviews`, {
    scheduledAt: new Date(
      Date.now() +
        (4 + Math.floor(Math.random() * 20)) * 86400000 +
        Math.floor(Math.random() * 8) * 3600000,
    ).toISOString(),
    durationMinutes: 45,
    location: 'Online',
    interviewerIds: [interviewer],
  })
  assert(r.status < 300, `tạo lịch qua API: ${r.status} ${r.code ?? ''}`)
  ctx.iv2 = r.data.id
  const p = await as('hr')
  await go(p, `/applications/${ctx.ivApp}`)
  await click(p, 'Phỏng vấn', { role: '[role=tab]' })
  await click(p, 'Đổi lịch')
  await fill(p, 'Địa điểm', 'Phòng 302')
  await click(p, 'Lưu thay đổi')
  const ok = await poll(
    async () => sql(`select location from interviews where id='${ctx.iv2}'`) === 'Phòng 302',
    8000,
    800,
  )
  assert(ok, 'địa điểm chưa đổi')
})
await step('L4b', 'Gợi ý câu hỏi phỏng vấn (AI, không lộ điểm)', async () => {
  const p = await as('interviewer')
  await go(p, `/applications/${ctx.ivApp}`)
  await click(p, 'Phỏng vấn', { role: '[role=tab]' }).catch(() => {})
  await click(p, 'Gợi ý câu hỏi')
  const t = await poll(
    async () => {
      const v = (await text(p)).split('Gợi ý câu hỏi')[1] ?? ''
      return v.includes('?') ? v : null
    },
    60000,
    2000,
  )
  assert(t, 'không có câu hỏi sau 60 giây')
  assert(!/\d+\s*\/\s*100|điểm phù hợp/i.test(t), 'gợi ý có lộ điểm')
})
await step('L4b', 'Huỷ buổi phỏng vấn', async () => {
  const p = await as('hr')
  await go(p, `/applications/${ctx.ivApp}`)
  await click(p, 'Phỏng vấn', { role: '[role=tab]' })
  await click(p, 'Huỷ buổi')
  await click(p, /Huỷ buổi/, { role: 'button' })
  assert(/Nhập lý do để tiếp tục/.test(await text(p)), 'huỷ buổi không bắt buộc lý do')
  await fill(p, 'Lý do', 'Ứng viên xin dời lịch')
  await click(p, /Huỷ buổi/, { role: 'button' })
  const ok = await poll(
    async () => sql(`select status from interviews where id='${ctx.iv2}'`) === 'CANCELLED',
    8000,
    800,
  )
  assert(ok, `trạng thái ${sql(`select status from interviews where id='${ctx.iv2}'`)}`)
})

// ===== L6: CV không đọc được → nhập nội dung tay; hàng đợi AI =====
await step('L6', 'Nhập nội dung CV cho hồ sơ FAILED → chấm lại', async () => {
  // CV PDF trang trắng (giống ảnh scan) → AI không đọc được
  const openJob = sql(
    "select j.id from jobs j join departments d on d.id=j.department_id where j.status='OPEN' and d.code='ENG' and (j.deadline is null or j.deadline >= current_date) limit 1",
  )
  const { readFileSync } = await import('node:fs')
  const fd = new FormData()
  fd.append('fullName', 'Phạm Thị Ảnh Scan')
  fd.append('email', `qa4.${stamp}@example.com`)
  fd.append('phone', '0966000222')
  fd.append('consent', 'true')
  fd.append(
    'cv',
    new Blob([readFileSync(process.env.BLANK_PDF)], { type: 'application/pdf' }),
    'scan.pdf',
  )
  const ap = await fetch(`${base}/api/v1/public/jobs/${openJob}/apply`, {
    method: 'POST',
    body: fd,
  })
  assert(ap.status < 300, `nộp CV trắng: HTTP ${ap.status} ${(await ap.text()).slice(0, 120)}`)
  const id = sql(
    `select a.id from applications a join candidates c on c.id=a.candidate_id where c.email='qa4.${stamp}@example.com'`,
  )
  const failed = await poll(
    async () => sql(`select ai_status from applications where id='${id}'`) === 'FAILED',
    120000,
    3000,
  )
  assert(
    failed,
    `CV trắng không thành FAILED: ${sql(`select ai_status from applications where id='${id}'`)}`,
  )
  assert(id, 'không có hồ sơ FAILED để thử')
  ctx.failed = id
  const p = await as('hr')
  await go(p, `/applications/${id}`)
  await click(p, 'Nhập nội dung CV')
  await fill(
    p,
    'Nội dung CV',
    'Nguyễn Văn A. Backend Developer 4 năm kinh nghiệm NestJS, PostgreSQL, Redis, Docker. Dự án hệ thống tuyển dụng và thanh toán. Đại học Bách khoa Hà Nội.',
  )
  await click(p, 'Lưu và chấm điểm')
  const s = await poll(
    async () => {
      const v = sql(`select ai_status from applications where id='${id}'`)
      return v === 'DONE' || v === 'FAILED' ? v : null
    },
    120000,
    3000,
  )
  assert(s === 'DONE', `aiStatus ${s}`)
})
await step('L6', 'Hàng đợi AI (Admin) mở được', async () => {
  const p = await as('admin')
  await go(p, '/admin/ai-queue')
  assert(/Hàng đợi theo bước/.test(await text(p)), 'không thấy khối hàng đợi')
})

// ===== L7: gợi ý ứng viên cũ → mời vào tin =====
await step('L7', 'Mời ứng viên cũ vào tin', async () => {
  const jobs = (await call('hr', 'GET', '/jobs?status=OPEN&limit=50')).data ?? []
  let found
  for (const j of jobs) {
    const m = await call('hr', 'GET', `/jobs/${j.id}/matches`)
    const list = m.data?.items ?? m.data?.matches ?? m.data ?? []
    if (Array.isArray(list) && list.some((x) => !x.invited)) {
      found = j.id
      break
    }
  }
  assert(found, 'không tin nào có gợi ý chưa mời')
  const before = Number(sql(`select count(*) from applications where job_id='${found}'`))
  const p = await as('hr')
  await go(p, `/manage/jobs/${found}/matches`)
  await click(p, 'Mời vào tin')
  const after = await poll(
    async () => {
      const n = Number(sql(`select count(*) from applications where job_id='${found}'`))
      return n > before ? n : null
    },
    8000,
    800,
  )
  assert(after, 'chưa tạo hồ sơ mời')
  await settle(p)
  assert((await text(p)).includes('Đã mời'), 'thẻ không chuyển sang Đã mời')
  return `nguồn ${sql(`select source from applications where job_id='${found}' order by created_at desc limit 1`)}`
})

// ===== L8: kho ứng viên, hỏi AI, sửa liên hệ, ẩn danh =====
await step('L8', 'Tìm ứng viên theo kỹ năng trong CV (F-SEARCH-01)', async () => {
  const p = await as('hr')
  await go(p, '/candidates?in=cv')
  const box = await p.waitForSelector('::-p-aria(Tìm ứng viên theo kỹ năng trong CV)')
  await box.type('NestJS')
  const n = await poll(
    async () => {
      await settle(p)
      const k = await p.$$eval(
        'a',
        (a) => a.filter((x) => /Mở hồ sơ ứng tuyển/.test(x.textContent)).length,
      )
      return k || null
    },
    20000,
    1500,
  )
  assert(n, 'không có kết quả')
  return `${n} kết quả`
})
await step('L8', 'Hỏi AI về kho CV', async () => {
  const p = await as('hr')
  await go(p, '/ai-chat')
  const box = await p.waitForSelector('textarea')
  await box.type('Ai có kinh nghiệm NestJS và PostgreSQL?')
  await click(p, 'Gửi câu hỏi')
  const ok = await poll(
    async () => {
      const busy = await p.$('::-p-aria(Dừng)')
      const t = await text(p)
      return !busy && t.split('Ai có kinh nghiệm NestJS và PostgreSQL?')[1]?.trim().length > 40
        ? t
        : null
    },
    90000,
    3000,
  )
  assert(ok, 'không có câu trả lời sau 90 giây')
  const cites = await p.$$eval(
    'button[aria-label]',
    (b) => b.filter((x) => /nguồn|trích/i.test(x.getAttribute('aria-label'))).length,
  )
  return `${cites} trích dẫn`
})
await step('L8', 'Sửa số điện thoại ứng viên', async () => {
  ctx.cand = sql(`select candidate_id from applications where id='${ctx.app ?? ctx.failed}'`)
  const p = await as('hr')
  await go(p, `/candidates?xem=candidate:${ctx.cand}`)
  await click(p, 'Thông tin liên hệ', { role: '[role=tab]' })
  await fill(p, 'Số điện thoại', '0901234567')
  await click(p, 'Lưu thông tin liên hệ')
  const ok = await poll(
    async () => sql(`select phone from candidates where id='${ctx.cand}'`) === '0901234567',
    8000,
    800,
  )
  assert(ok, 'chưa lưu số điện thoại')
})
await step('L8', 'Admin ẩn danh ứng viên (xác nhận) → mất PII', async () => {
  const p = await as('admin')
  await go(p, `/candidates?xem=candidate:${ctx.cand}`)
  await click(p, 'Thông tin liên hệ', { role: '[role=tab]' }).catch(() => {})
  await click(p, 'Ẩn danh ứng viên')
  await click(p, 'Ẩn danh vĩnh viễn', { role: 'button' })
  const ok = await poll(
    async () =>
      sql(`select anonymized_at is not null from candidates where id='${ctx.cand}'`) === 't',
    8000,
    800,
  )
  assert(ok, 'chưa ẩn danh')
  const row = sql(
    `select full_name || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'') from candidates where id='${ctx.cand}'`,
  )
  assert(!/0901234567|@example\.com/.test(row), `còn PII: ${row}`)
  return row
})

// ===== L9 + L10: người dùng, phiên đăng nhập, phòng ban =====
const pickRole = (p, value) =>
  p.evaluate((v) => {
    const s = [...document.querySelectorAll('select')].find((x) =>
      [...x.options].some((o) => o.value === v),
    )
    const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    set.call(s, v)
    s.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
await step('L9', 'Admin tạo Interviewer', async () => {
  const p = await as('admin')
  await go(p, '/users')
  await click(p, 'Thêm người dùng')
  ctx.userEmail = `qa.user.${stamp}@hireflow.dev`
  await fill(p, 'Họ tên', 'Kiểm Thử Người Dùng')
  await fill(p, 'Email', ctx.userEmail)
  await fill(p, 'Mật khẩu', 'Kiemthu@2026')
  await pickRole(p, 'interviewer')
  await click(p, 'Tạo')
  ctx.user = await poll(
    async () => sql(`select id from users where email='${ctx.userEmail}'`),
    8000,
    800,
  )
  assert(ctx.user, 'chưa có user')
})
await step('L9', 'Tạo trùng email bị báo lỗi', async () => {
  const p = await as('admin')
  await go(p, '/users')
  await click(p, 'Thêm người dùng')
  await fill(p, 'Họ tên', 'Trùng Email')
  await fill(p, 'Email', ctx.userEmail)
  await fill(p, 'Mật khẩu', 'Kiemthu@2026')
  await pickRole(p, 'interviewer')
  await click(p, 'Tạo')
  await wait(1500)
  const t = await text(p)
  const n = sql(`select count(*) from users where email='${ctx.userEmail}'`)
  assert(n === '1', `có ${n} user cùng email`)
  assert(/đã (tồn tại|được dùng|có)|trùng/i.test(t), 'không báo trùng email trên form')
  await p.keyboard.press('Escape')
})
await step('L10', 'Người dùng mới đăng nhập, F5 vẫn giữ phiên', async () => {
  accounts.qa = ctx.userEmail
  const savedPassword = password
  const p = await (async () => {
    const ctxb = await browser.createBrowserContext()
    const page = await ctxb.newPage()
    page.on('pageerror', (e) => issues.push(`qa JS: ${e.message.slice(0, 160)}`))
    await page.goto(`${base}/login`)
    await page.waitForSelector('input[type=email]')
    await page.type('input[type=email]', ctx.userEmail)
    await page.type('input[type=password]', 'Kiemthu@2026')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 15000 })
    return page
  })()
  void savedPassword
  pages.qa = p
  await p.reload({ waitUntil: 'domcontentloaded' })
  await settle(p)
  assert(!p.url().includes('/login'), 'F5 bị đẩy về đăng nhập')
})
await step('L10', 'Đổi mật khẩu qua menu tài khoản', async () => {
  const p = pages.qa
  await click(p, /^Tài khoản/)
  await click(p, 'Đổi mật khẩu', { role: 'button,[role=menuitem]' })
  await fill(p, 'Mật khẩu hiện tại', 'Kiemthu@2026')
  await fill(p, 'Mật khẩu mới', 'Kiemthu@2027')
  await fill(p, 'Nhập lại mật khẩu mới', 'Kiemthu@2027')
  await click(p, 'Đổi mật khẩu', { role: 'button' })
  await wait(1500)
  const old = await call(null, 'POST', '/auth/login', {
    email: ctx.userEmail,
    password: 'Kiemthu@2026',
  })
  const neu = await call(null, 'POST', '/auth/login', {
    email: ctx.userEmail,
    password: 'Kiemthu@2027',
  })
  assert(old.status === 401 && neu.status === 200, `cũ ${old.status}, mới ${neu.status}`)
})
await step('L10', 'Admin khoá tài khoản → phiên đang mở bị đẩy ra', async () => {
  const p = await as('admin')
  await go(p, '/users')
  await click(p, 'Thao tác với Kiểm Thử Người Dùng')
  await click(p, 'Khoá tài khoản', { role: '[role=menuitem],button' })
  await click(p, 'Khoá tài khoản', { role: 'button' })
  const locked = await poll(
    async () => sql(`select is_active from users where id='${ctx.user}'`) === 'f',
    8000,
    800,
  )
  assert(locked, 'chưa khoá')
  const q = pages.qa
  await go(q, '/interviews')
  await wait(1500)
  const r = await call(null, 'POST', '/auth/login', {
    email: ctx.userEmail,
    password: 'Kiemthu@2027',
  })
  assert(q.url().includes('/login'), `user bị khoá vẫn ở ${q.url().replace(base, '')}`)
  return `đăng nhập lại: ${r.status} ${r.code ?? ''}`
})
await step('L10', 'Sai mật khẩu và email không tồn tại cùng một thông điệp', async () => {
  const a = await call(null, 'POST', '/auth/login', {
    email: 'hm.sales@hireflow.dev',
    password: 'Sai@12345',
  })
  const b = await call(null, 'POST', '/auth/login', {
    email: `khong.co.${stamp}@hireflow.dev`,
    password: 'Sai@12345',
  })
  assert(
    a.status === 401 && b.status === 401 && a.message === b.message,
    `${a.status}/${b.status} "${a.message}" vs "${b.message}"`,
  )
})
await step('L9', 'Xoá người dùng (xoá mềm)', async () => {
  const p = await as('admin')
  await go(p, '/users')
  await click(p, 'Thao tác với Kiểm Thử Người Dùng')
  await click(p, 'Xoá người dùng', { role: '[role=menuitem],button' })
  await click(p, 'Xoá người dùng', { role: 'button' })
  const ok = await poll(
    async () => sql(`select deleted_at is not null from users where id='${ctx.user}'`) === 't',
    8000,
    800,
  )
  assert(ok, 'chưa xoá mềm')
})
await step('L9', 'Tạo rồi xoá phòng ban', async () => {
  const p = await as('admin')
  await go(p, '/departments')
  await click(p, 'Thêm phòng ban')
  const name = `QA ${stamp}`
  await fill(p, 'Tên phòng ban', name)
  await fill(p, 'Mã', `QA_${stamp.slice(-5).toUpperCase()}`)
  await click(p, 'Lưu')
  const id = await poll(
    async () => sql(`select id from departments where name='${name}'`),
    8000,
    800,
  )
  assert(id, 'chưa tạo phòng ban')
  await go(p, '/departments')
  await click(p, `Thao tác với ${name}`)
  await click(p, 'Xoá phòng ban', { role: '[role=menuitem],button' })
  await click(p, 'Xoá phòng ban', { role: 'button' })
  const gone = await poll(
    async () => sql(`select deleted_at is not null from departments where id='${id}'`) === 't',
    8000,
    800,
  )
  assert(gone, 'chưa xoá')
})
await step('L10', 'Đăng xuất → không vào lại trang nội bộ', async () => {
  const p = await as('hm')
  await go(p, '/applications')
  await click(p, /^Tài khoản/)
  await click(p, 'Đăng xuất', { role: 'button,[role=menuitem]' })
  await wait(1500)
  await go(p, '/applications')
  assert(p.url().includes('/login'), `sau đăng xuất vẫn ở ${p.url().replace(base, '')}`)
})

// ===== L11: hàng loạt, xuất CSV, thông báo =====
await step('L11', 'Đổi trạng thái hàng loạt 2 hồ sơ NEW → Sàng lọc', async () => {
  const job = sql(
    "select job_id from applications where status='NEW' group by job_id having count(*)>=2 limit 1",
  )
  assert(job, 'không có tin nào có 2 hồ sơ NEW')
  const newCount = () =>
    Number(sql(`select count(*) from applications where job_id='${job}' and status='NEW'`))
  const before = newCount()
  const p = await as('hr')
  await go(p, `/applications?jobId=${job}&status=NEW`)
  const boxes = await p.$$('tbody input[type=checkbox]')
  assert(boxes.length >= 2, `chỉ có ${boxes.length} ô chọn`)
  await boxes[0].click()
  await boxes[1].click()
  await click(p, /^Chuyển 2 hồ sơ sang Sàng lọc$/)
  await click(p, /^Chuyển/, { role: 'button' }).catch(() => {})
  const after = await poll(async () => newCount() === before - 2, 8000, 800)
  assert(after, `NEW còn ${newCount()} (trước ${before})`)
})
await step('L11', 'Xuất CSV theo bộ lọc', async () => {
  const p = await as('hr')
  await go(p, '/applications')
  const res = p.waitForResponse((r) => r.url().includes('/applications/export'), { timeout: 15000 })
  await click(p, /Xuất CSV/)
  const r = await res
  assert(r.status() === 200, `HTTP ${r.status()}`)
  return r.headers()['content-type']
})
await step('L11', 'Chuông thông báo: Đã đọc hết', async () => {
  const p = await as('hr')
  await go(p, '/applications')
  await click(p, /Thông báo/)
  await click(p, 'Đã đọc hết')
  await wait(1500)
  const unread = sql(
    "select count(*) from notifications n join users u on u.id=n.user_id where u.email='hr@hireflow.dev' and n.read_at is null",
  )
  assert(unread === '0', `còn ${unread} chưa đọc`)
})

// ===== L12: phần tử chỉ hiện ở trạng thái đặc biệt (Phase 0 mục 2.3) =====
const engOpenJob = () =>
  sql(
    "select j.id from jobs j join departments d on d.id=j.department_id where j.status='OPEN' and d.code='ENG' and (j.deadline is null or j.deadline >= current_date) order by (select count(*) from applications a where a.job_id=j.id) desc limit 1",
  )
await step('L12', 'HR tải CV hộ từ dialog tin → Tạo hồ sơ', async () => {
  const job = engOpenJob()
  const before = Number(sql(`select count(*) from applications where job_id='${job}'`))
  const p = await as('hr')
  await go(p, `/manage/jobs?xem=job:${job}`)
  await click(p, 'Tải CV hộ ứng viên')
  await fill(p, 'Họ tên', 'Đỗ Văn Tải Hộ')
  await fill(p, 'Email', `qa5.${stamp}@example.com`)
  const input = await p.$('[role=dialog] input[type=file], dialog input[type=file]')
  assert(input, 'không có ô chọn tệp trong dialog')
  await input.uploadFile(cvPath)
  await click(p, 'Tạo hồ sơ')
  assert(/Cần xác nhận ứng viên đã đồng ý/.test(await text(p)), 'không bắt buộc xác nhận đồng ý')
  await p.evaluate(() => {
    const box = [...document.querySelectorAll('label')].find((l) => /đã đồng ý/.test(l.textContent))
    box?.querySelector('input[type=checkbox]')?.click()
  })
  await click(p, 'Tạo hồ sơ')
  const after = await poll(
    async () => Number(sql(`select count(*) from applications where job_id='${job}'`)) > before,
    10000,
    800,
  )
  assert(after, 'chưa có hồ sơ mới')
  return sql(
    `select source from applications where job_id='${job}' order by created_at desc limit 1`,
  )
})
await step('L12', 'So sánh 2 hồ sơ từ bảng', async () => {
  const job = engOpenJob()
  const p = await as('hr')
  await go(p, `/applications?jobId=${job}`)
  const boxes = await p.$$('tbody input[type=checkbox]')
  assert(boxes.length >= 2, `chỉ có ${boxes.length} hồ sơ`)
  await boxes[0].click()
  await boxes[1].click()
  await click(p, /^So sánh 2 hồ sơ$/)
  const ok = await poll(async () => /So sánh 2/.test(await text(p)), 10000, 800)
  assert(ok, 'không mở bảng so sánh')
  await p.keyboard.press('Escape')
  await click(p, 'Bỏ chọn').catch(() => {})
})
await step('L12', 'Hồ sơ kế tiếp / trước khi mở từ danh sách', async () => {
  const job = engOpenJob()
  const p = await as('hr')
  await go(p, `/applications?jobId=${job}`)
  const row = await p.$('tbody tr td:nth-child(3)')
  assert(row, 'bảng không có dòng')
  await row.click()
  await click(p, /Mở bàn duyệt CV/, { role: 'a' })
  await settle(p)
  const first = p.url()
  await click(p, /Hồ sơ kế tiếp/)
  const moved = await poll(async () => p.url() !== first, 6000, 500)
  assert(moved, 'nút Hồ sơ kế tiếp không đổi hồ sơ')
  await click(p, /Hồ sơ trước/)
  const back = await poll(async () => p.url().split('?')[0] === first.split('?')[0], 6000, 500)
  assert(back, 'nút Hồ sơ trước không quay lại')
})
await step('L12', 'Lịch phỏng vấn: tuần sau → tuần này', async () => {
  const p = await as('hr')
  await go(p, '/interviews')
  const before = await text(p)
  if (!/Tuần sau/.test(before)) await click(p, /Theo tuần|Tuần/).catch(() => {})
  await click(p, 'Tuần sau')
  const changed = await poll(async () => (await text(p)) !== before, 6000, 500)
  assert(changed, 'Tuần sau không đổi nội dung')
  await click(p, 'Tuần này')
})
await step('L12', 'Chat AI: Dừng khi đang trả lời', async () => {
  const p = await as('hr')
  await go(p, '/ai-chat')
  const box = await p.waitForSelector('textarea')
  await box.type('Liệt kê chi tiết mọi ứng viên có kinh nghiệm Docker kèm số năm kinh nghiệm')
  await click(p, 'Gửi câu hỏi')
  await click(p, 'Dừng', { timeout: 15000 })
  await wait(1500)
  const busy = await p.$('::-p-aria(Dừng)')
  assert(!busy, 'nút Dừng không dừng được luồng trả lời')
})
await step('L12', 'Hàng đợi AI: Chạy lại một hồ sơ lỗi', async () => {
  const p = await as('admin')
  await go(p, '/admin/ai-queue')
  const has = /Chạy lại/.test(await text(p))
  assert(has, 'không có hồ sơ lỗi nào để chạy lại')
  const res = p.waitForResponse((r) => /retry/.test(r.url()) && r.request().method() === 'POST', {
    timeout: 10000,
  })
  await click(p, /^Chạy lại$/)
  const r = await res
  assert(r.status() < 300, `HTTP ${r.status()}`)
})
await step('L12', 'Nhân bản tin từ dialog → tin nháp mới', async () => {
  const before = Number(sql("select count(*) from jobs where status='DRAFT'"))
  const p = await as('hr')
  await go(p, `/manage/jobs?xem=job:${engOpenJob()}`)
  await click(p, 'Nhân bản')
  const ok = await poll(
    async () => Number(sql("select count(*) from jobs where status='DRAFT'")) > before,
    8000,
    800,
  )
  assert(ok, 'chưa có tin nháp mới')
  return sql('select title from jobs order by created_at desc limit 1')
})
await step('L12', 'Màn hẹp 375px: mở và đóng menu', async () => {
  const p = await as('hr')
  await p.setViewport({ width: 375, height: 800 })
  await go(p, '/applications')
  await click(p, 'Mở menu')
  const open = await poll(async () => !!(await p.$('::-p-aria(Đóng menu)')), 4000, 300)
  assert(open, 'menu không mở')
  await click(p, 'Đóng menu')
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  await p.setViewport({ width: 1280, height: 900 })
  assert(overflow <= 0, `tràn ngang ${overflow}px`)
})

await browser.close()
writeFileSync(out, JSON.stringify({ stamp, ctx, results, issues }, null, 2))
const failed = results.filter((r) => !r.ok)
console.log(
  `\n${results.length - failed.length}/${results.length} bước đạt · ${issues.length} lỗi JS/5xx → ${out}`,
)
