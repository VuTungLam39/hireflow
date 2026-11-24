# 08 — Recruiting Pattern Library

Only patterns whose business function is verified (Phase 00 file 06 workflows, Phase 01 tasks, backend modules). Each composes file 05 components.

| Pattern | Workflow evidence | Composition | Key rules |
|---|---|---|---|
| **Candidate Card** | W3 list on mobile; Kho ứng viên (CR-11) | Card: name, job (context label), ScoreBadge, StatusBadge, one meta line | identity never truncated mid-word; whole card opens Sheet |
| **Candidate Profile Header** | CR-09 | DetailLayout header: name, job, applied date, StatusBadge, ScoreBadge + metric, single "Chuyển trạng thái" | the only decision entry point (DL-16) |
| **CV Review Panel** | W4, T2/T3, CR-09; BR-AI-03 | SplitLayout detail: CV document (`cv-document`, serif) with evidence marks + Evidence Margin (criteria list with MatchBadge, number, quote) | two-way linking (file 06); "Có căn cứ bị loại (n)" disclosure lists rejected quotes; **SG-03/R3 alignment:** the document pane shows the **extracted text layer** that scoring verified against, so a quote that is invisible in the original PDF still appears visibly here; if R3 adds a "not visible in original" flag it renders as a FlagBadge on that criterion — Phase 05 must not design against this |
| **Criterion List / Evidence Margin** | ranking + CV review | numbered list; dots `criterion-dot-*` | numbers identical across ranking dots, highlights, segments (RR-07) |
| **Candidate Ranking** | W4, CR-10 | DataTable `ranking` + weights controls (Trọng số 1–3) | "Xếp hạng hồ sơ"; expansion row shows quotes; no decorative bars (F-20) |
| **Application Pipeline** | W3, statuses enum | stage-grouped sections with counts + compact stage bar | no drag-to-move; transitions in detail with reason |
| **Interview Schedule** | W5, interviews module | list grouped by day; Buổi phỏng vấn rows (time, hồ sơ, vòng, người phỏng vấn) | Interviewer sees only assigned (BR-INT-02) |
| **Interview Evaluation (Phiếu đánh giá)** | W5, `PUT /interviews/:id/feedback` | form: criteria ratings + nhận xét + recommendation | heading "Phiếu đánh giá"; one per interviewer per interview; form UX still Unknown from Phase 01 → validate in Phase 04 |
| **Offer Summary** | W6, offers module (BR-OFFER-01..05) | card: terms, OfferStatusBadge, approval trail, actions by role | "Offer" capitalised; actions only in detail; approve/return by HM phụ trách or Admin |
| **Activity Timeline** | history/notes/audit endpoints | Timeline: status changes (with reason), notes, Phiếu đánh giá, Offer events | reasons shown; actor names |
| **Candidate Comparison** | `GET jobs/:jobId/applications/compare` | DataTable `compare` | columns = hồ sơ (2–4), rows = criteria with quotes |
| **Bulk Candidate Actions** | `POST applications/bulk-status` | BulkActionBar | only Sàng lọc / Phỏng vấn / Từ chối; result summary (R1 will scope it server-side) |
| **Job Summary** | CR-07, public CR-02 | JobRow / JobSummary with surface context label | DL-11 clause; expired state per DL-17 on public |
| **Hiring Progress** | dashboard funnel endpoint | stage counts strip | one definition per unit (RR-13, F-12) |
