# 07 — Remediation Plan (proposed slices, owner schedules)

Each slice is one mattpocock loop: issue → test first → smallest fix → PR. Order = severity, then dependency.

| # | Slice | Findings | Size | Blocks | Status |
|---|---|---|---|---|---|
| R1 | **Tenant-scope bulk status + harden `transition()`**: filter bulk load by org/department scope; lock rows by `id + organization_id`; extend cross-tenant e2e to routes taking IDs in the body (bulk-status first, then a generic body-ID sweep) | SG-01 | S | **Gate re-check; real data; Phase 05 slices touching applications** | Scheduled — pre-Phase-05, first (owner 24/11) |
| R2 | **ADR-0002 on writes**: `findWritable` and bulk result return not-found for out-of-org and out-of-department; cross-tenant e2e requires 404 (drop 403 from the allowed set) | SG-02 | S | Phase 05 tenant-boundary slices | Scheduled — pre-Phase-05 (owner 24/11) |
| R3 | **Evidence visibility + years check**: detect evidence that exists only in invisible text (PDF text render attributes) → flag, no credit; derive/cap `years` from quoted span or experience dates; add adversarial CVs (hidden text, injected instruction) to `ai/eval` with a pass threshold | SG-03 | M (spike first on PDF visibility detection) | **Phase 05 CV-pipeline/scoring slices; real data** | Scheduled — pre-Phase-05; no acceptance (owner 24/11) |
| R4 | Drop demo-fill constant from production builds | SG-04 | XS | — | Non-blocking, ride-along |
| R5 | Tracking token out of the query string (fragment or one-time exchange); stop echoing query in error `path` | SG-05 | S | — | Non-blocking, ride-along |
| R6 | Forgot/reset password (or documented platform recovery procedure) | SG-06 | M | before real companies onboard | Before real companies onboard |
| — | SG-07 | accept as informational (900 s window, per-request revalidation) | — | — | Accepted informational (owner 24/11) |

Pre-Phase-05 set: **R1, R2, R3**. R1 must land before any real company data, regardless of Phase 05 timing.
After R1–R3: re-run file 08 checks + the new e2e, then issue a gate re-check verdict.

Carry-forward (not security, logged so it is not lost): code still contains "Đề nghị"/"Đã nhận" against DL-08 → Phase 05 terminology slice.
