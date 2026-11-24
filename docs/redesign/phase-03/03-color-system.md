# 03 — Color System

Tokens: `colors.*` in `fe/DESIGN.md`. All ratios computed (WCAG 2.x relative luminance) on 24/11/2026; the design.md lint `contrast-ratio` rule passes for every component pair.

## Hierarchies
- **Brand:** primary `#1F4E79` (action), marker family (evidence identity).
- **Neutral:** background → surface → surface-sunken; foreground → muted-foreground; border → border-strong.
- **Status:** success / warning / danger; info uses primary.
- **Surface hierarchy:** page (background) < working surface (surface) < tinted header/active nav (surface-sunken) < overlays (surface + overlay shadow).
- **Text:** foreground (primary text), muted-foreground (secondary, meta). No third text tone.
- **Border:** border (decorative separators) · border-strong (control outlines, ≥3:1).
- **Focus:** 2 px focus-ring `#1F4E79` with 2 px offset; ≥7:1 against every surface.
- **Disabled:** opacity 0.5 on the whole control + `aria-disabled`/`disabled`; disabled text is exempt from contrast but must keep its label.

## Verified pairs
| Pair | Ratio | Requirement |
|---|---|---|
| foreground / background | 16.2 | text ≥4.5 |
| foreground / surface | 17.2 | text |
| muted-foreground / background · surface · surface-sunken | 6.4 · 6.8 · 5.8 | text |
| on-primary / primary · primary-hover | 8.7 · 11.6 | text |
| primary / background · surface-sunken | 8.2 · 7.5 | link text |
| on-danger / danger | 6.5 | text |
| success / surface · background | 5.1 · 4.8 | text |
| warning / surface · background | 5.4 · 5.1 | text |
| danger / surface · background | 6.5 · 6.2 | text |
| foreground / marker · marker-soft | 10.9 · 14.3 | text on evidence fill |
| marker-ink / surface · background | 5.1 · 4.8 | dot border (UI ≥3) |
| border-strong / surface · background | 3.65 · 3.8 | control boundary (UI ≥3) |
| marker / surface | 1.6 | **fails as indicator alone → always with marker-ink border + number** |
| border / surface | 1.3 | decorative only |

## Status is never colour alone
Every status, score band and match state renders its terminology label (GLOSSARY "Thuật ngữ giao diện"); criterion dots carry their number; icons are paired with text. Phase 02 lesson: the marker dot at 1.6:1 was fixed with a border, which is now a token (`criterion-dot-border`).
