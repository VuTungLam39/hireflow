# 03 — Findings by Workflow (dimension B)

> Workflows from Phase 00 file 06. Writes were observed up to the control, never executed.

| Workflow | Path quality | Findings |
|---|---|---|
| W-01 Candidate find & apply (T3) | 3 clicks / ≈2.3 s system time; filters URL-synced | F-01, F-04, F-02, F-11; apply submission UX not exercised |
| W-02 Candidate tracking link | invalid token → clear message | F-24 (LCP 4.2 s); valid-token view UNK (needs real application) |
| W-03 Employer registration | form + check-email + verify pages clear | — (submission not exercised) |
| W-10 HR daily triage (dashboard) | task list with deep links | F-21, F-12 (HM) |
| W-12 HR review application & CV (T1/T2) | T1 2 actions; T2 needs 3 actions incl. a navigation | **F-07** (quick view w/o decisions), F-08 (late errors), F-03 (1024), F-22 (mobile), F-14 (labels) |
| W-13 HR ranking | weight sliders accessible; table quick | F-05, F-06, F-20, F-19 |
| W-11 HR jobs | list + workspace dialog | F-15 ("Xếp hạng ứng viên" action label) |
| W-20 Hiring Manager | scoped list/detail correct | F-12 |
| W-30 Interviewer feedback | assigned list + "Cần gửi phiếu" | phiếu form not opened → carried over (P01-11) |
| W-40 Admin | all admin pages render | — |
| W-50 platform_admin | tabs + clear empty state | — |
| W-15/16 Interviews & Offer | source-level only (writes) | F-14, F-16 (terminology) |

**Biggest workflow-level opportunity:** collapse T2 — decision from the quick view or a single review surface (F-07), keeping the confirm + reason step (ADR-safe).
