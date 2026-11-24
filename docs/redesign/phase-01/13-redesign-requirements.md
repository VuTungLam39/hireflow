# 13 — Redesign Requirements (input to Phase 02/03/04)

> Each requirement is traceable to findings and is verifiable. They constrain the redesign; they do not choose a visual direction (Phase 02).

| ID | Requirement | Verifiable by | Source |
|---|---|---|---|
| RR-01 | Public shell is designed mobile-first (per-role posture DL-18: candidate surfaces mobile-primary; HR/HM desktop-primary with a mobile-safe floor at 390 px — no overlap/breakage, no horizontal scroll, core read flows usable, no full-parity requirement; dense tables may degrade to cards with a path to detail): no overlap/collision of header controls at 320–430 px; targets ≥24 px with spacing (WCAG 2.5.8) | Playwright bbox check at 320/360/390/430 | F-01 |
| RR-02 | No page-level horizontal scroll at 390, 768, 1024, 1280, 1440 on any critical route | `scrollWidth ≤ innerWidth` sweep | F-03, F-22 |
| RR-03 | One public job-row and one company-facts component, reused across `/jobs`, company pages and job detail; components adapt to missing data (no empty cells) | component inventory + screenshots of sparse/complete companies | F-09, F-11 |
| RR-04 | One table system (variants: data list, ranking, compare, admin) with container-scoped overflow, sticky identity column, documented column priority | Phase 03 component spec; F-03 acceptance | F-03, F-19 |
| RR-05 | Filter pattern: primary search always visible; secondary filters in one control on <sm with active-count; company filter scales to ≥50 companies | screenshots at 390; 50-company mock | F-04, F-23 |
| RR-06 | One accessible primitive family (Dialog/Sheet, Popover/Menu/Listbox, Tabs, Tooltip, Slider) meeting WAI-ARIA APG keyboard patterns (arrows, Home/End, Escape, focus return) | keyboard test script per primitive | F-13, F-18, F-19 |
| RR-07 | **Explainability everywhere a score appears**: criteria numbered consistently across sliders, marks, CV highlights and score segments; per-criterion evidence reachable in one action on desktop and mobile | Phase 04 Ranking + CV Review scenarios | F-05, F-06, F-20, F-22 |
| RR-08 | Triage decision (advance / reject with reason) reachable in ≤2 actions from the applications list, preserving the confirm + reason step. Decisions live in the application detail where evidence is visible; the quick-view dialog is read + navigate only (open detail, open CV, copy tracking link), no state-changing buttons (DL-16) | T2 measured in Phase 04 vs baseline (3 actions) | F-07, DL-16 |
| RR-09 | First-class state design for every critical route: loading, empty, error (with retry), retrying, partial/stale, not-found (ADR-0002 copy), forbidden | state matrix in Phase 03 + screenshots | F-02, F-08, P01-07 |
| RR-10 | Public data freshness (DL-17): an expired job leaves public listings/search (`/jobs`, company pages, prerender) immediately at expiry; `/jobs/:id` stays reachable 30 days marked "Đã hết hạn", apply disabled, links to open jobs; after 30 days it returns not-found. Internal records kept indefinitely. Expiry never affects existing Hồ sơ ứng tuyển or the token tracking page (CR-13) — the two lifecycles stay decoupled. 30 days is a policy constant, not a measured value. Failed live refresh is visible to the user | Phase 05 slice H acceptance test | F-02, DL-17 |
| RR-11 | Public 404 for guests (never redirect guests to staff login for unknown URLs) | signed-out unknown-path check | F-10 |
| RR-12 | All UI copy follows GLOSSARY incl. Avoid lists and the public/internal scope column (Offer, Đã nhận việc, hồ sơ vs ứng viên, Việc làm vs Tin tuyển dụng, Phiếu đánh giá) | grep checks P01-16…P01-21 return 0 violations | F-14, F-15, F-16 |
| RR-13 | Dashboard counters share one definition per unit; task rows use task-specific verbs; zero states explained | HM/HR dashboard review | F-12, F-21 |
| RR-14 | Entry pages (login, tracking link) reach LCP ≤2.5 s on Lighthouse mobile (median of 3) | Lighthouse | F-24 |
| RR-15 | Exactly one h1 per page; skip link on every layout with repeated navigation | axe + heading audit | F-17 |
| RR-16 | Public pages communicate the product's distinct promise (evidence-backed, human-decided screening) in candidate-appropriate terms — a Phase 02 brief input, not a feature | Phase 02 design brief sign-off | critique A synthesis |

## Baselines Phase 04/08 must compare against

T1: 2 actions, ≈1.0 s system time · T2-proxy: 3 actions, ≈2.0 s (decision not executed) · T3: 3 clicks, ≈2.3 s · axe: 0 violations on 27 page×actor checks · Lighthouse public perf 79–100, a11y 100 · impeccable detect: 0 findings (`tool-output/impeccable-detect-fe-src.baseline.json`).

## Open questions for the owner — answered 24/11/2026

1. Quick view carries no decisions → DL-16 (RR-08). Reopen only with Phase 04 data.
2. Expired-job window → DL-17 (RR-10).
3. HM mobile is not primary → DL-18 (RR-01, RR-02; Phase 03/05 acceptance criteria).
