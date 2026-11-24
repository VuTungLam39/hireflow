# 07 — Form & Filter UX Audit (dimension E)

> Forms reviewed (read-only — no submission on production): login, public apply form (`/jobs/:id`), employer registration, job create form (renders for HR), filters on `/jobs` and `/applications`. Source: RHF + zod, `applyServerErrors` maps BE field errors (Phase 00 file 02).

## Observations (no finding)

- Login: labelled inputs, password reveal, Vietnamese error "Email hoặc mật khẩu không đúng" (RV, Phase 00), disabled-company message "Công ty của bạn đã bị khoá hoặc bị từ chối trên sàn" (RV). Throttle 5/60 s per account (SV).
- Apply form: Họ tên, Email, Số điện thoại, CV dropzone with type/size hint ("PDF hoặc DOCX, dưới 5.0 MB"), explicit consent checkbox linking the data policy (RV). Validation/error states not exercised (would require submission).
- Server field errors are mapped to fields (SV) — good pattern to keep.

## Findings

```text
Finding ID: F-04
Title: Public job filters push results below the fold and the company chip row does not scale
Category: Form/filter UX · Data-heavy · IA
Route: CR-01 /jobs
Actor: Guest / Candidate
UI State: default
Viewport: 390 (and 1440 for chip growth)
Problem: 9 controls (2 search fields, 4 company chips wrapping to 2–3 rows, 3 dropdowns) precede the first job on mobile; one chip per company grows unbounded as companies join.
Reproduction Steps: open /jobs at 390×844.
Evidence: phase-00/screenshots/guest/CR-01-jobs--default--390.png (first job at ~y=690); live (critique A).
Source Location: fe/src/features/public-jobs/pages/PublicJobsPage.tsx:45 (companies limit 48 → chips), ChipGroup
Expected Behavior: keyword search visible; other filters in one control; company filter as combobox when >N companies.
Actual Behavior: as above.
User Impact: candidates scroll before seeing jobs (T3 first step). Business Impact: marketplace scalability — 48 chips would be unusable.
Severity: P2 · Frequency: every mobile visit; grows with companies · Root Cause Confidence: High
Recommendation: mobile filter sheet with active-count; company combobox.
Implementation Effort: S–M · Dependencies: RR-05
Accessibility Impact: fewer tab stops before content · Responsive Impact: High · Performance Impact: none
Acceptance Criteria: at 390 px first job visible above the fold; company filter remains a single control for 50 companies.
```

Filter keyboard behaviour (listbox popover) → F-13 in file 09.
