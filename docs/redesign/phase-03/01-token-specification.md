# 01 — Token Specification

Source of truth: `fe/DESIGN.md` (design.md format, lint-passing). This file explains; if they disagree, DESIGN.md wins and this file is corrected [D-04].

## Three layers
| Layer | Where it lives | Rule |
|---|---|---|
| **Primitive** | table below (raw values); in code only inside the generated theme file | never referenced by components directly |
| **Semantic** | `colors`, `typography`, `rounded`, `spacing` in DESIGN.md (named by role) | the only layer feature code uses |
| **Component** | `components` in DESIGN.md | only where a component genuinely needs a fixed combination (31 entries; each maps to a contract in file 05) |

The design.md format stores colours as hex and allows references only inside `components`; the primitive→semantic mapping is therefore recorded here and enforced in Phase 05 by generating the theme with `designmd export --format css-tailwind` (Tailwind v4 is already the project's CSS engine).

## Primitive palette → semantic mapping
| Primitive | Hex | Semantic token(s) |
|---|---|---|
| paper-50 | `#FAF8F4` | background |
| white | `#FFFFFF` | surface, on-primary, on-danger |
| paper-100 | `#F3EEE3` | surface-sunken |
| paper-200 | `#E4DFD6` | border |
| stone-500 | `#8C857A` | border-strong |
| stone-700 | `#5F5B54` | muted-foreground |
| ink-900 | `#1C1B19` | foreground |
| blue-700 | `#1F4E79` | primary, focus-ring (info badges use primary) |
| blue-800 | `#173B5C` | primary-hover |
| marker-400 | `#F2C94C` | marker |
| marker-200 | `#FBE9B3` | marker-soft |
| marker-800 | `#8A6A00` | marker-ink |
| green-700 | `#2E7D4F` | success |
| amber-800 | `#9A5B00` | warning |
| red-700 | `#B3261E` | danger |

## Scales
- **Spacing** (4 px unit): xxs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32 · xxl 48.
- **Radius:** sm 4 · md 6 · lg 8 · full.
- **Border width:** 1 px default; 2 px for focus ring and criterion-dot border.
- **Shadow:** `overlay` 0 8px 24px rgba(28,27,25,.16); `raised` 0 1px 0 border.
- **Z-index:** base 0 · sticky 10 · popover 30 · overlay (sheet/dialog) 40 · toast 50.
- **Motion (CSS/WAAPI only):** duration fast 100 ms, base 150 ms, slow 200 ms; easing standard `cubic-bezier(.2,0,0,1)`, exit `cubic-bezier(.4,0,1,1)`. Reduced motion → opacity only, ≤100 ms.
- **Breakpoints (container-first):** 360 / 600 / 768 / 1024 / 1100 / 1280 / 1440.
Shadow, z-index, motion and breakpoints are not part of the design.md token schema (alpha); they are normative here and in DESIGN.md prose (Elevation & Depth, Layout, Components).

## Dark mode
None [D-09]. Semantic names are role-based so a dark set can be added as a second mapping of the same semantic names; no dark values are defined.
