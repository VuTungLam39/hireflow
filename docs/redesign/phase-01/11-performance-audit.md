# 11 — Performance Audit (dimension K) + feedback states

> Lighthouse 12.8.2 via temporary `npx -y lighthouse@12` (not installed in the project), mobile emulation, **3 runs per route**, medians reported. Internal timings: Playwright, 3 runs, desktop, warm API. Render free-plan cold start not reproduced in this session (API warm).

## 1. Lighthouse (public critical routes) — Phase 01 vs Phase 00

| Route | Perf (3 runs) | Δ vs P00 | A11y | BP | SEO | LCP med | FCP med | TBT med | CLS med |
|---|---|---|---|---|---|---|---|---|---|
| CR-01 /jobs | 99/99/100 | +2 (97) | 100 | 100 | 100 | 1.13 s | 1.13 s | 120 ms | 0.000 (P00 0.09) |
| CR-02 /jobs/:id | 96/94/98 | new | 100 | 96 | 100 | 1.15 s | 1.15 s | 222 ms | 0.000 |
| CR-03 /companies | 100/100/97 | +16–19 (81) | 100 | 100 | 100 | 1.14 s | 1.14 s | 52 ms | 0.000 |
| CR-04 /companies/vi-may | 100/100/99 | new | 100 | 100 | 100 | 1.21 s | 1.21 s | 77 ms | 0.000 |
| CR-05 /login | 88/87/89 | +11–13 (76) | 100 | 100 | 63 | 3.11 s | 3.02 s | 69 ms | 0.000 |
| CR-13 /applications/track | 79/79/83 | new | 100 | 96 | 63 | 4.18 s | 3.09 s | 49 ms | 0.000 |

Reading: Phase 00 single-run outliers (`/companies` SI 9.4 s, `/jobs` CLS 0.09) were not reproduced. Prerendered pages are fast; the two **client-rendered** pages (login, track) have LCP 3–4 s on emulated mobile. SEO 63 on login/track is expected for non-indexable pages (not a finding).

## 2. Internal timings (RV, 3 runs)

| Measure | Result |
|---|---|
| `/manage/jobs` cold (new context, no cache) to first rows | 884 / 915 / 831 ms (DCL ≈ 0.25 s, 338 KB) |
| `/manage/jobs` warm | 538 / 664 / 1794 ms |
| CV review to first evidence mark | 960 / 936 / 939 ms |
| CV review time to error UI when API returns 500 | **3,642 ms** (skeleton during TanStack Query retries) |

Phase 00's 4.8 s `/manage/jobs` reading → **not reproduced**; treated as a cold-start/one-off (P01-14 rejected).

## 3. Findings

```text
Finding ID: F-02
Title: Stale prerendered public content and masked loading/error states
Category: Performance · Feedback (system status)
Route: CR-01, CR-02, CR-03, CR-04
Actor: Guest / Candidate
UI State: loading, error, partial data
Viewport: all
Problem: public pages ship a build-time snapshot; when the API is slow or failing, the snapshot (e.g. "15 vị trí", HireFlow 11) is shown as if current; skeleton and error UI never appear on first load; when the API is healthy the counts silently change after hydration (13 / 9).
Reproduction Steps: block or 500 `/api/v1/public/**` and open /jobs (Phase 00 screenshots CR-01-jobs--error--390.png vs --default--390.png).
Evidence: Phase 00 file 09 §1 (RV); prerender pipeline SV (scripts/prerender.mjs, src/prerender/*, PRERENDER_DEPLOY_HOOK_URL).
Source Location: fe/scripts/prerender.mjs; fe/src/prerender/hydrate.ts; public-jobs pages
Expected Behavior: snapshot freshness bounded (rebuild on job publish/expire) and a visible "đang cập nhật/không tải được dữ liệu mới" state when live data fails.
Actual Behavior: possibly days-old listings shown without indication; expired jobs may appear until hydration succeeds.
User Impact: candidates may open/apply to jobs that closed; counts flip. Business Impact: trust in the marketplace.
Severity: P2 · Frequency: when API slow/down or between prerender refreshes · Root Cause Confidence: High (mechanism), Medium (frequency of staleness)
Recommendation: refresh prerender on job state changes (incl. deadline expiry) and design an explicit stale/offline state.
Implementation Effort: M (BE hook + FE state) · Dependencies: Phase 05 slice H; BE deploy hook already exists
Accessibility Impact: none · Responsive Impact: none · Performance Impact: keep prerender speed
Acceptance Criteria: a job past its deadline disappears from prerendered HTML within a defined window; API failure on a public page shows a visible notice.
```

```text
Finding ID: F-08
Title: CV-review errors surface only after ~3.6 s of silent retries
Category: Feedback · Performance
Route: CR-09 /applications/:id (and other detail queries using default retry)
Actor: HR, HM, Interviewer · UI State: error · Viewport: all
Problem: on 5xx the page shows a skeleton while queries retry twice, then "Chưa mở được hồ sơ".
Reproduction Steps: HR → mock `/api/v1/applications/**` 500 → open an application.
Evidence: RV 3,642 ms to error UI; query-client.ts retry ≤2 on non-4xx (SV).
Source Location: fe/src/lib/query-client.ts
Expected Behavior: status communicated within ~1 s ("đang thử lại…"), error with retry action.
Actual Behavior: ~3.6 s of skeleton with no message.
User Impact: users suspect a hang and reload. Business Impact: low–medium (Render cold starts make this common).
Severity: P2 · Frequency: on API errors/cold starts · Root Cause Confidence: High
Recommendation: show retry progress/state; keep retries but expose them.
Implementation Effort: S · Dependencies: state design (RR-09)
Accessibility Impact: announce status via live region · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: within 1.5 s of the first failure the UI shows a retrying/error message.
```

```text
Finding ID: F-24
Title: Client-rendered login and tracking pages are the slowest public routes
Category: Performance
Route: CR-05 /login, CR-13 /applications/track · Actor: staff (login), Candidate (track) · UI State: default · Viewport: mobile emulation
Problem: LCP medians 3.11 s and 4.18 s vs ≈1.1–1.2 s for prerendered pages.
Evidence: Lighthouse 3 runs each (table §1).
Source Location: AuthLayout/LoginPage (CSR), TrackApplicationPage (CSR + token call)
Expected Behavior: LCP ≤2.5 s on mobile for entry pages.
Actual Behavior: 3.1–4.2 s.
User Impact: slower first interaction for candidates opening tracking emails on phones. Business Impact: low.
Severity: P3 · Frequency: every first visit · Root Cause Confidence: Medium (LCP element not analysed)
Recommendation: inspect LCP element (login aside illustration; track page waits on token API) and render a lightweight shell first.
Implementation Effort: S · Dependencies: none
Accessibility Impact: none · Responsive Impact: none · Performance Impact: High
Acceptance Criteria: Lighthouse mobile LCP median ≤2.5 s on both routes.
```
