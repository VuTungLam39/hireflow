# 02 — Architecture Map

> Phase 00 · Workstream B · `main` @ `04ac5b7`. Labels as in file 01.

## 1. Frontend architecture (SV)

- **Feature-based**: `src/features/<name>/{api,hooks,components,pages,schemas,lib}` + public `index.ts`. Cross-feature imports must go through `@/features/<name>` — enforced by oxlint `no-restricted-imports` (router and tests exempt). Grep found **0 deep-import violations** (SV).
- Cross-feature dependency hubs (count of importing sites from other features): `jobs` 24, `applications` 23, `interviews` 7, `company` 6, `auth` 4, `departments` 3, `public-jobs`/`operations`/`dashboard` 1 each. `jobs` and `applications` are the coupling centre (SV).
- Layers: `routes/` (router, guards, paths) → `app/layouts` (shell) → `features/*/pages` → feature components → `components/shared` → `components/ui`.

## 2. Routing (SV; guest behaviour RV)

- Single data router (`createBrowserRouter`), all pages `lazy`-loaded, root `loader` = `sessionLoader` (restores session from refresh cookie before guards run), root `errorElement` = `ErrorPage`, `hydrateFallbackElement` = `PageLoader`.
- Three branches: **PublicLayout** (no auth), **GuestRoute → AuthLayout** (login; redirects authenticated users to `state.from` or `/`), **ProtectedRoute → MainLayout** (internal app; `protectedLoader` throws 503 when the API is unreachable).
- Per-route gating with `requires(Permission, children, fallbackTo?)` → `PermissionRoute`: without the permission it renders `ForbiddenPage` or redirects to `fallbackTo` (chain: `/` → `/interviews` → `/platform/companies`).
- The catch-all `*` (NotFoundPage) lives **inside** the protected branch → a guest hitting any unknown URL is redirected to `/login` (RV: `/khong-ton-tai` → `/login`). See file 15.
- **Detail dialogs are URL state**: `?xem=<kind>:<id>[:tab]` with kinds `application | candidate | job` (`hooks/use-detail.ts`), rendered by `app/layouts/DetailHost.tsx` over any page; `?xem=job:new` opens job creation. So CV review / candidate / job workspace are reachable both as routes and as overlays (SV).

## 3. Data fetching (SV)

- TanStack Query with feature-level query factories (e.g. `applicationQueries.list(params)`); 27 files use queries, 18 use mutations.
- Route loaders prefetch without blocking (`applicationsLoader` → `queryClient.prefetchQuery`).
- No ad-hoc fetching found inside `useEffect` (grep of `useEffect` bodies for `api.`/`axios`/`fetch(` → 0 hits) (SV, heuristic).
- Realtime: SSE for notifications (`lib/sse.ts`, `hooks/use-stream.ts`, `stores/realtime.store.ts` holds `connected` + `unreadCount`).
- Public pages may be **prerendered at build** (`scripts/prerender.mjs`, `src/prerender/*`) when `PRERENDER_API_URL` is set; client hydrates the query cache from the payload. Whether production builds actually prerender: UNK (env value not visible; to check via page source in Workstream I).

## 4. State management (SV)

| Store | Content | Persistence |
|---|---|---|
| `auth.store` | `accessToken` (memory only), `user`, `signedOut` | only a `hf_session` hint flag in localStorage (no token) |
| `ui.store` | breadcrumb `crumb`, `sidebarOpen`, `commandOpen`, `densityByUser` | `persist` (localStorage, guarded) |
| `realtime.store` | SSE `connected`, `unreadCount` | memory |

URL is the source of list state: `hooks/use-list-params.ts` parses filters/sort/page with zod schemas (16 files use `useListParams`/`useSearchParams`) (SV).

## 5. Authentication flow (SV; guest path RV)

1. Login → `/auth/login` returns access token (JSON) + sets httpOnly refresh cookie.
2. Access token kept in Zustand memory; Axios attaches `Authorization: Bearer`.
3. On page load the root loader calls `restoreSession()`: if on a guest page with no `hf_session` hint it skips; otherwise `POST /auth/refresh` then `GET /auth/me`. Network/5xx → marks `sessionUnavailable` (protected branch throws 503); 401 → clears session, guard redirects to `/login`.
4. On any 401 the interceptor performs one shared refresh (refresh tokens rotate) and retries; failure clears the session.
5. RV (guest): protected routes redirect to `/login`; each such load logs one console error `401` from the refresh attempt (expected noise, see file 15).

## 6. Authorization (SV)

- Permission strings are shared FE/BE: 23 permissions (`lib/permissions.ts` ≡ `be/src/common/permissions/permission.enum.ts`), with a parity test (`permissions.parity.test.ts`).
- Role → permission table exists in **both** BE (`common/permissions/role-permissions.ts`, authoritative) and FE (`ROLE_PERMISSIONS`, fallback only when `/auth/me` omits `permissions`). Tables are identical as of `04ac5b7` (SV).
- UI gating: `PermissionRoute`, `<Can>` (`components/shared/Can.tsx`), `usePermission`, nav items filtered by permission (`app/layouts/nav-config.ts`).
- Data scoping beyond permissions (department scope, interviewer "assigned only", tenant/organization) is enforced in BE queries (`common/utils/department-scope.ts`; comment BR-INT-02) — SV for existence, runtime behaviour Blocked (file 05).

## 7. API error handling (SV)

`lib/errors.ts`: `getErrorCode` (429 → `TOO_MANY_REQUESTS`), `getErrorMessage` (BE detail → mapped `ERROR_MESSAGES` → network/timeout/5xx Vietnamese fallbacks), `applyServerErrors` (maps BE `{field,messages}` into RHF fields), `getErrorRef` (first 8 chars of `x-request-id` shown to users). FE/BE error-code parity test exists (`error-codes.parity.test.ts`). Shared `ErrorState`, `ErrorPage`, `ForbiddenPage`, `NotFoundPage`, `SystemMessage`.

## 8. Forms & validation (SV)

RHF + zod schemas per feature (`features/*/schemas`), shared `FormField`, `Input`, `Select`, `Textarea`, `Checkbox`, `field-styles.ts`; server field errors mapped back via `applyServerErrors`.

## 9. Shared UI architecture (SV — catalogued in file 07)

In-house primitives (no Radix / no shadcn): Button (+`button-variants`), Input, Select, Textarea, Checkbox, Dialog, Popover, Tabs, Tooltip, SegmentedControl, ChipGroup, Stepper, Pagination, Avatar, Skeleton, Spinner, FormField, `tones.ts`. Composites: DataTable, FilterBar, DateRangeFilter, DetailDialog, SidePanel, ConfirmDialog, CommandPalette, KpiStrip, PageHeader, RowMenu, Timeline, EmptyState, ErrorState, FileUploader, Can. Shell: Sidebar, Topbar, UserMenu, QuickSearch, BrandMark, DetailHost, JobCreateDialog, JobWorkspaceDialog.

## 10. Backend surface relevant to FE (SV)

NestJS modules: `ai, applications, audit, auth, candidates, company, dashboard, departments, email, files, health, interviews, jobs, maintenance, matching, notifications, offers, organizations, public, rag, refresh-tokens, users`. Controllers: `admin, ai, applications, applications/:applicationId/interviews, applications/:applicationId/offers, audit-logs, auth, candidates, company, dashboard, departments, files, interviews, jobs, jobs/:jobId/applications, notifications, offers, platform, public, public/applications, public/employers, public/jobs, users`. Endpoint-level contract mapping is deferred to Phase 01/SG (out of scope for a FE map; the API contract must be preserved per plan §1.2).
