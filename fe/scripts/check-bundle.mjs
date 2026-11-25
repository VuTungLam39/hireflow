import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// SG-04 · R4: bản build công khai không được chứa mật khẩu/email tài khoản seed
const dist = fileURLToPath(new URL('../dist', import.meta.url))
const FORBIDDEN = ['Admin@123', '@hireflow.dev']

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(js|html|map)$/.test(name)) files.push(p)
  }
}
walk(dist)

const hits = files.flatMap((f) => {
  const text = readFileSync(f, 'utf8')
  return FORBIDDEN.filter((s) => text.includes(s)).map((s) => `${relative(dist, f)}: ${s}`)
})
if (hits.length) {
  console.error(`check-bundle: tìm thấy dữ liệu tài khoản seed trong bản build\n${hits.join('\n')}`)
  process.exit(1)
}
console.log(`check-bundle: ${files.length} tệp, không có dữ liệu tài khoản seed`)
