# 08 — Responsive Audit (dimension H)

> Viewports verified with Playwright: 1440, 1024, 768, 390 (plus 320/360/430 from Phase 00). Screenshots: `phase-01/screenshots/` (`guest-*-{1024,768}.png`, `hr-*-{1024,768}.png`, `hr-applications-1024-overflow.png`) and `phase-00/screenshots/**`.

## Summary matrix (RV)

| Route | 1440 | 1024 | 768 | 390 |
|---|---|---|---|---|
| Public `/jobs`, `/jobs/:id`, `/companies/:slug` | ok | ok (no overlap, no h-scroll) | ok | **header overlap (F-01)** |
| CR-06 dashboard | ok | ok | ok | ok (Phase 00) |
| CR-08 `/applications` | ok | **page h-scroll 1179/1024 px (F-03)** | ok (card layout) | ok, dense header (F-23) |
| CR-09 CV review | ok | ok | ok (stacked) | stacked, long scroll to evidence (F-22) |
| CR-10 ranking | ok | ok | ok | criteria column hidden (F-05/F-06) |

---

```text
Finding ID: F-01
Title: Public header links overlap on phones
Category: Responsive · Visual hierarchy
Route: all PublicLayout pages (CR-01, CR-02, CR-03, CR-04, CR-13, /employers/*, privacy)
Actor: Guest / Candidate
UI State: default
Viewport: 320, 360 (2 overlaps), 390, 430 (1 overlap); 768+ ok
Problem: "Công ty" and "Việc làm" render on top of "Nhà tuyển dụng"; text unreadable, tap targets collide.
Reproduction Steps: open https://hireflow-gray-zeta.vercel.app/jobs at 390×844.
Evidence: bbox intersection check (Phase 00 R-01/R-02; re-confirmed absent at 768/1024 in Phase 01); screenshots phase-00/screenshots/guest/CR-01-jobs--default--390.png; impeccable critique A (live 390).
Source Location: fe/src/app/layouts/PublicLayout.tsx:25-52 (right cluster `shrink-0`, NavLinks non-shrinking, `justify-between`).
Expected Behavior: all primary navigation readable and tappable at ≥320 px.
Actual Behavior: overlapping links at ≤430 px.
User Impact: candidates (mostly mobile) cannot reliably reach "Công ty" or employer entry; first impression broken on every public page.
Business Impact: weakens the public marketplace (MVP 3) acquisition surface.
Severity: P1
Frequency: every public page view on phones
Root Cause Confidence: High (layout source + measurement)
Recommendation: mobile header pattern (collapse right cluster into a menu or keep only "Đăng nhập"; allow left nav to shrink).
Implementation Effort: S
Dependencies: none (Phase 05 slice H)
Accessibility Impact: WCAG 1.4.10 Reflow / 2.5.8 target spacing risk
Responsive Impact: High
Performance Impact: none
Acceptance Criteria: no bounding-box overlap among header interactive elements at 320/360/390/430; targets ≥24 px with spacing.
```

```text
Finding ID: F-03
Title: Applications table forces horizontal page scroll on laptops (1024 px)
Category: Responsive · Data-heavy
Route: CR-08 /applications
Actor: HR (also HM, Admin; Interviewer variant has fewer columns — not measured)
UI State: default, comfortable density
Viewport: 1024
Problem: table renders 1179 px wide inside a 1024 px viewport; whole page scrolls sideways.
Reproduction Steps: sign in as HR, resize to 1024×900, open /applications.
Evidence: scrollWidth 1179 vs 1024; overflowing TABLE/THEAD/TH (sticky header cells); screenshot phase-01/screenshots/hr-applications-1024-overflow.png. 768 switches to card layout (ok).
Source Location: fe/src/components/shared/DataTable.tsx; column set in fe/src/features/applications/pages/ApplicationsPage.tsx
Expected Behavior: table fits or scrolls inside its own container with sticky first column; page never scrolls horizontally.
Actual Behavior: page-level horizontal scroll; right-hand columns ("Nộp lúc", actions) off-screen.
User Impact: HR on 13" laptops/split screens lose the date/actions columns; easy to miss status changes.
Business Impact: core HR list (task T1) degraded on a common device size.
Severity: P2
Frequency: every visit at 1024–~1180 px widths
Root Cause Confidence: High
Recommendation: container-scoped overflow with sticky identity column, or responsive column priority (hide/merge low-priority columns between 768–1200).
Implementation Effort: S–M
Dependencies: table system decision (RR-04)
Accessibility Impact: WCAG 1.4.10 Reflow (page-level 2-D scroll)
Responsive Impact: High
Performance Impact: none
Acceptance Criteria: at 1024 and 1280, documentElement.scrollWidth ≤ innerWidth on /applications for every role.
```

```text
Finding ID: F-22
Title: CV review on phones buries the evidence and crowds contact data
Category: Responsive · Recruiting domain
Route: CR-09 /applications/:id
Actor: HR, HM
UI State: default
Viewport: 390
Problem: score column and CV sheet stack; the CV with highlighted evidence starts far below the fold; email · phone · source run in one meta line wrapping to 3 lines.
Reproduction Steps: HR at 390×844 → /applications/8e88c6c4-… .
Evidence: phase-00/screenshots/hr/CR-09-application-detail--default--390.png; impeccable critique A (P2).
Source Location: fe/src/features/applications/pages/ApplicationDetailPage.tsx; components/CvSheet.tsx
Expected Behavior: on mobile, jump between a criterion and its evidence without long scrolling; contact info scannable.
Actual Behavior: long vertical scroll; "Xem trong CV ↘" is the only bridge.
User Impact: HM reviewing on phone (approvals, quick checks) spends effort locating evidence.
Business Impact: explainability — the differentiator — weaker on mobile.
Severity: P2
Frequency: every mobile CV review
Root Cause Confidence: Medium (visual evidence; no mobile usage data)
Recommendation: mobile tabbed/segmented layout (Đánh giá | CV) with evidence deep-links; split contact line.
Implementation Effort: M
Dependencies: Phase 04 CV Review prototype
Accessibility Impact: low
Responsive Impact: High
Performance Impact: none
Acceptance Criteria: from any criterion card, its evidence is visible within one action at 390 px.
```

```text
Finding ID: F-23
Title: Dense header area on mobile applications list
Category: Responsive · Data-heavy
Route: CR-08 /applications
Actor: HR, HM
UI State: default
Viewport: 390
Problem: actions + horizontally scrolling tabs + search + 4 filter buttons + density toggle precede the first record.
Reproduction Steps: HR at 390 → /applications.
Evidence: phase-00/screenshots/hr/CR-08-applications--default--390.png (first record at ~y=420 of 844).
Source Location: ApplicationsPage.tsx, components/shared/FilterBar.tsx
Expected Behavior: first records visible in the first viewport; secondary filters behind one "Bộ lọc" control.
Actual Behavior: ~50% of first viewport is controls.
User Impact: slower scanning on phones. Severity: P3 · Frequency: every mobile visit · Root Cause Confidence: High
Business Impact: low
Recommendation: collapse filters into a sheet with an active-count badge on <sm.
Implementation Effort: S · Dependencies: FilterBar redesign (RR-05)
Accessibility Impact: none · Responsive Impact: Medium · Performance Impact: none
Acceptance Criteria: at 390 px the first two records start above the fold.
```
