# 05 — Actor & Permission Matrix

> Phase 00 · Workstream D · `main` @ `04ac5b7` + live site, 2026-11-24.
> Runtime verification: signed in as **Admin, HR, Hiring Manager, platform_admin, Interviewer** (accounts provided by the owner in-session; credentials never recorded). Interviewer verified in a follow-up session the same day. A sixth "company" account was provided and is rejected at login with `403 ORG_DISABLED` (see §4).

## 1. Actor model (DL-02, ADR-0001)

| Actor | Kind | Authentication | `/auth/me` (RV) |
|---|---|---|---|
| Guest | anonymous | none | — |
| **Candidate** | **guest actor, not an account holder** | token link emailed after applying (`/applications/track`) | — (no candidate role exists, SV) |
| Employer applicant | guest → `admin` of a PENDING company | `/employers/register` → email verification → platform approval | not exercised |
| Admin | company account | email + password | `role=admin`, org `hireflow-demo:ACTIVE`, no department — **RV** |
| HR | company account | email + password | `role=hr`, org `hireflow-demo:ACTIVE`, no department — **RV** |
| Hiring Manager | company + department account | email + password | `role=hiring_manager`, org `hireflow-demo:ACTIVE`, dept "Phát triển phần mềm" — **RV** |
| Interviewer | company account, assigned-only | email + password | `role=interviewer`, org `hireflow-demo`, no department, permissions `job:read, application:read, cv:read, interview:feedback` — **RV** |
| `platform_admin` ("Quản trị sàn") | platform account, no company | email + password | `role=platform_admin`, `organization=null` — **RV (exists)** |

`permissions` returned by `/auth/me` were present for all four roles, so the FE fallback table was not used (RV).

## 2. Route access per role (RV — signed in, desktop 1440)

✔ = page renders · ⛔ = in-app ForbiddenPage "Trang này không thuộc quyền của bạn" · → = redirect

| Route | Admin | HR | Hiring Manager | platform_admin | Interviewer | Source expectation |
|---|---|---|---|---|---|---|
| `/` Hôm nay | ✔ "5 hồ sơ chờ bạn xem" | ✔ "5 hồ sơ chờ bạn xem" | ✔ "2 hồ sơ chờ bạn xem" | → `/platform/companies` | → `/interviews` | match |
| `/interviews` | ✔ | ✔ | ✔ | → `/platform/companies` | ✔ (2 buổi cần xử lý) | match |
| `/manage/jobs` | ✔ | ✔ | ✔ | ⛔ | ✔ (3 tin — assigned scope) | match |
| `/manage/jobs/new` | ✔ | ✔ | ⛔ | ⛔ | ⛔ | match |
| `/applications` | ✔ | ✔ (31 hồ sơ) | ✔ (department scope) | ⛔ | ✔ (3 hồ sơ — assigned only) | match |
| `/candidates` | ✔ | ✔ | ✔ | ⛔ | ⛔ | match |
| `/ai-chat` | ✔ | ✔ | ✔ | ⛔ | ⛔ | match |
| `/users` | ✔ | ⛔ | ⛔ | ⛔ | ⛔ | match |
| `/departments` | ✔ | ⛔ | ⛔ | ⛔ | ⛔ | match |
| `/admin/company` | ✔ | ✔ | ⛔ | ⛔ | ⛔ | match |
| `/admin/ai-queue` | ✔ | ⛔ | ⛔ | ⛔ | ⛔ | match |
| `/admin/audit-logs` | ✔ | ⛔ | ⛔ | ⛔ | ⛔ | match |
| `/platform/companies` | ⛔ | ⛔ | ⛔ | ✔ "Công ty trên sàn" | ⛔ | match |
| `/platform/queues` | ⛔ | ⛔ | ⛔ | ✔ "Hàng đợi hệ thống" | ⛔ | match |

**Result: 70/70 role×route cells observed (5 roles × 14 routes) match the source permission table** (`be/src/common/permissions/role-permissions.ts`). Login landing: Admin/HR/HM → `/`; Interviewer → `/interviews`; platform_admin → `/platform/companies` (RV).

## 3. Data scope (RV where noted)

| Check | Observation | Label |
|---|---|---|
| HM department scope | HR's application list returned ≥20 items on page 1 (31 total in UI); HM's returned 9 — HM sees a subset | RV |
| HM opening an application outside the department (`/applications/de01095c…`, visible to HR) | "Chưa mở được hồ sơ — Không tìm thấy dữ liệu" + reference code; no data leaked; shown as *not found*, not *forbidden* | RV |
| HM on `/manage/jobs/:id/edit` for a job outside the department | route renders (gate = `job:read`), BE returns not-found → "Chưa mở được tin — Không tìm thấy dữ liệu". Whether HM can open the edit form for an **in-department** job: not tested (read-only) | RV (partial) — Security Gate SG-F1 |
| Admin on `/platform/*` | ForbiddenPage | RV |
| platform_admin on tenant pages | ForbiddenPage or redirect; no tenant data rendered | RV |
| Interviewer assigned scope | sees only 3 applications (all in Phỏng vấn) with column "Phiếu của bạn" (Đã gửi / Cần gửi phiếu); 3 jobs; opening an unassigned application (visible to HR/HM) → "Chưa mở được hồ sơ — Không tìm thấy dữ liệu" | RV (ADR-0002 behaviour) |
| Cross-company isolation | not tested — Security Gate scope | — |

## 4. Disabled company account (RV)

`hienvan690@…` → `POST /auth/login` → `403 {"code":"ORG_DISABLED","message":"Organization is disabled"}`; UI alert: "Công ty của bạn đã bị khoá hoặc bị từ chối trên sàn" (screenshot `guest/CR-05-login--error-company-account--1440.png`). Confirms that a SUSPENDED/REJECTED company blocks sign-in of its users.

## 5. Permission strings (SV, FE = BE, parity-tested)

`user:manage, department:manage, job:read, job:create, job:update, job:publish, candidate:read, candidate:update, candidate:anonymize, application:read, application:create, application:update-status, application:approve-offer, cv:read, ai:chat, ai:rescore, dashboard:read, ops:manage, audit:read, interview:manage, interview:feedback, company:manage, platform:manage`.

## 6. Remaining gaps

- Interviewer: phiếu submission form not opened/submitted (production write).
- Action-level permissions (status change, rescore, offer approve, anonymize) verified at source only — not exercised, because each is a production write.
