import { readFileSync, writeFileSync } from 'node:fs'

// Token DESIGN.md sống ở namespace riêng (-v2-) để không đè token cũ cùng tên;
// --spacing-{xs..xl} còn bị Tailwind v4 dùng cho max-w-{xs..xl} → đưa hẳn ra khỏi namespace spacing.
const file = new URL('../src/styles/tokens.generated.css', import.meta.url)
const css = readFileSync(file, 'utf8')
  .replace(/--(color|font-weight|font|text|radius|tracking|leading)-/g, '--$1-v2-')
  .replaceAll('--spacing-', '--space-v2-')
writeFileSync(file, css)
