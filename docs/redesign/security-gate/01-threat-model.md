# 01 — Threat Model

Baseline: `feat/mvp31-s5-release @ a5af803` (backend identical to live `main @ 04ac5b7` for every file cited). Built from source, not from documents.

## Assets
| Asset | Where | Why it matters |
|---|---|---|
| Tenant data isolation | every table carries `organization_id`; filters in `common/utils/department-scope.ts` | one company must never see or change another's jobs, candidates, CVs, scores |
| CV files | S3-compatible storage (B2 in prod), `cv_files` | candidate PII |
| Candidate PII | `candidates`, CV text, CV chunks (RAG) | privacy, anonymisation duty |
| Scoring integrity | `ai/scoring.ts`, `cv_profiles`, `applications.score*` | the product's promise: evidence-backed scores |
| Platform administration | `/platform/*` | approves/suspends companies, sets AI limits |
| AI spend | `ai_usage`, per-org daily limits | cost abuse |

## Actors
- **Guest candidate** — no account; applies publicly; holds a tracking token (ADR-0001).
- **Company roles** — Admin, HR (scope all), Hiring Manager (department + assigned jobs), Interviewer (assigned interviews only).
- **platform_admin** — no organization; only `platform:manage`; `dataScope = none`.
- **External attacker** — unauthenticated; can register an employer (pending approval) and submit CVs.
- **Malicious candidate** — controls CV content fed to the LLM.

## Trust boundaries
1. **Public API** (`@Public()`): login/refresh, employer registration, public jobs/companies/media, apply, track/withdraw, signed file content, health.
2. **Authenticated API**: global `JwtAuthGuard` → `PermissionsGuard` (role → permission map) → service-level scope (org, department, assigned).
3. **LLM pipeline**: CV text (untrusted) → PII masking → extraction prompt → strict JSON schema → deterministic scoring with verbatim-quote check; RAG chat over CV chunks.
4. **File storage**: magic-byte checked upload; 5-minute signed URLs (HMAC for local driver, presigned for S3).
5. **Guest tracking tokens**: hashed, 90-day, one application.

## Key controls observed (Source-verified)
- JWT validated every request; user re-read from DB; inactive user → 401; disabled organization → 403 `ORG_DISABLED` (blocks existing sessions too).
- Refresh token: httpOnly, `SameSite=Strict`, path-scoped, rotated, reuse → whole family revoked.
- Login throttle 5/min per email (block 60 s) + 30/min per IP; constant-time bcrypt on unknown email.
- Every read finder goes through an org filter; the cross-tenant e2e suite covers all path-parameter routes.

## Where controls are weakest
Bodies carrying foreign IDs (SG-01), error shape on write paths (SG-02), and the gap between "quote exists in text" and "quote is visible to a human" (SG-03).
