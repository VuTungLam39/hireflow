# 06 — Platform Admin & Hygiene (Areas H–I)

## H. Platform admin [SG-F3 part 2]
- Permissions: only `platform:manage`; `dataScope = none`; `orgIdOf()` throws 403 for any tenant-scoped service → no tenant endpoint works for platform_admin. — Source-verified; Phase 00 runtime: lands on `/platform/companies`, tenant routes blocked.
- Surface: list/detail organizations, approve, reject, suspend, reactivate, set AI limits, queue stats. Detail exposes org profile, admin contact email and AI usage counts — **no candidate, application or CV data**. — Source-verified.
- Locking: suspend → `ORG_DISABLED` for logins and existing sessions (see file 04).
- Logging: approve/reject/suspend/reactivate/AI-limit changes write audit rows (`OrgApproved`, `OrgRejected`, `OrgSuspended`, `OrgReactivated`, `OrgAiLimitsUpdated`). — Source-verified.
- Blast radius of a compromised platform account: can suspend every company (availability) and raise AI spend limits (cost); cannot read tenant data.
- **SG-F3 (platform part) disposition: cleared with evidence.** No finding.

## I. Credential & secret hygiene
### RK-15 — ACCEPTED RISK (SG-08)
- Fact: the shared password of the demo test accounts was posted in chat (Phase 00).
- Owner decision (24/11/2026): no rotation — demo accounts, demo data only (DL-06). Owner also confirmed this password is **not** the repository's default seed password.
- **Hard condition:** that password must never be reused for any real account or any environment holding real company data. The acceptance **expires the moment real data is onboarded**; the gate re-opens on this point then.

### Repository secret grep (tracked content at `a5af803`, incl. newly committed docs)
Patterns: cloud/API key prefixes, private-key headers, credentialed connection strings, `password|secret|api_key|token = "<8+ chars>"`. Values not reproduced here.

| File | Hit | Assessment |
|---|---|---|
| `.github/workflows/ci.yml:93` | Postgres URL with password for the CI service container on localhost | test-only, not a secret |
| `README.md:386` | Neon URL template with placeholder user/password | placeholder |
| `README.md:439, 481` | example env assignments | placeholders/examples |
| `be/src/database/seeds/seed-guard.ts:1` | default seed password | known default; refused for remote DBs → SG-04 |
| `fe/src/features/auth/pages/LoginPage.tsx:14` | same default, shipped in prod bundle | SG-04 |
| `fe/scripts/qa/flows.mjs:921-958` | QA script passwords for local seeded accounts | local-only test data |
| `be/.env.example`, `fe/.env.example` | placeholder values (`change…`, local MinIO keys) | examples |
| tests / MSW mocks | mock passwords and tokens | test data |

No live production secret found in tracked content. `docs/conversation-logs/` is untracked and out of this gate (Commit B gate still pending).
