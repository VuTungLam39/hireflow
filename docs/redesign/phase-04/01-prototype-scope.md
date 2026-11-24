# 01 — Prototype Scope (draft for Checkpoint 1)

Selection score per §04.1: business impact (B) × interaction complexity (I) × data density (D) × actors (A) × change risk (R), each 1–3.

| # | Area | B | I | D | A | R | Decision |
|---|---|---|---|---|---|---|---|
| 1 | **CV Review** (application detail + evidence margin) | 3 | 3 | 3 | 3 (HR, HM, Interviewer) | 3 | **IN — floor [D-07]** |
| 2 | **Candidate Ranking** | 3 | 3 | 3 | 2 (HR, HM) | 3 | **IN — floor [D-07]** |
| 3 | **Application Pipeline** (list → triage) | 3 | 2 | 3 | 2 | 3 | **IN** (owner) |
| 4 | **Public browse → apply** (+ tracking) | 3 | 2 | 2 | 1 (Candidate) | 3 | **IN** (owner) |
| 5 | **Interview Evaluation** (Phiếu đánh giá) | 2 | 2 | 1 | 2 (Interviewer, HM) | 2 | **IN** (owner) |
| 6 | Interview Scheduling | 2 | 2 | 1 | 2 | 1 | OUT — form-heavy, low DNA risk; contracts suffice |
| 7 | Job Creation | 2 | 2 | 1 | 1 | 1 | OUT (stretch) — only if 1–5 complete without thinning |
| 8 | Candidate Profile (Kho ứng viên) | 2 | 1 | 2 | 2 | 1 | OUT (stretch) — reuses Candidate Card + CV Review |
| 9 | Dashboard | 2 | 1 | 2 | 3 | 1 | OUT (stretch) — concept already rendered in Phase 02 |

## Areas IN

### P1 — CV Review (high fidelity: the DNA itself is the question)
- **Workflow:** open hồ sơ → read Mức phù hợp → follow each criterion to its Căn cứ in the CV (two-way linking) → inspect "Có căn cứ bị loại" → read Phiếu đánh giá summary → "Chuyển trạng thái" with reason (Từ chối) → confirmation.
- **Actors:** HR (primary), HM (read + decide in scope).
- **Answers:** F-05, F-06, F-20, F-22, F-07; RR-07, RR-08; DL-16 (decision only here); SG-03/R3 presentation (CV pane = extracted text layer).
- **States:** loading (skeleton), CV unreadable (AiStatus FAILED "Không đọc được CV"), Đang đọc CV, not-found (ADR-0002 one design), permission-denied for action (in scope), error on submit (dialog stays open), 390 px accordion mode.
- **Baseline:** T2 proxy ≈2.0 s / 3 actions to evidence + decision controls; T3 3 clicks ≈2.3 s.

### P2 — Candidate Ranking (high fidelity for dots/weights; mid for layout)
- **Workflow:** open tin → Xếp hạng hồ sơ → adjust Trọng số → see order change → expand a row to read quotes → open hồ sơ.
- **Actors:** HR, HM.
- **Answers:** F-05, F-06, F-20, F-19 (ranking table → DataTable variant); RR-04, RR-07.
- **States:** loading, no scored hồ sơ yet (empty), stale weights after JD change, 1024 fit, 390 cards.
- **Baseline:** T3 (3 clicks ≈2.3 s to "why").

### P3 — Application Pipeline (mid fidelity)
- **Workflow:** applications list (64 rows) → search → filter "Bộ lọc (n)" → open quick-view Sheet (read-only) → "Mở chi tiết" → decide; bulk Sàng lọc for 3 selected.
- **Actors:** HR.
- **Answers:** F-03, F-04, F-07, F-19, F-23; RR-02, RR-04, RR-05, RR-08; DL-16.
- **States:** loading, empty filter result, error + retry, stale notice, bulk result summary (succeeded / không đổi / lỗi).
- **Baseline:** T1 2 actions ≈1.0 s.

### P4 — Public browse → apply (+ tracking) (mid fidelity, mobile-first)
- **Workflow:** /jobs at 390 → filter sheet → job detail → apply (2 fields + CV) → success with tracking promise → tracking page.
- **Actors:** Candidate (guest, ADR-0001).
- **Answers:** F-01, F-02, F-04, F-10, F-24; RR-01, RR-05, RR-10, RR-11, RR-16; DL-17.
- **States:** expired job (≤30 days) with apply disabled, stale data notice, upload error (wrong type / >5 MB), public 404, tracking invalid token, public stage labels (never "Offer").
- **Baseline:** none in Phase 01 for apply (production write) → proxy: steps count + unassisted completion; stated as proxy.

### P5 — Interview Evaluation / Phiếu đánh giá (mid fidelity)
- **Workflow:** Interviewer opens assigned Buổi phỏng vấn → sees hồ sơ summary + criteria → fills Phiếu đánh giá → submit → HM sees it in CV Review.
- **Actors:** Interviewer, HM.
- **Answers:** Phase 01 Unknown (Phiếu đánh giá form UX), IR-6; GLOSSARY Phiếu đánh giá.
- **States:** not assigned → not-found, already submitted (read-only), validation errors, save error.
- **Baseline:** none (form never exercised — production write) → proxy: unassisted completion + error recovery.

## Validation method (to be fixed by the owner's participants line)
Until the owner names participants, the plan assumes **"internally validated only"** wording: structured cognitive walkthroughs by Claude + the owner's own pass. If 3–5 external participants are confirmed, file 03's kit is used by the owner and findings may be worded as walkthrough results.
