import { readFileSync, writeFileSync } from 'node:fs'
const [, , input, outDir] = process.argv
const rows = readFileSync(input, 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l))
const name = {
  4181: 'A · ngây thơ',
  4182: 'B · memo + useDeferredValue',
  4183: 'C · B + virtualization',
}
const p50 = (s) => Number(s.split(' / ')[0])
const p95 = (s) => Number(s.split(' / ')[1])
const panels = [
  { key: 'block', title: 'Chặn luồng chính sau khi kéo (ms)' },
  { key: 'nextPaint', title: 'Đến khung hình kế tiếp (ms)' },
  { key: 'tableDone', title: 'Bảng hiện thứ hạng mới (ms)', target: 100 },
  { key: 'rows', title: 'Số dòng RankingRow render lại' },
]
const C = {
  surface: '#fcfcfb',
  ink: '#0b0b0b',
  ink2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  bar: '#2a78d6',
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const fmt = (v) =>
  v >= 100
    ? Math.round(v).toLocaleString('vi-VN')
    : v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
for (const cpu of ['1', '4']) {
  const data = rows
    .filter((r) => r.cpu === cpu)
    .map((r) => ({ label: name[new URL(r.base).port], r }))
  const W = 760,
    labelW = 210,
    panelH = 132,
    top = 64,
    barH = 22,
    gap = 8,
    right = 70
  const H = top + panels.length * panelH + 20
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif">`
  svg += `<rect width="${W}" height="${H}" fill="${C.surface}"/>`
  svg += `<text x="16" y="28" font-size="16" font-weight="600" fill="${C.ink}">Bảng xếp hạng 1.107 hồ sơ – kéo trọng số (trung vị 20 lần, CPU ×${cpu})</text>`
  svg += `<text x="16" y="48" font-size="12" fill="${C.ink2}">Số liệu từ React Profiler API (bản build profiling). Vạch chấm: mục tiêu &lt; 100ms của US-05.</text>`
  panels.forEach((p, i) => {
    const y0 = top + i * panelH
    const vals = data.map((d) => p50(d.r[p.key]))
    const max = Math.max(...vals, p.target ?? 0) * 1.08 || 1
    const plotW = W - labelW - right - 16
    const sx = (v) => labelW + (v / max) * plotW
    svg += `<text x="16" y="${y0 + 16}" font-size="13" font-weight="600" fill="${C.ink}">${esc(p.title)}</text>`
    const by = y0 + 28
    svg += `<line x1="${labelW}" x2="${labelW}" y1="${by - 4}" y2="${by + 3 * (barH + gap)}" stroke="${C.axis}" stroke-width="1"/>`
    data.forEach((d, j) => {
      const y = by + j * (barH + gap)
      const v = vals[j]
      const w = Math.max(2, sx(v) - labelW)
      svg += `<text x="${labelW - 8}" y="${y + barH / 2 + 4}" font-size="12" text-anchor="end" fill="${C.ink2}">${esc(d.label)}</text>`
      svg += `<path d="M${labelW},${y} h${w - 4} a4,4 0 0 1 4,4 v${barH - 8} a4,4 0 0 1 -4,4 h${-(w - 4)} z" fill="${C.bar}"><title>${esc(d.label)}: ${fmt(v)} (p95 ${fmt(p95(d.r[p.key]))})</title></path>`
      svg += `<text x="${labelW + w + 6}" y="${y + barH / 2 + 4}" font-size="12" fill="${C.ink}">${fmt(v)}</text>`
    })
    if (p.target) {
      const x = sx(p.target)
      svg += `<line x1="${x}" x2="${x}" y1="${by - 6}" y2="${by + 3 * (barH + gap) - 2}" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="3 3"/>`
      svg += `<text x="${x + 4}" y="${by - 8}" font-size="11" fill="${C.muted}">100ms</text>`
    }
  })
  svg += '</svg>\n'
  writeFileSync(`${outDir}/ranking-profiler-cpu${cpu}x.svg`, svg)
}
console.log('ok')
