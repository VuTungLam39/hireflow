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
// Khớp MEDIA_KEY ở be/src/modules/company/media.rules.ts
const MEDIA_PATH = /\/api\/v1\/public\/media\/([0-9a-f]{64}\.(?:jpg|png|webp))/g
const siteUrl = (
  process.env.PRERENDER_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '')
).replace(/\/$/, '')

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
  const { prerenderPublicPages, buildSitemap } = await import(
    pathToFileURL(join(ssrDir, 'entry.js')).href
  )
  const pages = await prerenderPublicPages({
    apiUrl,
    siteUrl: siteUrl || undefined,
  })

  const template = await readFile(join(distDir, 'index.html'), 'utf8')
  if (
    !template.includes('<div id="root"></div>') ||
    !template.includes('<title>HireFlow</title>')
  ) {
    throw new Error('dist/index.html không có <div id="root"></div> hoặc <title>HireFlow</title>')
  }

  const mediaFiles = new Set()
  for (const page of pages) {
    const html = template
      .replace('<title>HireFlow</title>', page.head)
      .replace(
        '<div id="root"></div>',
        `<div id="root">${page.html}</div>\n    <script>${page.payload}</script>`,
      )
      // P3-F6: HTML đã đủ nội dung, nhường băng thông cho CSS và ảnh; hydrate tải JS sau một vòng mạng
      .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
    for (const [, file] of html.matchAll(MEDIA_PATH)) mediaFiles.add(file)
    const target = join(distDir, page.file)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, html)
  }

  // P3-F6: ảnh của trang công khai thành file tĩnh cùng đường dẫn, Vercel phục vụ trước rewrite nên mọi vùng CDN có sẵn
  // shortcut: chép mọi ảnh trang công khai vào bản build, đủ ở quy mô demo; khi build quá nặng thì chuyển ảnh sang CDN riêng
  const mediaDir = join(distDir, 'api', 'v1', 'public', 'media')
  await mkdir(mediaDir, { recursive: true })
  let copied = 0
  for (const file of mediaFiles) {
    const res = await fetch(`${apiUrl}/public/media/${file}`).catch(() => null)
    if (!res?.ok) {
      console.warn(`[prerender] không tải được ảnh ${file}, giữ qua rewrite`)
      continue
    }
    await writeFile(join(mediaDir, file), Buffer.from(await res.arrayBuffer()))
    copied++
  }
  console.log(`[prerender] ${copied}/${mediaFiles.size} ảnh công khai thành file tĩnh`)

  if (siteUrl) {
    await writeFile(join(distDir, 'sitemap.xml'), buildSitemap(pages, siteUrl))
    const robots = await readFile(join(distDir, 'robots.txt'), 'utf8')
    await writeFile(
      join(distDir, 'robots.txt'),
      `${robots.trimEnd()}\nSitemap: ${siteUrl}/sitemap.xml\n`,
    )
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(
    `[prerender] ${pages.length} trang công khai trong ${seconds}s → dist/jobs.html, dist/jobs/*.html, dist/companies.html, dist/companies/*.html`,
  )
} catch (error) {
  console.error(`[prerender] lỗi: ${error instanceof Error ? error.message : error}`)
  if (strict) process.exit(1)
  console.warn('[prerender] tiếp tục build không prerender (PRERENDER_STRICT=true để báo lỗi)')
} finally {
  await rm(ssrDir, { recursive: true, force: true })
}
