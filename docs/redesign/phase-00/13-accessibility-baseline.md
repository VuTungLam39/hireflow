# 13 — Accessibility Baseline

> Phase 00 · Workstream I · Tools: Lighthouse 12.8.2 (mobile, single run) and axe-core 4.10.2 injected at audit level from cdnjs into the live page (no project install) with tags `wcag2a, wcag2aa, best-practice`, viewport 390. Public pages only; internal BLK.

## 1. Automated results (RV)

| Page | Lighthouse a11y | axe violations | Headings | Landmarks |
|---|---|---|---|---|
| `/jobs` | 100 | 0 | 1 heading total (h1); job titles are not headings | header, nav, main, footer |
| `/jobs/:id` | — | 0 | 6, one h1 | header, nav, main, footer |
| `/companies` | 100 | 0 | 4, one h1 | header, nav, main, footer |
| `/companies/vi-may` | — | 0 | 3, one h1 | header, nav, main, footer |
| `/login` | 100 | 0 | **2 × h1** ("Mỗi quyết định…" in aside, "Đăng nhập") | main only (no skip link) |
| `/employers/register` | — | 0 | 1 | header, nav, main, footer |

Automated tools did **not** catch R-01/R-02 (overlapping header links at ≤430 px) — a real readability/tap issue.

## 2. Keyboard & focus (RV)

- Public pages: first Tab → skip link "Bỏ qua tới nội dung", then brand, nav links; focus indicator = 2px solid outline.
- `/login`: no skip link; inputs show focus via box-shadow (outline none); after the form, focus reaches an element in the aside region whose computed outline is `none` and no shadow → **focus not visible** (to confirm in Phase 01). An extra `tabindex=-1` section labelled "Notifications alt+T" is the Sonner toaster region (expected).

## 3. Source-level notes (SV)

- Native `<dialog>` + `showModal()` for `Dialog`; custom Popover/Tabs/Tooltip with ARIA roles; Tabs lack Home/End; native `<select>`.
- Global `prefers-reduced-motion` handling exists (file 11).
- `axe-core` is already a devDependency, used only by `fe/scripts/qa/phase3.mjs` (manual QA script, not in CI) — SV.

## 4. Internal critical routes (RV, axe-core 4.10.2 `wcag2a/wcag2aa`, desktop 1440, signed in)

| Route | Actor | axe violations |
|---|---|---|
| CR-06 `/` | HR | 0 |
| CR-07 `/manage/jobs` | HR | 0 |
| CR-08 `/applications` | HR | 0 |
| CR-09 `/applications/:id` (CV review) | HR | 0 |
| CR-10 ranking | HR | 0 |
| CR-11 `/candidates` | HR | 0 |
| CR-12 `/platform/companies` | platform_admin | 0 |

Automated checks are clean; manual a11y of hand-rolled primitives (dialogs, popovers, tabs, sliders on ranking, keyboard path through CV evidence marks) remains for Phase 01 (P01-A11Y-PRIM). Lighthouse was not run on signed-in pages (auth cookie flow not wired into Lighthouse CLI in this phase — limitation).

## 5. Not measured

Screen-reader announcement of form errors, colour contrast of soft-tinted secondary states, Interviewer pages (BLK).
