import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

// GLOSSARY "Thuật ngữ giao diện" – danh sách Avoid (Phase 03 file 09, DL-08, DL-11)
const VI = 'À-ỹ'
const uiWord = (w) => new RegExp(`[${VI}]\\S*\\s+${w}\\b|\\b${w}\\s+[^\\s'"\`]*[${VI}]`)
const PUBLIC = /^(features[\\/]public-jobs|prerender)[\\/]|^app[\\/]layouts[\\/]Public/
// Văn bản pháp lý/chính sách ngoài phạm vi guard (quyết định chủ dự án 24/11/2026)
const LEGAL = /PrivacyPolicyPage\.tsx$/

export const rules = [
  { name: 'Đề nghị (OFFER)', re: /Đề nghị/ },
  { name: 'Đã nhận (HIRED)', re: /Đã nhận(?! việc| hồ sơ)/ },
  { name: 'điểm AI', re: /điểm AI/i },
  { name: 'bằng chứng', re: /bằng chứng/i },
  { name: 'Xếp hạng ứng viên', re: /Xếp hạng ứng viên/ },
  { name: 'offer viết thường', re: uiWord('offer') },
  { name: 'feedback (Phiếu đánh giá)', re: uiWord('feedback') },
  { name: 'nhận xét (Phiếu đánh giá)', re: /nhận xét phỏng vấn|phiếu nhận xét|gửi nhận xét/i },
  { name: 'việc làm sau đăng nhập', re: /[Vv]iệc làm/, scope: 'internal' },
  { name: 'nhãn nội bộ trên trang công khai', re: /Tin tuyển dụng|\bOffer\b/, scope: 'public' },
]

export const stripComments = (line) => {
  const t = line.trim()
  if (/^(\/\/|\/\*|\*)/.test(t)) return ''
  return line.replace(/\{\/\*.*?\*\/\}/g, '').replace(/(^|\s)\/\/.*$/, '$1')
}

export const scan = (rel, text) => {
  const pub = PUBLIC.test(rel)
  const hits = []
  text.split('\n').forEach((raw, i) => {
    const line = stripComments(raw)
    for (const r of rules) {
      if (r.scope === 'internal' && pub) continue
      if (r.scope === 'public' && !pub) continue
      if (r.re.test(line)) hits.push({ rule: r.name, line: i + 1, text: raw.trim() })
    }
  })
  return hits
}

const selfTest = () => {
  const names = (rel, s) => scan(rel, s).map((h) => h.rule)
  assert.deepEqual(names('x.tsx', "label: 'Đề nghị'"), ['Đề nghị (OFFER)'])
  assert.deepEqual(names('x.tsx', "label: 'Đã nhận việc'"), [])
  assert.deepEqual(names('features/public-jobs/x.tsx', "'Đã nhận hồ sơ'"), [])
  assert.deepEqual(names('x.tsx', "label: 'Đã nhận'"), ['Đã nhận (HIRED)'])
  assert.deepEqual(names('x.tsx', '// Đề nghị trong comment'), [])
  assert.deepEqual(names('x.tsx', '<p>Tạo offer mới</p>'), ['offer viết thường'])
  assert.deepEqual(names('x.tsx', 'const offer = useOffer(id)'), [])
  assert.deepEqual(names('x.tsx', 'iv.feedbacks.map((f) => f)'), [])
  assert.deepEqual(names('x.tsx', "'Việc làm'"), ['việc làm sau đăng nhập'])
  assert.deepEqual(names('features/public-jobs/x.tsx', "'Việc làm'"), [])
  assert.deepEqual(names('features/public-jobs/x.tsx', "'Tin tuyển dụng'"), [
    'nhãn nội bộ trên trang công khai',
  ])
  assert.deepEqual(names('x.tsx', "'Có căn cứ bị loại'"), [])
}

const main = () => {
  selfTest()
  const root = fileURLToPath(new URL('../src', import.meta.url))
  const baselinePath = fileURLToPath(new URL('./check-terms.baseline.json', import.meta.url))
  const files = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (
        /\.tsx?$/.test(name) &&
        !/\.test\.|[\\/](test|mocks)[\\/]|lib[\\/]terms\.ts$/.test(p) &&
        !LEGAL.test(p)
      )
        files.push(p)
    }
  }
  walk(root)

  const counts = {}
  const report = []
  for (const f of files) {
    const rel = relative(root, f).replaceAll('\\', '/')
    for (const h of scan(rel, readFileSync(f, 'utf8'))) {
      const key = `${rel} :: ${h.rule}`
      counts[key] = (counts[key] ?? 0) + 1
      report.push({ key, ...h, rel })
    }
  }

  // shortcut: baseline giữ vi phạm cũ; mỗi slice dựng lại màn hình thì xoá dòng tương ứng
  if (process.argv.includes('--update-baseline')) {
    const sorted = Object.fromEntries(Object.entries(counts).sort())
    writeFileSync(baselinePath, JSON.stringify(sorted, null, 2) + '\n')
    console.log(`Đã ghi baseline: ${Object.keys(sorted).length} mục`)
    return
  }

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
  const over = Object.entries(counts).filter(([k, n]) => n > (baseline[k] ?? 0))
  const stale = Object.entries(baseline).filter(([k, n]) => (counts[k] ?? 0) < n)
  for (const [k] of over)
    for (const h of report.filter((r) => r.key === k))
      console.error(`${h.rel}:${h.line}  [${h.rule}]  ${h.text}`)
  if (stale.length)
    console.log(
      `Baseline thừa ${stale.length} mục (đã sửa) – chạy: node scripts/check-terms.mjs --update-baseline`,
    )
  if (over.length || stale.length) process.exit(1)
  console.log(
    `Thuật ngữ: không có vi phạm mới (${Object.keys(baseline).length} mục cũ trong baseline)`,
  )
}

main()
