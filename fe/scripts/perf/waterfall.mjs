import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1280, height: 900 },
})
for (const base of process.argv.slice(2)) {
  const runs = []
  const ctx = await browser.createBrowserContext()
  const login = await ctx.newPage()
  await login.goto(`${base}/login`, { waitUntil: 'networkidle0' })
  await login.type('input[name=email]', process.env.LOGIN_EMAIL ?? 'hr@hireflow.dev')
  await login.type('input[name=password]', 'Admin@123')
  await Promise.all([
    login.waitForNavigation({ waitUntil: 'networkidle0' }),
    login.click('button[type=submit]'),
  ])
  await login.close()
  for (let i = 0; i < 5; i++) {
    const page = await ctx.newPage()
    await page.goto(`${base}/`, { waitUntil: 'networkidle0' })
    const cdp = await page.createCDPSession()
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    })
    const times = {}
    cdp.on('Network.requestWillBeSent', (e) => {
      if (/ApplicationsPage-.*\.js/.test(e.request.url)) times.chunkStart ??= e.timestamp
      if (/\/api\/v1\/applications\?/.test(e.request.url)) times.apiStart ??= e.timestamp
      times.ids ??= {}
      times.ids[e.requestId] = e.request.url
    })
    cdp.on('Network.loadingFinished', (e) => {
      const url = times.ids?.[e.requestId] ?? ''
      if (/ApplicationsPage-.*\.js/.test(url)) times.chunkEnd ??= e.timestamp
      if (/\/api\/v1\/applications\?/.test(url)) times.apiEnd ??= e.timestamp
    })
    const clickAt = Date.now()
    await page.click('a[href="/applications"]')
    await page.waitForFunction(
      () =>
        location.pathname === '/applications' &&
        document.querySelector('main h1')?.textContent?.includes('Hồ sơ ứng tuyển') &&
        document.querySelectorAll('main a[href^="/applications/"]').length > 0,
      { timeout: 30000, polling: 10 },
    )
    const shown = Date.now() - clickAt
    const ms = (a) => Math.round((a - times.chunkStart) * 1000)
    runs.push({
      apiAfterChunkStart: ms(times.apiStart),
      chunkDone: ms(times.chunkEnd),
      apiDone: ms(times.apiEnd),
      shown,
    })
    await page.close()
  }
  await ctx.close()
  const med = (k) => [...runs.map((r) => r[k])].sort((a, b) => a - b)[2]
  console.log(
    JSON.stringify({
      base,
      apiStartAfterChunkStart: med('apiAfterChunkStart'),
      chunkDone: med('chunkDone'),
      apiDone: med('apiDone'),
      tableShownAfterClick: med('shown'),
    }),
  )
}
await browser.close()
