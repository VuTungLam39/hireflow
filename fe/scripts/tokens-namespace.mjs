import { readFileSync, writeFileSync } from 'node:fs'

// Tailwind v4 cho --spacing-{xs..xl} đè max-w-{xs..xl} (max-w-md = 16px) → đổi namespace
const file = new URL('../src/styles/tokens.generated.css', import.meta.url)
writeFileSync(file, readFileSync(file, 'utf8').replaceAll('--spacing-', '--space-'))
