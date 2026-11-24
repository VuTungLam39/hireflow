# Assessment B: Detector + Browser Evidence (HireFlow, main checkout)

Date: 2026-11-24. Source: `scratchpad/hf-main/fe/src` (192 .tsx files plus .ts/.css).

## 1. CLI scan (Phase 08 baseline)
- Command: `sh "D:/NCC_Intern Project/.claude/skills/impeccable/scripts/impeccable" detect --json <hf-main/fe/src>` (cwd `D:\NCC_Intern Project`)
- Exit code: **0** (clean). Output: `[]`, saved as `detect-fe-src.json`. stderr was empty.
- **Total findings: 0.** Per-rule table: none. No rule fired.
- The tool scanned the whole tree in one run, so it did not need splitting into folders.
- Sanity checks:
  - A single-file scan of `features/public-jobs/pages/PublicJobsPage.tsx` returned `[]`.
  - A positive control fired `gradient-text`: a temp HTML file with `bg-gradient-to-r ... bg-clip-text`, outside the repo and since deleted. So the detector loads and matches. It is not failing silently.

### Per-target findings
| Target | Findings |
|---|---|
| public-jobs/pages/PublicJobsPage.tsx, CompaniesPage.tsx, CareersPage.tsx | 0 |
| features/ranking/** | 0 |
| applications/pages/ApplicationDetailPage.tsx + components/CvSheet.tsx | 0 |
| features/dashboard/** | 0 |

### False positives
None to review. The clean result matches the project's own CI guard, `fe/scripts/check-design.mjs`. That guard already blocks raw colors, gradients, page animations and AI wording, and the colors go through tokens in `fe/src/index.css`. Most of the detector's slop rules check for exactly these things. One caveat: a static scan cannot see runtime-only issues such as contrast with real data, overflow or layout. A clean scan does not cover those.

## 2. Browser overlay (public URLs, no sign-in)
- Browser: `playwright-cli -s=critB open https://hireflow-gray-zeta.vercel.app/jobs`, in a new isolated session.
- Mutation preflight: **passed.** Setting `document.title='pf'` held, and a `<script>` element was appended.
- Live server: `impeccable live-server --background` ran on port 8400. `curl http://localhost:8400/detect.js` returned 200 (3.1 MB).
- Injection on /jobs, /companies and /companies/vi-may: **FAILED** on all three, because the script's `onerror` fired. The console showed:
  `Access to script at 'http://localhost:8400/detect.js' from origin 'https://hireflow-gray-zeta.vercel.app' has been blocked by CORS policy: Permission was denied for this request to access the loopback address space.`
  - Cause: Chrome's Private/Local Network Access rule blocks an HTTPS public origin from loading a script from a loopback address.
  - It is not CSP: the response has no `Content-Security-Policy` header.
  - **No overlay was shown. No `impeccable` console messages appeared.**
- Fallback: the detector's URL mode was run once per page. Command: `impeccable detect --json https://hireflow-gray-zeta.vercel.app/{jobs,companies,companies/vi-may}`. Results:
  | Page | Exit code | Findings | Raw output |
  |---|---|---|---|
  | /jobs | 0 | 0 | `url-jobs.json` |
  | /companies | 0 | 0 | `url-companies.json` |
  | /companies/vi-may | 0 | 0 | `url-companies_vi-may.json` |
  - Not verified: whether the URL scan waited for the React app to finish rendering. Read these as weak evidence.
- Pages that need sign-in (ranking, CV review/ApplicationDetail, dashboard) were covered **by the CLI scan only**.

## 3. Cleanup
- `impeccable live-server stop --keep-inject` printed "Stopped live server on port 8400". Port 8400 is no longer listening (checked with netstat). The background task exited with code 0.
- `playwright-cli -s=critB close` closed the browser.
- playwright-cli had written snapshots to `D:\NCC_Intern Project\.playwright-cli\`, inside the repo. That folder was deleted.
- No files under `.impeccable/` changed during the run. No project files were edited.
