/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync('src/index.css', 'utf8')
const tokens = Object.fromEntries(
  [...css.matchAll(/--duration-(\w+): (\d+)ms;/g)].map((m) => [m[1], Number(m[2])]),
)
const animations = Object.fromEntries(
  [...css.matchAll(/--animate-([\w-]+): [\w-]+ (\S+)/g)].map((m) => [m[1], m[2]]),
)
const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : [join(dir, e.name)],
  )

// M-07
it('defines the 100/150/200 ms duration tokens', () => {
  expect(tokens).toEqual({ fast: 100, base: 150, slow: 200 })
})

// M-05, M-07
it.each([
  ['float-in', 'base'],
  ['fade-in', 'base'],
  ['overlay-in', 'base'],
  ['overlay-sheet', 'slow'],
  ['slide-in-right', 'slow'],
  ['slide-in-left', 'slow'],
  ['slide-in-up', 'slow'],
])('%s uses the %s token', (name, token) => {
  expect(animations[name]).toBe(`var(--duration-${token})`)
})

// DD-12
it('keeps marker-focus at 300 ms', () => {
  expect(animations['marker-focus']).toBe('300ms')
})

// M-07 · DD-12
it('nothing lasts longer than 200 ms except the named exceptions', () => {
  const allowed = ['skeleton', 'progress', 'caret', 'marker-focus']
  const slow = Object.entries(animations)
    .filter(([name, value]) => !allowed.includes(name) && !value.startsWith('var(--duration-'))
    .map(([name]) => `--animate-${name}`)

  for (const file of sources('src').filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))) {
    const source = readFileSync(file, 'utf8')
    const found = source.matchAll(/\bduration-(\d+)|\bduration-\[|\banimate-\[|\bMOVE_MS = (\d+)/g)
    for (const [match, utility, move] of found)
      if (!(Number(utility ?? move) <= 200)) slow.push(`${file}: ${match}`)
    // DD-12
    for (const [match, name] of source.matchAll(/\banimate-([a-z][a-z-]*)/g))
      if (!['spin', 'none', ...Object.keys(animations)].includes(name))
        slow.push(`${file}: ${match}`)
    for (const [match] of source.matchAll(
      /\[(transition|animation)[:-]|(duration|animate)-\(|\bdelay-[\d[(]|(transition|animation)Duration/g,
    ))
      slow.push(`${file}: ${match}`)
  }
  for (const file of sources('src').filter((f) => f.endsWith('.css'))) {
    const raw = readFileSync(file, 'utf8').matchAll(
      /^\s*(transition|animation)(-duration|-delay)?:.*\d(ms|s)\b.*$|@apply[^;]*\b(duration|delay)-.*$/gm,
    )
    for (const [line] of raw) slow.push(`${file}: ${line.trim()}`)
  }
  expect(slow).toEqual([])
})

// M-02
it('reduced motion replaces entrance animations with a fade of the fast token', () => {
  const reduced = css.slice(css.indexOf('prefers-reduced-motion: reduce'))
  expect(reduced).toContain('animation: fade-in var(--duration-fast) linear both !important')
  for (const selector of [
    'dialog[open]::backdrop',
    '.animate-fade-in',
    '.animate-overlay-in',
    '.animate-overlay-sheet',
  ])
    expect(reduced).toContain(selector)
})

// M-02
it('reduced motion caps transitions at the fast token, only where a transition exists', () => {
  const reduced = css.slice(css.indexOf('prefers-reduced-motion: reduce'))
  const rule = /([^{}]+)\{\s*transition-duration: var\(--duration-fast\) !important;/.exec(reduced)
  expect(rule?.[1]).toContain("[class*='transition']::after")
  expect(rule?.[1]).not.toMatch(/(^|,)\s*\*/)
})
