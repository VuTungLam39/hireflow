# 07 — Remediation Plan (proposed slices, owner schedules)

Each slice is one mattpocock loop: issue → test first → smallest fix → PR. Order = severity, then dependency.

| # | Slice | Findings | Size | Blocks | Status |
|---|---|---|---|---|---|
| R1 | **Tenant-scope bulk status + harden `transition()`**: filter bulk load by org/department scope; lock rows by `id + organization_id`; extend cross-tenant e2e to routes taking IDs in the body (bulk-status first, then a generic body-ID sweep) | SG-01 | S | **Gate re-check; real data; Phase 05 slices touching applications** | **Merged 25/11** — PR #139, merge `4218b5d`; Render deploy `hireflow-api` success |
| R2 | **ADR-0002 on writes**: `findWritable` and bulk result return not-found for out-of-org and out-of-department; cross-tenant e2e requires 404 (drop 403 from the allowed set) | SG-02 | S | Phase 05 tenant-boundary slices | **Implemented 25/11** — PR #140 merged into the R1 branch by mistake (base not retargeted) → re-landed via **PR #141**; see R2 record |
| R3 | **Evidence visibility + years check**: detect evidence that exists only in invisible text (PDF text render attributes) → flag, no credit; derive/cap `years` from quoted span or experience dates; add adversarial CVs (hidden text, injected instruction) to `ai/eval` with a pass threshold | SG-03 | M (spike first on PDF visibility detection) | **Phase 05 CV-pipeline/scoring slices; real data** | **Implemented 25/11** — PR (R3 branch `fix/sg03-r3-evidence-visibility`); see R3 record |
| R4 | Drop demo-fill constant from production builds | SG-04 | XS | — | Non-blocking, ride-along |
| R5 | Tracking token out of the query string (fragment or one-time exchange); stop echoing query in error `path` | SG-05 | S | — | Non-blocking, ride-along |
| R6 | Forgot/reset password (or documented platform recovery procedure) | SG-06 | M | before real companies onboard | **Implemented 25/11** — PR (branch `feat/r6-password-reset`); see R6 record |
| — | SG-07 | accept as informational (900 s window, per-request revalidation) | — | — | Accepted informational (owner 24/11) |

Pre-Phase-05 set: **R1, R2, R3**. R1 must land before any real company data, regardless of Phase 05 timing.
After R1–R3: re-run file 08 checks + the new e2e, then issue a gate re-check verdict.

Carry-forward (not security, logged so it is not lost): code still contains "Đề nghị"/"Đã nhận" against DL-08 → Phase 05 terminology slice.

## R1 record (25/11/2026)
- **Branch:** `fix/sg01-r1-bulk-status-tenant-scope` off `main @ eb122fa`. Kickoff baseline note ("after PR #123", "parallel with Slice 4") was stale — main had moved to Slice 6; R1 ran in its own session after Phase 05 paused for the gate (P5-D09b).
- **Reproduced locally first (test red):** as org B Admin, `POST /applications/bulk-status` with org A ids → `succeeded: [A ids]`, both A applications INTERVIEW → REJECTED.
- **Fix (`applications.service.ts`):** (1) bulk load adds `app.organizationId = orgIdOf(user)` → other-org ids are never loaded and are reported `NOT_FOUND`, identical to a non-existent id (ADR-0002); (2) `transitionIn()` locks by `id + organization_id` → the last trusted point refuses other-org applications for every caller (manual status, bulk, offer flow).
- **Scope note vs this file:** "org/**department** scope filter" — the department part of the bulk result (`SCOPE_FORBIDDEN` for HM out-of-department) is left unchanged: it is the 403-vs-404 oracle owned by **R2** (row above names "bulk result … out-of-department"). Recorded here, not silently expanded.
- **Tests (`be/test/cross-tenant.e2e-spec.ts`):**
  - bulk-status with A ids → `failed: NOT_FOUND` for each, same as a random UUID; no status change, no audit row.
  - `transition()` called directly with an org B user on an A application → `NotFoundException`, status unchanged.
  - **Generic body-ID sweep:** routes discovered from Nest metadata (non-GET, non-public, `@Body` DTO with `id`/`…Id`/`…Ids` fields, nested DTOs followed) — **10 routes**: `POST /jobs`, `PATCH /jobs/:id`, `PATCH /jobs/:id/hiring-manager`, `PUT /jobs/:id/interview-stages`, `POST /applications/bulk-status`, `POST /users`, `PATCH /users/:id`, `PATCH /interviews/:id`, `PUT /interviews/:id/feedback`, `POST /applications/:applicationId/interviews`. Each runs on org B's own resources twice: with org A ids → must be refused; with org B ids (control) → must succeed, proving the body is otherwise valid. A new route with body ids and no case fails the test.
  - **Result:** 10/10 refuse org A ids; 10/10 controls succeed. **No same-class hole besides bulk-status** — no follow-up ticket needed.
  - Net check: with the service fix reverted, 4 tests fail (sweep, direct transition, bulk-status, "A untouched"); with it, all pass.
- **Not done here (by design):** production authenticated probes (W8) — belong to the gate re-check. Next slice: **R2 (SG-02)**.

## R2 record (25/11/2026)
- **Branch:** `fix/sg02-r2-adr0002-writes`, stacked on R1 (`fix/sg01-r1-bulk-status-tenant-scope`, PR #139 not yet merged). Retarget to `main` after #139 merges.
- **Tests first (red):** cross-tenant e2e path-param sweep now requires **404** (403 dropped; only a role-level `403 FORBIDDEN` from `PermissionsGuard`, raised before any lookup, is still accepted — the ADR-0002 permitted exception, e.g. Admin công ty on `/platform/*`); new test sends **valid bodies** to `PATCH …/status`, `POST …/notes`, `POST …/rescore` on an org A application as org B and requires `404 NOT_FOUND` with the same message as a random UUID (empty-body requests stop at 400 validation and never reached the lookup); `applications.e2e` HM out-of-department note write now expects 404 `NOT_FOUND` (was 403 `SCOPE_FORBIDDEN`). Red before the fix: rescore 403, status/notes/rescore 403 `SCOPE_FORBIDDEN`, HM note 403.
- **Fix (`applications.service.ts`):** `findWritable()` throws the same `NotFoundException('Application not found')` for missing, out-of-organization and out-of-department (HM) applications; bulk result reports `NOT_FOUND` for out-of-department ids (completes the department half R1 left to R2).
- **Contract note:** `SCOPE_FORBIDDEN` is no longer emitted by the backend; the enum value and the FE message map entry are kept (removing them is a contract change — propose separately if wanted). FE impact: an HM opening a write on an out-of-department application now sees the not-found state instead of "ngoài phạm vi phòng ban".
- **Verified:** BE e2e 352/352, unit 462/462, lint/typecheck clean; with the fix reverted 3 tests fail. Next: **R3 (SG-03)** — spike first, separate session.
- **Landing incident:** #140 was merged after #139 while its base was still the R1 branch → R2 commits reached `fix/sg01-r1-bulk-status-tenant-scope`, not `main`. Detected by checking `origin/main` (R2 commits absent); re-landed unchanged via PR #141 (`fix/sg02-r2-adr0002-writes` → `main`).

## R3 record (25/11/2026)
- **Branch:** `fix/sg03-r3-evidence-visibility` off `main @ 85363a8` (after #141).
- **Spike (PDF visibility):** pdf.js operator list exposes fill colour (normalised to `setFillRGBColor "#rrggbb"`), text render mode and font size per `showText`; text placed outside the page box is already dropped by pdf.js text extraction. No new dependency (unpdf's bundled pdf.js).
- **Fix 1 (`cv-parser.ts`):** PDF text runs that a reader cannot see — render mode 3/7, fill near-white (all channels ≥ 0xF0), effective font size < 2 pt — are cut from the extracted text before it is stored. Hidden text therefore never reaches the LLM (hidden injection is gone too) and a quote taken from it fails BR-AI-03 verification → `match = 0`, flag `UNVERIFIED_EVIDENCE`, quote kept as `rejectedEvidence` (= "flag, no credit"). Normal PDFs give identical text (cuts only happen for hidden runs).
- **Fix 2 (`scoring.ts`, `yearsCap`):** LLM `years` is capped by max(years stated in the quote, career span from date ranges in the CV text, e.g. `03/2018 – nay`). No basis → 0 → requirement with `minYears` gets 0.5.
- **Eval (`ai/eval`):** new `cv11-hidden-text` (PDF with white, invisible and 0.5 pt lines: backend skills, B2B/CRM, AI instruction); `cv06-injection` and `cv11` marked adversarial. Pass threshold: every adversarial CV scores ≤ its expected score; `npm run ai:eval` exits 1 otherwise and the report shows the row. The fake LLM obeys cv06 by design → 1/2 in unit tests; the real-provider run is part of the gate re-check.
- **Verified:** BE unit 468/468, e2e 352/352 (one run had a flaky failure in the SG-01 sweep; passed alone and on full rerun), lint/typecheck clean.
- **Known limits (shortcut, in code):** CTM scale, transparency (ExtGState `ca`), text same colour as a non-white background, text covered by shapes, and DOCX hidden runs (`w:vanish`, white font) are not detected. Already-parsed CV text in the DB keeps hidden text until re-parsed — no real data yet, so no backfill.
- **Next:** gate re-check (file 08 checks + new e2e + real-provider `ai:eval`).

## R6 record (25/11/2026)
- **Branch:** `feat/r6-password-reset` off `main @ 7119264`.
- **Owner decisions (25/11):** link single-use, **30 min** TTL, a new link cancels the previous one, **3 emails/hour per account + 3 requests/hour per IP**, same 202 answer whether or not the email exists (BR-ACC-09); after reset **revoke every session** and send the user to `/login` (no auto sign-in).
- **BE:**
  - `POST /auth/forgot-password` (public, 202 always, `@Throttle` 3/h/IP): unknown or inactive account → no email; otherwise invalidates unused reset tokens, issues `randomBytes(32)` token stored as SHA-256 hash (`auth_tokens`, kind `RESET_PASSWORD`), enqueues email; per-account cap 3/h counted from `auth_tokens`.
  - `POST /auth/reset-password` (public, 10/min): password rule = BR-ACC-06; token consumed and password updated **in one transaction** (`used_at IS NULL AND expires_at > now()`, active user only) → `TOKEN_INVALID` otherwise (no reason given); then `revokeAllForUser`. Log line with hashed user id only.
  - Email link puts the token in the **URL fragment** (`/reset-password#t=…`) so it never reaches server/proxy logs or `Referer` (R5 direction).
  - Migration `1792600000031-AddPasswordReset`: enum value `RESET_PASSWORD`; `CK_auth_tokens_target` rewritten with `kind::text` so the new value is usable inside the migration transaction.
- **FE:** "Quên mật khẩu?" on `/login`; `/forgot-password` (generic confirmation, 30-minute note); `/reset-password` reads `#t=`, **removes the fragment from the address bar/history immediately**, new password + confirm, success → `/login` with notice; invalid/used/expired → one "Link không còn hiệu lực" screen with "Gửi lại link".
- **Tests:** BE e2e `password-reset.e2e-spec.ts` — unknown/inactive email: 202, same message, no email; link in fragment; weak password 400; reset → old password 401, new 200, old refresh session 401; token reuse `TOKEN_INVALID`; new link cancels old; expired refused; per-account cap 3 emails for 4 requests; 4th request from one IP 429. BE unit: template link in fragment, not query. FE: 4 tests (login link + generic answer, fragment read + stripped + reset → login notice, used token, missing token). BE unit 470, FE 344, lint/typecheck/build exit 0. **BE e2e not run locally** (Docker/Postgres not running on this machine) — CI runs `migration:run` + e2e.
- **Not done:** production smoke (needs a real mailbox to receive the link; Mailjet in prod) — owner to decide which account to test with.

