# Phase Report — Phase 00 Product Reconnaissance

Phase: 00 — Product Reconnaissance (read-only)
Status: **PASSED**
Date: 2026-11-24
Branch examined: `main` @ `04ac5b7` (read-only detached worktree) + live site https://hireflow-gray-zeta.vercel.app
Governing document: `docs/hireflow-master-plan-v1.2-consolidated-en.md` (read in place, DL-00)

## 1. Objective

Establish with evidence what HireFlow currently is — repository, architecture, routes, actors/permissions, workflows, components, states, visuals, responsive/a11y/performance baselines — before any redesign decision.

## 2. Scope completed

Workstreams A–J completed for: source code; public surface (guest); signed-in surface for **all five staff roles — Admin, HR, Hiring Manager, Interviewer, platform_admin**. Deliberately not executed: any step that writes production data.

## 3. Deliverables

`README.md`, `01-repository-map.md`, `02-architecture-map.md`, `03-route-and-page-inventory.md` (03+04), `05-actor-permission-matrix.md`, `06-workflow-map.md`, `07-component-and-layout-catalog.md` (07+08), `09-ui-state-inventory.md`, `10-visual-reconnaissance.md`, `11-interaction-animation-inventory.md`, `12-responsive-audit.md`, `13-accessibility-baseline.md`, `14-performance-baseline.md`, `15-document-code-discrepancies.md`, `16-risk-and-dependency-register.md`, `17-phase-01-audit-backlog.md`, `screenshots/` (guest 39, hr 28, hiring-manager 8, interviewer 8, admin 2, platform-admin 3 = 88 PNG). Domain docs: `/GLOSSARY.md`, `docs/adr/0001-candidate-is-a-guest-actor.md`, `docs/adr/0002-out-of-scope-resources-return-not-found.md`. Owner-facing Vietnamese summaries: `docs/ket-qua/`.

## 4. Verified facts (highlights)

- Stack matches plan §2.1 except: no Radix (hand-rolled primitives); `axe-core` already a devDependency.
- 10 public + 1 guest + 20 protected routes, plus 4 URL-state detail dialogs; CV review lives in `/applications/:id`.
- **platform_admin exists** (source + runtime: `role=platform_admin`, `organization=null`, lands on `/platform/companies`).
- **Candidate is a guest actor** (no role; token link) — DL-02 / ADR-0001.
- **Role × route matrix: 70/70 observed cells match the BE permission table** (5 roles × 14 routes).
- HM department scope and Interviewer assigned scope work at runtime (HM 9 vs HR ≥20 applications; Interviewer 3 applications / 3 jobs; out-of-scope record → not-found, no leak — ADR-0002).
- Disabled company blocks login (`403 ORG_DISABLED`).
- Public pages are prerendered; snapshot is stale (15 vs 13 jobs) and masks loading/error states.
- Public header links overlap at 320–430 px.
- axe: 0 violations on 6 public + 7 internal critical pages; Lighthouse mobile perf 97 / 81 / 76 (`/jobs`, `/companies`, `/login`).

## 5. Findings

See files 15 (21 discrepancies), 16 (15 risks), 17 (Phase 01 backlog P01-01…P01-21 + Security Gate flags SG-F1…F4 + carry-forward notes).

## 6. Decisions (decision log) and rules applied

| ID | Decision |
|---|---|
| DL-00 | Examine `main`; read plan in place |
| DL-01 | Critical routes CR-01..CR-13 approved; `/ai-chat` flagged for Security Gate |
| DL-02 | Candidate = guest actor authenticated by token link (ADR-0001) |
| DL-03 | `/jobs` 12-link finding closed (pagination 12/page) |
| DL-04 | `/manage/jobs/:id/edit` (`job:read`) → files 15/17 + Security Gate |
| DL-05 | Phase 01 item: a11y of hand-rolled primitives |
| DL-06 | Demo dataset accepted as verification dataset |
| DL-07 | 2026-11-24 — accounts for Admin, HR, HM, platform_admin provided in-session; credentials never written to any file |
| DL-08 | Grill Q1: "Offer" for status, block, actions, notifications (English kept deliberately); HIRED = "Đã nhận việc"; avoid "Đề nghị", "Đã nhận". GLOSSARY updated; no ADR |
| DL-09 | Grill Q2: Hồ sơ ứng tuyển is the HR working unit (counts, queues, statuses, scores, ranking); Ứng viên = the person (Kho ứng viên, profile); detail page titled with candidate name is not a violation. GLOSSARY updated |
| DL-10 | Grill Q3: out-of-scope resources return "not found"; in-scope + missing action permission = permission-denied. ADR-0002 |

| DL-11 | Grill Q5: Tin tuyển dụng = canonical, all signed-in surfaces (count "tin"); "Việc làm" = public label only (count "vị trí"); no mixing per surface. GLOSSARY; no ADR |
| DL-12 | Grill Q6: "Nhà tuyển dụng" is a public navigation label, not a concept; standalone entry removed; company lifecycle + label note folded into Công ty; registrant described, not termed |
| DL-13 | Grill Q7: add Phiếu đánh giá (one per Interviewer per interview) and Buổi phỏng vấn. Provenance: dashboard copy + source; Interviewer submit-flow **not runtime-verified** (depends on Q4) |
| DL-14 | Q4: owner will reset the Interviewer password; no further login attempts until confirmed |
| DL-15 | 2026-11-24 — owner supplied the corrected Interviewer password; signed in on the first attempt; Interviewer verified; phase re-declared PASSED |

(Owner's paste asked for DL-07..09; DL-07 was already taken, so round 1 is DL-08..10.)

GLOSSARY provenance notes kept here (the glossary itself carries no implementation detail): the locked-company state is runtime-verified as `403 ORG_DISABLED` at login (file 05 §4); Phiếu đánh giá per-interviewer cardinality now observed in the Interviewer UI (column "Phiếu của bạn": Đã gửi / Cần gửi phiếu); the submit form itself was not opened.

Rules applied: **D-01** (mattpocock process; `/grill-with-docs`), **D-05** (Lighthouse, axe-core at audit level), **D-06** (entry criteria / status cap), **D-07** (merged deliverables, critical-routes screenshot scope).

## 7. Unknowns

Valid-token candidate tracking view; Phiếu đánh giá form and submit (production write); action-level permissions (status change, rescore, offer approval, anonymize) at runtime; in-department HM access to job edit; signed-in Lighthouse; cold-start timings; Google Fonts loading method.

## 8. Blockers

None. (Interviewer account verified 2026-11-24; grill rounds 1–2 answered — frontier empty.)

## 9. Files changed

Created only: `docs/redesign/phase-00/**`, `GLOSSARY.md`, `docs/adr/0001-…`, `docs/adr/0002-…`, `docs/ket-qua/*.md` (owner request). **No source file changed.**

## 10. Dependencies changed

**None.** Lighthouse ran via temporary `npx -y lighthouse@12` (npm cache); axe-core injected from cdnjs into the browser page.

## 11. Commands executed

`git fetch origin main`; `git worktree add --detach <scratchpad>/hf-main origin/main`; `node -v`; `playwright-cli open|eval|screenshot|snapshot|run-code` (route probes, sign-in per role, state mocks via `page.route`, screenshots, axe injection, Navigation Timing); `npx -y lighthouse@12 …` ×3; read-only `cat/grep/find/ls/wc/sed` on the worktree.

## 12. Tests executed

Playwright runtime probes (guest + 5 roles), Lighthouse ×3 (public), axe ×14 (6 public, 8 internal). **Not executed:** project unit/contract/E2E tests, build, `check:design`, `fe/scripts/qa/*`, `fe/scripts/perf/*`. **Blocked:** none. **Deliberately skipped:** all production writes.

## 13. Actual test results

Role×route: 70/70 match. axe: 0 violations on 14 pages. Lighthouse (mobile, single run): `/jobs` 97/100/100/100, `/companies` 81/100/100/100, `/login` 76/100/100/63 (perf/a11y/bp/seo). Responsive: header overlap at 320/360/390/430, none at 768.

## 14. Risks

RK-15 shared demo password posted in chat (rotate); RK-05 tenant isolation untested (Security Gate); RK-06 job edit route gate; RK-07 `/ai-chat` LLM surface; RK-08 stale prerender; RK-09 hand-rolled primitives; RK-02 merge = release. Full list: file 16.

## 15. Definition of Done (plan §00.15)

| Item | Status | Evidence |
|---|---|---|
| Repository architecture is mapped | ✔ | 01, 02 |
| Actual routes are inventoried | ✔ | 03 (router + guest + signed-in) |
| Actors and permissions verified or marked unknown/blocked | ✔ | 05 — 5 staff roles RV; Candidate = guest (ADR-0001) |
| Critical workflows are documented | ✔ (writes observed up to the control) | 06 |
| UI components and layouts are catalogued | ✔ | 07 |
| UI states are inventoried | ✔ for critical routes (secondary states partial per D-07) | 09 |
| Screenshots have sufficient context within §00.10 | ✔ | `screenshots/` (88, all actors) |
| Responsive, a11y, performance baselines documented | ✔ (signed-in Lighthouse = limitation) | 12, 13, 14 |
| Documentation/source discrepancies identified | ✔ | 15 |
| Risks and blockers are recorded | ✔ | 16 |
| Phase 01 backlog is prepared | ✔ | 17 |
| No unapproved source changes | ✔ | §9 |

**Gate [D-06]:** all four entry criteria met (criterion 3 via accepted limitation DL-06). All DoD items satisfied with evidence → **PASSED**.

## 16. Next prerequisites

Owner review of this report and files 15/17; rotate demo passwords (RK-15). Phase 01 starts only on an explicit instruction (and Security Gate follows Phase 01).

## Skill / Tool Execution Log (plan §5.5)

```text
2026-11-24 | 00 | playwright-cli 0.1.25 | microsoft/playwright | C:\Users\Admin\.claude\skills\playwright-cli\SKILL.md (read)
Task: tooling check, guest probes, sign-in per role, state mocks, 80 screenshots, timing | Status: Verified
2026-11-24 | 00 | Lighthouse 12.8.2 (temporary npx) | public pages ×3, single run | Status: Partially verified
2026-11-24 | 00 | axe-core 4.10.2 (cdnjs, audit level, D-05) | 13 pages | Status: Verified
2026-11-24 | 00 | diagnosing-bugs | C:\Users\Admin\.claude\skills\diagnosing-bugs\SKILL.md (exists) | Status: N/A — contradictions were explained by source reading (catch-all placement, prerender, scoped not-found)
2026-11-24 | 00 | grill-with-docs → grilling + domain-modeling | C:\Users\Admin\.claude\skills\grill-with-docs\SKILL.md, ...\grilling\SKILL.md, ...\domain-modeling\SKILL.md (+ GLOSSARY-FORMAT.md, ADR-FORMAT.md) read
Output: GLOSSARY.md, ADR-0001, ADR-0002; rounds 1–2 answered, frontier empty | Status: Verified
```
