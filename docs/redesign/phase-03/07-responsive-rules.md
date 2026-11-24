# 07 — Responsive Rules (testable)

Check widths: 320 · 360 · 390 · 430 · 768 · 1024 · 1280 · 1440. Every rule below is written so a Playwright check can assert it.

## Posture (DL-18)
| Surface | Design start | Floor |
|---|---|---|
| Public / candidate (`/jobs`, `/jobs/:id`, `/companies*`, `/applications/track`, apply) | 360 px mobile-first | 320 px |
| Internal (HR, HM, Interviewer, Admin, Quản trị sàn) | 1280 px desktop-first | 390 px |

## Global rules (all routes, all widths)
- R1 `document.documentElement.scrollWidth <= innerWidth` (no page h-scroll) — RR-02.
- R2 No overlapping bounding boxes among header controls, buttons, badges, h1 (Phase 02 concept check) — RR-01.
- R3 Interactive targets ≥24 px; ≥44 px when `(pointer: coarse)`.
- R4 Text ≥12 px; body ≥14 px internal, ≥16 px public.

## Internal at 390 px (floor)
- R5 Core read flows usable: open list → open hồ sơ → see Mức phù hợp, criteria and each Căn cứ (one tap per criterion) → see status.
- R6 Navigation via compact Rail (menu button → Sheet).
- R7 Tables become stacked cards; no hidden identity.
- R8 Dense desktop features (saved views, column chooser, bulk bar) may be absent; decision action still reachable in detail.

## Table degradation (DataTable)
- T1 Priority 4 columns hide first, then priority 3, by **container** width.
- T2 Priority 2 columns relocate into the identity cell's secondary line before hiding.
- T3 Priority 1 never hides.
- T4 Applications list at 1024 viewport fits its container with zero container overflow (Phase 02 concept: 918/918).
- T5 <600 px container → card layout.

## SplitLayout
≥1280 side by side (2:3) · 768–1279 narrow list + detail · <768 separate list and detail routes with Back.

## Public header
≤430 px: logo + single menu button; no overlap at 320–430 (F-01).

## Overlays
Dialog and Sheet go full-screen <600 px; Popover-based filters become a Sheet <600 px.

## Images and media
Company logos have fixed aspect boxes with fallback initials (F-09 logo failure); gallery images lazy-load with dimensions to avoid layout shift.
