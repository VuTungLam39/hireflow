# 03 — Tenant Isolation & Authorization (Areas A–C)

## A. Tenant isolation
**Method:** read every controller (113 handlers, `be/src/modules/**/*.controller.ts`) and the scope helpers; run a temporary local e2e harness on the existing cross-tenant fixtures (removed afterwards, no repo change).

| Check | Result | Evidence |
|---|---|---|
| Path-param routes (all `:id` routes) refuse other-org IDs | Pass — existing suite `cross-tenant.e2e-spec.ts` | Source-verified; suite passed locally 24/11 |
| Lists, dashboards, export, CV search show nothing of another org | Pass — same suite | Source-verified + local run |
| IDs supplied in request **body** | **FAIL — SG-01** (`bulk-status`) | Runtime-verified (local) |
| Other body IDs: compare (`ids`), interview `interviewerIds`, job `hiringManagerId`, `departmentId` | Pass — each checked against org | Source-verified |
| RAG retrieval (`/ai/chat`, `/ai/cv-search`) | Pass — SQL filters `organization_id` + department/HM scope | Source-verified (`rag/retrieval.ts`) |
| Public media `/public/media/:file` | Pass — strict key regex `^media/[0-9a-f]{64}\.(jpg|png|webp)$`; traversal → 404 | Source + Runtime (prod, read-only) |
| Production cross-company GET with real accounts | **Not verified** — passwords were not provided this session | — |

**Department sub-boundary (HM):** reads use `applyDepartmentScope` (department OR assigned HM). Phase 00 leftover on `/manage/jobs/:id/edit`: the backend `GET /jobs/:id` for an out-of-department job returns 404 (Phase 00 runtime), and every edit endpoint requires `job:update`, which HM does not hold → HM cannot edit any job, in or out of department. The FE route offering an edit page to HM is a UX defect, not a control gap.

## B. ADR-0002 verification [SG-F4]
| Path class | Out-of-scope vs never-existed | Evidence |
|---|---|---|
| GET detail (applications, jobs, candidates, file URL) | identical 404 body + same timing class (5–9 ms) | Runtime-verified (local) |
| Write on application (status, notes, rescore, reopen, cv-text) | 403 `SCOPE_FORBIDDEN` vs 404 → **distinguishable** | Runtime-verified (local) → SG-02 |
| Bulk status | `succeeded` vs `NOT_FOUND` → distinguishable (and a write) | SG-01 |
| Permitted exception (in-scope, missing action permission) | implemented by `PermissionsGuard` → 403 before any lookup — matches ADR | Source-verified |

**SG-F4 disposition: confirmed finding (SG-02)** for write paths; reads cleared with evidence.

## C. Authorization depth [SG-F1 + general]
- **SG-F1 disposition: cleared with evidence (Source-verified).** `PATCH /jobs/:id`, `PUT /jobs/:id/requirements`, `/interview-stages`, `/hiring-manager`, `DELETE /jobs/:id` all require `job:update`; HM and Interviewer lack it (`role-permissions.ts`). A runtime write check is listed in file 08 for completeness.
- Routes whose permission is weaker than the action, reviewed:
  - `POST /applications/:id/notes` requires only `application:read` → Interviewer/HM can add notes on applications in scope. Intended per notes feature (collaboration); scoped by `findWritable`. No finding.
  - `PUT /jobs/:id/ranking-weights` requires `application:read` → weights are stored **per user** (`jobId + userId`) — no effect on others. No finding.
  - `POST /interviews/:id/question-suggestions` (`application:read`) consumes the org chat quota — bounded by daily limit. No finding.
- FE guards confirmed as UX only; every backend handler is behind the global JWT guard unless `@Public()` (8 public handlers, listed in file 01).
