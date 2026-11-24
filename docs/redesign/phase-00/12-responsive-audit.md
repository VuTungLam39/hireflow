# 12 — Responsive Audit (baseline)

> Phase 00 · Workstream I · Public pages RV via Playwright; internal BLK. Viewports measured: 320, 360, 390, 430, 768, 1440. Real-device usage data: not available (no analytics in repo — SV).

## 1. Findings (RV)

| ID | Route | Widths | Observation | Evidence |
|---|---|---|---|---|
| R-01 | All `PublicLayout` pages | 320, 360 | Header links overlap: "Việc làm"×"Nhà tuyển dụng" and "Công ty"×"Nhà tuyển dụng" (bounding boxes intersect) | Playwright bbox check; `CR-01-jobs--default--390.png` |
| R-02 | All `PublicLayout` pages | 390, 430 | "Công ty" overlaps "Nhà tuyển dụng" | same; visible in screenshot |
| R-03 | All `PublicLayout` pages | 768 | no overlap | bbox check |
| R-04 | `/jobs` | 320–1440 | no horizontal page scroll | `scrollWidth ≤ innerWidth` |
| R-05 | `/jobs` mobile | 390 | job rows stack well; filters wrap to 2–3 rows above the fold | screenshot |

## 2. Existing assets (SV, not run)

`fe/scripts/qa/responsive.mjs`, `fe/docs/qa-responsive.md` — an earlier responsive QA exists; its results were not re-run in this phase.

## 3. Internal app (RV, 390 vs 1440, HR + platform_admin)

| ID | Route | Observation |
|---|---|---|
| R-06 | all internal | Rail collapses to hamburger at 390; topbar keeps search icon, bell, avatar — no overlap observed |
| R-07 | CR-08 `/applications` | Table becomes card list; tabs scroll horizontally with edge arrow; four filter dropdowns wrap to two rows above the first record |
| R-08 | CR-09 detail | Two panes stack; CV sheet below the score column (long scroll to reach evidence) |
| R-09 | CR-10 ranking, CR-11, CR-12 | 390 screenshots captured; not yet reviewed in detail — mobile table density/overflow to be judged in Phase 01 |

Tablet/laptop breakpoints (768/1024/1280) for internal pages not captured — secondary per D-07.
