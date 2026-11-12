import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../src', import.meta.url))
const strict = process.argv.includes('--strict')

const rules = [
  {
    name: 'Màu thô Tailwind',
    re: /\b(bg|text|border|ring|divide|stroke|fill|decoration|accent|from|to|via|outline)-(slate|gray|zinc|stone|neutral|indigo|violet|purple|emerald|green|teal|lime|amber|yellow|orange|red|rose|blue|sky|cyan|pink|fuchsia)-[0-9]{2,3}\b/g,
  },
  { name: 'Mã màu hex trong feature', re: /#[0-9a-fA-F]{6}\b/g, skip: /\.css$/ },
  { name: 'Gradient', re: /\b(bg-gradient-to|bg-linear-to|radial-gradient|linear-gradient)\b/g },
  { name: 'Bóng ngoài shadow-float', re: /\bshadow-(?!float\b|none\b)[a-z0-9]+\b/g },
  {
    name: 'Animation vào trang',
    re: /\banimate-(slide-up|fade-in|grow-x|scale-in|bounce|ping)\b|\bstagger\b/g,
  },
  { name: 'Bo góc ngoài token', re: /\brounded-(lg|xl|2xl|3xl)\b/g },
  { name: 'Icon "AI"', re: /\b(Sparkles|Bot|Wand2?|Brain|Rocket|Zap)\b(?=[\s,}])/g },
  { name: 'Chữ dưới 12px', re: /\btext-\[(9|10|11)px\]/g },
  { name: 'Hoạ tiết nền', re: /\bbg-dots\b|\bbackdrop-blur/g },
  {
    name: 'Chữ "AI" trên giao diện',
    re: />[^<{]*\bAI\b[^<]*<|(?:label|title|description|placeholder|aria-label)[:=]\s*['"][^'"]*\bAI\b[^'"]*['"]/g,
  },
  // Rà soát UI/UX: chỉ cảnh báo, chưa chặn CI
  { name: 'Viền nhấn một bên (side-tab)', re: /\bborder-[lr]-(2|4|8|\[\d+px\])\b/g, advisory: true },
  { name: 'Chữ nghiêng', re: /\bitalic\b/g, advisory: true },
  { name: 'Font mono', re: /\bfont-mono\b/g, advisory: true },
  { name: 'Bo góc tuỳ ý', re: /\brounded-\[[^\]]+\]/g, advisory: true },
  { name: 'Ký tự thay icon', re: />\s*[★☆✓✔✕✖➜⚠🔥✨🚀]/gu, skip: /\.css$/, advisory: true },
]

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\.|[\\/](test|mocks)[\\/]/.test(p)) files.push(p)
  }
}
walk(root)

let failed = 0
const rows = []
for (const rule of rules) {
  let hits = 0
  const where = new Map()
  for (const file of files) {
    if (rule.skip?.test(file)) continue
    if (file.endsWith('index.css') && rule.name !== 'Gradient') continue
    const n = readFileSync(file, 'utf8').match(rule.re)?.length ?? 0
    if (n) {
      hits += n
      where.set(relative(root, file), n)
    }
  }
  if (!rule.advisory) failed += hits
  rows.push({ rule: rule.name, files: where.size, hits, ...(rule.advisory ? { mode: 'cảnh báo' } : {}) })
  if (hits && process.argv.includes('--verbose'))
    for (const [f, n] of where) console.log(`  ${rule.name}: ${f} (${n})`)
}

console.table(rows)
if (strict && failed) {
  console.error(`check-design: còn ${failed} vi phạm`)
  process.exit(1)
}
