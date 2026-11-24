# 01 — Repository Map

> Phase 00 · Workstream A · Examined: `main` @ `04ac5b7` (Merge PR #109), read through a detached worktree; the working copy (`feat/mvp31-s5-release`) was not used as evidence.
> Labels: SV = Source-verified, RV = Runtime-verified, DO = Documented-only, UNK = Unknown, INC = Inconsistent.

## 1. Top-level structure (SV)

| Path | Role |
|---|---|
| `fe/` | Frontend SPA (React + Vite), deployed to Vercel |
| `be/` | Backend API + workers (NestJS + TypeORM), deployed to Render |
| `.github/workflows/ci.yml` | Single CI workflow (jobs `be`, `be-e2e`, `fe`) |
| `render.yaml` | Render blueprint: web `hireflow-api` (plan free, `autoDeployTrigger: commit`) + keyvalue `hireflow-redis` |
| `docker-compose.yml` | Local all-in-one stack |
| `.agents/`, `.claude/`, `.codex/`, `skills-lock.json` | Agent skill installs (not product code) |

Not a monorepo: no npm workspaces; `fe` and `be` each have their own `package.json` + `package-lock.json` (SV).

## 2. Frontend toolchain (SV, `fe/package.json`)

| Area | Actual | Plan §2.1 historical | Label |
|---|---|---|---|
| Package manager | npm (`package-lock.json`) | — | SV |
| Node | `engines.node >=22`; CI Node 22; local v22.22.0 | — | SV |
| React | ^19.3.1 | React 19 | SV |
| Build | Vite ^8.3.4 (rolldown `codeSplitting` groups `react`, `vendor`) | Vite 8 | SV |
| TypeScript | ~7.0.2, `strict`, `noUnusedLocals/Parameters`, `erasableSyntaxOnly`, alias `@/* → src/*` | TS 7 | SV |
| Routing | `react-router` ^8.4.0 (data router, lazy routes, loaders) | RR 8 | SV |
| Server state | `@tanstack/react-query` ^5.104.4 (devtools DEV only) | TQ 5 | SV |
| Client state | `zustand` ^5.0.15 (3 stores) | Zustand 5 | SV |
| Forms | `react-hook-form` ^7.90 + `@hookform/resolvers` ^6 + `zod` ^4.6.7 (16 files use `zodResolver`) | RHF + Zod 4 | SV |
| HTTP | `axios` ^1.20 | Axios | SV |
| Styling | Tailwind CSS ^4.3.3 via `@tailwindcss/vite`; no `tailwind.config` (CSS-first in `src/index.css`) | Tailwind 4 | SV |
| Icons / toasts | `lucide-react` ^1.60, `sonner` ^2.0.8 | same | SV |
| Virtualization | `@tanstack/react-virtual` ^3.14 | not listed | SV (addition) |
| Primitives | **No Radix** — Dialog, Popover, Tabs, Tooltip, Select are in-house (`src/components/ui`) | "Radix used selectively" | INC (file 15) |
| Tests | MSW ^2.15, Vitest ^5.0.5, Testing Library, jsdom; 69 test files; contract tests | same | SV |
| Lint / format | oxlint ^1.88 (hooks rules, `no-explicit-any`, `import/no-cycle`, deep feature-import ban); Prettier ^3.9 + tailwind plugin | same | SV |
| a11y engine | **`axe-core` 4.10.2 already a devDependency** | Plan schedules axe-core for Phase 01 | INC |

## 3. Scripts (SV)

`dev`, `build` (= `tsc -b && vite build && node scripts/prerender.mjs`), `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:watch`, `test:contract`, `prerender`, `build:profile` (React profiling build), `check:design` (custom Design Spec v1.0 guard: no raw colors/gradients/page animations/AI wording).

Existing in-repo tooling relevant to later phases (SV, **not executed** in this phase): `fe/scripts/qa/{clickall,flows,inventory,keyboard,phase2,phase3,responsive,sweep}.mjs`, `fe/scripts/perf/{lh,nojs,waterfall,bench-ranking,chart}.mjs`, docs `fe/docs/qa-responsive.md`, `fe/docs/rendering.md`.

## 4. Entrypoints & providers (SV)

- `fe/index.html` → `src/main.tsx`: one-shot reload on `vite:preloadError` (stale chunk after deploy); hydrates (`hydrateRoot`) when a prerender payload exists, else `createRoot`.
- `src/app/providers.tsx`: `QueryClientProvider` + Sonner `<Toaster>` (bottom-left) + React Query Devtools in DEV.
- `src/lib/query-client.ts`: `staleTime 30s`, no refetch on focus, no retry on 4xx (max 2 otherwise); mutations `retry:false`, `networkMode:'always'`.
- `src/lib/api-client.ts`: Axios `baseURL = VITE_API_URL` (default `/api/v1`), timeout 15s (`SLOW_TIMEOUT_MS` 120s for uploads/LLM/cold start), `withCredentials`, Bearer token from memory, single-flight refresh on 401.

## 5. Feature modules (SV)

18 folders under `src/features/`, each with a public `index.ts`: `ai-chat, applications, audit, auth, candidates, company, dashboard, departments, employers, interviews, jobs, matching, notifications, operations, platform, public-jobs, ranking, users`. Shared: `src/components/ui` (≈20 primitives), `src/components/shared` (15 composites), `src/hooks` (14), `src/lib`, `src/stores` (3), `src/pages` (error/forbidden/not-found), `src/prerender` (public-page prerender + JSON-LD). ≈368 files in `fe/src`.

## 6. Environment variable names (SV — names only, no values)

- FE: `VITE_API_URL` (zod-validated at startup), `VITE_PROXY_TARGET`, `PRERENDER_API_URL`, `PRERENDER_SITE_URL`, `PRERENDER_STRICT`; Vercel-provided `VERCEL_PROJECT_PRODUCTION_URL`.
- BE (`be/.env.example`): `NODE_ENV PORT API_PREFIX CORS_ORIGINS POSTGRES_HOST_PORT DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_DATABASE DATABASE_URL DB_SSL DB_SYNCHRONIZE DB_LOGGING JWT_ACCESS_SECRET JWT_ACCESS_EXPIRES_IN JWT_REFRESH_EXPIRES_IN REDIS_HOST REDIS_PORT REDIS_USERNAME REDIS_PASSWORD REDIS_TLS REDIS_URL QUEUE_PREFIX STORAGE_DRIVER STORAGE_LOCAL_ROOT S3_ENDPOINT S3_PUBLIC_ENDPOINT S3_REGION S3_BUCKET S3_ACCESS_KEY S3_SECRET_KEY S3_FORCE_PATH_STYLE THROTTLE_TTL THROTTLE_LIMIT TRUST_PROXY DEBUG_CLIENT_IP PRERENDER_DEPLOY_HOOK_URL PRERENDER_DEBOUNCE_MS CV_RETENTION_MONTHS SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD LLM_PROVIDERS AI_TIMEOUT_MS AI_FIRST_TOKEN_TIMEOUT_MS AI_PROMPT_VERSION GEMINI_API_KEY GEMINI_MODEL GEMINI_MODEL_EXTRACT GEMINI_MODEL_FALLBACK GROQ_API_KEY GROQ_MODEL GROQ_JSON_MODE OLLAMA_BASE_URL OLLAMA_MODEL OLLAMA_JSON_MODE EMBEDDING_PROVIDER EMBEDDING_MODEL EMBEDDING_DIM EMBEDDING_BATCH_SIZE EMAIL_PROVIDER MAILPIT_URL MAILJET_API_KEY MAILJET_SECRET_KEY EMAIL_FROM EMAIL_FROM_NAME APP_PUBLIC_URL PLATFORM_ADMIN_EMAIL`.

## 7. CI / deploy

- CI (SV): **fe** = `npm ci`, `npm audit --omit=dev --audit-level=high`, `format:check`, `lint`, `check:design`, `typecheck`, `test`, `build`. **be** = audit, format, lint, typecheck, unit, build, compose validation. **be-e2e** = Postgres 18 + pgvector, Redis 7, migrations, coverage, core coverage ≥70% gate. **No browser E2E job.**
- FE deploy (`fe/vercel.json`, SV): `cleanUrls`; 301 `/careers → /companies/hireflow-demo` (RV: lands there); rewrite `/api/:path* → https://hireflow-api-z99n.onrender.com/api/:path*` (same-origin API → refresh cookie is first-party); SPA fallback; immutable caching for `/assets/*` and public media.
- API deploy: Render free plan, `autoDeployTrigger: commit` (SV). **Merge to `main` = production release** for FE and API (SV config; matches plan §2.1).

## 8. Runtime assumptions & technical risks (detail in file 16)

1. Render **free** plan → cold starts (~1 min per source comment on `SLOW_TIMEOUT_MS`); affects every perf baseline.
2. No browser E2E in CI; QA/perf scripts exist but are not wired to CI.
3. Vercel previews share the production API (plan §2.1 — DO in this phase, not re-tested).
4. `axe-core` already installed although the plan schedules it for Phase 01 — governance record (§6) UNK.
