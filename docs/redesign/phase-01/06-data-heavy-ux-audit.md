# 06 — Data-heavy & Recruiting-domain UX Audit (dimensions D, F)

> Routes: CR-08 applications, CR-09 CV review, CR-10 ranking, CR-11 candidates, CR-07 jobs. Evidence: Phase 00/01 screenshots, source (`main` @ `04ac5b7`), impeccable critique A (cross-checked), grep checks for GLOSSARY rules (DL-08…DL-13).

## What works (RV)

- CV review is the product's strongest screen: per-criterion match + verbatim quote + "Xem trong CV ↘", CV with numbered highlighter marks (4 marks on the sample), legend "dạ quang = căn cứ cho tiêu chí". Heuristic 31/40 (critique A).
- Ranking weight sliders are accessible (name = criterion, `aria-valuetext` "Trọng số 3 trên 3", ArrowLeft changes value) — RV.
- Applications list: URL-synced search/filters/tabs, density toggle, server search (T1 in 2 actions).

## Findings

```text
Finding ID: F-05
Title: Ranking criterion marks have no visible legend and disappear on mobile
Category: Recruiting domain · Data-heavy
Route: CR-10 /manage/jobs/:id/ranking
Actor: HR, HM, Admin (Interviewer has job:read but ranking not exercised)
UI State: default
Viewport: 1440 (unlabeled), <640 (column hidden)
Problem: "●●○" criterion marks are not mapped visibly to the numbered criteria; column hidden below sm.
Reproduction Steps: HR → ranking of "Kế toán tổng hợp".
Evidence: phase-00/screenshots/hr/CR-10-ranking--default--1440.png / --390.png; RankingRow.tsx:99 `hidden … sm:table-cell`; RequirementMarks has role="img" + aria-label summary + title (SV) — accessible name exists, visual legend does not.
Source Location: fe/src/features/ranking/components/RankingRow.tsx:99; fe/src/features/applications/components/Score.tsx (RequirementMarks)
Expected Behavior: sighted users can read which criteria matched without hovering; mobile keeps a compact form.
Actual Behavior: meaning only via tooltip/screen reader; nothing on mobile.
User Impact: the at-a-glance explanation of a rank is opaque. Business Impact: weakens the differentiator on the ranking screen.
Severity: P2 (downgraded from critique A's P1: accessible name present, workaround via row detail)
Frequency: every ranking view · Root Cause Confidence: High
Recommendation: number marks to match slider numbering, add a legend, compact mark strip on mobile.
Implementation Effort: S · Dependencies: RR-07
Accessibility Impact: positive if visual labels added · Responsive Impact: Medium · Performance Impact: none
Acceptance Criteria: each mark shows its criterion number; marks visible at 390 px.
```

```text
Finding ID: F-06
Title: Mobile ranking gives no affordance for "why this rank"
Category: Recruiting domain · Responsive
Route: CR-10 · Actor: HR, HM · UI State: default · Viewport: 390
Problem: desktop shows a side "Bấm một dòng để xem vì sao" prompt; mobile shows rank/name/status/score only.
Reproduction Steps: HR at 390 → ranking.
Evidence: phase-00/screenshots/hr/CR-10-ranking--default--390.png vs --1440.png
Source Location: fe/src/features/ranking/pages/JobRankingPage.tsx
Expected Behavior: explanation reachable and signposted on mobile.
Actual Behavior: no hint; explanation discoverability depends on guessing a row tap.
User Impact: HM on phone cannot see why a candidate ranks first. Business Impact: explainability gap.
Severity: P2 (critique A: P1 — downgraded, desktop path works and rows are tappable)
Frequency: mobile ranking views · Root Cause Confidence: Medium (tap behaviour not exercised)
Recommendation: row tap opens a bottom sheet with quotes; inline hint text.
Implementation Effort: S–M · Dependencies: Phase 04 Ranking prototype
Accessibility Impact: low · Responsive Impact: High · Performance Impact: none
Acceptance Criteria: at 390 px a visible cue exists and one tap shows the per-criterion evidence.
```

```text
Finding ID: F-07
Title: Quick-view dialog shows evidence quotes but no decision actions or CV highlights
Category: Workflow · Recruiting domain
Route: CR-08 → `?xem=application:<id>` dialog → CR-09
Actor: HR (HM similar)
UI State: default
Viewport: 1440
Problem: the dialog opened from the list shows score + quotes; to act (Chuyển sang… / Từ chối) or see quotes in the CV, the user must press "Mở bàn duyệt CV" (full page).
Reproduction Steps: HR → /applications → open "Đỗ Minh Khôi".
Evidence: Playwright: dialog buttons = "Đóng", link "Mở bàn duyệt CV"; 0 `<mark>` in dialog; full page has 4 marks + "Chuyển sang Sàng lọc" (T2-proxy, file 01).
Source Location: fe/src/app/layouts/DetailHost.tsx; features/applications ApplicationDialog
Expected Behavior: triage decision possible from the quick view, or the quick view is clearly a preview.
Actual Behavior: +1 action and a navigation for every decision (T2 = 3 actions).
User Impact: slower triage across many applications. Business Impact: core HR efficiency (T2).
Severity: P2 · Frequency: every triage · Root Cause Confidence: High
Recommendation: decide in Phase 02/04 whether the quick view carries the primary decision (with the same confirm/reason flow) or is removed in favour of the review page.
Implementation Effort: M · Dependencies: Phase 04 CV Review prototype
Accessibility Impact: none · Responsive Impact: low · Performance Impact: none
Acceptance Criteria: T2 decision reachable in ≤2 actions from the list (Phase 04 threshold).
```

```text
Finding ID: F-14
Title: Offer/Hired status labels contradict the glossary (DL-08)
Category: Recruiting domain · Consistency (terminology)
Route: CR-08 filters & chips, CR-06 KPI, CR-09 status, jobs counters
Actor: all staff
UI State: default
Viewport: all
Problem: status OFFER labelled "Đề nghị", HIRED labelled "Đã nhận"; dashboard says "Đã nhận việc" and "đang ở bước đề nghị"; offer UI says "offer".
Reproduction Steps: HR → /applications → "Trạng thái" filter lists "Đề nghị", "Đã nhận" (RV).
Evidence (SV grep): features/applications/constants.ts:8 `OFFER: 'Đề nghị'`, :9 `HIRED: 'Đã nhận'`; features/jobs/constants.ts:29 `'Đã nhận'`; use-applications.ts:223, ApplicationsPage.tsx:477, DashboardPage.tsx:161 ("bước Đề nghị/đề nghị"); DashboardPage.tsx:159 "Đã nhận việc".
Source Location: as above
Expected Behavior: "Offer" and "Đã nhận việc" everywhere (GLOSSARY).
Actual Behavior: 3–4 names for 2 concepts.
User Impact: users must map synonyms; filter vs offer block mismatch. Business Impact: trust in status data.
Severity: P2 · Frequency: constant · Root Cause Confidence: High
Recommendation: single label source updated per GLOSSARY in the Phase 05 slice that owns status labels.
Implementation Effort: S · Dependencies: Phase 02 terminology table (D-09)
Accessibility Impact: none · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: grep for the Avoid list ("Đề nghị" for this concept, "Đã nhận" as a status) returns 0 UI strings.
```

```text
Finding ID: F-15
Title: "Ứng viên" used where an application is meant; candidate-facing page uses "tin tuyển dụng"
Category: Recruiting domain · Terminology (DL-09, DL-11)
Route: CR-07 jobs action, CR-10 ranking caption, /chinh-sach-du-lieu
Actor: HR/HM; Candidate
UI State: default · Viewport: all
Problem: "Xếp hạng ứng viên" (ranking ranks applications within a job); privacy page (candidate audience) says "tin tuyển dụng".
Reproduction Steps: grep.
Evidence (SV): features/jobs/pages/JobsPage.tsx:376 "Xếp hạng ứng viên"; features/ranking/components/RankingTable.tsx:37 caption "Xếp hạng ứng viên theo mức phù hợp"; features/public-jobs/pages/PrivacyPolicyPage.tsx:167 "tin tuyển dụng". EmployerRegisterPage.tsx:52 addresses employers → allowed.
Source Location: as above
Expected Behavior: "Xếp hạng hồ sơ"; "việc làm/vị trí" on candidate surfaces.
Actual Behavior: as quoted.
User Impact: minor confusion. Business Impact: low. Severity: P3 · Frequency: low · Root Cause Confidence: High
Recommendation: copy fix within relevant slices. Implementation Effort: XS · Dependencies: GLOSSARY
Accessibility Impact: caption is read by screen readers · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: grep shows no "xếp hạng ứng viên" and no "tin tuyển dụng" on candidate pages.
```

```text
Finding ID: F-16
Title: "Offer" written in lowercase in UI copy
Category: Terminology (DL-08)
Route: CR-09 offer block · Actor: HR, HM, Admin · UI State: default · Viewport: all
Problem: buttons/strings "Soạn offer", "Tạo offer" (×7 lowercase occurrences of the word vs ×9 "Offer").
Evidence (SV): grep on fe/src (*.tsx) — counts "offer" 20+16 vs "Offer" 9+7 incl. identifiers; UI strings "Soạn offer" ×4, "Tạo offer" ×3.
Source Location: features/applications (offer components)
Expected Behavior: "Offer" as a proper term (GLOSSARY). Actual Behavior: mixed case.
User Impact: cosmetic inconsistency. Business Impact: none. Severity: P3 · Frequency: offer block · Root Cause Confidence: High
Recommendation: normalise in the offer slice. Implementation Effort: XS · Dependencies: none
Accessibility Impact: none · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: UI strings use "Offer".
```

```text
Finding ID: F-19
Title: Parallel table and modal implementations
Category: Consistency · Data-heavy (maintainability with user-visible variance)
Route: CR-08 (DataTable), CR-10 (RankingTable raw <table>), compare dialog, funnel report, platform quota/queue tables
Actor: HR, HM, platform_admin · UI State: default · Viewport: all
Problem: 5 raw tables besides DataTable; 5 modal surfaces (Dialog, DetailDialog, SidePanel, CommandPalette, GalleryLightbox).
Evidence (SV): Phase 00 file 07 §4; visual: ranking table density/header style differs from applications table (screenshots).
Source Location: components/shared/DataTable.tsx; features/ranking/components/RankingTable.tsx; applications/components/CompareDialog.tsx; dashboard/components/FunnelReport.tsx; platform/components/{AiQuotaSection,QueueCountsTable}.tsx
Expected Behavior: one table system with variants; one modal primitive with variants.
Actual Behavior: divergent headers, density, sort affordances.
User Impact: inconsistent scanning/sorting behaviour. Business Impact: redesign cost multiplied.
Severity: P3 · Frequency: n/a · Root Cause Confidence: High
Recommendation: Phase 03 component architecture: Table (data, ranking, compare variants) and Dialog/Sheet primitives.
Implementation Effort: M (Phase 05 slice B/C) · Dependencies: RR-04
Accessibility Impact: consolidating improves consistency of keyboard behaviour · Responsive Impact: Medium · Performance Impact: none
Acceptance Criteria: Phase 03 component inventory lists one Table and one Dialog family with documented variants.
```

## Grep-rule checks with no finding (conform)

- Phiếu đánh giá (DL-13): UI strings use "phiếu đánh giá"/"phiếu" (13+8 / 28+4 occurrences); "feedback"/"nhận xét" appear only in identifiers, never as visible copy → conforms (P01-21).
- "Nhà tuyển dụng" internal (DL-12): only `PlatformCompaniesPage.tsx:124` refers to the *public page* by its label ("trang Nhà tuyển dụng") → label usage, not a concept → conforms (P01-20).
- Cross-scope "Việc làm" behind login: 0 occurrences → conforms (P01-19), except the candidate-page case in F-15.
