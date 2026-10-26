import puppeteer from 'puppeteer-core'
const out = process.argv[2]
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
})
for (const [name, url] of [
  ['csr-no-js', 'http://localhost:4185/jobs'],
  ['prerender-no-js', 'http://localhost:4173/jobs'],
]) {
  const page = await browser.newPage()
  await page.setJavaScriptEnabled(false)
  await page.goto(url, { waitUntil: 'networkidle0' })
  const info = await page.evaluate(() => ({
    rootChars: document.getElementById('root').innerHTML.length,
    text: document.getElementById('root').innerText.slice(0, 80).replace(/\s+/g, ' '),
    links: document.querySelectorAll('#root a').length,
  }))
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name, JSON.stringify(info))
  await page.close()
}
await browser.close()
