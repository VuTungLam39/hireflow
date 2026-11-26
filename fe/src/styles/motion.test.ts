/// <reference types="node" />
import { readFileSync } from 'node:fs'

// M-02 · accessibility contract: reduced motion chỉ opacity, ≤100 ms
it('reduced-motion fade lasts at most 100 ms', () => {
  const css = readFileSync('src/index.css', 'utf8')
  const reduced = css.slice(css.indexOf('prefers-reduced-motion: reduce'))
  const times = [...reduced.matchAll(/animation: fade-in (\d+)ms/g)].map((m) => Number(m[1]))
  expect(times.length).toBeGreaterThan(0)
  expect(Math.max(...times)).toBeLessThanOrEqual(100)
})
