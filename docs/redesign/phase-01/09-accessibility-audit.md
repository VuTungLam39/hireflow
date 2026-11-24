# 09 — Accessibility Audit (dimension I) + impeccable technical audit

> Tools: axe-core 4.10.2 (already a project devDependency; injected at audit level into live pages — no install), Lighthouse 12.8.2 (3 runs), Playwright keyboard scripts, source review. Screen-reader testing with a real AT (NVDA/VoiceOver): **not performed** — limitation; automated + keyboard only.

## 1. Automated coverage (RV)

| Scope | Pages × actor | axe wcag2a/aa violations |
|---|---|---|
| Public (Phase 00) | /jobs, /jobs/:id, /companies, /companies/vi-may, /login, /employers/register | 0 |
| HR (Phase 00) | CR-06, CR-07, CR-08, CR-09, CR-10, CR-11 | 0 |
| platform_admin | /platform/companies (P00), /platform/queues (P01) | 0 |
| Hiring Manager (P01) | /, /applications, /manage/jobs, /candidates | 0 |
| Interviewer (P00+P01) | /interviews, /applications, /manage/jobs | 0 |
| Admin (P01) | /, /users, /admin/company, /admin/audit-logs | 0 |

Lighthouse accessibility = 100 on all 6 public critical routes × 3 runs.

## 2. Hand-rolled primitives — keyboard pass (P01-A11Y-PRIM, RV)

| Primitive | Check | Result |
|---|---|---|
| Dialog (native `<dialog>` + `showModal`) — application quick view | focus moves inside on open; labelled (`aria-labelledby`); Escape closes; focus returns to the triggering row | **Pass**. After 25 Tabs focus left the dialog document area — expected native behaviour (focus may move to browser chrome; background is inert) |
| Popover — "Trạng thái" filter (`aria-haspopup=listbox`, `aria-expanded` toggles) | Enter opens; Escape closes and returns focus; Tab enters options (`role=option`, `aria-selected`) | **Partial**: ArrowDown/ArrowUp do not move between options (arrow handling only targets `[role^=menuitem]`, SV Popover.tsx:14) → F-13 |
| Tabs (applications) | roving tabindex; ArrowRight moves | **Partial**: Home/End not handled (SV + RV) → F-18 |
| Slider (ranking weights) | name = criterion, `aria-valuetext` "Trọng số 3 trên 3", ArrowLeft changes value | **Pass** |
| Command palette (Ctrl+K) | opens dialog, focus in combobox | **Pass** |
| Tooltip | shows on `:focus-visible`, `aria-describedby` (SV) | Pass (source) |

## 3. Findings

```text
Finding ID: F-13
Title: Listbox popovers do not support arrow-key navigation
Category: Accessibility (keyboard, ARIA pattern)
Route: CR-08 filters (Trạng thái, Tin, Mức phù hợp, Ngày nộp) and other Popover listboxes
Actor: HR, HM, Interviewer, Admin
UI State: popover open
Viewport: desktop
Problem: options are exposed as role="option" inside role="listbox", but arrow keys do nothing; users must Tab through options.
Reproduction Steps: /applications → focus "Trạng thái" → Enter → Tab → ArrowDown (focus stays on "Tất cả").
Evidence: Playwright RV (afterTab = option "Tất cả", afterTabArrow unchanged); Popover.tsx:14 selector `[role^="menuitem"]`.
Source Location: fe/src/components/ui/Popover.tsx:14,47,84
Expected Behavior: WAI-ARIA listbox pattern — arrows move, Home/End, type-ahead optional.
Actual Behavior: arrows inert; Tab works.
User Impact: keyboard/screen-reader users get a non-standard interaction; still operable. Business Impact: low.
Severity: P3 (operable via Tab; APG non-conformance)
Frequency: every keyboard use of filters · Root Cause Confidence: High
Recommendation: extend roving focus to role="option" (or use one primitive for menu/listbox).
Implementation Effort: XS–S · Dependencies: Phase 03 primitives (RR-06)
Accessibility Impact: High for keyboard users · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: ArrowUp/Down/Home/End move between options in every listbox popover.
```

```text
Finding ID: F-17
Title: /login has two h1 and no skip link
Category: Accessibility (structure)
Route: CR-05 /login · Actor: staff · UI State: default · Viewport: all
Problem: marketing aside h1 "Mỗi quyết định tuyển dụng đều có căn cứ." plus form h1 "Đăng nhập"; no skip link (public layout has one).
Reproduction Steps: open /login, list headings.
Evidence: Phase 00 RV; Phase 01 RV: focusables are 2 inputs, "Hiện mật khẩu", "Đăng nhập", "Đăng ký nhà tuyển dụng" — none in the aside. The Phase 00 "invisible focus stop" is **not reproduced** → rejected.
Source Location: fe/src/app/layouts/AuthLayout.tsx, features/auth/pages/LoginPage.tsx
Expected Behavior: one h1 (form); aside heading as h2 or non-heading.
Actual Behavior: two h1.
User Impact: minor for screen-reader navigation (form is first focusable anyway, so no skip link is needed in practice). Business Impact: none.
Severity: P3 · Frequency: every login · Root Cause Confidence: High
Recommendation: demote aside heading. Implementation Effort: XS · Dependencies: none
Accessibility Impact: Low · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: exactly one h1 on /login.
```

```text
Finding ID: F-18
Title: Tabs lack Home/End keys
Category: Accessibility (keyboard)
Route: CR-08 tabs (Tất cả, Chờ xem…), other Tabs usages · Actor: staff · UI State: default · Viewport: desktop
Problem: Home/End do not move focus to first/last tab.
Evidence: RV (afterEnd/afterHome stayed on "Chờ xem (5)"); Tabs.tsx:101-102 handles only ArrowLeft/Right.
Source Location: fe/src/components/ui/Tabs.tsx:101-102
Expected Behavior: APG tabs: Home/End supported. Actual Behavior: not supported.
User Impact: minor. Business Impact: none. Severity: P3 · Frequency: keyboard users · Root Cause Confidence: High
Recommendation: add Home/End. Implementation Effort: XS · Dependencies: RR-06
Accessibility Impact: Low · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: Home/End move to first/last tab.
```

## 4. Not covered

Real screen-reader output; colour contrast of soft-tinted secondary states with real data beyond axe's computed checks; error announcements on form submit (submission not performed on production); AccessLint/skills — **not used** (not installed; the kickoff prompt does not name it; plan §01.8 conditions it on reading its SKILL.md — recorded as not available).

## 5. impeccable `audit` (technical, 5 dimensions; single-context — audit has no sub-agent requirement)

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | axe/Lighthouse clean; primitives mostly correct; listbox arrows (F-13), tabs Home/End (F-18) |
| 2 | Performance | 3 | public pages fast (LCP ≈1.1–1.2 s); CSR login/track LCP 3.1–4.2 s (F-24); retry-delayed errors (F-08) |
| 3 | Theming | 4 | full token system in `index.css`, CI guard bans raw colours; no dark mode by decision (D-09) — n/a penalty not applied |
| 4 | Responsive | 2 | public header overlap (F-01), page h-scroll at 1024 (F-03), dense mobile headers (F-04, F-23) |
| 5 | Implementation integrity | 3 | detector 0 findings; duplication of tables/modals (F-19) |
| **Total** | | **15/20** | **Good** (address responsive) |
