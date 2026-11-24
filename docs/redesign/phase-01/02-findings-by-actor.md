# 02 — Findings by Actor

> Full finding records live in the dimension files (04–11). Severity: P0 0 · P1 1 · P2 12 · P3 11.

| Actor | Findings (severity) | Strongest positives (RV) |
|---|---|---|
| **Guest / Candidate** | F-01 header overlap (P1) · F-02 stale prerender (P2) · F-04 filters/chips (P2) · F-09 empty facts strip (P2) · F-10 404→login (P2) · F-11 job row variants (P3) · F-15 privacy page term (P3) · F-24 track page LCP (P3) | prerendered public pages LCP ≈1.1 s; a11y 100; clear apply form with consent; T3 in 3 clicks |
| **HR** | F-03 1024 h-scroll (P2) · F-05 ranking marks (P2) · F-06 mobile "why" (P2) · F-07 quick view w/o actions (P2) · F-08 late errors (P2) · F-14 status terms (P2) · F-22 mobile CV review (P2) · F-13 listbox arrows (P3) · F-15 "Xếp hạng ứng viên" (P3) · F-16 "offer" case (P3) · F-18 tabs Home/End (P3) · F-19 duplicate tables/modals (P3) · F-20 score bars (P3) · F-21 dashboard CTAs/zeros (P3) · F-23 mobile list header (P3) | T1 2 actions/≈1.0 s; CV review evidence design; accessible weight sliders |
| **Hiring Manager** | F-12 three different counts (P2) + HR list items that apply to HM (F-03, F-05, F-06, F-07, F-14, F-22) | department scope correct; out-of-scope = not found (ADR-0002) |
| **Interviewer** | shares F-13, F-18, F-14 (status labels in list) — no Interviewer-specific defect found | focused nav (3 items), "Phiếu của bạn" column, "Cần xử lý" grouping. **Phiếu đánh giá form not opened** (production write risk) → carried over (P01-11) |
| **Admin** | shares HR findings; admin pages axe-clean | consistent Forbidden page; admin pages render for all 5 sections |
| **platform_admin** | none specific | empty state in "Chờ duyệt" is clear and actionable; axe clean |
| **Staff at login** | F-17 two h1 (P3) · F-24 login LCP 3.1 s (P3) | clear Vietnamese errors incl. disabled-company message |
