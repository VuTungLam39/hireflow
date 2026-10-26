import puppeteer from 'puppeteer-core'
const [, , base, jobId, cpu = '1', changes = '20', scroll = '0.5'] = process.argv
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
})
const page = await browser.newPage()
await page.goto(`${base}/login`, { waitUntil: 'networkidle0' })
await page.type('input[name=email]', process.env.LOGIN_EMAIL ?? 'hr01@perf.local')
await page.type('input[name=password]', 'Admin@123')
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle0' }),
  page.click('button[type=submit]'),
])
await page.goto(`${base}/manage/jobs/${jobId}/ranking`, { waitUntil: 'networkidle0' })
await page.waitForSelector('tbody tr')
await page.evaluate(
  (f) => window.scrollTo(0, (document.body.scrollHeight - innerHeight) * f),
  Number(scroll),
)
await new Promise((r) => setTimeout(r, 500))
const client = await page.createCDPSession()
await client.send('Emulation.setCPUThrottlingRate', { rate: Number(cpu) })
const info = await page.evaluate(() => ({
  rowsInDom: document.querySelectorAll('tbody tr[data-index], tbody tr:not([aria-hidden])').length,
  sliders: document.querySelectorAll('input[type=range]').length,
}))
const results = []
for (let i = 0; i < Number(changes); i++) {
  const r = await page.evaluate(async (i) => {
    const sliders = [...document.querySelectorAll('input[type=range]')]
    const el = sliders[i % sliders.length]
    const next = String(((Number(el.value) + (i % 2 ? 1 : 0)) % 3) + 1)
    window.__HIREFLOW_PROFILE__ = { samples: [], renders: {} }
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, next)
    const t0 = performance.now()
    el.dispatchEvent(new Event('input', { bubbles: true }))
    const sync = performance.now() - t0
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r)))
    const paint = performance.now() - t0
    const started = performance.now()
    let last = 0
    let quietSince = performance.now()
    while (performance.now() - started < 15000) {
      await new Promise((r) => setTimeout(r, 25))
      const n = window.__HIREFLOW_PROFILE__.samples.length
      if (n !== last) {
        last = n
        quietSince = performance.now()
      } else if (n > 0 && performance.now() - quietSince > 200) break
    }
    const s = window.__HIREFLOW_PROFILE__.samples
    const done = s.length ? Math.min(...s.map((x) => x.commitTime)) - t0 : 0
    return {
      sync,
      paint,
      done,
      renderMs: s.reduce((a, x) => a + x.actualDuration, 0),
      commits: s.length,
      rows: window.__HIREFLOW_PROFILE__.renders.RankingRow ?? 0,
    }
  }, i)
  results.push(r)
}
const pct = (arr, p) => {
  const a = [...arr].sort((x, y) => x - y)
  return a[Math.min(a.length - 1, Math.ceil((p / 100) * a.length) - 1)]
}
const f = (k, d = 1) =>
  `${pct(
    results.map((r) => r[k]),
    50,
  ).toFixed(d)} / ${pct(
    results.map((r) => r[k]),
    95,
  ).toFixed(d)}`
console.log(
  JSON.stringify({
    base,
    cpu,
    scroll,
    ...info,
    n: results.length,
    block: f('sync'),
    nextPaint: f('paint'),
    tableDone: f('done'),
    renderMs: f('renderMs'),
    rows: f('rows', 0),
    commits: f('commits', 0),
  }),
)
await browser.close()
