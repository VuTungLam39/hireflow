import { writeFile } from 'node:fs/promises'
import { startFlow } from 'lighthouse'
import puppeteer from 'puppeteer-core'
const [, , outDir, ...targets] = process.argv
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const rows = []
for (const t of targets) {
  const [label, url, login] = t.split('|')
  const page = await browser.newPage()
  if (login) {
    const origin = new URL(url).origin
    await page.goto(`${origin}/login`, { waitUntil: 'networkidle0' })
    await page.type('input[name=email]', login)
    await page.type('input[name=password]', 'Admin@123')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type=submit]'),
    ])
  }
  const runs = []
  for (let i = 0; i < 3; i++) {
    const flow = await startFlow(page, {
      config: {
        extends: 'lighthouse:default',
        settings: { onlyCategories: ['performance', 'seo'], disableStorageReset: !!login },
      },
    })
    await flow.navigate(url)
    const lhr = (await flow.createFlowResult()).steps[0].lhr
    const a = lhr.audits
    runs.push({
      perf: lhr.categories.performance.score * 100,
      seo: lhr.categories.seo.score * 100,
      fcp: a['first-contentful-paint'].numericValue,
      lcp: a['largest-contentful-paint'].numericValue,
      tbt: a['total-blocking-time'].numericValue,
      si: a['speed-index'].numericValue,
    })
    if (i === 2) await writeFile(`${outDir}/${label}.html`, await flow.generateReport())
  }
  const med = (k) => [...runs.map((r) => r[k])].sort((x, y) => x - y)[1]
  rows.push({
    label,
    url,
    perf: med('perf'),
    seo: med('seo'),
    fcp: Math.round(med('fcp')),
    lcp: Math.round(med('lcp')),
    tbt: Math.round(med('tbt')),
    si: Math.round(med('si')),
  })
  console.log(JSON.stringify(rows.at(-1)))
  await page.close()
}
await browser.close()
