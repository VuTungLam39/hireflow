// F-PUB-04
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')
const apiUrl = process.env.PRERENDER_API_URL?.trim()
const strict = process.env.PRERENDER_STRICT === 'true'

if (!apiUrl) {
  console.log('[prerender] PRERENDER_API_URL trống, bỏ qua (trang công khai chạy CSR)')
  process.exit(0)
}

const started = performance.now()
try {
  await build({
    root,
    logLevel: 'warn',
    build: { ssr: 'src/prerender/entry.tsx', outDir: ssrDir, emptyOutDir: true },
  })
  const { prerenderPublicPages } = await import(pathToFileURL(join(ssrDir, 'entry.js')).href)
  const pages = await prerenderPublicPages({
    apiUrl,
    siteUrl:
      process.env.PRERENDER_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`),
  })

  const template = await readFile(join(distDir, 'index.html'), 'utf8')
  if (
    !template.includes('<div id="root"></div>') ||
    !template.includes('<title>HireFlow</title>')
  ) {
    throw new Error('dist/index.html không có <div id="root"></div> hoặc <title>HireFlow</title>')
  }

  for (const page of pages) {
    const html = template
      .replace('<title>HireFlow</title>', page.head)
      .replace(
        '<div id="root"></div>',
        `<div id="root">${page.html}</div>\n    <script>${page.payload}</script>`,
      )
    const target = join(distDir, page.file)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, html)
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(
    `[prerender] ${pages.length} trang công khai trong ${seconds}s → dist/jobs.html, dist/jobs/*.html`,
  )
} catch (error) {
  console.error(`[prerender] lỗi: ${error instanceof Error ? error.message : error}`)
  if (strict) process.exit(1)
  console.warn('[prerender] tiếp tục build không prerender (PRERENDER_STRICT=true để báo lỗi)')
} finally {
  await rm(ssrDir, { recursive: true, force: true })
}
