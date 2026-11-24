# Phase Report — Phase 04 Prototype & Validation

Phase: 04 · Status: **PASSED — internally validated only** · Date: 24/11/2026
Baseline: `feat/mvp31-s5-release @ 05baf4b` (Commit G). DESIGN.md lint 0 errors / 0 warnings / 1 info (token summary).
**Validation method: internally validated only** [D-08] — automated browser checks + Claude cognitive walkthroughs + owner pass. No external participants; "validated with users" does not apply.

## 1. Objective
Validate the frozen DNA and design system through the highest-risk workflows and produce the Phase 05 slice spec.

## 2. Scope completed
P1 CV Review, P2 Ranking, P3 Pipeline, P4 public browse→apply→tracking, P5 Phiếu đánh giá (owner-approved scope; stretch areas not built).

## 3. Deliverables
`01-prototype-scope.md` · `02-critical-workflow-prototypes.md` · `03-validation-scenarios.md` (incl. facilitator kit) · `04-validation-findings.md` · `05-approved-implementation-spec.md` · `prototypes/` (5 HTML + `tokens.css` from DESIGN.md + `proto.css/js` + `checks/` scripts, JSON results, 56+ screenshots).

## 4. Verified facts
- 120/120 renders pass (5 prototypes × all states/views × 1440/1024/768/390): no page h-scroll, no overlap, one h1, tables fit containers (1024: 918/918), zero console errors.
- 20/20 scripted flows pass at 1440 and 390; keyboard: J/x, Tabs Home, evidence Enter/Escape, dialog focus return.
- Action counts vs anchors: S1 2 (anchor 3) · S2 1 (≤2) · S3 2 (2) · S4a 3 (3). System times ≤0.4 s per path.

## 5. Findings
13: VF-01..VF-12 + OP-1 — 11 resolved in prototype, 1 accepted (VF-11), 1 carried to R3 (VF-12); three P1s resolved (preselected Từ chối, checkbox covering name at 390, unconfirmed Rút hồ sơ). All resolved items carried as slice constraints in file 05.

## 6. Decisions
Scope P1–P5 + corrected anchors (owner, Checkpoint 1); validation method internal (owner); owner verdict "pass" (Checkpoint 2). [D-07] floor exceeded; [D-08] method stated; [D-02] gating expressed in file 05 (🟢 slices 0–6, 12 read; 🔒 slices 7–11).

## 7. Unknowns
**Human task times not measured** (owner notes had none) — time criterion assessed on action counts + system time only. Real PDF-vs-text-layer behaviour (R3). Real Radix bundle delta (slice 2).

## 8. Blockers
None.

## 9. Files changed
New `docs/redesign/phase-04/*`; `.impeccable/config.json` (7 scoped ignores for prototype files: cream-palette ×5 — DD-01; cramped-padding ×2 — table card false positive); `docs/ket-qua/2026-11-24-phase-04-checkpoint-2.md`. No fe/src, be/. Not committed.

## 10. Dependencies changed
None in the project. Tools: @google/design.md 0.4.0 (scratchpad), playwright-core from global @playwright/cli.

## 11–13. Commands / tests / results
`designmd export --format css-tailwind` · `node checks/check-renders.cjs` (120/120) · `node checks/check-flows.cjs` (20/20) · `impeccable detect` (0 unsuppressed).

## 14. Risks
Builder-run validation biases toward speed and familiarity; Phase 05 inherits the "internally validated only" caveat for every slice.

## Definition of Done (§04.7)
- [x] Critical workflows prototyped (P1–P5)
- [x] Loading, empty, error, permission states considered (per-prototype state switcher, 120 renders)
- [x] Responsive behaviour checked (4 widths, R1–R4, T1–T5)
- [x] Interaction logic confirmed (20 flows, keyboard checks)
- [x] Major usability issues resolved (3 P1 + P2s fixed in prototype)
- [x] Implementation spec approved (owner, 24/11/2026)
- [x] Results reported against §04.4 thresholds with method stated honestly — time criterion on action counts/system time, human time not measured

## Tool log (§5.5)
design.md CLI 0.4.0 · Playwright-core · impeccable hook/detect · frontend-design not installed; ui-ux-pro-max, emil `break-ui`, `/grill-me` not run.

**Status: PASSED — internally validated only.** STOP — Phase 05 not started (new session with its own kickoff).
