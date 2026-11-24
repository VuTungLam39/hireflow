# 14 — Performance Baseline

> Phase 00 · Workstream I · Lighthouse 12.8.2 via temporary `npx -y lighthouse@12` (downloaded to the npm cache, **not** added to the project), default mobile emulation, **single run per page** on 2026-11-24 — treat as indicative; variance not measured. Internal pages BLK.

## 1. Results (RV)

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Speed Index | TTFB (root doc) | Transfer |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/jobs` | 97 | 100 | 100 | 100 | 1.5 s | 1.5 s | 110 ms | 0.09 | 1.5 s | 70 ms | 501 KiB |
| `/companies` | 81 | 100 | 100 | 100 | 2.8 s | 2.8 s | 140 ms | 0 | 9.4 s | 530 ms | 477 KiB |
| `/login` | 76 | 100 | 100 | **63** | 4.0 s | 4.0 s | 60 ms | 0.001 | 4.8 s | 50 ms | 506 KiB |

## 2. Observations

- `/jobs` is prerendered and fast; `/login` (not prerendered, CSR) has LCP 4.0 s on emulated mobile.
- `/companies` Speed Index 9.4 s vs LCP 2.8 s — late visual completion (likely logo images); to investigate in Phase 01.
- `/login` SEO 63 — likely generic title "HireFlow" / indexability; not a redesign blocker.
- CLS 0.09 on `/jobs` — near the 0.1 threshold (hydration replacing stale prerender counts is a plausible cause — file 09).
- API cold start (Render free) not captured: the API was warm during runs. Bundle-level analysis (`build:profile`, `scripts/perf/*`) not run (no build performed in this read-only phase).

## 3. Internal critical routes (RV, Playwright Navigation Timing, desktop, warm API, signed in as HR — indicative only)

| Route | DOMContentLoaded | Resources | Transfer (cache-warm) | Time to content |
|---|---|---|---|---|
| CR-06 `/` | 113 ms | 65 | 14 KB | — |
| CR-07 `/manage/jobs` | **4,847 ms** (first hit in session) | 51 | 11 KB | — |
| CR-08 `/applications` | 106 ms | 53 | 15 KB | — |
| CR-11 `/candidates` | 159 ms | 53 | 9 KB | — |
| CR-09 `/applications/:id` | — | — | — | heading visible ≈1.6 s |
| CR-10 ranking | — | — | — | table visible ≈1.3 s |

Limitations: SPA navigations after the first load reuse cached chunks, so transfer sizes are not cold-load figures; Lighthouse was not run with authentication; Render cold start was not captured (API warm). The 4.8 s outlier on `/manage/jobs` needs re-measurement in Phase 01 before being treated as a finding.

## 4. Raw reports

Lighthouse JSON kept outside the repo (session scratchpad); re-run command: `npx -y lighthouse@12 <url> --only-categories=performance,accessibility,best-practices,seo --output=json`.
