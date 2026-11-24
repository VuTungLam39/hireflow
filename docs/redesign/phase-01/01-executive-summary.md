# 01 — Executive Summary (Phase 01 UX/UI Audit)

> 2026-11-24 · `main` @ `04ac5b7` · live https://hireflow-gray-zeta.vercel.app · actors: Guest/Candidate, HR, Hiring Manager, Interviewer, Admin, platform_admin (all verified in Phase 00).
> Labels: RV = Runtime-verified, SV = Source-verified, DO = Documented-only.

## 1. Headline

HireFlow's core HR workflow (find application → read evidence-backed CV review → decide) is **fast and structurally sound**: automated checks are clean (axe 0 violations on 27 page×actor combinations; impeccable detector 0 findings), permission and scope behaviour match the BE table 70/70. The problems are concentrated in **three areas**:

1. **Public mobile shell** — the header navigation overlaps at 320–430 px on every public page (F-01, **P1**, the only P1).
2. **Feedback and state integrity** — stale prerendered public content that also hides loading/error states (F-02), CV-review errors that surface only after ~3.6 s of retries (F-08), terminology drift between status labels, filters and the glossary (F-14…F-16).
3. **Explainability outside the CV page** — the differentiator (verbatim evidence) is strong on CV review but weak elsewhere: unlabeled criterion marks on ranking, no "why" affordance on mobile ranking, quick-view dialog without decision actions, public pages that never surface the explainable-score idea (F-05, F-06, F-07, F-11).

**Findings by severity (verified): P0 = 0 · P1 = 1 · P2 = 12 · P3 = 11 · total 24.** Security observations are not rated here; they are routed to the Security Gate (SG-F1…F4, file 12 §3).

## 2. Baseline task metrics [D-08] — current product

**Method:** scripted Playwright runs on production (desktop 1440, warm API, Chromium), 3 runs each, average reported. Time = system/interaction time from the task's start screen to the success condition, **excluding human reading/think time** (no human participants in this phase). Steps = user actions (clicks/typing) and URL changes. Data: live demo dataset (DL-06).

| Task | Definition used | Success condition | Avg time (3 runs) | Steps | Notes |
|---|---|---|---|---|---|
| **T1** | HR finds and opens one specific application ("Đỗ Minh Khôi") from `/applications` | Quick-view dialog shows "Mức phù hợp" | **1.02 s** (1076 / 989 / 995 ms) | 2 actions (type name in search, open row); 0 page navigations (URL gains `?search=`) | Search is server-side and URL-synced |
| **T2** | HR views a CV and records one evaluation | — | **Not measured as defined**: recording an evaluation (status change / phiếu) is a production write — not performed | — | See proxy |
| **T2-proxy** | From T1's dialog → "Mở bàn duyệt CV" → full CV review with evidence highlights and the decision control visible | ≥1 `<mark>` evidence visible **and** "Chuyển sang Sàng lọc" visible | **0.95 s** for the CV-review step (960 / 936 / 939 ms); T1+T2-proxy ≈ **2.0 s** | T1 + 1 action (open full review) = **3 actions**, 1 navigation | Quick-view dialog has quotes but **no** marks in CV and **no** decision buttons (F-07) |
| **T3** | Guest filters `/jobs` by company "Ví Mây", opens "Backend Engineer (Payments)", then opens the company page | `/companies/vi-may` heading visible | **2.26 s** (2350 / 2012 / 2416 ms), fresh context each run | 3 clicks; 5 URL changes | First-visit (no cache) |

Phase 04 thresholds should use the **step counts** as the primary baseline (robust) and the times as an upper bound for system latency; human-timed walkthroughs in Phase 04 will add think time.

## 3. Phase 00 reference timings re-measured

| Item | Phase 00 | Phase 01 (3 runs) | Verdict |
|---|---|---|---|
| `/manage/jobs` first load | 4.8 s (1 run) | cold (no cache) **0.88 s** to rows (884/915/831), DCL ≈ 0.25 s, 338 KB; warm 0.54–1.79 s | **Not reproduced** → P01-14 rejected (one-off cold start) |
| CV review to content | ≈1.6 s | **0.95 s** to first evidence mark | consistent/faster |
| Ranking table | ≈1.3 s | not re-measured (no regression signal) | carried as reference |
| `/companies` Lighthouse perf | 81 (SI 9.4 s) | **97–100** (SI 1.1 s) | Phase 00 outlier not reproduced |
| `/login` Lighthouse perf | 76 | **87–89** (LCP 3.1 s) | improved/variance; still slowest public page |

## 4. Tool-assisted audit summary [D-03, D-05]

- **impeccable critique** (dual sub-agent; 6 targets): heuristic totals /jobs 23/32, /companies 23/32, /companies/vi-may 21/32, ranking 26/36, CV review 31/40, dashboard 24/28. Every item was cross-checked against source/workflow; several were **downgraded** (file 12 §4).
- **impeccable audit** (technical, file 09 §5): 15/20 — Good.
- **impeccable detect** on `fe/src`: **0 findings** (exit 0) → Phase 08 consistency baseline (scanner sanity-checked on a planted violation).
- **axe-core 4.10.2**: 0 violations — public 6 pages (Phase 00) + internal 21 page×actor checks in Phase 01.
- **Lighthouse 12.8.2**, 3 runs × 6 public critical routes: perf 79–100, a11y 100 everywhere.

## 5. What Phase 02/03 must take from this

See file 13 (redesign requirements RR-01…RR-16) — the most important: mobile-first public shell; one job-row and one table system; explainability visible wherever a score appears; decision actions reachable from the quick view; state design (loading/error/stale) as first-class; terminology from GLOSSARY with a public/internal scope column.
