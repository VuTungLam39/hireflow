# 02 — Findings Register

Severity scale (kickoff §5; plan SG.3 mapping): CRITICAL = P0 · HIGH = P1 · MEDIUM = P2 · LOW = P3.
Evidence labels per master plan §3.2. "Runtime-verified (local)" = reproduced against a local instance (docker-compose DB, temporary e2e harness), never production.

| ID | Area | Severity | Evidence | Location | Summary |
|---|---|---|---|---|---|
| SG-01 | A | **CRITICAL** | Runtime-verified (local) + Source-verified | `POST /api/v1/applications/bulk-status` · `be/src/modules/applications/applications.service.ts:549-573`, `transition()` `:966` | Cross-tenant write: HR/Admin of company B changes status of company A's applications |
| SG-02 | B | MEDIUM | Runtime-verified (local) + Source-verified | `findWritable()` `applications.service.ts:1044-1067`; bulk result `:564` | Write endpoints answer 403 `SCOPE_FORBIDDEN` "outside your organization" for other-org IDs vs 404 for non-existent → existence oracle, violates ADR-0002 |
| SG-03 | F | **HIGH** | Source-verified (mechanism); exploitation by live LLM Not verified | `be/src/modules/ai/scoring.ts` (BR-AI-03), `ai/dto/llm-output.dto.ts:28-30` | Score can be inflated: text invisible in the rendered CV still counts as verified evidence; LLM-asserted `years` is never checked against the quote |
| SG-04 | I | LOW | Runtime-verified (prod bundle, read-only) + Source-verified | `fe/src/features/auth/pages/LoginPage.tsx:14-22`, `be/src/database/seeds/seed-guard.ts:1` | Default seed password and demo account emails ship in the public production JS bundle and the public repo |
| SG-05 | E | LOW | Runtime-verified (prod, invalid token only) + Source-verified | `GET /public/applications/track?t=…`; email link `email.templates.ts:124` | Guest tracking token travels in the query string; echoed in the error body `path`; lands in access logs |
| SG-06 | D | LOW | Missing (Source-verified) | auth module | No forgot/reset-password flow; recovery depends on an Admin |
| SG-07 | D | LOW (informational) | Source-verified | `jwt.strategy.ts`, `auth.service.ts:95` | Logout revokes the refresh family but the access token stays valid until expiry (≤900 s); mitigated by per-request DB check of user/org status |
| SG-08 | I | Accepted risk (RK-15) | Documented-only | — | Shared demo password exposed in chat; owner decision: no rotation (see file 06) |

---

## SG-01 — Cross-tenant status write via bulk-status (CRITICAL)

- **Actor:** HR or Admin of any active company (both hold `application:update_status`; scope `all`).
- **Reproduction (local only):** temporary e2e harness built on the existing `test/cross-tenant.e2e-spec.ts` fixtures (org A with an application in `INTERVIEW`; Admin of org B). B calls `POST /api/v1/applications/bulk-status` with `{ ids: [<A application id>, <random uuid>], status: "REJECTED", reasonCode: "SKILL_GAP" }`.
- **Actual:** `200`, `succeeded: [<A application id>]`, `failed: [<random> NOT_FOUND]`; DB row of org A moved `INTERVIEW → REJECTED`. Audit row is written under org B's organization id (org A sees a status change with no actor of its own).
- **Root cause (high confidence):** the bulk query loads applications by `id IN (:...ids)` with no `organization_id` filter; the only per-row guard is the department check, which is skipped for scope `all`; `transition()` locks the row by `id` only.
- **Why the existing guard rail missed it:** `cross-tenant.e2e-spec.ts` enumerates only routes with a path parameter and sends an empty body; ids-in-body endpoints are outside its net.
- **Precondition:** knowledge of a target application UUID (v4, not enumerable). The `succeeded`/`NOT_FOUND` split also works as an existence oracle for guessed IDs.
- **Impact:** one company can reject/advance another company's candidates — integrity breach of the core tenant property (SG.1-1).
- **Present on:** baseline `a5af803` and `main @ 04ac5b7` (live).
- **Remediation direction:** scope the bulk load with the same `applyDepartmentScope`/org filter as `listQuery`, and make `transition()` (the last trusted point) lock by `id` + `organization_id`; extend the cross-tenant e2e to body-supplied ids.

## SG-02 — ADR-0002 not honoured on write endpoints (MEDIUM)

- **Reproduction (local):** as org B, `PATCH /applications/<A id>/status`, `POST /applications/<A id>/notes`, `POST /applications/<A id>/rescore` → `403 SCOPE_FORBIDDEN "Application is outside your organization"`; same calls with a random UUID → `404 NOT_FOUND "Application not found"`.
- **Read endpoints conform:** `GET /applications/:id`, `/jobs/:id`, `/candidates/:id`, `/files/:id/url` → identical 404 body for cross-org and never-existed (timing 5–9 ms both, same class).
- **Department sub-boundary:** HM out-of-department writes answer 403 "outside your department" (Source-verified). ADR-0002 permits permission-denied only for *in-scope* resources lacking an action permission; an out-of-department application is out of scope → should be not-found.
- **Test gap:** the cross-tenant e2e accepts `[403, 404]`, so it cannot detect this.
- **Impact:** existence of another company's record is disclosed to any HR/Admin who holds its UUID; contradicts an accepted ADR.
- **Remediation direction:** in `findWritable` return the same `NotFoundException` for out-of-org and out-of-department; tighten the e2e to require 404.

## SG-03 — Score inflation through invisible text and unverified years (HIGH)

- **Mechanism (Source-verified):** scoring is deterministic and only accepts evidence that appears verbatim in the extracted CV text (`text.includes(normalizeText(evidence))`). That guarantees the quote exists in the *text layer*, not that a human reading the CV can see it. White/hidden text, off-page text or tiny fonts in a PDF are extracted, quoted, and pass verification.
- `years` (0–50, from the LLM) decides `match = 1` vs `0.5` for requirements with `minYears`, and is never cross-checked with the evidence quote. A CV line such as hidden "NestJS – 8 năm" (no injection needed) or an injected instruction could raise it.
- Delimiter break-out is handled (`<cv>` tags stripped; system prompt says CV is data). Output schema is strict.
- **Not verified:** whether the configured production LLM obeys an injected instruction (needs a real-provider run; fake LLM in e2e cannot show it).
- **Impact:** a candidate can move their own score and pass MUST criteria without visible basis — the product's "evidence-backed" promise fails exactly where it is sold.
- **Remediation direction:** flag evidence found only in non-visible text (PDF render/colour/size check at extraction) or show the CV text layer as the primary evidence view; derive or cap `years` from the quoted span / experience dates; add an adversarial CV to the AI eval set.

## SG-04 — Seed password and demo emails in the public bundle (LOW)

- Production `assets/LoginPage-*.js` contains the default seed password string and 6 demo emails; the repo is public. Owner confirmed (24/11) the production demo password is **different**, so this is not a live credential. Remote seeding refuses the default password (`seed-guard.ts` strong-password check).
- **Impact:** account-name enumeration for the demo company; any non-production environment seeded with defaults is open.
- **Remediation direction:** keep the demo-fill block out of production builds (compile-time `import.meta.env.DEV`), or drop the constant.

## SG-05 — Tracking token in URL (LOW)

- Token: 256-bit `randomBytes(32)`, stored as hash, TTL 90 days, scoped to one application, view exposes job title/company/stage only; withdraw takes the token in a POST body; API sends `Referrer-Policy: no-referrer`. Throttled 30/min (track) and 10/min (withdraw).
- Weakness: query-string token is written to platform access logs and browser history, and the error body echoes `path` including the token.
- **Remediation direction:** move the token to the URL fragment or exchange it once for a short-lived cookie; stop echoing query strings in error `path`.

## SG-06, SG-07 — see file 04.
