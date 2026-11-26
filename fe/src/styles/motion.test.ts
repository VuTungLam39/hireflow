/// <reference types="node" />
import { readFileSync } from 'node:fs'

// M-02
it('reduced-motion fade lasts at most 100 ms', () => {
  const css = readFileSync('src/index.css', 'utf8')
  const reduced = css.slice(css.indexOf('prefers-reduced-motion: reduce'))
  const times = [...reduced.matchAll(/animation: fade-in (\d+)ms/g)].map((m) => Number(m[1]))
  expect(times.length).toBeGreaterThan(0)
  expect(Math.max(...times)).toBeLessThanOrEqual(100)
  for (const selector of [
    'dialog[open]::backdrop',
    '.animate-fade-in',
    '.animate-overlay-in',
    '.animate-overlay-sheet',
  ])
    expect(reduced).toContain(selector)
})

// M-05
it.each([
  ['overlay-in', 150],
  ['overlay-sheet', 200],
])('%s fades for %i ms', (name, ms) => {
  const css = readFileSync('src/index.css', 'utf8')
  expect(css).toContain(`--animate-${name}: fade-in ${ms}ms`)
})
