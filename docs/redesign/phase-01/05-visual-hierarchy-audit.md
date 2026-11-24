# 05 — Visual Hierarchy Audit (dimension C)

> Evidence: impeccable critique A (live 1440/390 for public; Phase 00 screenshots for signed-in), cross-checked in source. Current visual language: warm neutrals, display "Bricolage Grotesque" headings, brand green, highlighter yellow for evidence (Phase 00 file 10).

## Strengths

- Clear page titles as sentences on the dashboard ("5 hồ sơ chờ bạn xem"); consistent framed-sheet shell; evidence highlighting is visually distinctive and product-specific (critique A: CV review is the most "authored" screen).
- Detector: 0 design-slop findings (no raw colours/gradients — enforced by `check:design`).

## Findings

```text
Finding ID: F-09
Title: Company page facts strip renders mostly empty bordered cells
Category: Visual hierarchy · Content
Route: CR-04 /companies/:slug (e.g. /companies/vi-may)
Actor: Guest / Candidate · UI State: default (company with only "Đang tuyển" fact) · Viewport: 1440 and 390
Problem: a 4-column (2 on mobile) bordered grid shows a single fact; the rest is empty box.
Reproduction Steps: open /companies/vi-may.
Evidence: live screenshots (critique A); source CareersPage.tsx:166-171 builds facts conditionally, :203 `grid grid-cols-2 sm:grid-cols-4` fixed.
Source Location: fe/src/features/public-jobs/pages/CareersPage.tsx:166-203
Expected Behavior: grid adapts to number of facts or hides when <2.
Actual Behavior: looks broken/unfinished on the company's brand page.
User Impact: candidate trust in company page. Business Impact: employer brand quality.
Severity: P2 (critique A P1 → downgraded: cosmetic, no task blocked)
Frequency: companies with sparse profiles (2 of 3 live) · Root Cause Confidence: High
Recommendation: auto-fit columns to fact count; hide strip below 2 facts.
Implementation Effort: XS · Dependencies: none
Accessibility Impact: none · Responsive Impact: Medium · Performance Impact: none
Acceptance Criteria: no empty bordered cells for any fact count 1–4.
```

```text
Finding ID: F-11
Title: Job row anatomy differs between /jobs and company pages
Category: Visual consistency
Route: CR-01 vs CR-04 · Actor: Guest · UI State: default · Viewport: 1440
Problem: /jobs rows: logo, ~18 px display title, 3 meta lines; company page rows: ~14 px bold title, 1 meta line.
Evidence: live (critique A); Phase 00 screenshots CR-01/CR-04.
Source Location: PublicJobsPage.tsx vs CareersPage.tsx (separate row markup)
Expected Behavior: one job-row component with context variants. Actual Behavior: two designs.
User Impact: minor re-learning. Business Impact: low. Severity: P3 · Frequency: constant · Root Cause Confidence: High
Recommendation: shared JobRow (RR-03). Implementation Effort: S · Dependencies: Phase 03
Accessibility Impact: none · Responsive Impact: low · Performance Impact: none
Acceptance Criteria: same component renders jobs on both pages.
```

```text
Finding ID: F-20
Title: Score bars add little information (tiny/unlabeled)
Category: Visual hierarchy · Recruiting domain
Route: CR-10 ranking, CR-09 CV review, CR-08 list
Actor: HR, HM · UI State: default · Viewport: all
Problem: ~24 px mini bars beside the number in ranking/list; 5-segment bar on CV review unlabeled (all green at 100).
Evidence: phase-00 screenshots CR-10, CR-09; critique A.
Source Location: features/applications/components/Score.tsx (ScoreBadge, bars)
Expected Behavior: visual encodes something the number doesn't (e.g. criteria segments numbered, unmatched shown empty).
Actual Behavior: decorative redundancy.
User Impact: noise. Business Impact: low. Severity: P3 · Frequency: constant · Root Cause Confidence: High
Recommendation: number segments / drop mini bars. Implementation Effort: S · Dependencies: RR-07
Accessibility Impact: none (number is present) · Responsive Impact: low · Performance Impact: none
Acceptance Criteria: each score visual either labelled per criterion or removed.
```

```text
Finding ID: F-21
Title: Dashboard zero-state KPIs and identical row CTAs flatten hierarchy
Category: Visual hierarchy · Workflow
Route: CR-06 / · Actor: HR, HM, Admin · UI State: default with zeros · Viewport: 1440
Problem: "Hồ sơ tuần này 0" rendered as large numerals; every task row ends in the same "Xem →".
Evidence: phase-00/screenshots/hr/CR-06-dashboard--default--1440.png; critique A (P2/P3).
Source Location: DashboardPage.tsx, components/shared/KpiStrip.tsx
Expected Behavior: zeros de-emphasised/explained; verbs per task ("Duyệt", "Quyết định", "Đóng tin").
Actual Behavior: as above.
User Impact: slower scanning of what to do. Business Impact: low. Severity: P3 · Frequency: daily · Root Cause Confidence: High
Recommendation: task-specific verbs; zero-state copy. Implementation Effort: XS · Dependencies: none
Accessibility Impact: more descriptive link text helps (WCAG 2.4.4) · Responsive Impact: none · Performance Impact: none
Acceptance Criteria: no two task rows share a generic CTA; zero KPIs have explanatory copy.
```
