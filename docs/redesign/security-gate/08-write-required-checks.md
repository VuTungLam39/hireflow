 **PENDING owner** — B2 console: bucket type private + anonymous GET → 401/403 | # | Check | Status | How to run |
|---|---|---|---|
| W1 | Org B bulk-status on org A application | **Executed locally 24/11 → FAIL (SG-01)** | temporary spec built from `test/cross-tenant.e2e-spec.ts` fixtures; `POST /applications/bulk-status` as B with `[A.app, randomUUID]` → assert A row unchanged (currently changes to REJECTED). Make it a permanent test in R1 |
| W2 | Org B write calls on org A application (status, notes, rescore) vs random UUID | **Executed locally 24/11 → 403 vs 404 (SG-02)** | same harness; compare status + body |
| W3 | HM / Interviewer `PATCH /jobs/:id` (in and out of department) | Not executed — Source-verified 403 by `PermissionsGuard` | add to `permissions.guard.spec`/e2e: login as HM, PATCH own-department job → expect 403 |
| W4 | Suspend org → existing access token rejected on next request | Not executed | e2e: login HR, platform suspend org, call `/auth/me` with old token → expect 403 `ORG_DISABLED`; refresh → 401 |
| W5 | Logout → refresh token unusable; access token until expiry | Not executed | e2e: login, logout, call `/auth/refresh` with old cookie → 401 |
| W6 | Valid tracking token view + withdraw scope (only that application) | Not executed | e2e: public apply twice (two jobs), use token 1 → only application 1 visible/withdrawable |
| W7 | Hidden-text CV → score credit (SG-03) | Not executed | craft PDF with white-text skill line; run pipeline with fake LLM returning that quote → score rises; then with real provider (owner-approved quota) for injection behaviour |
| W8 | Production cross-company GET probes with real test accounts (ADR-0002 on prod) | Not executed — passwords not provided this session (read-only, allowed) | provide passwords in-session; GET public job ID of company B as HR of company A vs random UUID |
| W9 | B2 bucket is private (no public listing/read) | Not executed — provider setting | owner checks B2 console: bucket type "private"; anonymous GET of an object key → 401/403 |

## Gate re-check run (25/11/2026)
- Baseline `main @ 467b872` (R1 #139, R2 #141, R3 #142). Local stack, fake LLM.
- BE e2e **353/353** (new: W3 case; W4 refresh assertion; W6 isolation assertion). BE unit 468/468.
- An attempted W7 pipeline e2e in `ai-pipeline.e2e` was dropped: adding any 12th upload to that file leaves the last uploaded application in `PROCESSING` (independent of PDF/R3 — a DOCX upload does the same; first cause seen was the 100 req/min per-user throttle hit by 150 ms HTTP polling). Logged as a follow-up to diagnose; not a security finding.
- **Verdict: local checks PASS; gate stays CONDITIONAL until W7 real-provider eval, W8, W9 are done.**

