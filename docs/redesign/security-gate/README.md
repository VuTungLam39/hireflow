# Phase Report — Phase SG Security Gate [D-02]

Date: 24/11/2026 · Baseline: `feat/mvp31-s5-release @ a5af803` (not pushed; not needed — backend files cited are identical to live `main @ 04ac5b7`).
Governing document: `docs/hireflow-master-plan-v1.2-consolidated-en.md` (read in place, DL-00; kickoff referred to `docs/redesign/master-plan-v1.2.md`, which does not exist). Plan SG.3 names one `findings.md`; the owner's kickoff (newer) defines files 01–08 — followed, with CRITICAL/HIGH = P0/P1.

## Verdict: **GATE FAILED**
Blocking: **SG-01 (CRITICAL)** — cross-tenant status write through `POST /applications/bulk-status`, reproduced locally, present on live `main`.
Also open: **SG-03 (HIGH)** — planned as pre-Phase-05 slice R3; owner must either keep it scheduled or sign an acceptance.
Consequences: no real company data on the live product; no Phase 05 slice touching tenant boundaries, CV pipeline or scoring until a re-check passes. Phase 02 may start (it depends on the gate having run, not on remediation).

## Opening declarations
- Threat model: file 01 (assets, actors, 5 trust boundaries).
- Inherited flags and dispositions:

| Flag | Disposition |
|---|---|
| SG-F1 job edit gated by `job:read` | **Cleared with evidence** (backend requires `job:update`; HM/Interviewer lack it) — runtime write check W3 deferred |
| SG-F2 `/ai-chat` | **Cleared with evidence** for cross-tenant retrieval; injection residual folded into SG-03 |
| SG-F3 track token + `/platform/*` | Token: **confirmed SG-05 (LOW)**; platform: **cleared with evidence** |
| SG-F4 ADR-0002 | **Confirmed finding SG-02 (MEDIUM)** on write paths; reads cleared |
| RK-15 | **Accepted risk SG-08**, expires on real-data onboarding |
| /ai-chat (DL-01) | as SG-F2 |

- Testing environment: production — read-only, unauthenticated only (passwords not provided); local docker-compose — write checks via temporary e2e harness (deleted after run, repo unchanged).

## Findings summary (file 02)
CRITICAL 1 (SG-01) · HIGH 1 (SG-03) · MEDIUM 1 (SG-02) · LOW 4 (SG-04..07) · Accepted 1 (SG-08).

## Deliverables
`01-threat-model.md` · `02-findings-register.md` · `03-tenant-isolation-and-authorization.md` · `04-auth-session-and-guest-token.md` · `05-llm-pipeline-and-files.md` · `06-platform-admin-and-hygiene.md` · `07-remediation-plan.md` · `08-write-required-checks.md`

## Unknowns / not verified
Production authenticated probes (W8); live-LLM injection behaviour (W7); B2 bucket ACL (W9); W3–W6 runtime.

## Skill / Tool Execution Log (§5.5)
| Tool | Use | Note |
|---|---|---|
| `security-audit` skill (`~/.claude/skills/security-audit/SKILL.md`, read 24/11) | method: boundary + result per finding, severity anchors, needs-validation discipline | Installed copy does not name cloudflare as source — provenance vs plan's `cloudflare/security-audit-skill` unverified. Ran in guidance style, single agent: full-audit sub-agent waves and external output dir not used (no sub-agents requested). Owner-authorised read-only prod probing deviates from the skill's "no deployed endpoints" default |
| Source review | 113 handlers, scope helpers, auth, files, AI, RAG | read-only |
| vitest e2e (local) | temporary spec on `cross-tenant` fixtures; existing suite passed | DB `localhost:5433`, fake LLM, `EMAIL_PROVIDER=log` |
| curl (prod, read-only) | 401 sweep, invalid token, bad signature, media traversal, headers, JS bundle grep | no login, no writes |
| git grep | secret patterns over tracked files | values not recorded |

## Files changed
New: `docs/redesign/security-gate/*` (9 files), `docs/ket-qua/2026-11-24-security-gate-ket-qua.md`. No product code changed.

## Owner decisions (24/11/2026)
- Verdict GATE FAILED accepted as correct.
- **R1 (SG-01)** and **R2 (SG-02)** scheduled as pre-Phase-05 slices, mattpocock loop, one PR each, R1 first. R1 keeps class-fix scope (scoped bulk load, `transition()` locks by `id + organization_id`, cross-tenant e2e extended to body-supplied IDs via generic sweep). R2 includes HM out-of-department writes and the e2e change to require 404. R1 must land before any real company data.
- **SG-03:** R3 stays a pre-Phase-05 slice and blocks real data. **No risk acceptance signed.** Order: spike PDF visibility detection first; years derivation/cap and adversarial-CV eval set in parallel.
- R4, R5 non-blocking; R6 before real companies onboard; SG-07 accepted as informational.
- Consequences: Phase 02 may start now. Real data onboarding and Phase 05 slices touching tenant boundaries, CV pipeline or scoring stay blocked until a gate re-check (after R1–R3; closes W3–W9) passes.
- Master plan copied to canonical path `docs/redesign/master-plan-v1.2.md`.

STOP — R1 not started (scheduling only).

**Update 25/11/2026:** R1 implemented (PR #PRNUM) — see file 07 "R1 record". Gate verdict unchanged until the re-check after R1–R3.
