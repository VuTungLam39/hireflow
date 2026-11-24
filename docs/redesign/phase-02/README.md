# Phase Report — Phase 02 Design DNA & Creative Direction

Phase: 02 · Status: **PASSED** · Date: 24/11/2026
Baseline: `feat/mvp31-s5-release @ 24775d3`. Phase 00 PASSED, Phase 01 PASSED, Security Gate ran (GATE FAILED, R1–R3 scheduled). None blocks Phase 02: it changes no code and depends on the gate having run, not on remediation (plan §02.10, gate README).

## Opening declarations
- Inherited constraints: Vietnamese UI; **no dark mode** [D-09]; DL-18 device posture; DL-16 read-only quick view; DL-17 expired jobs; terminology DL-08..DL-13; motion CSS/WAAPI only (GSAP/Three.js decided against).
- Exploration: three directions each derived from a different cluster of Phase 01 findings — A from the evidence findings (F-05/06/20/22, RR-07, RR-16), B from density/consistency (F-03/19, RR-04/08), C from mobile/task clarity (F-01/04/12/21). Appendix B read only to avoid anchoring; none of its three hypotheses is reused as-is.

## 1. Objective
Derive a new Design DNA from the brief and Phase 01 evidence; compare 2–3 directions; owner chooses; freeze.

## 2. Scope completed
Brief (13 points), principles (11 + 5 mandatory edge states), three full directions (13 concept items each, RR mapping, weaknesses, edge states), comparison with workflow evaluation and one recommendation, GLOSSARY terminology table.

## 3. Deliverables
`01-product-design-brief.md` · `02-design-principles.md` · `03-direction-a.md` · `04-direction-b.md` · `05-direction-c.md` · `06-direction-comparison.md` · GLOSSARY.md "Thuật ngữ giao diện". `07-approved-design-dna.md` · `08-design-decision-log.md` · `concepts/` (split.html, ledger.html, dashboard.html, a.css, 12 screenshots — concept material).

## 4. Verified facts
Current labels read from source (`fe/src/features/applications/constants.ts`, `jobs/constants.ts`, `TrackApplicationPage.tsx`; enums in `be/src`). Current product claims cite Phase 00/01 files.

## 5. Findings
None new (design phase). Terminology deltas vs current code (Phase 05 inputs): OFFER "Đề nghị"→"Offer", HIRED "Đã nhận"→"Đã nhận việc", flag "Có bằng chứng bị loại"→"Có căn cứ bị loại", match 0.5 "Một phần"→"Khớp một phần", ranking title → "Xếp hạng hồ sơ".

## 6. Decisions
[D-09] applied (terminology into GLOSSARY, no dark mode, Appendix B not used as candidates). [D-08]: direction quality is argued, not measured.
**Owner decisions at checkpoint (24/11):** Direction A + B's table system (DD-01); labels confirmed (DD-03..05): score bands "Phù hợp cao / một phần / thấp" at 70/40 (thresholds from current `SCORE_GOOD`/`SCORE_FAIR`); "Khớp một phần"; "Có căn cứ bị loại".

## 7. Unknowns
Actual action counts and user acceptance (Phase 04). Internal mobile navigation pattern (Phase 03).

## 8. Blockers
None.

## 9. Files changed
New `docs/redesign/phase-02/*` (9 docs + `concepts/`); `GLOSSARY.md` (appended section). No product code. Not committed.

## 10. Dependencies changed
None.

## 11–13. Commands / tests
Read-only greps of source for labels. No tests (design phase). Concept freeze gate: Playwright (playwright-core from global `@playwright/cli`, Chromium) rendered 3 concepts × 1440/1024/768/390; checks: page h-scroll, element overlap, `document.fonts.check` Vietnamese glyphs, table vs container width, visible rows; WCAG contrast computed for 12 colour pairs. Result: ALL PASS after one revision round (file 07). Script kept in scratchpad, not in repo.

## 14. Risks
Phase 04 validation may still send the direction back [D-08]. Concepts load fonts from Google Fonts (concept only); Phase 03 must self-host.

## Definition of Done (§02.10)
- [x] Brief approved (owner accepted at checkpoint)
- [x] Design principles defined
- [x] Directions compared
- [x] Critical workflows evaluated (design intent, file 06)
- [x] Design DNA finalized (file 07)
- [x] Decisions recorded (file 08)
- [x] Terminology table finalized (3 new labels confirmed) · [x] dark-mode decision recorded (no dark mode)

## Skill / Tool Execution Log (§5.5)
| Skill | Status |
|---|---|
| Anthropic `frontend-design` | **Missing** — not installed in this environment; not used |
| `ui-ux-pro-max` | present (`~/.claude/skills/ui-ux-pro-max/SKILL.md` header read); not executed — palettes/fonts chosen by hand against WCAG targets |
| Emil Kowalski `emil-design-eng` | present (`.claude/skills/`); not executed — motion principles written directly to P9 |
| mattpocock `/grill-me` | not run — owner checkpoint replaces it this round |
| taste-skill browser habit | applied — 1440/1024/768/390 real-browser check of all concepts |
| `.taste-skill/direction.json` | deliberately not read (not a project input) |

## Post-fix re-verification (24/11/2026)
- impeccable detect on `concepts/`: exit 0, **0 unsuppressed findings**. Heading skip fixed (h3→h2 in split.html). The cramped-padding warning was **not** the badge: it targets `.wrap` (ledger table card) — badge guess reverted; judged false positive (cell padding 12px gives the inset) and suppressed for `ledger.html` only, with reason. `cream-palette` suppressed per file (DD-01). Suppressions live in `.impeccable/config.json`.
- Re-render split.html + ledger.html at 1440/1024/768/390: **8/8 clean** (no page h-scroll, 0 overlaps, Vietnamese glyphs OK; ledger table fits container at every width, 918/918 at 1024).

Status: **PASSED**. STOP — awaiting closing-commit instruction; Phase 03 not started.
