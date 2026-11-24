# 10 — Motion & Interaction Audit (dimension J)

> Evidence: Phase 00 file 11 (keyframes, durations, reduced-motion), Phase 01 runtime keyboard/interaction checks.

## Result: no motion finding at P0–P2

- Motion is CSS-only (no animation library), short (100–300 ms, mostly 150 ms), with a global `prefers-reduced-motion` alternative (120 ms fade or none) and JS checks in CvSheet/RankingTable (SV). Consistent with D-11.
- Purposeful motion present: evidence highlight pulse (`marker-focus`) when jumping to a quote; streaming caret in AI chat; skeleton shimmer.
- Interaction strengths (RV): URL-synced quick view with focus return; Ctrl+K palette; slider keyboard support; density toggle.

## Observations carried to Phase 06 (not findings)

- The ranking weight change has no preview/animation of re-ordering; impeccable critique A suggests a live preview ("Xem trước – chưa lưu"). Recorded as a Phase 06/04 opportunity, not a defect.
- `marker-focus` behaviour under reduced motion was not exercised at runtime (source handles it).

Related interaction defects are filed under their primary dimension: F-07 (quick view lacks actions, file 06), F-13/F-18 (keyboard, file 09).
