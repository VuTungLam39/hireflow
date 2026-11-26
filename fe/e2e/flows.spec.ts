/// <reference types="node" />
import { expect, test } from '@playwright/test'
import { login, publicIds } from './support'

// P8 · 8c · F01, F02, F04: GHI DỮ LIỆU, chỉ chạy trên bản sao DB (01-test-strategy.md)
test.skip(!process.env.E2E_FLOWS, 'đặt E2E_FLOWS=1 khi backend trỏ vào bản sao DB')

const PASSWORD = process.env.E2E_PASSWORD ?? 'Admin@123'
const MAILPIT = 'http://localhost:8025/api/v1'

function pdf(text: string) {
  const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets = objects.map((body, i) => {
    const at = out.length
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
    return at
  })
  const xref = out.length
  out += `xref\n0 6\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(out)
}

test('F01: sai mật khẩu, đăng nhập, đăng xuất, trang nội bộ đòi đăng nhập lại', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('hr@hireflow.dev')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('sai-mat-khau-1A')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/5173\/$/)
  await page.reload()
  await expect(page.locator('h1')).toBeVisible()
  await page.getByRole('button', { name: /^Tài khoản/ }).click()
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto('/applications')
  await expect(page).toHaveURL(/\/login/)
})

test('F02: khách nộp CV, nhận email theo dõi, rút hồ sơ', async ({ page }) => {
  const { jobId, jobTitle } = await publicIds(page)
  const email = `p8-${Date.now()}@example.com`
  await page.goto(`/jobs/${jobId}`)
  await page.locator('#apply-name').fill('Ứng viên kiểm thử')
  await page.locator('#apply-email').fill(email)
  await page.locator('#apply-phone').fill('0912345678')
  await page.locator('input[type=file]').setInputFiles({
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    buffer: pdf('NestJS TypeScript PostgreSQL 3 years experience'),
  })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Nộp hồ sơ' }).click()
  await expect(page.getByText(/đã được tiếp nhận/)).toBeVisible()

  let link = ''
  await expect
    .poll(
      async () => {
        const found = await (await page.request.get(`${MAILPIT}/search?query=to:${email}`)).json()
        if (!found.messages?.length) return ''
        const message = await (
          await page.request.get(`${MAILPIT}/message/${found.messages[0].ID}`)
        ).json()
        link = /\/applications\/track#t=[^\s"<)]+/.exec(message.Text)?.[0] ?? ''
        return link
      },
      { timeout: 60_000 },
    )
    .not.toBe('')

  await page.goto(link)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(jobTitle)
  await page.getByRole('button', { name: 'Rút hồ sơ' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Rút hồ sơ' }).click()
  await expect(page.getByText('Đã rút hồ sơ').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rút hồ sơ' })).toHaveCount(0)
})

test('F04: HR chuyển Sàng lọc rồi Từ chối kèm lý do', async ({ page }) => {
  const api = await login(page, 'hr@hireflow.dev')
  const [application] = await api('/applications?status=NEW&limit=1')
  expect(application, 'không có hồ sơ Mới').toBeTruthy()
  await page.goto(`/applications/${application.id}`)
  const change = page.getByRole('button', { name: 'Chuyển trạng thái' })
  const dialog = page.getByRole('alertdialog')

  await change.click()
  await dialog.getByLabel('Trạng thái mới').selectOption('SCREENING')
  await dialog.getByRole('button', { name: 'Xác nhận' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('main')).toContainText('Sàng lọc')

  await change.click()
  await dialog.getByLabel('Trạng thái mới').selectOption('REJECTED')
  const confirm = dialog.getByRole('button', { name: 'Xác nhận từ chối' })
  await confirm.click()
  await expect(dialog, 'thiếu lý do phải giữ hộp thoại').toBeVisible()
  await dialog.getByRole('button', { name: 'Chưa đủ kinh nghiệm' }).click()
  await dialog.getByRole('textbox', { name: 'Ghi chú' }).fill('Kiểm thử Phase 08')
  await confirm.click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Hồ sơ đã ở trạng thái kết thúc.')).toBeVisible()
})
