# 04 — Validation Findings

**Validation method: internally validated only** [D-08] — (1) automated browser checks (120 renders, 20 scripted flows, keyboard checks), (2) cognitive walkthrough of every scenario by Claude, (3) the owner's pass — **done 24/11/2026, owner verdict: pass**. No external participants; the phrase "validated with users" does not apply to any result here.

## Owner pass (24/11/2026)
Owner verdict: **all scenarios S1–S5 pass**. The owner's returned notes describe each scenario's observed behaviour (states, labels, keyboard) but contain **no human timings and no per-scenario unassisted/context-loss marks**. Therefore:
- *Unassisted* and *no context loss*: owner's overall declaration "đã pass".
- *Time not worse than anchor*: assessed on **action counts + system time** (table below), **not on human seconds**. Human timing is recorded as **not measured**.
- S4d (expired job) answer was not given in the notes; behaviour verified by automated check only.
Owner-pass stumble recorded: **OP-1** (below).

## Results per scenario (system timing + action counts)
System time = scripted step durations in Chromium (no network; file:// prototypes) — it measures the design's interaction cost, not production latency.
| Scenario | Anchor | Actions (scripted) | System time | Unassisted / context loss | Verdict so far |
|---|---|---|---|---|---|
| S1 evidence + decision controls | T2 proxy 3 actions ≈2.0 s | **2** (criterion → quote in CV; Chuyển trạng thái). Quote text itself visible with 0 actions in the margin | 0.13 s (1440) · 0.12 s (390) | owner: pass | **pass** (human time not measured) |
| S1 full reject with reason | — (writes data) | 5 incl. one error recovery | ≈1.0 s (incl. 400 ms simulated save) | owner: pass | error recovery works |
| S2 ranked list → evidence | T1-family ≤2 actions; Phase 00 ranking ≈1.3 s | **1** (expand row) | 0.06 s | owner: pass | **pass** (human time not measured) |
| S2 weight change → re-order | — | 1 | <0.01 s | owner: pass | works; announced (VF-04) |
| S3 list → open hồ sơ | T1 2 actions ≈1.0 s | **2** (quick view → Mở chi tiết) | 0.30 s (1440) · 0.40 s (390) | owner: pass | **pass** (human time not measured) |
| S3 search + filter + bulk | — | 6 | 0.30 s | owner: pass | bulk summary shown |
| S4a browse → company | T3 3 clicks ≈2.3 s | **3** | 0.18 s · 0.15 s | owner: pass | **pass** (human time not measured) |
| S4b apply | proxy | 7 incl. one error recovery | 0.26 s | owner: pass | every error recovered first attempt (scripted) |
| S4c tracking / withdraw | proxy | — | — | owner: pass | withdraw now confirmed (VF-06) |
| S4d expired job | DL-17 | 0 (state) | — | — | apply disabled ✔ |
| S5 Phiếu đánh giá | proxy (IR-6) | 5 incl. one error recovery | 0.33 s | owner: pass | works |

## Findings
| ID | Source | Scenario | Finding | Sev | Disposition |
|---|---|---|---|---|---|
| VF-01 | walkthrough | S1 | Decision dialog opened with "Từ chối" preselected — one Enter could reject | P1 | **resolved in prototype**: no default; must choose; reason field appears only for Từ chối |
| VF-02 | walkthrough | S1 | Confirm button said "Xác nhận từ chối" even when another status was chosen | P2 | **resolved**: label and style follow the chosen status |
| VF-03 | walkthrough | S2 | Trọng số options were bare 1/2/3 | P3 | **resolved**: "1 · ít quan trọng / 2 · quan trọng / 3 · rất quan trọng" |
| VF-04 | walkthrough | S2 | Re-order after weight change was silent for screen readers | P2 | **resolved**: live region "Đã sắp xếp lại theo trọng số mới" |
| VF-05 | browser check | S3 (390) | Card mode: checkbox cell covered the name, tapping the name selected instead of opening | P1 | **resolved**: 44 px checkbox box top-right; carried to Phase 05 as DataTable card-mode rule |
| VF-06 | walkthrough | S4c | "Rút hồ sơ" on tracking page had no confirmation (irreversible for the candidate) | P1 | **resolved**: AlertDialog "Rút hồ sơ này? … không thể hoàn tác", default "Giữ hồ sơ" |
| VF-07 | browser check | S3 | `[hidden]` overridden by component `display` → empty bulk bar overlapped the table | P2 | **resolved**; carried: Phase 05 base CSS keeps `[hidden]{display:none!important}` |
| VF-08 | browser check | S4b (390) | File input forced 427 px page width | P2 | **resolved**; carried: file input full-width rule in FileUploader contract |
| VF-09 | browser check | P1/P5 loading | Loading states had no h1 | P3 | **resolved**: visually hidden h1 + `aria-busy`; carried to edge-state template |
| VF-10 | browser check | S5 | Visually hidden radios outside their labels | P3 | **resolved**; carried: segmented rating = native radios inside positioned labels |
| VF-11 | walkthrough | S1 | Quote text is already visible in the margin, so "reach evidence" is 0–1 actions; the T2 proxy anchor is generous for this design | — | **accepted** — recorded so Phase 05 does not regress to hidden quotes |
| VF-12 | walkthrough | S4 | Prototype cannot show real rendered PDF vs text-layer difference (SG-03) | — | **carried to Phase 05/R3** — CV pane labelled "Nội dung CV đã trích xuất …" as the R3-aligned presentation |

| OP-1 | owner pass | S1, S5 save error | "Thử lại" was plain text — retry meant pressing the confirm button again | P2 | **resolved in prototype**: explicit "Thử lại" button, input kept; carried to AlertDialog/form contracts (slice 2) |

Note on the owner's S3 remark ("why no reject in quick view is not explained"): the Sheet already shows "Để chuyển trạng thái, mở chi tiết hồ sơ." (`p3-pipeline.html` line 35) — recorded as **no change**, wording kept for slice 7.

**Caveat:** the owner built the product, so familiarity favours speed; with no human timings this phase's time criterion rests on action counts and system time only.
