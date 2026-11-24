# 03 — Route & Page Inventory (v1.1 files 03 + 04 merged [D-07])

> Phase 00 · Workstream C · Source: `fe/src/routes/router.tsx`, `paths.ts`, `guards.tsx` on `main` @ `04ac5b7` (not the sidebar). Runtime probe: live site as **Guest** on 2026-11-24 via Playwright CLI.
> Status column: SV = in router; RV-G = verified live as guest; **BLK** = signed-in runtime check *Blocked — awaiting test accounts/data* (accounts promised by project owner, not yet received).
> Loading/empty/error/responsive columns are filled for guest pages from the probe; for signed-in pages they are BLK and will be completed in Workstreams G/H.

## 1. Public branch — `PublicLayout`, no auth

| Route | Page component | Purpose | Data source (FE api) | Key interactions | Status |
|---|---|---|---|---|---|
| `/jobs` | `public-jobs/pages/PublicJobsPage` | Job board across companies | `public/jobs` | filter/search, open job, company filter `?company=` | SV · RV-G (200, h1 "Việc làm trên HireFlow", 12 job links on first view) |
| `/jobs/:id` | `public-jobs/pages/PublicJobDetailPage` | Job detail + apply | `public/jobs/:id`, `public/applications` | "Ứng tuyển vị trí này" / "Nộp hồ sơ", CV upload | SV · RV-G (sample job renders; unknown id → no `h1`, error UI to capture in H) |
| `/companies` | `public-jobs/pages/CompaniesPage` | Company directory | `public` | open company | SV · RV-G (3 companies: `hireflow-demo`, `vi-may`, `cho-lanh`) |
| `/companies/:slug` | `public-jobs/pages/CareersPage` | Company careers page | `public` | open job | SV · RV-G (unknown slug → no `h1`, capture in H) |
| `/careers` | redirect | Legacy → `/companies/hireflow-demo` (Vercel 301 + SPA fallback) | — | — | SV · RV-G |
| `/chinh-sach-du-lieu` | `public-jobs/pages/PrivacyPolicyPage` | Candidate data policy | static | — | SV · RV-G |
| `/employers/register` | `employers/pages/EmployerRegisterPage` | Employer self-registration (MVP 3) | `public/employers` | form submit | SV · RV-G (form renders; **submission not tested** — would create live data) |
| `/employers/check-email` | `employers/pages/CheckEmailPage` | Post-registration notice | — | resend? | SV · RV-G |
| `/verify-email` | `employers/pages/VerifyEmailPage` | Email-verification landing | `public/employers` (token) | — | SV · RV-G (no token → "Link không còn hiệu lực") |
| `/applications/track` | `public-jobs/pages/TrackApplicationPage` | Candidate tracks application via emailed link | `public/applications` (token) | withdraw? | SV · RV-G (no token → "Link không còn hiệu lực"; console 401) |

## 2. Guest branch — `GuestRoute → AuthLayout`

| Route | Page | Behaviour | Status |
|---|---|---|---|
| `/login` | `auth/pages/LoginPage` | Login form; already-authenticated → `state.from` or `/` | SV · RV-G |

No registration-for-candidates, password-reset or forgot-password route exists in the router (SV: **Missing**). Plan §2.4 "password recovery" → Missing.

## 3. Protected branch — `ProtectedRoute → MainLayout` (guest → `/login`, RV-G)

| Route | Page component | Required permission (`PermissionRoute`) | Fallback when missing | Roles holding it (BE table) | Status |
|---|---|---|---|---|---|
| `/` | `dashboard/pages/DashboardPage` ("Hôm nay") | `dashboard:read` | → `/interviews` | admin, hr, hiring_manager | SV · BLK |
| `/interviews` | `interviews/pages/InterviewsPage` | `application:read` | → `/platform/companies` | admin, hr, hiring_manager, interviewer | SV · BLK |
| `/manage/jobs` | `jobs/pages/JobsPage` | `job:read` | Forbidden | admin, hr, hiring_manager, interviewer | SV · BLK |
| `/manage/jobs/new` | `jobs/pages/JobFormPage` | `job:create` | Forbidden | admin, hr | SV · BLK |
| `/manage/jobs/:id/edit` | `jobs/pages/JobFormPage` | `job:read` (route gate). Whether the page/BE additionally require `job:update`: UNK | Forbidden | admin, hr, hiring_manager, interviewer (route only) | SV · BLK · finding: route gate weaker than the action |
| `/manage/jobs/:id/ranking` | `ranking/pages/JobRankingPage` | `job:read` | Forbidden | admin, hr, hiring_manager, interviewer | SV · BLK |
| `/manage/jobs/:id/matches` | `matching/pages/JobMatchesPage` | `application:create` | Forbidden | admin, hr | SV · BLK |
| `/applications` | `applications/pages/ApplicationsPage` (loader prefetch) | `application:read` | Forbidden | admin, hr, hiring_manager, interviewer (scoped "assigned" in BE) | SV · BLK |
| `/applications/:id` | `applications/pages/ApplicationDetailPage` (full width) — **CV review lives here** | `application:read` | Forbidden | as above | SV · BLK |
| `/candidates` | `candidates/pages/CandidatesPage` ("Kho ứng viên") | `candidate:read` | Forbidden | admin, hr, hiring_manager | SV · BLK |
| `/candidates/:id` | `candidates/pages/CandidateDetailPage` | `candidate:read` | Forbidden | admin, hr, hiring_manager | SV · BLK |
| `/ai-chat` | `ai-chat/pages/ChatPage` ("Hỏi kho CV") | `ai:chat` | Forbidden | admin, hr, hiring_manager | SV · BLK |
| `/users` | `users/pages/UsersPage` | `user:manage` | Forbidden | admin | SV · BLK |
| `/departments` | `departments/pages/DepartmentsPage` | `department:manage` | Forbidden | admin | SV · BLK |
| `/admin/company` | `company/pages/CompanyPage` | `company:manage` | Forbidden | admin, hr | SV · BLK |
| `/admin/ai-queue` | `operations/pages/AiQueuePage` ("Xử lý CV") | `ops:manage` | Forbidden | admin | SV · BLK |
| `/admin/audit-logs` | `audit/pages/AuditLogPage` | `audit:read` | Forbidden | admin | SV · BLK |
| `/platform/companies` | `platform/pages/PlatformCompaniesPage` | `platform:manage` | Forbidden | platform_admin | SV · BLK |
| `/platform/companies/:id` | `platform/pages/PlatformCompanyDetailPage` | `platform:manage` | Forbidden | platform_admin | SV · BLK |
| `/platform/queues` | `platform/pages/PlatformQueuesPage` (17 lines) | `platform:manage` | Forbidden | platform_admin | SV · BLK |
| `*` | `pages/NotFoundPage` | authenticated only | — | all | SV · guest RV-G → `/login` (INC, file 15) |

### URL-state overlays (not routes, but navigable — SV)

`?xem=application:<id>[:tab]` (ApplicationDialog, `application:read`), `?xem=candidate:<id>` (CandidateDialog, `candidate:read`), `?xem=job:<id>` (JobWorkspaceDialog, `job:read`), `?xem=job:new` (JobCreateDialog, `job:create`). Rendered by `DetailHost` on top of any internal page. Command palette / QuickSearch (`ui.store.commandOpen`) is a global entry point.

### Historical routes from plan §00.5

- `/applications/:id` → exists (SV).
- `/manage/jobs/:id/ranking` → exists (SV).
- `/careers` → Deprecated (redirect only) (SV + RV-G).

## 4. Sidebar vs router (SV)

Sidebar (`nav-config.ts`) exposes 13 entries in 3 groups ("Công việc", "Quản trị", "Quản trị sàn"). Routes **not** in the sidebar: `/manage/jobs/new`, `/manage/jobs/:id/{edit,ranking,matches}`, `/applications/:id`, `/candidates/:id`, `/platform/companies/:id`, all public/guest routes. Note "Lịch phỏng vấn" is gated by `application:read`, not `interview:*`.

## 5. Critical routes — FIXED LIST for Phase 00/01 evidence and Phase 08 regression [D-07]

Core-workflow routes plus any route that exposes cross-company data:

| # | Route | Why critical |
|---|---|---|
| CR-01 | `/jobs` | Public core workflow; aggregates jobs **across companies** |
| CR-02 | `/jobs/:id` | Public core workflow; application + CV upload entry (CV pipeline input) |
| CR-03 | `/companies` | Public core; lists **all companies** |
| CR-04 | `/companies/:slug` | Public core; per-company page |
| CR-05 | `/login` | Gate to every signed-in workflow |
| CR-06 | `/` (Hôm nay) | Dashboard core workflow |
| CR-07 | `/manage/jobs` (+ `?xem=job:<id>` workspace, `?xem=job:new`) | Job management |
| CR-08 | `/applications` | Application list (HR core task T1) |
| CR-09 | `/applications/:id` (+ `?xem=application:<id>`) | Application detail **and CV review** (task T2); evidence quotes |
| CR-10 | `/manage/jobs/:id/ranking` | Ranking (AI scores + quotes) |
| CR-11 | `/candidates` | Candidate pool — tenant-scoped candidate data |
| CR-12 | `/platform/companies` (+ `/:id`) | Only route designed to see **cross-company** data (platform_admin) |
| CR-13 | `/applications/track` | Public, token-based access to an application — cross-tenant exposure surface |

Candidates considered and excluded (secondary for redesign decisions; still in map level): `/interviews`, `/manage/jobs/:id/matches`, `/ai-chat` (cross-CV search — **flag for Security Gate**, tenant-scoped RAG), `/candidates/:id`, admin pages, employer registration pages, privacy page.

> **APPROVED by project owner 2026-11-24 (DL-01)** as proposed, including CR-11 and CR-13. `/ai-chat` stays out of the critical list but is flagged as an LLM surface for the Security Gate (file 17, SG-F2).
>
> `/jobs` link count (12): closed as explained — pagination 12/page, "1–12 trong 13", page 2 holds 1 job (RV 2026-11-24; DL-03).
