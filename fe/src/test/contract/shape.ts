export type ShapeDiffKind = 'missing' | 'type' | 'extra'

export class ShapeDiff {
  readonly kind: ShapeDiffKind
  readonly path: string
  readonly detail: string

  constructor(kind: ShapeDiffKind, path: string, detail: string) {
    this.kind = kind
    this.path = path
    this.detail = detail
  }

  toString() {
    return `${this.path}: ${this.detail}`
  }
}

const kindOf = (v: unknown) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v)

/** So cấu trúc `actual` (BE) với `expected` (mock); null ở một bên được coi là nullable */
export function diffShape(expected: unknown, actual: unknown, path = '$'): ShapeDiff[] {
  const e = kindOf(expected)
  const a = kindOf(actual)
  if (e === 'null' || a === 'null' || e === 'undefined') return []
  if (a === 'undefined') return [new ShapeDiff('missing', path, 'BE thiếu')]
  if (e !== a) return [new ShapeDiff('type', path, `mock ${e} ≠ BE ${a}`)]

  if (e === 'array') {
    const [x] = expected as unknown[]
    const [y] = actual as unknown[]
    return x === undefined || y === undefined ? [] : diffShape(x, y, `${path}[]`)
  }
  if (e !== 'object') return []

  const exp = expected as Record<string, unknown>
  const act = actual as Record<string, unknown>
  const out: ShapeDiff[] = []
  for (const key of Object.keys(exp)) {
    out.push(...diffShape(exp[key], act[key], `${path}.${key}`))
  }
  for (const key of Object.keys(act)) {
    if (!(key in exp)) out.push(new ShapeDiff('extra', `${path}.${key}`, 'BE trả thêm'))
  }
  return out
}
