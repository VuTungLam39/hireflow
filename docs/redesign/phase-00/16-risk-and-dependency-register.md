# 16 — Risk & Dependency Register

| ID | Risk / dependency | Likelihood | Impact | Mitigation / owner | Status |
|---|---|---|---|---|---|
| RK-01 | Test accounts for all five staff roles provided and verified 2026-11-24 | — | — | — | **Closed** |
| RK-15 | All demo accounts share one password that was posted in chat | Certain | Low–Medium (demo data only) | Owner rotates passwords after Phase 00 | Open (owner) |
| RK-14 | Recon sessions created production audit-log/login entries for the demo accounts | Certain | Low | Accepted side-effect of sign-in; no other writes | Accepted |
| RK-02 | Merge to `main` = production release (Vercel + Render auto-deploy) | Certain | High for Phase 05 | One slice = one revertible PR + smoke (D-10) | Accepted rule |
| RK-03 | Vercel previews call the production API | Likely (DO) | Medium — preview testing touches prod data | Verify in Phase 05 planning | Open |
| RK-04 | Render free plan cold starts (~1 min) | Likely | Medium — perf baselines and UX of first load | Measure cold vs warm in Phase 01 | Open |
| RK-05 | Tenant isolation is enforced in BE queries only; not runtime-tested | Unknown | Critical | Security Gate scope 1 | Open |
| RK-06 | `/manage/jobs/:id/edit` route gate = `job:read` | Confirmed (SV) | Medium–High if BE also lax | Security Gate (DL-04) | Open |
| RK-07 | `/ai-chat` is an LLM surface over the CV store (RAG) | — | High (prompt injection, cross-tenant retrieval) | Security Gate flag (DL-01) | Open |
| RK-08 | Stale prerender of public pages | Confirmed (RV) | Medium — wrong counts, masked error states | Phase 01 finding; Phase 05 data pattern | Open |
| RK-09 | Hand-rolled primitives (Dialog, Popover, Tabs, Tooltip) | Confirmed | Medium — a11y regressions during rebuild | Phase 01 backlog (DL-05) | Open |
| RK-10 | Coupling hubs `jobs` (24) and `applications` (23) | Confirmed | Medium — slice order/blast radius | Phase 05 slice planning | Open |
| RK-11 | No browser E2E in CI | Confirmed | Medium — regression detection | Phase 08 Playwright Test via §6 | Open |
| RK-12 | Demo dataset is the verification dataset | Accepted (DL-06) | Low–Medium — may not cover all pipeline states | Accepted limitation | Accepted |
| RK-13 | Live production writes during recon (apply, register) | — | Medium | Not performed; read-only rule | Controlled |

External dependencies (SV): Vercel, Render (API + Key Value), Neon Postgres (+pgvector), Backblaze B2 (S3 API), Gemini (LLM + embeddings; Groq/Ollama alternatives configured), Mailjet (email), Google Fonts (Be Vietnam Pro, Bricolage Grotesque — loading method UNK).
