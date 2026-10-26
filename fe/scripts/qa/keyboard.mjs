// Kickoff 6: dùng được bằng bàn phím trên các form chính
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL ?? 'http://localhost:8080'
const login = process.env.LOGIN_EMAIL ?? 'hr@hireflow.dev'
const cvPath = process.env.CV_PATH
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` – ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
})
const page = await browser.newPage()

const focused = () =>
  page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return ''
    const href = el.getAttribute('href')
    if (href?.startsWith('/jobs/')) return `link:${href}`
    return (
      el.getAttribute('name') ||
      el.getAttribute('aria-label') ||
      el.textContent?.trim().slice(0, 40) ||
      el.tagName.toLowerCase()
    )
  })

async function tabUntil(match, max = 40) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const name = await focused()
    if (match(name)) return name
  }
  return null
}

// 1. Nộp CV ở trang công khai
await page.goto(`${base}/jobs`, { waitUntil: 'networkidle0' })
const jobLink = await tabUntil((n) => n.startsWith('link:/jobs/'))
await page.keyboard.press('Enter')
await page.waitForSelector('input[name=fullName]')
check('Mở chi tiết job bằng Enter', !!jobLink, jobLink ?? '')

const order = []
for (const name of ['fullName', 'email', 'phone']) {
  const got = await tabUntil((n) => n === name)
  order.push(got)
  if (got)
    await page.keyboard.type(
      name === 'email'
        ? `kb-${Date.now()}@example.com`
        : name === 'phone'
          ? '0912345678'
          : 'Bàn Phím Thử',
    )
}
check('Tab tới họ tên, email, số điện thoại', order.every(Boolean), order.join(' → '))

const pickBtn = await tabUntil((n) => n === 'chọn từ máy')
let filePicked = false
if (pickBtn && cvPath) {
  const [chooser] = await Promise.all([
    page.waitForFileChooser({ timeout: 5000 }),
    page.keyboard.press('Enter'),
  ])
  await chooser.accept([cvPath])
  filePicked = await page
    .waitForFunction(() => /\.docx/i.test(document.body.innerText), { timeout: 5000 })
    .then(
      () => true,
      () => false,
    )
}
check('Chọn file CV bằng Enter trên nút "chọn từ máy"', filePicked)

const consent = await tabUntil((n) => n === 'consent')
if (consent) await page.keyboard.press('Space')
const consentChecked = await page.$eval('input[name=consent]', (el) => el.checked)
check('Tích ô đồng ý bằng Space', consentChecked)

const submit = await tabUntil((n) => /Nộp|Ứng tuyển|Gửi/.test(n))
if (submit) await page.keyboard.press('Enter')
const thanked = await page
  .waitForFunction(() => document.body.innerText.includes('Cảm ơn bạn đã ứng tuyển'), {
    timeout: 15000,
  })
  .then(
    () => true,
    () => false,
  )
check('Gửi hồ sơ bằng Enter', thanked, submit ?? 'không tới được nút gửi')

// 2. Đăng nhập
await page.goto(`${base}/login`, { waitUntil: 'networkidle0' })
await tabUntil((n) => n === 'email')
await page.keyboard.type(login)
await tabUntil((n) => n === 'password')
await page.keyboard.type(process.env.LOGIN_PASSWORD ?? 'Admin@123')
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle0' }),
  page.keyboard.press('Enter'),
])
check('Đăng nhập chỉ bằng Tab và Enter', !page.url().endsWith('/login'), page.url())

// 3. Tạo job
await page.goto(`${base}/manage/jobs/new`, { waitUntil: 'networkidle0' })
const fields = []
for (const name of ['title', 'departmentId', 'location', 'jdText']) {
  const got = await tabUntil((n) => n === name)
  fields.push(got)
  if (!got) continue
  if (name === 'departmentId') await page.keyboard.press('ArrowDown')
  else
    await page.keyboard.type(
      name === 'jdText'
        ? 'Mô tả công việc thử bằng bàn phím, đủ dài để qua kiểm tra độ dài tối thiểu của form.'
        : `Thử bàn phím ${name}`,
    )
}
check('Tab tới tiêu đề, phòng ban, địa điểm, JD', fields.every(Boolean), fields.join(' → '))
const create = await tabUntil((n) => /Tạo job|Lưu/.test(n))
if (create) await page.keyboard.press('Enter')
const created = await page
  .waitForFunction(() => /\/manage\/jobs\/[0-9a-f-]{36}\/edit/.test(location.pathname), {
    timeout: 10000,
  })
  .then(
    () => true,
    () => false,
  )
check('Tạo job bằng Enter', created, page.url())

// 4. Hộp thoại đổi trạng thái
await page.goto(`${base}/applications?status=NEW`, { waitUntil: 'networkidle0' })
const appLink = await page
  .$eval('main a[href^="/applications/"]', (a) => a.getAttribute('href'))
  .catch(() => null)
await page.goto(base + appLink, { waitUntil: 'networkidle0' })
const action = await tabUntil((n) => /Chuyển sang|Từ chối/.test(n))
if (action) await page.keyboard.press('Enter')
const opened = await page.waitForSelector('dialog[open]', { timeout: 5000 }).then(
  () => true,
  () => false,
)
await page.keyboard.press('Escape')
const closed = await page
  .waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5000 })
  .then(
    () => true,
    () => false,
  )
check(
  'Mở hộp thoại đổi trạng thái bằng Enter, đóng bằng Esc',
  !!action && opened && closed,
  action ?? '',
)

await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`${results.length - failed}/${results.length} đạt`)
process.exitCode = failed ? 1 : 0
