# 03 — Validation Scenarios & Facilitator Kit

Validation method (owner, 24/11/2026): **internally validated only** [D-08] — cognitive walkthroughs per scenario (Claude) + the owner's own timed pass. The kit below is also usable for 3–5 external participants if recruited before file 05 is approved.

## Thresholds (§04.4 minimums) and anchors
Pass = (a) completed unassisted · (b) time not worse than the anchor · (c) no context loss (participant never asks "where am I / where did it go").
| Scenario | Anchor (Phase 01 / Phase 00) | Threshold |
|---|---|---|
| S1 CV Review (P1) | **T2 proxy**: ≈2.0 s system time, 3 actions to reach evidence + decision controls (proxy because the real decision writes data) | ≤3 actions to evidence + decision controls; system time ≤2.0 s |
| S2 Ranking (P2) | Phase 00 ranking content ≈1.3 s; **T1-family action count** | ranked list → one hồ sơ's evidence in ≤2 actions; system response ≤1.3 s |
| S3 Pipeline (P3) | **T1**: 2 actions ≈1.0 s to open a hồ sơ from the list | ≤2 actions; system time ≤1.0 s |
| S4a Browse → company (P4) | **T3**: 3 clicks ≈2.3 s | ≤3 clicks; ≤2.3 s |
| S4b Apply (P4) | proxy — no Phase 01 baseline (apply writes data) | unassisted; every validation error recovered on first attempt |
| S4c Tracking (P4) | proxy — valid-token view never observed in Phase 01 | stage understood without explanation; no "Offer" exposure |
| S5 Phiếu đánh giá (P5) | proxy — IR-6, form was Unknown in Phase 01 | unassisted; error recovery on first attempt |
Human timing excludes facilitator talk: start the clock when the participant finishes reading the task card, stop on the success screen; pause while the facilitator speaks.

## Scenario scripts
Each step lists the check(s) (NS next-step clarity · CL context loss · AC action count · FB feedback · ER error recovery · SC scannability · KB keyboard).

### S1 — HR reviews a hồ sơ and rejects it with reason (`p1-cv-review.html`)
1. Read Mức phù hợp and band (SC). 2. Find why criterion 1 "NestJS ≥ 3 năm" is Khớp — reach the quote in the CV (AC, NS). 3. Find which quote was not counted (Có căn cứ bị loại) (SC). 4. Read the two Phiếu đánh giá (SC). 5. Decide Từ chối; try confirming without a reason (ER, FB). 6. Choose "Thiếu kỹ năng bắt buộc", confirm (FB). 7. Keyboard-only repeat of steps 2 and 5 (KB). Also switch `?state=denied` and ask what they can and cannot do (NS).

### S2 — HM finds who is strongest for AWS (`p2-ranking.html`)
1. Open Xếp hạng (NS). 2. Raise Trọng số of AWS to 3; say what changed (FB, SC). 3. Open the evidence of the new first hồ sơ (AC). 4. Open that hồ sơ (CL). 5. Keyboard: J/K + x (KB). Stale state: ask what the notice means (NS).

### S3 — HR triages new hồ sơ (`p3-pipeline.html`)
1. Find "Nguyễn" (SC). 2. Filter to Mới (NS). 3. Preview one hồ sơ, move to next with "Sau" (CL). 4. Try to reject from the preview — expected: not possible, goes to detail (NS). 5. Select 3 and move to Sàng lọc; read the result summary (FB). Error state: recover (ER).

### S4 — Candidate on a phone (`p4-public.html`, 390 px)
a. Find a Hà Nội job via Bộ lọc and open that company's page (AC). b. Apply; submit empty first; fix each error (ER); read the success message and say what happens next (NS). c. Open tracking; say where the application stands (NS). d. Open an expired job; say what to do instead (NS).

### S5 — Interviewer submits a Phiếu đánh giá (`p5-evaluation.html`)
1. Submit empty (ER). 2. Rate both criteria, choose đề xuất, submit (FB). 3. Say whether they can edit it later (NS). Save-error state: confirm nothing was lost (ER).

## Facilitator kit
- **Session script (≈30 min):** consent & recording → "we test the design, not you" → think-aloud practice (1 min) → task cards S1–S5 in order for HR role; S4 only for Candidate role → after each task: "what did you expect to happen?" → debrief (biggest confusion, one thing to change).
- **Role briefs:** *HR* — "You screen 60+ CVs a week for a fintech; you decide who goes to interview." *Candidate* — "You are job hunting on your phone during a commute." *HM* — "You lead the backend team; you only care about candidates for your team." *Interviewer* — "You just finished a technical interview."
- **Recording template (Phase 01 finding format):** Finding ID · Scenario/step · Route · Actor · State · Viewport · What the participant did (verbatim quote if any) · Expected · Actual · Severity P0–P3 · Unassisted? (Y/N) · Time (s, excl. facilitator) · Context loss? (Y/N) · Proposed change.
- **Do not:** help during a task (note it as "assisted"), explain labels, or fill in unrecorded quotes.
