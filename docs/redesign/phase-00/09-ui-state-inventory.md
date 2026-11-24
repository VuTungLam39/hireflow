# 09 — UI State Inventory

> Phase 00 · Workstream G. Guest pages: Runtime-verified with Playwright (loading = API delayed 8 s; error = API forced 500; empty = API mocked empty — **mocked states are labelled as such**). Internal pages: **Blocked — awaiting test accounts**; shared state components are Source-verified only.

## 1. Key mechanism discovered (RV + SV)

Public pages are **prerendered at build** (`scripts/prerender.mjs`; the payload is hydrated into the query cache). Consequences observed:

- Forcing the public API to fail or hang still shows the **prerendered content** — the loading skeleton and error state are effectively unreachable on first load for prerendered routes (`/jobs`, `/jobs/:id`, `/companies`, `/companies/:slug`).
- The prerendered snapshot is **stale**: on 2026-11-24 the forced-error screenshot of `/jobs` showed "15 vị trí đang tuyển" / HireFlow 11, while the live API returned 13 / HireFlow 9 after hydration (screenshots `CR-01-jobs--error--390.png` vs `CR-01-jobs--default--390.png`). Prerender is refreshed by a deploy hook (`PRERENDER_DEPLOY_HOOK_URL`, SV); that expiring jobs do not trigger it is an inference (UNK), consistent with the 15→13 drift.
- When media requests fail, company logos fall back to the browser's broken-image + alt text (`CR-04-company--error--1440.png`).

## 2. Guest pages (RV)

| Page | Default | Loading | Empty | Error | Permission-denied | Other |
|---|---|---|---|---|---|---|
| `/jobs` (CR-01) | ✔ list, 12/page, "1–12 trong 13", "1 / 2" | prerendered content shown (no skeleton) | ✔ mocked: empty state | prerendered (stale) content shown, no error UI | n/a | pagination ✔ |
| `/jobs/:id` (CR-02) | ✔ detail + apply form | prerendered content | n/a | prerendered content | n/a | unknown id → no `h1` rendered (error UI to inspect in Phase 01) |
| `/companies` (CR-03) | ✔ 3 companies | prerendered | ✔ mocked: "Chưa có công ty nào – Trang công ty hiện khi công ty được duyệt…" | prerendered | n/a | — |
| `/companies/:slug` (CR-04) | ✔ | prerendered | n/a | prerendered + broken logo | n/a | unknown slug → no `h1` |
| `/login` (CR-05) | ✔ | — | — | not exercised (would need failed login attempts against production throttle) | n/a | password reveal button ✔ |
| `/applications/track` (CR-13) | no token → "Link không còn hiệu lực" | captured | n/a | captured | n/a | valid token: UNK |
| Protected route as guest | — | — | — | — | redirect to `/login` (no explicit message) | |

Disabled/hover/focus/selected states on public pages: focus ring = 2px solid outline on links/buttons (RV, file 13); hover/active not systematically captured (secondary per D-07).

## 3. Shared state components (SV)

`Skeleton` (`animate-skeleton`), `Spinner`, `PageLoader` (route hydrate fallback), `EmptyState`, `ErrorState` (+ request ref from `x-request-id`), `ErrorPage` (root error boundary), `ForbiddenPage` (PermissionRoute), `NotFoundPage` (authenticated only), `SystemMessage`, `LoadingDialog` in `DetailHost`, toasts via Sonner, `protectedLoader` → 503 when API unreachable (Render cold start).

## 4. Internal critical routes (RV 2026-11-24, signed in; screenshots under `screenshots/<actor>/`)

Mocks: loading = `/api/v1/**` delayed 8 s (auth/notifications excluded); error = `/api/v1/**` forced 500.

| Route | Default | Loading | Empty | Error | Permission-denied | Other |
|---|---|---|---|---|---|---|
| CR-06 `/` | ✔ HR/HM/Admin (task list, KPI strip, funnel) | ✔ captured | n/a (data present) | ✔ captured | platform → redirect; Interviewer BLK | badge count in sidebar ("Hôm nay 5") |
| CR-07 `/manage/jobs` | ✔ HR/HM; `?xem=job:id` dialog ✔ | ✔ | not reachable read-only | ✔ | HM `/manage/jobs/new` → ForbiddenPage | DOMContentLoaded 4.8 s on first hit (cold chunk/API) |
| CR-08 `/applications` | ✔ HR 1440/390, HM | ✔ | ✔ via search with no match | ✔ | platform → ForbiddenPage | tabs, filters, density, selection |
| CR-09 `/applications/:id` | ✔ HR 1440/390, HM in-scope; dialog variant ✔ | ✔ skeleton | n/a | skeleton persists ≥3.5 s while TanStack Query retries 5xx, then error | HM out-of-department → "Chưa mở được hồ sơ / Không tìm thấy dữ liệu" | unknown id → same not-found + "Mã tham chiếu"; 4 `<mark>` evidence quotes |
| CR-10 ranking | ✔ HR 1440/390, HM | — | DRAFT job ranking captured (`CR-10-ranking--draft-job--1440.png`) | — | — | ready ≈1.3 s |
| CR-11 `/candidates` | ✔ HR 1440/390 | ✔ | — | ✔ | platform → ForbiddenPage | — |
| CR-12 `/platform/companies` | ✔ platform 1440/390 ("Chờ duyệt" tab empty state) | — | ✔ (real: no pending company) | — | Admin → ForbiddenPage | detail page not captured (no row in default tab) |

Forbidden state is uniform: "Trang này không thuộc quyền của bạn" inside the shell (RV). Out-of-scope records are shown as *not found* rather than *forbidden* (deliberate non-disclosure; Phase 01 to judge wording).

Not captured (secondary per D-07 or write-only): hover/active/selected for every control, pending states of mutations, long-content stress, network-offline. Interviewer: BLK.
